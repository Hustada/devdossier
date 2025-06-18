import { GitHubRepository } from './github-api'
import { JobAnalysis } from '@/components/job-input'

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
}

export class AIResumeAgent {
  private apiKey: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || ''
  }

  /**
   * Analyzes a job description to extract key requirements
   */
  async analyzeJobDescription(jobText: string): Promise<JobAnalysis> {
    // For now, using a mock implementation
    // In production, this would call OpenAI API to analyze the job description
    
    const analysis = await this.mockJobAnalysis(jobText)
    return analysis
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

    const resumeHtml = await this.generateResumeHTML(
      userProfile, 
      selectedRepos, 
      jobAnalysis
    )

    return {
      resumeHtml,
      selectedRepositories: selectedRepos,
      tailoredToJob: jobAnalysis
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
    // This would call GitHub API to analyze repository files
    // For now, using repository metadata and language info
    
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

  private async generateResumeHTML(
    userProfile: { name?: string; login: string; bio?: string },
    repositoryMatches: RepositoryMatch[],
    jobAnalysis?: JobAnalysis
  ): Promise<string> {
    // This would generate a professional HTML resume
    // For now, returning a simple template
    
    const resumeTitle = jobAnalysis 
      ? `Resume for ${jobAnalysis.jobTitle}` 
      : 'Software Engineer Resume'

    return `
      <html>
        <head>
          <title>${resumeTitle}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 25px; }
            .project { margin-bottom: 15px; padding: 10px; border-left: 3px solid #ff6b35; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${userProfile.name || userProfile.login}</h1>
            <p>${userProfile.bio || 'Software Engineer'}</p>
            ${jobAnalysis ? `<p><strong>Tailored for: ${jobAnalysis.jobTitle}</strong></p>` : ''}
          </div>
          
          <div class="section">
            <h2>Selected Projects</h2>
            ${repositoryMatches.map(match => `
              <div class="project">
                <h3>${match.repository.name}</h3>
                <p>${match.repository.description || 'No description available'}</p>
                <p><strong>Technologies:</strong> ${match.relevantTechnologies.join(', ')}</p>
                <p><strong>Match Score:</strong> ${match.matchScore}%</p>
                <p><strong>Why relevant:</strong> ${match.reasoning.join('; ')}</p>
              </div>
            `).join('')}
          </div>
        </body>
      </html>
    `
  }
}