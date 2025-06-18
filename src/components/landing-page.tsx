'use client'

import { useState } from "react"
import { GitHubConnectButton } from "./github-connect-button"
import { GitHubAuth } from "@/lib/github-auth"

export function LandingPage() {
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnectGitHub = () => {
    setIsConnecting(true)
    
    // Get GitHub client ID from environment or use a default for demo
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || 'demo-client-id'
    const auth = new GitHubAuth(clientId)
    
    try {
      auth.redirectToGitHub()
    } catch (error) {
      console.error('Failed to connect to GitHub:', error)
      setIsConnecting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <div className="container max-w-6xl mx-auto px-4 py-16 sm:py-24">
        <div className="text-center space-y-8">
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
            DevDossier
          </h1>
          
          <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto">
            Transform your GitHub profile into a professional resume with AI-powered expertise
          </p>
          
          <div className="flex justify-center pt-8">
            <GitHubConnectButton 
              onClick={handleConnectGitHub} 
              loading={isConnecting}
            />
          </div>
        </div>
        
        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mt-24">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-primary rounded-lg mx-auto flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">AI</span>
            </div>
            <h3 className="font-semibold text-lg">AI-Powered Resume Writing</h3>
            <p className="text-muted-foreground">
              Expert AI transforms your GitHub projects into compelling professional achievements
            </p>
          </div>
          
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-primary rounded-lg mx-auto flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">📊</span>
            </div>
            <h3 className="font-semibold text-lg">Smart Project Analysis</h3>
            <p className="text-muted-foreground">
              Automatically analyzes your repositories to highlight technical skills and impact
            </p>
          </div>
          
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-primary rounded-lg mx-auto flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">✓</span>
            </div>
            <h3 className="font-semibold text-lg">ATS Optimization</h3>
            <p className="text-muted-foreground">
              Ensures your resume passes through Applicant Tracking Systems successfully
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}