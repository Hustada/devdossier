'use client'

import { Button } from "./ui/button"
import { Github, Loader2 } from "lucide-react"

interface GitHubConnectButtonProps {
  onClick?: () => void
  loading?: boolean
}

export function GitHubConnectButton({ onClick, loading = false }: GitHubConnectButtonProps) {
  return (
    <Button 
      size="lg" 
      className="text-lg px-8 py-4 h-auto" 
      onClick={onClick}
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <Github className="w-5 h-5 mr-2" />
          Connect GitHub
        </>
      )}
    </Button>
  )
}