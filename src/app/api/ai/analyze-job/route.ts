import { NextRequest, NextResponse } from 'next/server'
import { AIResumeAgent } from '@/lib/ai-resume-agent'

export async function POST(request: NextRequest) {
  try {
    const { jobDescription } = await request.json()

    if (!jobDescription || typeof jobDescription !== 'string') {
      return NextResponse.json(
        { error: 'Job description is required' },
        { status: 400 }
      )
    }

    const aiAgent = new AIResumeAgent()
    const analysis = await aiAgent.analyzeJobDescription(jobDescription)

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Job analysis failed:', error)
    return NextResponse.json(
      { error: 'Failed to analyze job description' },
      { status: 500 }
    )
  }
}