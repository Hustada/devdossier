'use client'

import { GitHubUser } from '@/lib/github-api'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { 
  MapPin, 
  Building2,
  Globe,
  Sparkles
} from 'lucide-react'

interface ProfileCardProps {
  user: GitHubUser
  selectedReposCount: number
  onGenerateResume: () => void
  isGeneratingResume: boolean
}

export function ProfileCard({ 
  user, 
  selectedReposCount, 
  onGenerateResume, 
  isGeneratingResume 
}: ProfileCardProps) {
  return (
    <Card className="flex flex-col">
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
              <a 
                href={user.blog} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:text-primary"
              >
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
            onClick={onGenerateResume}
            className="w-full" 
            size="lg"
            disabled={isGeneratingResume}
          >
            {isGeneratingResume ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate AI Resume
              </>
            )}
          </Button>
          {selectedReposCount > 0 && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              {selectedReposCount} repositories selected
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}