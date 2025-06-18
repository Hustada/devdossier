'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { GitHubAPI, type GitHubUser, type GitHubRepository } from '@/lib/github-api'
import { ModernDashboard } from '@/components/modern-dashboard'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<GitHubUser | null>(null)
  const [repositories, setRepositories] = useState<GitHubRepository[]>([])
  const [allRepositories, setAllRepositories] = useState<GitHubRepository[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadGitHubData = async () => {
      const token = localStorage.getItem('github_access_token')
      
      if (!token) {
        router.push('/')
        return
      }

      try {
        const api = new GitHubAPI(token)
        
        const [userData, repoData] = await Promise.all([
          api.getUser(),
          api.getRepositories()
        ])
        
        setUser(userData)
        setAllRepositories(repoData)
        setRepositories(repoData.slice(0, 6)) // Show top 6 repos by default
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load GitHub data')
        setLoading(false)
      }
    }

    loadGitHubData()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-lg">Loading your GitHub profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-lg text-red-600">Error: {error}</p>
          <button 
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  if (user) {
    return (
      <ModernDashboard 
        user={user} 
        repositories={repositories} 
        allRepositories={allRepositories}
      />
    )
  }

  return null
}