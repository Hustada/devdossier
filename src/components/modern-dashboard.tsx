'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GitHubUser, GitHubRepository } from '@/lib/github-api'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { 
  Star, 
  GitFork, 
  Calendar, 
  ExternalLink, 
  Users, 
  BookOpen, 
  MapPin, 
  Building2,
  Globe,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react'

interface ModernDashboardProps {
  user: GitHubUser
  repositories: GitHubRepository[]
  allRepositories: GitHubRepository[]
}

const languageColors: Record<string, string> = {
  'TypeScript': '#3178c6',
  'JavaScript': '#f1e05a',
  'Python': '#3572A5',
  'Java': '#b07219',
  'C++': '#f34b7d',
  'Go': '#00ADD8',
  'Rust': '#dea584',
  'Ruby': '#701516',
  'PHP': '#4F5D95',
  'Swift': '#ffac45',
  'Kotlin': '#A97BFF',
  'C#': '#239120',
  'HTML': '#e34c26',
  'CSS': '#1572B6',
  'Vue': '#4FC08D',
  'React': '#61DAFB',
}

export function ModernDashboard({ user, repositories, allRepositories }: ModernDashboardProps) {
  const router = useRouter()
  const [showAllRepos, setShowAllRepos] = useState(false)
  const [selectedRepos, setSelectedRepos] = useState<Set<string>>(new Set())

  const displayedRepos = showAllRepos ? allRepositories : repositories.slice(0, 6)

  const toggleRepoSelection = (repoName: string) => {
    const newSelected = new Set(selectedRepos)
    if (newSelected.has(repoName)) {
      newSelected.delete(repoName)
    } else {
      newSelected.add(repoName)
    }
    setSelectedRepos(newSelected)
  }

  const handleGenerateResume = () => {
    if (selectedRepos.size === 0) {
      alert('Please select at least one repository to include in your resume.')
      return
    }
    
    alert(`Generating resume with ${selectedRepos.size} selected repositories. AI implementation coming soon!`)
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
                  <ChevronUp className="w-4 h-4 mr-2" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  View All ({allRepositories.length})
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="flex lg:gap-8 gap-4 flex-col lg:flex-row lg:items-stretch">
          {/* Left Sidebar - User Profile */}
          <div className="lg:w-80 w-full flex-shrink-0">
            <Card className="h-full flex flex-col">
              <div className="p-6 text-center">
                <div className="flex flex-col items-center space-y-3">
                  <img 
                    src={user.avatar_url} 
                    alt={user.name || user.login}
                    className="w-16 h-16 rounded-full ring-4 ring-orange-500/30"
                  />
                  <div>
                    <h3 className="text-lg font-semibold">{user.name || user.login}</h3>
                    {user.bio && (
                      <p className="text-sm text-muted-foreground mt-1">{user.bio}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="px-6 pb-6 space-y-4 flex-1 flex flex-col">
                {/* User Details */}
                <div className="space-y-3 text-sm">
                  {user.location && (
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{user.location}</span>
                    </div>
                  )}
                  {user.company && (
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Building2 className="w-4 h-4" />
                      <span>{user.company}</span>
                    </div>
                  )}
                  {user.blog && (
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Globe className="w-4 h-4" />
                      <a href={user.blog} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                        {user.blog.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 gap-3 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Repositories</span>
                    <span className="font-semibold">{user.public_repos}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Followers</span>
                    <span className="font-semibold">{user.followers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Following</span>
                    <span className="font-semibold">{user.following}</span>
                  </div>
                </div>

                {/* Generate Resume Button */}
                <div className="pt-4 border-t mt-auto">
                  <Button 
                    onClick={handleGenerateResume}
                    className="w-full" 
                    size="lg"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate AI Resume
                  </Button>
                  {selectedRepos.size > 0 && (
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      {selectedRepos.size} repositories selected
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content - Repository Cards */}
          <div className="flex-1 min-w-0">
            <div className="grid md:grid-cols-2 gap-4">
              {displayedRepos.map((repo) => (
                <Card 
                  key={repo.name} 
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedRepos.has(repo.name) 
                      ? 'ring-2 ring-orange-500 bg-orange-50 shadow-lg shadow-orange-200' 
                      : 'hover:bg-accent/50 hover:border-orange-200 hover:shadow-orange-100'
                  }`}
                  onClick={() => toggleRepoSelection(repo.name)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{repo.name}</CardTitle>
                        {repo.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {repo.description}
                          </p>
                        )}
                      </div>
                      <div className="ml-2 flex-shrink-0">
                        <div className={`w-3 h-3 rounded-full transition-all ${
                          selectedRepos.has(repo.name) 
                            ? 'bg-orange-500 shadow-sm shadow-orange-300' 
                            : 'bg-muted hover:bg-orange-300'
                        }`} />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      {repo.language && (
                        <div className="flex items-center space-x-1">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: languageColors[repo.language] || '#gray' }}
                          />
                          <span>{repo.language}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3" />
                        <span>{repo.stargazers_count}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <GitFork className="w-3 h-3" />
                        <span>{repo.forks_count}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(repo.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    {/* Repository Topics */}
                    {repo.topics && repo.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {repo.topics.slice(0, 3).map((topic) => (
                          <Badge key={topic} variant="secondary" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                        {repo.topics.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{repo.topics.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Empty State */}
            {displayedRepos.length === 0 && (
              <Card className="p-8 text-center">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No repositories found</h3>
                <p className="text-muted-foreground">
                  Create some repositories on GitHub to get started with your resume.
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}