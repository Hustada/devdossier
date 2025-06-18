'use client'

import { Badge } from './ui/badge'
import { 
  Github,
  Sparkles,
  Heart,
  Code2
} from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-background/80 backdrop-blur-sm mt-16">
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left side - Branding */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-orange-600" />
              <span className="text-lg font-bold text-orange-600">DevDossier</span>
            </div>
            <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
              Beta
            </Badge>
          </div>

          {/* Center - Description */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Code2 className="w-4 h-4" />
              AI-powered resume builder for developers
            </p>
          </div>

          {/* Right side - Links */}
          <div className="flex items-center space-x-4">
            <a 
              href="https://github.com/Hustada/devdossier" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-orange-600 transition-colors"
            >
              <Github className="w-4 h-4" />
              <span>Source</span>
            </a>
            
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              Made with <Heart className="w-3 h-3 text-red-500" /> by developers, for developers
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="border-t border-border/30 mt-6 pt-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <div>
              © 2025 DevDossier. Transform your GitHub profile into a professional resume.
            </div>
            <div className="flex items-center gap-4">
              <span>Powered by AI</span>
              <span className="text-orange-600">•</span>
              <span>Open Source</span>
              <span className="text-orange-600">•</span>
              <span>Privacy First</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}