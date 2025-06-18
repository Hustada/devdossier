'use client'

import { GitHubRepository } from '@/lib/github-api'
import { RepositoryMatch } from '@/lib/ai-resume-agent'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { 
  Star, 
  GitFork, 
  Calendar
} from 'lucide-react'

interface RepositoryCardProps {
  repository: GitHubRepository
  matchData?: RepositoryMatch
  isSelected: boolean
  onToggleSelection: (repoName: string) => void
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

export function RepositoryCard({ 
  repository, 
  matchData, 
  isSelected, 
  onToggleSelection 
}: RepositoryCardProps) {
  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-lg ${
        isSelected 
          ? 'ring-2 ring-orange-500 bg-orange-50 shadow-lg shadow-orange-200' 
          : 'hover:bg-accent/50 hover:border-orange-200 hover:shadow-orange-100'
      }`}
      onClick={() => onToggleSelection(repository.name)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <CardTitle className="text-lg truncate">{repository.name}</CardTitle>
              {matchData && (
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    matchData.confidenceLevel === 'high' ? 'bg-green-50 text-green-700 border-green-200' :
                    matchData.confidenceLevel === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                    'bg-gray-50 text-gray-600 border-gray-200'
                  }`}
                >
                  {matchData.matchScore}% match
                </Badge>
              )}
            </div>
            {repository.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {repository.description}
              </p>
            )}
            {matchData && matchData.reasoning.length > 0 && (
              <p className="text-xs text-orange-600 mt-1 line-clamp-1">
                {matchData.reasoning[0]}
              </p>
            )}
          </div>
          <div className="ml-2 flex-shrink-0">
            <div className={`w-3 h-3 rounded-full transition-all ${
              isSelected 
                ? 'bg-orange-500 shadow-sm shadow-orange-300' 
                : 'bg-muted hover:bg-orange-300'
            }`} />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {repository.language && (
            <div className="flex items-center space-x-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: languageColors[repository.language] || '#gray' }}
              />
              <span>{repository.language}</span>
            </div>
          )}
          <div className="flex items-center space-x-1">
            <Star className="w-3 h-3" />
            <span>{repository.stargazers_count}</span>
          </div>
          <div className="flex items-center space-x-1">
            <GitFork className="w-3 h-3" />
            <span>{repository.forks_count}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="w-3 h-3" />
            <span>{new Date(repository.updated_at).toLocaleDateString()}</span>
          </div>
        </div>
        
        {/* Repository Topics */}
        {repository.topics && repository.topics.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {repository.topics.slice(0, 3).map((topic) => (
              <Badge key={topic} variant="secondary" className="text-xs">
                {topic}
              </Badge>
            ))}
            {repository.topics.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{repository.topics.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}