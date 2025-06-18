interface GitHubAuthDeps {
  origin?: string
  locationAssign?: (url: string) => void
  fetch?: typeof fetch
}

export class GitHubAuth {
  private clientId: string
  private redirectUri: string
  private locationAssign: (url: string) => void
  private fetchFn: typeof fetch

  constructor(clientId: string, deps: GitHubAuthDeps = {}) {
    this.clientId = clientId
    const origin = deps.origin || (typeof window !== 'undefined' ? window.location.origin : '')
    this.redirectUri = `${origin}/auth/callback`
    this.locationAssign = deps.locationAssign || ((url: string) => window.location.assign(url))
    this.fetchFn = deps.fetch || fetch
  }

  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'read:user,repo',
      response_type: 'code',
    })

    return `https://github.com/login/oauth/authorize?${params.toString()}`
  }

  redirectToGitHub(): void {
    const authUrl = this.getAuthUrl()
    this.locationAssign(authUrl)
  }

  async handleCallback(code: string): Promise<{ access_token: string; token_type: string }> {
    const response = await this.fetchFn('/api/auth/github/callback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    })

    if (!response.ok) {
      throw new Error('Failed to exchange code for token')
    }

    return response.json()
  }
}