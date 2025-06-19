import { NextRequest, NextResponse } from 'next/server'
import { AIResumeAgent, RepositoryMatch } from '@/lib/ai-resume-agent'
import { JobAnalysis } from '@/components/job-input'

export async function POST(request: NextRequest) {
  try {
    const { userProfile, repositoryMatches, jobAnalysis } = await request.json()

    if (!userProfile || !repositoryMatches || !Array.isArray(repositoryMatches)) {
      return NextResponse.json(
        { error: 'User profile and repository matches are required' },
        { status: 400 }
      )
    }

    const aiAgent = new AIResumeAgent()
    const resumeResult = await aiAgent.generateResume(
      userProfile,
      repositoryMatches as RepositoryMatch[],
      jobAnalysis as JobAnalysis | undefined
    )

    return NextResponse.json(resumeResult)
  } catch (error) {
    console.error('Resume generation failed:', error)
    return NextResponse.json(
      { error: 'Failed to generate resume' },
      { status: 500 }
    )
  }
}