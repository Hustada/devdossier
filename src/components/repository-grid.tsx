'use client'

import { GitHubRepository } from '@/lib/github-api'
import { RepositoryMatch } from '@/lib/ai-resume-agent'
import { RepositoryCard } from './repository-card'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { 
  BookOpen,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface RepositoryGridProps {
  repositories: GitHubRepository[]
  allRepositories: GitHubRepository[]
  repositoryMatches: RepositoryMatch[]
  selectedRepos: Set<string>
  showAllRepos: boolean
  onToggleSelection: (repoName: string) => void
  onToggleShowAll: () => void
  hideHeader?: boolean
}

export function RepositoryGrid({
  repositories,
  allRepositories,
  repositoryMatches,
  selectedRepos,
  showAllRepos,
  onToggleSelection,
  onToggleShowAll,
  hideHeader = false
}: RepositoryGridProps) {
  const displayedRepos = showAllRepos ? allRepositories : repositories.slice(0, 6)

  return (
    <div className="flex-1 min-w-0">
      {/* Repository Header - Only show if not hidden */}
      {!hideHeader && (
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Repositories</h2>
              <p className="text-muted-foreground">Select repositories to include in your resume</p>
              <div className="w-12 h-0.5 bg-gradient-to-r from-orange-500 to-orange-300 mt-2"></div>
            </div>
            <Button
              variant="outline"
              onClick={onToggleShowAll}
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
      )}

      {/* Repository Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {displayedRepos.map((repo) => {
          const matchData = repositoryMatches.find(match => match.repository.name === repo.name)
          return (
            <RepositoryCard
              key={repo.name}
              repository={repo}
              matchData={matchData}
              isSelected={selectedRepos.has(repo.name)}
              onToggleSelection={onToggleSelection}
            />
          )
        })}
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
  )
}