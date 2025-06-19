import { GitHubRepository } from './github-api'
import { JobAnalysis } from '@/components/job-input'
import { AIService } from './ai-service'

export interface RepositoryMatch {
  repository: GitHubRepository
  matchScore: number
  reasoning: string[]
  relevantTechnologies: string[]
  confidenceLevel: 'high' | 'medium' | 'low'
}

export interface ResumeGenerationResult {
  resumeHtml: string
  selectedRepositories: RepositoryMatch[]
  tailoredToJob?: JobAnalysis
  resumeData?: {
    name: string
    title: string
    summary: string
    skills: string[]
    projects: {
      name: string
      description: string
      technologies: string[]
      achievements: string[]
      url?: string
    }[]
  }
}

export class AIResumeAgent {
  private aiService: AIService

  constructor(aiService?: AIService) {
    this.aiService = aiService || AIService.createDefault('openai')
  }

  /**
   * Analyzes a job description to extract key requirements
   */
  async analyzeJobDescription(jobText: string): Promise<JobAnalysis> {
    const systemPrompt = `You are an expert technical recruiter and job analyzer. Extract key information from job descriptions with high accuracy.`
    
    const prompt = `Analyze this job description and extract the following information:

${jobText}

Provide a structured analysis including:
1. Job title (inferred if not explicit)
2. Required technologies (programming languages, frameworks, tools)
3. Experience level (junior, mid, senior, lead)
4. Job type/category (e.g., "Full Stack Development", "Machine Learning", "DevOps")
5. Key skills beyond technologies (soft skills, methodologies, etc.)

Be specific and accurate. Focus on technical requirements and avoid generic terms.`

    const schema = `{
  "jobTitle": "string",
  "requiredTechnologies": ["string"],
  "experienceLevel": "junior" | "mid" | "senior" | "lead",
  "jobType": "string",
  "keySkills": ["string"],
  "description": "string"
}`

    try {
      const analysis = await this.aiService.generateStructuredText<JobAnalysis>(
        prompt,
        schema,
        {
          systemPrompt,
          temperature: 0.3,
          maxTokens: 1000
        }
      )
      
      // Ensure description is included
      analysis.description = jobText
      
      return analysis
    } catch (error) {
      console.error('AI job analysis failed, using fallback:', error)
      return this.mockJobAnalysis(jobText)
    }
  }

  /**
   * Scores repositories based on how well they match job requirements
   */
  async scoreRepositoriesForJob(
    repositories: GitHubRepository[], 
    jobAnalysis: JobAnalysis
  ): Promise<RepositoryMatch[]> {
    const matches: RepositoryMatch[] = []

    for (const repo of repositories) {
      const matchResult = await this.analyzeRepositoryMatch(repo, jobAnalysis)
      matches.push(matchResult)
    }

    // Sort by match score (highest first)
    return matches.sort((a, b) => b.matchScore - a.matchScore)
  }

  /**
   * Selects best repositories for a general resume (without job targeting)
   */
  async selectBestRepositories(repositories: GitHubRepository[]): Promise<RepositoryMatch[]> {
    const matches: RepositoryMatch[] = []

    for (const repo of repositories) {
      const matchResult = await this.analyzeRepositoryGeneral(repo)
      matches.push(matchResult)
    }

    // Sort by general quality score
    return matches.sort((a, b) => b.matchScore - a.matchScore)
  }

  /**
   * Generates a resume based on selected repositories
   */
  async generateResume(
    userProfile: { name?: string; login: string; bio?: string },
    repositoryMatches: RepositoryMatch[],
    jobAnalysis?: JobAnalysis
  ): Promise<ResumeGenerationResult> {
    // Select top repositories (limit to 6-8 most relevant)
    const selectedRepos = repositoryMatches.slice(0, 8)

    // Generate structured resume data
    const resumeData = await this.generateStructuredResumeData(
      userProfile,
      selectedRepos,
      jobAnalysis
    )

    const resumeHtml = await this.generateResumeHTML(
      userProfile, 
      selectedRepos, 
      jobAnalysis
    )

    return {
      resumeHtml,
      selectedRepositories: selectedRepos,
      tailoredToJob: jobAnalysis,
      resumeData
    }
  }

