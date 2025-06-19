import { NextRequest, NextResponse } from 'next/server'
import { JobAnalysis } from '@/components/job-input'
import { AIService } from '@/lib/ai-service'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // First, try to fetch the actual job content using a simple fetch
    let jobContent = ''
    let fetchSuccessful = false

    try {
      console.log('Attempting to fetch job content from:', url)
      
      // Try to fetch the job page content
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)

      if (response.ok) {
        const html = await response.text()
        jobContent = html
        fetchSuccessful = true
        console.log('Successfully fetched job content, length:', html.length)
      }
    } catch (fetchError) {
      console.log('Direct fetch failed, falling back to URL analysis:', fetchError)
    }

    let jobAnalysis: JobAnalysis

    if (fetchSuccessful && jobContent) {
      // Use AI to analyze the fetched content
      console.log('🧠 Using AI to analyze fetched job content')
      jobAnalysis = await analyzeJobContent(url, jobContent)
    } else {
      // Fallback to URL pattern analysis
      console.log('🔧 Using fallback URL pattern analysis')
      jobAnalysis = await analyzeJobUrl(url)
    }

    console.log('📊 Final job analysis result:', jobAnalysis)
    return NextResponse.json(jobAnalysis)
  } catch (error) {
    console.error('Job URL fetch failed:', error)
    return NextResponse.json(
      { error: 'Failed to fetch job content' },
      { status: 500 }
    )
  }
}

async function analyzeJobContent(url: string, htmlContent: string): Promise<JobAnalysis> {
  try {
    const aiService = AIService.createDefault('openai')
    
    // Better HTML content extraction - look for job-specific content
    const textContent = htmlContent
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    // Try to find job-specific sections in LinkedIn
    const jobSections = [
      'Job description',
      'About the job',
      'What you\'ll do',
      'Requirements',
      'Qualifications',
      'Responsibilities',
      'Experience',
      'Skills',
      'Technologies'
    ]

    // Look for content around job-related keywords
    let relevantContent = ''
    for (const section of jobSections) {
      const regex = new RegExp(`${section}[^.]*(?:[^.]*\.){0,20}`, 'gi')
      const matches = textContent.match(regex)
      if (matches) {
        relevantContent += matches.join(' ') + ' '
      }
    }

    // If we found relevant content, use it; otherwise use truncated full content
    const finalContent = relevantContent.length > 100 
      ? relevantContent.substring(0, 6000) 
      : textContent.substring(0, 6000)

    const prompt = `Analyze this job posting content and extract the following information.

IMPORTANT: If any field cannot be determined from the content, provide reasonable defaults rather than empty values.

Job posting URL: ${url}
Content: ${finalContent}

Extract:
1. Job title (if not found, infer from content or use "Software Engineer")
2. Required technologies and programming languages (look for tech stacks, frameworks, languages)
3. Experience level (junior, mid, senior, lead - if not specified, default to "mid")
4. Job type/category (e.g., "Full Stack Development", "Backend Development", "Software Engineering")
5. Key skills and requirements beyond technologies
6. Brief description summarizing the role

Focus on actual job requirements mentioned in the posting. Do not return empty fields.`

    const schema = `{
  "jobTitle": "string",
  "requiredTechnologies": ["string"],
  "experienceLevel": "junior" | "mid" | "senior" | "lead",
  "jobType": "string", 
  "keySkills": ["string"],
  "description": "string"
}`

    const analysis = await aiService.generateStructuredText<JobAnalysis>(
      prompt,
      schema,
      {
        systemPrompt: 'You are an expert job posting analyzer. Extract accurate information from job postings. Always return complete data - never leave fields empty. Provide reasonable defaults when specific information is not available.',
        temperature: 0.3,
        maxTokens: 1500
      }
    )

    // Validate the response and provide defaults if needed
    const validatedAnalysis: JobAnalysis = {
      jobTitle: analysis.jobTitle || 'Software Engineer',
      requiredTechnologies: Array.isArray(analysis.requiredTechnologies) && analysis.requiredTechnologies.length > 0 
        ? analysis.requiredTechnologies 
        : ['JavaScript', 'Python', 'React', 'Git'],
      experienceLevel: analysis.experienceLevel || 'mid',
      jobType: analysis.jobType || 'Software Development',
      keySkills: Array.isArray(analysis.keySkills) && analysis.keySkills.length > 0 
        ? analysis.keySkills 
        : ['Problem solving', 'Team collaboration', 'Communication'],
      description: analysis.description || `Job posting analyzed from ${url}`
    }

    return validatedAnalysis

  } catch (error) {
    console.error('AI analysis of job content failed:', error)
    // Fallback to URL analysis
    return analyzeJobUrl(url)
  }
}

