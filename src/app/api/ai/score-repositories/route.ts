import { NextRequest, NextResponse } from 'next/server'
import { AIResumeAgent, RepositoryMatch } from '@/lib/ai-resume-agent'
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

    console.log(`🚀 Starting repository analysis for ${repositories.length} repositories`)
    if (jobAnalysis) {
      console.log(`🎯 Job-targeted analysis for: ${jobAnalysis.jobTitle}`)
      console.log(`📋 Required technologies: ${jobAnalysis.requiredTechnologies.join(', ')}`)
    } else {
      console.log('📊 General repository selection analysis')
    }

    const aiAgent = new AIResumeAgent()
    
    let matches
    if (jobAnalysis) {
      console.log('🤖 Sending repositories to AI for job-specific scoring...')
      matches = await aiAgent.scoreRepositoriesForJob(repositories as GitHubRepository[], jobAnalysis as JobAnalysis)
    } else {
      console.log('🤖 Sending repositories to AI for general scoring...')
      matches = await aiAgent.selectBestRepositories(repositories as GitHubRepository[])
    }

    console.log(`✅ AI analysis complete! Found ${matches.length} scored repositories`)
    console.log(`🏆 Top 3 matches:`, matches.slice(0, 3).map((m: RepositoryMatch) => `${m.repository.name} (${m.matchScore}%)`))

    return NextResponse.json(matches)
  } catch (error) {
    console.error('❌ Repository scoring failed:', error)
    return NextResponse.json(
      { error: 'Failed to score repositories' },
      { status: 500 }
    )
  }
}