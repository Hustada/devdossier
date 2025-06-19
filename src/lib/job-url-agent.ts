import { JobAnalysis } from '@/components/job-input'

export class JobUrlAgent {
  /**
   * Detects if the input text contains a job URL
   */
  static detectJobUrl(text: string): string | null {
    const urlPatterns = [
      // LinkedIn job URLs
      /https?:\/\/(?:www\.)?linkedin\.com\/jobs[\/\w\-?&=]*/gi,
      // Indeed job URLs  
      /https?:\/\/(?:www\.)?indeed\.com\/(?:viewjob|jobs\/view)[\/\w\-?&=]*/gi,
      // Glassdoor job URLs
      /https?:\/\/(?:www\.)?glassdoor\.com\/job-listing[\/\w\-?&=]*/gi,
      // General job board patterns
      /https?:\/\/[^\s]*(?:jobs?|career|position|hiring)[^\s]*/gi,
      // Company career pages
      /https?:\/\/[^\s]*career[s]?[\/\w\-?&=]*/gi,
    ]

    for (const pattern of urlPatterns) {
      const matches = text.match(pattern)
      if (matches && matches.length > 0) {
        return matches[0]
      }
    }

    return null
  }

  /**
   * Fetches and analyzes job content from a URL using WebFetch
   */
  static async analyzeJobFromUrl(url: string): Promise<JobAnalysis> {
    try {
      // Use the WebFetch tool to get job page content
      const response = await fetch('/api/job-url-fetch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch job content: ${response.statusText}`)
      }

      const jobAnalysis = await response.json()
      return jobAnalysis
    } catch (error) {
      console.error('Failed to analyze job from URL:', error)
      
      // Fallback to basic analysis based on URL
      return this.createFallbackAnalysis(url)
    }
  }

  /**
   * Creates a basic job analysis when URL fetching fails
   */
  private static createFallbackAnalysis(url: string): JobAnalysis {
    // Extract basic info from URL patterns
    let jobTitle = 'Software Engineer'
    let jobType = 'Software Development'
    
    if (url.includes('senior') || url.includes('lead')) {
      jobTitle = 'Senior Software Engineer'
    } else if (url.includes('junior') || url.includes('entry')) {
      jobTitle = 'Junior Software Engineer'
    } else if (url.includes('full-stack') || url.includes('fullstack')) {
      jobTitle = 'Full Stack Developer'
      jobType = 'Full Stack Development'
    } else if (url.includes('frontend') || url.includes('front-end')) {
      jobTitle = 'Frontend Developer'
      jobType = 'Frontend Development'
    } else if (url.includes('backend') || url.includes('back-end')) {
      jobTitle = 'Backend Developer'
      jobType = 'Backend Development'
    }

    return {
      jobTitle,
      requiredTechnologies: ['JavaScript', 'React', 'Node.js', 'Python'],
      experienceLevel: 'mid',
      jobType,
      keySkills: ['Problem solving', 'Team collaboration', 'Agile development'],
      description: `Job posting found at: ${url}\n\nPlease paste the job description text for better analysis.`
    }
  }

  /**
   * Extracts job ID from LinkedIn URLs for direct access
   */
  static extractLinkedInJobId(url: string): string | null {
    const patterns = [
      /currentJobId=(\d+)/,
      /jobs\/view\/(\d+)/,
      /jobs\/(\d+)/
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    return null
  }

  /**
   * Constructs direct LinkedIn job URL from job ID
   */
  static constructLinkedInJobUrl(jobId: string): string {
    return `https://www.linkedin.com/jobs/view/${jobId}`
  }

  /**
   * Validates if a URL is likely to contain job information
   */
  static isValidJobUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url)
      const hostname = parsedUrl.hostname.toLowerCase()
      const pathname = parsedUrl.pathname.toLowerCase()
      
      // Check for known job board domains
      const jobBoardDomains = [
        'linkedin.com',
        'indeed.com', 
        'glassdoor.com',
        'monster.com',
        'ziprecruiter.com',
        'dice.com',
        'simplyhired.com',
        'careerbuilder.com'
      ]

      // Check if it's a known job board
      if (jobBoardDomains.some(domain => hostname.includes(domain))) {
        return true
      }

      // Check for job-related keywords in path
      const jobKeywords = ['job', 'career', 'position', 'hiring', 'employment', 'vacancy']
      if (jobKeywords.some(keyword => pathname.includes(keyword))) {
        return true
      }

      return false
    } catch {
      return false
    }
  }
}