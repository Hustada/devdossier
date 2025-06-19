import { NextRequest, NextResponse } from 'next/server'
import { AIResumeAgent } from '@/lib/ai-resume-agent'
import { JobAnalysis } from '@/components/job-input'
import { GitHubRepository } from '@/lib/github-api'

export async function POST(request: NextRequest) {
  try {
    const { repositories, jobAnalysis } = await request.json()

    if (!repositories || !Array.isArray(repositories)) {
      return NextResponse.json(
        { error: 'Repositories array is required' },
        { status: 400 }
      )
    }

    const aiAgent = new AIResumeAgent()
    
    let matches
    if (jobAnalysis) {
      matches = await aiAgent.scoreRepositoriesForJob(repositories as GitHubRepository[], jobAnalysis as JobAnalysis)
    } else {
      matches = await aiAgent.selectBestRepositories(repositories as GitHubRepository[])
    }

    return NextResponse.json(matches)
  } catch (error) {
    console.error('Repository scoring failed:', error)
    return NextResponse.json(
      { error: 'Failed to score repositories' },
      { status: 500 }
    )
  }
}