  /**
   * Analyzes repository content to understand technologies and implementation
   */
  private async analyzeRepositoryContent(repository: GitHubRepository): Promise<{
    technologies: string[]
    complexity: 'low' | 'medium' | 'high'
    implementationQuality: number
  }> {
    try {
      // Get repository details for AI analysis
      const repoInfo = {
        name: repository.name,
        description: repository.description || '',
        language: repository.language || '',
        topics: repository.topics || [],
        stars: repository.stargazers_count,
        forks: repository.forks_count,
        size: repository.size,
        hasReadme: repository.name.toLowerCase().includes('readme'),
        isActive: this.isRecentlyActive(repository.updated_at)
      }

      const systemPrompt = `You are a senior software engineer analyzing GitHub repositories. Provide accurate technical assessments based on repository metadata.`
      
      const prompt = `Analyze this GitHub repository and provide a technical assessment:

Repository: ${repoInfo.name}
Description: ${repoInfo.description}
Primary Language: ${repoInfo.language}
Topics/Tags: ${repoInfo.topics.join(', ')}
Stars: ${repoInfo.stars}
Forks: ${repoInfo.forks}
Size: ${repoInfo.size}KB
Recently Active: ${repoInfo.isActive}

Based on this information, determine:
1. All technologies used (programming languages, frameworks, tools)
2. Project complexity (low/medium/high)
3. Implementation quality score (0-10)

Consider factors like:
- Language ecosystem and common patterns
- Project size and community engagement
- Topic tags indicating specific technologies
- Repository activity and maintenance`

      const schema = `{
  "technologies": ["string"],
  "complexity": "low" | "medium" | "high",
  "implementationQuality": number
}`

      const analysis = await this.aiService.generateStructuredText<{
        technologies: string[]
        complexity: 'low' | 'medium' | 'high'
        implementationQuality: number
      }>(
        prompt,
        schema,
        {
          systemPrompt,
          temperature: 0.2,
          maxTokens: 500
        }
      )

      return analysis
    } catch (error) {
      console.error('AI repository analysis failed, using fallback:', error)
      return this.fallbackRepositoryAnalysis(repository)
    }
  }

  private fallbackRepositoryAnalysis(repository: GitHubRepository): {
    technologies: string[]
    complexity: 'low' | 'medium' | 'high'
    implementationQuality: number
  } {
    const technologies: string[] = []
    
    // Extract from language
    if (repository.language) {
      technologies.push(repository.language)
    }

    // Extract from topics/tags
    if (repository.topics) {
      technologies.push(...repository.topics)
    }

    // Mock complexity based on repository stats
    let complexity: 'low' | 'medium' | 'high' = 'low'
    if (repository.stargazers_count > 10 || repository.forks_count > 5) {
      complexity = 'medium'
    }
    if (repository.stargazers_count > 50 || repository.forks_count > 20) {
      complexity = 'high'
    }

    // Mock implementation quality score
    const qualityScore = Math.min(
      (repository.stargazers_count * 0.3 + repository.forks_count * 0.7) / 10,
      10
    )

    return {
      technologies,
      complexity,
      implementationQuality: qualityScore
    }
  }

