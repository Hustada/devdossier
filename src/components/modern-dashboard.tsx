'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GitHubUser, GitHubRepository } from '@/lib/github-api'
import { AIResumeAgent, RepositoryMatch } from '@/lib/ai-resume-agent'
import { JobInput, JobAnalysis } from './job-input'
import { ProfileCard } from './profile-card'
import { RepositoryGrid } from './repository-grid'
import { Footer } from './footer'
import { Badge } from './ui/badge'
import { Button } from './ui/button'

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
  const [isGeneratingResume, setIsGeneratingResume] = useState(false)


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
      const aiAgent = new AIResumeAgent()
      const matches = await aiAgent.scoreRepositoriesForJob(allRepositories, analysis)
      setRepositoryMatches(matches)
      
      // Auto-select top matching repositories
      const topMatches = matches.slice(0, 6).map(match => match.repository.name)
      setSelectedRepos(new Set(topMatches))
    } catch (error) {
      console.error('Failed to analyze repositories for job:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleClearJob = () => {
    setJobAnalysis(null)
    setRepositoryMatches([])
    setSelectedRepos(new Set())
  }

  const handleGenerateResume = async () => {
    if (selectedRepos.size === 0) {
      alert('Please select at least one repository to include in your resume.')
      return
    }
    
    setIsGeneratingResume(true)
    
    try {
      const aiAgent = new AIResumeAgent()
      
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
        selectedMatches = await aiAgent.selectBestRepositories(selectedRepoObjects)
      }
      
      const resumeResult = await aiAgent.generateResume(
        user,
        selectedMatches,
        jobAnalysis || undefined
      )
      
      // Open resume in new window
      const newWindow = window.open('', '_blank')
      if (newWindow) {
        newWindow.document.write(resumeResult.resumeHtml)
        newWindow.document.close()
      }
      
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

        <div className="flex lg:gap-8 gap-4 flex-col lg:flex-row lg:items-start">
          {/* Left Sidebar - User Profile */}
          <div className="lg:w-80 w-full flex-shrink-0">
            <ProfileCard
              user={user}
              selectedReposCount={selectedRepos.size}
              onGenerateResume={handleGenerateResume}
              isGeneratingResume={isGeneratingResume}
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