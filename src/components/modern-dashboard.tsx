'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GitHubUser, GitHubRepository } from '@/lib/github-api'
import { RepositoryMatch } from '@/lib/ai-resume-agent'
import { JobInput, JobAnalysis } from './job-input'
import { ProfileCard } from './profile-card'
import { RepositoryGrid } from './repository-grid'
import { Footer } from './footer'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { ResumeEditor, ResumeData } from './resume-editor'

interface ModernDashboardProps {
  user: GitHubUser
  repositories: GitHubRepository[]
  allRepositories: GitHubRepository[]
}


export function ModernDashboard({ user, repositories, allRepositories }: ModernDashboardProps) {
  const router = useRouter()
  const [showAllRepos, setShowAllRepos] = useState(false)
  const [selectedRepos, setSelectedRepos] = useState<Set<string>>(new Set())
  const [jobAnalysis, setJobAnalysis] = useState<JobAnalysis | null>(null)
  const [repositoryMatches, setRepositoryMatches] = useState<RepositoryMatch[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [repoAnalysisStep, setRepoAnalysisStep] = useState<string | null>(null)
  const [isGeneratingResume, setIsGeneratingResume] = useState(false)
  const [showResumeEditor, setShowResumeEditor] = useState(false)
  const [resumeData, setResumeData] = useState<ResumeData | null>(null)
  const [resumeHtml, setResumeHtml] = useState<string>('')


  const toggleRepoSelection = (repoName: string) => {
    const newSelected = new Set(selectedRepos)
    if (newSelected.has(repoName)) {
      newSelected.delete(repoName)
    } else {
      newSelected.add(repoName)
    }
    setSelectedRepos(newSelected)
  }

  const handleJobAnalysis = async (analysis: JobAnalysis) => {
    setIsAnalyzing(true)
    setJobAnalysis(analysis)
    
    try {
      setRepoAnalysisStep(`🎯 Starting AI analysis for ${analysis.jobTitle}`)
      console.log('🎯 Starting repository scoring for job:', analysis.jobTitle)
      
      await new Promise(resolve => setTimeout(resolve, 500)) // Brief pause to show step
      setRepoAnalysisStep(`📊 Analyzing ${allRepositories.length} repositories with AI`)
      console.log('📊 Analyzing', allRepositories.length, 'repositories...')
      
      const response = await fetch('/api/ai/score-repositories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repositories: allRepositories,
          jobAnalysis: analysis
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      setRepoAnalysisStep('🧠 Processing AI repository scores')
      const matches = await response.json()
      
      setRepoAnalysisStep('🎯 Auto-selecting best matching repositories')
      console.log('✅ Repository scoring complete. Top matches:', matches.slice(0, 5).map((m: RepositoryMatch) => `${m.repository.name} (${m.matchScore}%)`))
      setRepositoryMatches(matches)
      
      // Auto-select repositories with high confidence scores
      const autoSelectMatches = matches
        .filter((match: RepositoryMatch) => 
          match.confidenceLevel === 'high' || 
          (match.confidenceLevel === 'medium' && match.matchScore >= 50)
        )
        .slice(0, 5) // Limit to top 5 high-confidence matches
        .map((match: RepositoryMatch) => match.repository.name)
      
      // If we have fewer than 3 high-confidence matches, add some medium confidence ones
      if (autoSelectMatches.length < 3) {
        const additionalMatches = matches
          .filter((match: RepositoryMatch) => 
            match.confidenceLevel === 'medium' && 
            match.matchScore >= 30 &&
            !autoSelectMatches.includes(match.repository.name)
          )
          .slice(0, 3 - autoSelectMatches.length)
          .map((match: RepositoryMatch) => match.repository.name)
        
        autoSelectMatches.push(...additionalMatches)
      }
      
      setRepoAnalysisStep('✅ Repository analysis complete!')
      await new Promise(resolve => setTimeout(resolve, 1000)) // Show completion message
      setRepoAnalysisStep(null)
      
      setSelectedRepos(new Set(autoSelectMatches))
    } catch (error) {
      console.error('Failed to analyze repositories for job:', error)
      setRepoAnalysisStep('❌ Repository analysis failed')
      await new Promise(resolve => setTimeout(resolve, 2000))
      setRepoAnalysisStep(null)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleClearJob = () => {
    setJobAnalysis(null)
    setRepositoryMatches([])
    setSelectedRepos(new Set())
    setRepoAnalysisStep(null)
  }

  const handleGenerateResume = async () => {
    if (selectedRepos.size === 0) {
      alert('Please select at least one repository to include in your resume.')
      return
    }
    
    setIsGeneratingResume(true)
    
    try {
      // Get repository matches for selected repos
      let selectedMatches: RepositoryMatch[]
      
      if (jobAnalysis) {
        // Use existing job-based matches
        selectedMatches = repositoryMatches.filter(match => 
          selectedRepos.has(match.repository.name)
        )
      } else {
        // Generate general matches for selected repos
        const selectedRepoObjects = allRepositories.filter(repo => 
          selectedRepos.has(repo.name)
        )
        
        const response = await fetch('/api/ai/score-repositories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            repositories: selectedRepoObjects,
            jobAnalysis: null
          }),
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        selectedMatches = await response.json()
      }
      
      const resumeResponse = await fetch('/api/ai/generate-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userProfile: {
            name: user.name || undefined,
            login: user.login,
            bio: user.bio || undefined
          },
          repositoryMatches: selectedMatches,
          jobAnalysis: jobAnalysis || undefined
        }),
      })

      if (!resumeResponse.ok) {
        throw new Error(`HTTP ${resumeResponse.status}: ${resumeResponse.statusText}`)
      }

      const resumeResult = await resumeResponse.json()
      
      // Use the structured resume data from AI or fallback to parsing
      const resumeData: ResumeData = resumeResult.resumeData ? {
        ...resumeResult.resumeData,
        template: 'classic',
        primaryColor: '#ff6b35'
      } : {
        name: user.name || user.login,
        title: jobAnalysis?.jobTitle || 'Software Engineer',
        summary: 'Experienced software engineer with a proven track record of building impactful projects.',
        skills: Array.from(new Set(selectedMatches.flatMap(m => m.relevantTechnologies))),
        projects: selectedMatches.map(match => ({
          name: match.repository.name,
          description: match.repository.description || '',
          technologies: match.relevantTechnologies,
          achievements: match.reasoning,
          url: match.repository.html_url
        })),
        template: 'classic',
        primaryColor: '#ff6b35'
      }
      
      setResumeData(resumeData)
      setResumeHtml(resumeResult.resumeHtml)
      setShowResumeEditor(true)
      
    } catch (error) {
      console.error('Failed to generate resume:', error)
      alert('Failed to generate resume. Please try again.')
    } finally {
      setIsGeneratingResume(false)
    }
  }

  const handleSignOut = () => {
    localStorage.removeItem('github_access_token')
    router.push('/')
  }

  if (showResumeEditor && resumeData && resumeHtml) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-orange-50">
        {/* Header */}
        <div className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="container max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button 
                  variant="ghost" 
                  onClick={() => setShowResumeEditor(false)}
                  className="mr-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Dashboard
                </Button>
                <h1 className="text-2xl font-bold text-orange-600">
                  DevDossier
                </h1>
                <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700 border-orange-200">
                  Resume Editor
                </Badge>
              </div>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
        
        <ResumeEditor
          initialData={resumeData}
          resumeHtml={resumeHtml}
          onSave={(data) => {
            setResumeData(data)
            // TODO: Regenerate HTML with new template/data
          }}
          onExport={(format) => {
            // TODO: Implement export functionality
            console.log('Export format:', format)
          }}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-orange-50">
      {/* Header */}
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-orange-600">
                DevDossier
              </h1>
              <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700 border-orange-200">
                Dashboard
              </Badge>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 py-8">
        {/* Job Input Component */}
        <JobInput 
          onJobAnalysis={handleJobAnalysis}
          onClearJob={handleClearJob}
          isAnalyzing={isAnalyzing}
          repoAnalysisStep={repoAnalysisStep}
        />


        {/* Repositories Header - Full Width */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Repositories</h2>
              <p className="text-muted-foreground">Select repositories to include in your resume</p>
              <div className="w-12 h-0.5 bg-gradient-to-r from-orange-500 to-orange-300 mt-2"></div>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowAllRepos(!showAllRepos)}
            >
              {showAllRepos ? (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                  Show Less
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  View All ({allRepositories.length})
                </>
              )}
            </Button>
          </div>
        </div>

        <div className={`flex lg:gap-8 gap-4 flex-col lg:flex-row ${
          !showAllRepos ? 'lg:items-stretch' : 'lg:items-start'
        }`}>
          {/* Left Sidebar - User Profile */}
          <div className="lg:w-80 w-full flex-shrink-0">
            <ProfileCard
              user={user}
              selectedReposCount={selectedRepos.size}
              onGenerateResume={handleGenerateResume}
              isGeneratingResume={isGeneratingResume}
              shouldMatchHeight={!showAllRepos}
            />
          </div>

          {/* Main Content - Repository Grid */}
          <RepositoryGrid
            repositories={repositories}
            allRepositories={allRepositories}
            repositoryMatches={repositoryMatches}
            selectedRepos={selectedRepos}
            showAllRepos={showAllRepos}
            onToggleSelection={toggleRepoSelection}
            onToggleShowAll={() => setShowAllRepos(!showAllRepos)}
            hideHeader={true}
          />
        </div>
      </div>
      
      <Footer />
    </div>
  )
}