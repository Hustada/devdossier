import { GitHubAPI } from '../github-api'

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('GitHubAPI', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should fetch user profile', async () => {
    const mockUserData = {
      login: 'testuser',
      name: 'Test User',
      bio: 'Software Developer',
      public_repos: 25,
      followers: 100,
      following: 50,
      location: 'San Francisco, CA',
      company: 'Tech Company',
      blog: 'https://testuser.dev',
      email: 'test@example.com'
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUserData
    })

    const api = new GitHubAPI('test-token')
    const user = await api.getUser()

    expect(user).toEqual(mockUserData)
    expect(mockFetch).toHaveBeenCalledWith('https://api.github.com/user', {
      headers: {
        'Authorization': 'Bearer test-token',
        'Accept': 'application/vnd.github.v3+json'
      }
    })
  })

  it('should fetch user repositories', async () => {
    const mockRepos = [
      {
        name: 'awesome-project',
        description: 'An awesome project',
        language: 'TypeScript',
        stargazers_count: 10,
        forks_count: 2,
        topics: ['react', 'nextjs'],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-12-01T00:00:00Z'
      }
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockRepos
    })

    const api = new GitHubAPI('test-token')
    const repos = await api.getRepositories()

    expect(repos).toEqual(mockRepos)
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.github.com/user/repos?sort=updated&per_page=100',
      {
        headers: {
          'Authorization': 'Bearer test-token',
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    )
  })

  it('should fetch repository languages', async () => {
    const mockLanguages = {
      'TypeScript': 5000,
      'JavaScript': 3000,
      'CSS': 1000
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockLanguages
    })

    const api = new GitHubAPI('test-token')
    const languages = await api.getRepositoryLanguages('testuser', 'awesome-project')

    expect(languages).toEqual(mockLanguages)
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.github.com/repos/testuser/awesome-project/languages',
      {
        headers: {
          'Authorization': 'Bearer test-token',
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    )
  })

  it('should handle API errors gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized'
    })

    const api = new GitHubAPI('invalid-token')
    
    await expect(api.getUser()).rejects.toThrow('GitHub API request failed: 401 Unauthorized')
  })
})