  private isRecentlyActive(updatedAt: string): boolean {
    const lastUpdate = new Date(updatedAt)
    const monthsOld = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24 * 30)
    return monthsOld < 6
  }

  private async analyzeRepositoryMatch(
    repository: GitHubRepository, 
    jobAnalysis: JobAnalysis
  ): Promise<RepositoryMatch> {
    const repoAnalysis = await this.analyzeRepositoryContent(repository)
    
    // Calculate match score based on multiple factors
    let matchScore = 0
    const reasoning: string[] = []
    const relevantTechnologies: string[] = []

    // Technology matching
    const jobTechs = jobAnalysis.requiredTechnologies.map(t => t.toLowerCase())
    const repoTechs = repoAnalysis.technologies.map(t => t.toLowerCase())
    
    const techMatches = repoTechs.filter(tech => 
      jobTechs.some(jobTech => 
        tech.includes(jobTech) || jobTech.includes(tech)
      )
    )

    if (techMatches.length > 0) {
      matchScore += techMatches.length * 25
      relevantTechnologies.push(...techMatches)
      reasoning.push(`Uses ${techMatches.join(', ')} required for this role`)
    }

    // Project complexity matching
    if (repoAnalysis.complexity === 'high' && jobAnalysis.experienceLevel !== 'junior') {
      matchScore += 20
      reasoning.push('Complex project demonstrating advanced skills')
    }

    // Description matching (simple keyword search)
    if (repository.description) {
      const descWords = repository.description.toLowerCase()
      const jobKeywords = [...jobAnalysis.keySkills, jobAnalysis.jobType].map(k => k.toLowerCase())
      
      const keywordMatches = jobKeywords.filter(keyword => 
        descWords.includes(keyword.toLowerCase())
      )
      
      if (keywordMatches.length > 0) {
        matchScore += keywordMatches.length * 15
        reasoning.push(`Project description mentions ${keywordMatches.join(', ')}`)
      }
    }

    // Recent activity bonus
    const lastUpdate = new Date(repository.updated_at)
    const monthsOld = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24 * 30)
    if (monthsOld < 6) {
      matchScore += 10
      reasoning.push('Recently updated project')
    }

    // Quality score
    matchScore += repoAnalysis.implementationQuality

    // Determine confidence level
    let confidenceLevel: 'high' | 'medium' | 'low' = 'low'
    if (matchScore >= 60) confidenceLevel = 'high'
    else if (matchScore >= 30) confidenceLevel = 'medium'

    return {
      repository,
      matchScore: Math.min(matchScore, 100),
      reasoning,
      relevantTechnologies,
      confidenceLevel
    }
  }

  private async analyzeRepositoryGeneral(repository: GitHubRepository): Promise<RepositoryMatch> {
    const repoAnalysis = await this.analyzeRepositoryContent(repository)
    
    let matchScore = 0
    const reasoning: string[] = []

    // Base score from stars and forks (social proof)
    matchScore += Math.min(repository.stargazers_count * 2, 30)
    matchScore += Math.min(repository.forks_count * 3, 20)

    if (repository.stargazers_count > 5) {
      reasoning.push(`${repository.stargazers_count} stars showing community interest`)
    }

    // Complexity bonus
    if (repoAnalysis.complexity === 'high') {
      matchScore += 25
      reasoning.push('Complex project demonstrating advanced technical skills')
    } else if (repoAnalysis.complexity === 'medium') {
      matchScore += 15
      reasoning.push('Well-structured project with good complexity')
    }

    // Technology diversity
    if (repoAnalysis.technologies.length > 3) {
      matchScore += 10
      reasoning.push('Uses multiple technologies effectively')
    }

    // Recent activity
    const lastUpdate = new Date(repository.updated_at)
    const monthsOld = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24 * 30)
    if (monthsOld < 3) {
      matchScore += 15
      reasoning.push('Active development')
    }

    // Has good description
    if (repository.description && repository.description.length > 20) {
      matchScore += 5
      reasoning.push('Well-documented project')
    }

    return {
      repository,
      matchScore: Math.min(matchScore, 100),
      reasoning,
      relevantTechnologies: repoAnalysis.technologies,
      confidenceLevel: matchScore >= 60 ? 'high' : matchScore >= 30 ? 'medium' : 'low'
    }
  }

  private async mockJobAnalysis(jobText: string): Promise<JobAnalysis> {
    // Simple keyword-based analysis for MVP
    const text = jobText.toLowerCase()
    
    let jobTitle = "Software Engineer"
    let experienceLevel: 'junior' | 'mid' | 'senior' | 'lead' = 'mid'
    let jobType = "Software Development"
    const requiredTechnologies: string[] = []
    const keySkills: string[] = []

    // Detect job titles
    if (text.includes('machine learning') || text.includes('ml engineer')) {
      jobTitle = "Machine Learning Engineer"
      jobType = "Machine Learning"
    } else if (text.includes('data scientist')) {
      jobTitle = "Data Scientist"
      jobType = "Data Science"
    } else if (text.includes('frontend') || text.includes('front-end')) {
      jobTitle = "Frontend Developer"
      jobType = "Frontend Development"
    } else if (text.includes('backend') || text.includes('back-end')) {
      jobTitle = "Backend Developer"
      jobType = "Backend Development"
    } else if (text.includes('full stack') || text.includes('fullstack')) {
      jobTitle = "Full Stack Developer"
      jobType = "Full Stack Development"
    }

    // Detect experience level
    if (text.includes('junior') || text.includes('entry level') || text.includes('0-2 years')) {
      experienceLevel = 'junior'
    } else if (text.includes('senior') || text.includes('5+ years') || text.includes('lead')) {
      experienceLevel = 'senior'
    } else if (text.includes('lead') || text.includes('principal') || text.includes('staff')) {
      experienceLevel = 'lead'
    }

    // Detect technologies
    const techKeywords = [
      'javascript', 'typescript', 'python', 'java', 'react', 'vue', 'angular',
      'node.js', 'express', 'django', 'flask', 'tensorflow', 'pytorch',
      'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'mongodb', 'postgresql',
      'redis', 'graphql', 'rest api', 'git', 'ci/cd'
    ]

    techKeywords.forEach(tech => {
      if (text.includes(tech)) {
        requiredTechnologies.push(tech.charAt(0).toUpperCase() + tech.slice(1))
      }
    })

    // Detect key skills
    const skillKeywords = [
      'problem solving', 'team collaboration', 'agile', 'scrum',
      'test driven development', 'api design', 'database design',
      'system design', 'code review', 'mentoring'
    ]

    skillKeywords.forEach(skill => {
      if (text.includes(skill)) {
        keySkills.push(skill.split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' '))
      }
    })

    return {
      jobTitle,
      requiredTechnologies,
      experienceLevel,
      jobType,
      keySkills,
      description: jobText
    }
  }

  private async generateStructuredResumeData(
    userProfile: { name?: string; login: string; bio?: string },
    repositoryMatches: RepositoryMatch[],
    jobAnalysis?: JobAnalysis
  ): Promise<ResumeGenerationResult['resumeData']> {
    try {
      const systemPrompt = `You are a professional resume writer specializing in software engineering resumes. Generate structured resume data that highlights technical achievements and project impact.`
      
      const prompt = `Create structured resume data for this software engineer:

Name: ${userProfile.name || userProfile.login}
Bio: ${userProfile.bio || 'Software Engineer'}
${jobAnalysis ? `Target Role: ${jobAnalysis.jobTitle}` : ''}

Selected Projects:
${repositoryMatches.map(match => `
- ${match.repository.name}: ${match.repository.description || 'No description'}
  Technologies: ${match.relevantTechnologies.join(', ')}
  GitHub Stars: ${match.repository.stargazers_count}
  Why relevant: ${match.reasoning.join('; ')}
`).join('')}

${jobAnalysis ? `
Job Requirements:
- Technologies: ${jobAnalysis.requiredTechnologies.join(', ')}
- Experience Level: ${jobAnalysis.experienceLevel}
- Key Skills: ${jobAnalysis.keySkills.join(', ')}
` : ''}

Generate a professional summary (2-3 sentences) and transform each project into achievement-focused bullet points. Focus on technical impact and quantifiable results.`

      const schema = `{
  "name": "string",
  "title": "string",
  "summary": "string",
  "skills": ["string"],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": ["string"],
      "achievements": ["string"],
      "url": "string"
    }
  ]
}`

      const resumeData = await this.aiService.generateStructuredText<NonNullable<ResumeGenerationResult['resumeData']>>(
        prompt,
        schema,
        {
          systemPrompt,
          temperature: 0.7,
          maxTokens: 2000
        }
      )

      // Add URLs from repository data
      resumeData.projects = resumeData.projects.map((project, index) => ({
        ...project,
        url: repositoryMatches[index]?.repository.html_url || ''
      }))

      return resumeData
    } catch (error) {
      console.error('AI structured resume generation failed, using fallback:', error)
      
      // Fallback structured data
      const allSkills = Array.from(new Set(repositoryMatches.flatMap(m => m.relevantTechnologies)))
      
      return {
        name: userProfile.name || userProfile.login,
        title: jobAnalysis?.jobTitle || 'Software Engineer',
        summary: `Experienced software engineer with expertise in ${allSkills.slice(0, 3).join(', ')}. Proven track record of building impactful projects with focus on ${jobAnalysis?.jobType || 'software development'}.`,
        skills: allSkills,
        projects: repositoryMatches.map(match => ({
          name: match.repository.name,
          description: match.repository.description || '',
          technologies: match.relevantTechnologies,
          achievements: match.reasoning,
          url: match.repository.html_url
        }))
      }
    }
  }

  private async generateResumeHTML(
    userProfile: { name?: string; login: string; bio?: string },
    repositoryMatches: RepositoryMatch[],
    jobAnalysis?: JobAnalysis
  ): Promise<string> {
    try {
      const systemPrompt = `You are a professional resume writer with expertise in software engineering resumes. Create clean, ATS-friendly HTML resumes that highlight technical skills and project impact.`
      
      const resumeData = {
        name: userProfile.name || userProfile.login,
        bio: userProfile.bio || 'Software Engineer',
        targetRole: jobAnalysis?.jobTitle || 'Software Engineer',
        projects: repositoryMatches.map(match => ({
          name: match.repository.name,
          description: match.repository.description || '',
          technologies: match.relevantTechnologies,
          reasoning: match.reasoning,
          stars: match.repository.stargazers_count,
          url: match.repository.html_url
        }))
      }

      const prompt = `Create a professional HTML resume for this software engineer:

Name: ${resumeData.name}
Bio: ${resumeData.bio}
${jobAnalysis ? `Target Role: ${resumeData.targetRole}` : ''}

Selected Projects:
${resumeData.projects.map(p => `
- ${p.name}: ${p.description}
  Technologies: ${p.technologies.join(', ')}
  GitHub Stars: ${p.stars}
  Why relevant: ${p.reasoning.join('; ')}
`).join('')}

${jobAnalysis ? `
Job Requirements:
- Technologies: ${jobAnalysis.requiredTechnologies.join(', ')}
- Experience Level: ${jobAnalysis.experienceLevel}
- Key Skills: ${jobAnalysis.keySkills.join(', ')}
` : ''}

Generate a complete HTML resume with:
1. Professional header with name and title
2. Professional summary section (2-3 sentences)
3. Technical skills section organized by category
4. Selected projects section with impact-focused descriptions
5. Modern, clean CSS styling
6. Print-friendly layout
7. ATS-friendly structure

Make the project descriptions compelling and focus on technical achievements. Use action verbs and quantify impact where possible.`

      const resumeHtml = await this.aiService.generateTextWithRetry(
        prompt,
        {
          systemPrompt,
          temperature: 0.7,
          maxTokens: 3000,
          maxRetries: 2,
          retryDelay: 1000
        }
      )

      return resumeHtml
    } catch (error) {
      console.error('AI resume generation failed, using fallback:', error)
      return this.fallbackResumeHTML(userProfile, repositoryMatches, jobAnalysis)
    }
  }

  private fallbackResumeHTML(
    userProfile: { name?: string; login: string; bio?: string },
    repositoryMatches: RepositoryMatch[],
    jobAnalysis?: JobAnalysis
  ): string {
    const resumeTitle = jobAnalysis 
      ? `Resume for ${jobAnalysis.jobTitle}` 
      : 'Software Engineer Resume'

    const allTechnologies = Array.from(
      new Set(
        repositoryMatches.flatMap(match => match.relevantTechnologies)
      )
    )

    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${resumeTitle}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Arial', sans-serif; 
              line-height: 1.6; 
              color: #333; 
              max-width: 800px; 
              margin: 0 auto; 
              padding: 40px 20px; 
              background: white;
            }
            .header { 
              text-align: center; 
              margin-bottom: 40px; 
              border-bottom: 2px solid #ff6b35;
              padding-bottom: 20px;
            }
            .header h1 { 
              font-size: 2.5em; 
              color: #2c3e50; 
              margin-bottom: 10px;
            }
            .header .title { 
              font-size: 1.2em; 
              color: #ff6b35; 
              font-weight: 600;
            }
            .section { 
              margin-bottom: 30px; 
            }
            .section h2 { 
              color: #2c3e50; 
              border-bottom: 1px solid #ecf0f1;
              padding-bottom: 10px;
              margin-bottom: 20px;
              font-size: 1.4em;
            }
            .skills {
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
              margin-bottom: 20px;
            }
            .skill-tag {
              background: #ff6b35;
              color: white;
              padding: 5px 12px;
              border-radius: 15px;
              font-size: 0.9em;
              font-weight: 500;
            }
            .project { 
              margin-bottom: 25px; 
              padding: 20px; 
              border-left: 4px solid #ff6b35;
              background: #f8f9fa;
              border-radius: 0 8px 8px 0;
            }
            .project h3 {
              color: #2c3e50;
              margin-bottom: 10px;
              font-size: 1.2em;
            }
            .project-description {
              margin-bottom: 10px;
              color: #555;
            }
            .project-tech {
              color: #ff6b35;
              font-weight: 600;
              font-size: 0.9em;
            }
            .summary {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 30px;
              border-left: 4px solid #3498db;
            }
            @media print {
              body { padding: 20px; }
              .project { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${userProfile.name || userProfile.login}</h1>
            <div class="title">${jobAnalysis?.jobTitle || userProfile.bio || 'Software Engineer'}</div>
            ${jobAnalysis ? `<div style="margin-top: 10px; color: #666; font-size: 0.9em;">Resume tailored for ${jobAnalysis.jobTitle}</div>` : ''}
          </div>
          
          <div class="section">
            <div class="summary">
              <h2>Professional Summary</h2>
              <p>Experienced software engineer with expertise in ${allTechnologies.slice(0, 5).join(', ')}. 
              Proven track record of building ${repositoryMatches.length} significant projects with focus on ${jobAnalysis?.jobType || 'software development'}. 
              ${jobAnalysis ? `Strong background in ${jobAnalysis.keySkills.slice(0, 3).join(', ')}.` : 'Passionate about creating efficient, scalable solutions.'}</p>
            </div>
          </div>

          <div class="section">
            <h2>Technical Skills</h2>
            <div class="skills">
              ${allTechnologies.map(tech => `<span class="skill-tag">${tech}</span>`).join('')}
            </div>
          </div>
          
          <div class="section">
            <h2>Selected Projects</h2>
            ${repositoryMatches.map(match => `
              <div class="project">
                <h3>${match.repository.name}${match.repository.stargazers_count > 0 ? ` (⭐ ${match.repository.stargazers_count})` : ''}</h3>
                <div class="project-description">
                  ${match.repository.description || 'Innovative software project demonstrating technical expertise'}
                </div>
                <div class="project-tech">
                  <strong>Technologies:</strong> ${match.relevantTechnologies.join(', ')}
                </div>
                ${match.reasoning.length > 0 ? `
                <div style="margin-top: 8px; font-size: 0.9em; color: #666;">
                  <strong>Key Highlights:</strong> ${match.reasoning.join('; ')}
                </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
          
          <div style="text-align: center; margin-top: 40px; font-size: 0.8em; color: #999;">
            Generated by DevDossier - AI-Powered Resume Builder
          </div>
        </body>
      </html>
    `
  }
}