import { GitHubAuth } from '../github-auth'

describe('GitHubAuth', () => {
  const mockLocationAssign = jest.fn()
  const mockFetch = jest.fn()
  
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should generate correct GitHub OAuth URL', () => {
    const auth = new GitHubAuth('test-client-id', { 
      origin: 'http://localhost:3000',
      locationAssign: mockLocationAssign,
      fetch: mockFetch
    })
    const authUrl = auth.getAuthUrl()
    
    expect(authUrl).toContain('https://github.com/login/oauth/authorize')
    expect(authUrl).toContain('client_id=test-client-id')
    expect(authUrl).toContain('scope=read%3Auser%2Crepo')
    expect(authUrl).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fcallback')
  })

  it('should redirect to GitHub OAuth', () => {
    const auth = new GitHubAuth('test-client-id', { 
      origin: 'http://localhost:3000',
      locationAssign: mockLocationAssign,
      fetch: mockFetch
    })
    auth.redirectToGitHub()
    
    expect(mockLocationAssign).toHaveBeenCalledWith(
      expect.stringContaining('https://github.com/login/oauth/authorize')
    )
  })

  it('should handle OAuth callback with code', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: 'test-access-token',
        token_type: 'bearer'
      })
    })

    const auth = new GitHubAuth('test-client-id', { 
      origin: 'http://localhost:3000',
      locationAssign: mockLocationAssign,
      fetch: mockFetch
    })
    const mockCode = 'test-oauth-code'

    const result = await auth.handleCallback(mockCode)
    
    expect(result).toEqual({
      access_token: 'test-access-token',
      token_type: 'bearer'
    })
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/github/callback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: mockCode }),
    })
  })
})