async function analyzeJobUrl(url: string): Promise<JobAnalysis> {
  // Enhanced URL pattern analysis
  const urlLower = url.toLowerCase()
  
  let jobTitle = 'Software Engineer'
  let experienceLevel: 'junior' | 'mid' | 'senior' | 'lead' = 'mid'
  let jobType = 'Software Development'
  let requiredTechnologies: string[] = []
  let keySkills: string[] = []

  // Analyze experience level
  if (urlLower.includes('senior') || urlLower.includes('sr-')) {
    experienceLevel = 'senior'
    jobTitle = 'Senior Software Engineer'
  } else if (urlLower.includes('lead') || urlLower.includes('principal') || urlLower.includes('staff')) {
    experienceLevel = 'lead'
    jobTitle = 'Lead Software Engineer'
  } else if (urlLower.includes('junior') || urlLower.includes('jr-') || urlLower.includes('entry')) {
    experienceLevel = 'junior'
    jobTitle = 'Junior Software Engineer'
  }

  // Analyze job type
  if (urlLower.includes('full-stack') || urlLower.includes('fullstack')) {
    jobTitle = jobTitle.replace('Software Engineer', 'Full Stack Developer')
    jobType = 'Full Stack Development'
    requiredTechnologies = ['JavaScript', 'React', 'Node.js', 'Express', 'MongoDB', 'PostgreSQL']
  } else if (urlLower.includes('frontend') || urlLower.includes('front-end')) {
    jobTitle = jobTitle.replace('Software Engineer', 'Frontend Developer')
    jobType = 'Frontend Development'
    requiredTechnologies = ['JavaScript', 'React', 'Vue.js', 'CSS', 'HTML', 'TypeScript']
  } else if (urlLower.includes('backend') || urlLower.includes('back-end')) {
    jobTitle = jobTitle.replace('Software Engineer', 'Backend Developer')
    jobType = 'Backend Development'
    requiredTechnologies = ['Python', 'Java', 'Node.js', 'PostgreSQL', 'MongoDB', 'AWS']
  } else if (urlLower.includes('data') && urlLower.includes('scientist')) {
    jobTitle = 'Data Scientist'
    jobType = 'Data Science'
    requiredTechnologies = ['Python', 'R', 'SQL', 'TensorFlow', 'PyTorch', 'Pandas']
  } else if (urlLower.includes('machine-learning') || urlLower.includes('ml-engineer')) {
    jobTitle = 'Machine Learning Engineer'
    jobType = 'Machine Learning'
    requiredTechnologies = ['Python', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'AWS', 'Docker']
  } else if (urlLower.includes('devops') || urlLower.includes('site-reliability')) {
    jobTitle = 'DevOps Engineer'
    jobType = 'DevOps'
    requiredTechnologies = ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'Jenkins', 'Python']
  } else if (urlLower.includes('mobile') || urlLower.includes('ios') || urlLower.includes('android')) {
    jobTitle = 'Mobile Developer'
    jobType = 'Mobile Development'
    if (urlLower.includes('ios')) {
      requiredTechnologies = ['Swift', 'Objective-C', 'iOS', 'Xcode']
    } else if (urlLower.includes('android')) {
      requiredTechnologies = ['Java', 'Kotlin', 'Android', 'Android Studio']
    } else {
      requiredTechnologies = ['React Native', 'Flutter', 'JavaScript', 'Dart']
    }
  }

  // Add common technologies if none specified
  if (requiredTechnologies.length === 0) {
    requiredTechnologies = ['JavaScript', 'Python', 'React', 'Node.js', 'Git', 'AWS']
  }

  // Common key skills
  keySkills = [
    'Problem solving',
    'Team collaboration', 
    'Agile methodologies',
    'Code review',
    'Testing',
    'Documentation'
  ]

  // If it's a LinkedIn URL, try to extract more specific information
  if (url.includes('linkedin.com')) {
    // Try to get more details from LinkedIn URL structure
    const jobIdMatch = url.match(/currentJobId=(\d+)/) || url.match(/jobs\/view\/(\d+)/)
    if (jobIdMatch) {
      // LinkedIn job ID found in URL
      // For LinkedIn, provide more comprehensive defaults
      jobTitle = 'Software Engineer'
      jobType = 'Software Development'
      requiredTechnologies = ['JavaScript', 'React', 'Node.js', 'Python', 'Git', 'AWS']
      keySkills = [
        'Problem solving',
        'Team collaboration', 
        'Agile methodologies',
        'Code review',
        'Communication skills',
        'Technical documentation'
      ]
    }
  }

  return {
    jobTitle,
    requiredTechnologies,
    experienceLevel,
    jobType,
    keySkills,
    description: `Job posting analyzed from URL: ${url}\n\nThis analysis was generated from URL patterns. For more accurate analysis, please paste the full job description text.`
  }
}