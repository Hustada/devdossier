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
  Loader2
} from 'lucide-react'

interface JobInputProps {
  onJobAnalysis: (analysis: JobAnalysis) => void
  onClearJob: () => void
  isAnalyzing?: boolean
}

export interface JobAnalysis {
  jobTitle: string
  requiredTechnologies: string[]
  experienceLevel: 'junior' | 'mid' | 'senior' | 'lead'
  jobType: string
  keySkills: string[]
  description: string
}

export function JobInput({ onJobAnalysis, onClearJob, isAnalyzing = false }: JobInputProps) {
  const [jobDescription, setJobDescription] = useState('')
  const [currentAnalysis, setCurrentAnalysis] = useState<JobAnalysis | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) return

    try {
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

      const analysis = await response.json()
      
      setCurrentAnalysis(analysis)
      onJobAnalysis(analysis)
    } catch (error) {
      console.error('Failed to analyze job description:', error)
      // Show user-friendly error message
      alert('Failed to analyze job description. Please try again or check your internet connection.')
    }
  }

  const handleClear = () => {
    setJobDescription('')
    setCurrentAnalysis(null)
    setIsExpanded(false)
    onClearJob()
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
              Paste a job description to get AI-curated repository recommendations that match the role requirements.
            </div>
            
            <div className="space-y-3">
              <Textarea
                placeholder="Paste job description, requirements, or job posting URL here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="min-h-[100px] resize-none"
                disabled={isAnalyzing}
              />
              
              <div className="flex space-x-2">
                <Button
                  onClick={handleAnalyze}
                  disabled={!jobDescription.trim() || isAnalyzing}
                  className="flex-1"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
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
          </div>
        )}
      </CardContent>
    </Card>
  )
}