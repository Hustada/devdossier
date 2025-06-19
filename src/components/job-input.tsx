'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Textarea } from './ui/textarea'
import { 
  Briefcase, 
  Sparkles, 
  Target,
  Brain,
  X,
  Loader2,
  Link,
  Globe
} from 'lucide-react'
import { JobUrlAgent } from '@/lib/job-url-agent'

interface JobInputProps {
  onJobAnalysis: (analysis: JobAnalysis) => void
  onClearJob: () => void
  isAnalyzing?: boolean
  repoAnalysisStep?: string | null
}

export interface JobAnalysis {
  jobTitle: string
  requiredTechnologies: string[]
  experienceLevel: 'junior' | 'mid' | 'senior' | 'lead'
  jobType: string
  keySkills: string[]
  description: string
}

export function JobInput({ onJobAnalysis, onClearJob, isAnalyzing = false, repoAnalysisStep = null }: JobInputProps) {
  const [jobDescription, setJobDescription] = useState('')
  const [currentAnalysis, setCurrentAnalysis] = useState<JobAnalysis | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [detectedUrl, setDetectedUrl] = useState<string | null>(null)
  const [loadingStep, setLoadingStep] = useState<string | null>(null)

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) return

    try {
      setLoadingStep('🔍 Analyzing input...')
      
      // Check if the input contains a job URL
      const detectedUrl = JobUrlAgent.detectJobUrl(jobDescription.trim())
      
      if (detectedUrl) {
        // If URL is detected, use the JobUrlAgent to fetch and analyze
        console.log('🔗 Job URL detected:', detectedUrl)
        setLoadingStep('🔗 Job URL detected')
        
        await new Promise(resolve => setTimeout(resolve, 500)) // Brief pause to show step
        setLoadingStep('📄 Fetching job content...')
        
        console.log('📄 Fetching and analyzing job content...')
        const analysis = await JobUrlAgent.analyzeJobFromUrl(detectedUrl)
        
        setLoadingStep('🧠 Analyzing requirements...')
        await new Promise(resolve => setTimeout(resolve, 300))
        
        console.log('✅ Job analysis complete:', analysis)
        setLoadingStep('✅ Analysis complete!')
        
        await new Promise(resolve => setTimeout(resolve, 500))
        setLoadingStep(null)
        
        setCurrentAnalysis(analysis)
        onJobAnalysis(analysis)
      } else {
        // Traditional job description text analysis
        setLoadingStep('📝 Analyzing job description...')
        console.log('📝 Analyzing job description text...')
        
        const response = await fetch('/api/ai/analyze-job', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ jobDescription: jobDescription.trim() }),
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        setLoadingStep('🧠 Processing AI response...')
        const analysis = await response.json()
        
        console.log('✅ Job analysis complete:', analysis)
        setLoadingStep('✅ Analysis complete!')
        
        await new Promise(resolve => setTimeout(resolve, 500))
        setLoadingStep(null)
        
        setCurrentAnalysis(analysis)
        onJobAnalysis(analysis)
      }
    } catch (error) {
      console.error('Failed to analyze job description:', error)
      setLoadingStep(null)
      // Show user-friendly error message
      alert('Failed to analyze job description. Please try again or check your internet connection.')
    }
  }

  const handleClear = () => {
    setJobDescription('')
    setCurrentAnalysis(null)
    setIsExpanded(false)
    setDetectedUrl(null)
    setLoadingStep(null)
    onClearJob()
  }

  const handleInputChange = (value: string) => {
    setJobDescription(value)
    
    // Detect URL as user types
    const url = JobUrlAgent.detectJobUrl(value)
    setDetectedUrl(url)
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Briefcase className="w-5 h-5 text-orange-600" />
            <CardTitle className="text-lg">Job-Tailored Resume</CardTitle>
            <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
              Optional
            </Badge>
          </div>
          {currentAnalysis && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {!currentAnalysis ? (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Paste a job description or job posting URL to get AI-curated repository recommendations that match the role requirements.
            </div>
            
            {detectedUrl && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Globe className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-800">
                  Job URL detected: <span className="font-medium">{new URL(detectedUrl).hostname}</span>
                </span>
                <Badge variant="secondary" className="ml-auto">
                  <Link className="w-3 h-3 mr-1" />
                  Auto-fetch
                </Badge>
              </div>
            )}
            
            <div className="space-y-3">
              <Textarea
                placeholder="Paste job description, requirements, or job posting URL here..."
                value={jobDescription}
                onChange={(e) => handleInputChange(e.target.value)}
                className="min-h-[100px] resize-none"
                disabled={isAnalyzing}
              />
              
              <div className="flex space-x-2">
                <Button
                  onClick={handleAnalyze}
                  disabled={!jobDescription.trim() || isAnalyzing || loadingStep !== null}
                  className="flex-1"
                >
                  {isAnalyzing || loadingStep ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {loadingStep || 'Analyzing...'}
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Analyze Job & Get Recommendations
                    </>
                  )}
                </Button>
                
                {jobDescription.trim() && (
                  <Button
                    variant="outline"
                    onClick={() => setIsExpanded(!isExpanded)}
                  >
                    {isExpanded ? 'Collapse' : 'Preview'}
                  </Button>
                )}
              </div>
              
              {isExpanded && jobDescription.trim() && (
                <div className="p-3 bg-gray-50 rounded-md border">
                  <div className="text-sm font-medium text-gray-700 mb-2">Preview:</div>
                  <div className="text-sm text-gray-600 whitespace-pre-wrap">
                    {jobDescription.slice(0, 500)}
                    {jobDescription.length > 500 && '...'}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-green-700">
              <Target className="w-4 h-4" />
              <span className="text-sm font-medium">Job Analysis Complete</span>
            </div>
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 text-orange-700 mb-2">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">AI Recommendation Active</span>
              </div>
              <p className="text-xs text-orange-600">
                Repository selection will be automatically optimized for this job. You can still manually adjust selections below.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Job Title</div>
                <div className="text-sm text-gray-900">{currentAnalysis.jobTitle}</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Experience Level</div>
                <Badge variant="outline" className="text-xs">
                  {currentAnalysis.experienceLevel}
                </Badge>
              </div>
              
              <div className="md:col-span-2">
                <div className="text-sm font-medium text-gray-700 mb-2">Required Technologies</div>
                <div className="flex flex-wrap gap-1">
                  {currentAnalysis.requiredTechnologies.map((tech) => (
                    <Badge key={tech} variant="secondary" className="text-xs">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="md:col-span-2">
                <div className="text-sm font-medium text-gray-700 mb-2">Key Skills</div>
                <div className="flex flex-wrap gap-1">
                  {currentAnalysis.keySkills.map((skill) => (
                    <Badge key={skill} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
              <div className="flex items-center space-x-2 text-orange-700 mb-2">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">AI Recommendation Active</span>
              </div>
              <div className="text-xs text-orange-600">
                Repository selection will be automatically optimized for this job. You can still manually adjust selections below.
              </div>
            </div>
            
            {/* Repository Analysis Progress */}
            {repoAnalysisStep && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center space-x-2 text-blue-700">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-medium">{repoAnalysisStep}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}