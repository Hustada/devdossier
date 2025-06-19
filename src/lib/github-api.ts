export interface GitHubUser {
  login: string
  name: string | null
  bio: string | null
  public_repos: number
  followers: number
  following: number
  location: string | null
  company: string | null
  blog: string | null
  email: string | null
  avatar_url: string
  html_url: string
}

export interface GitHubRepository {
  name: string
  full_name: string
  description: string | null
  language: string | null
  stargazers_count: number
  forks_count: number
  topics: string[]
  created_at: string
  updated_at: string
  pushed_at: string
  html_url: string
  clone_url: string
  size: number
  open_issues_count: number
  default_branch: string
  private: boolean
}

export interface GitHubLanguages {
  [language: string]: number
}

export interface GitHubCommit {
  sha: string
  commit: {
    author: {
      name: string
      email: string
      date: string
    }
    message: string
  }
  author: {
    login: string
    avatar_url: string
  } | null
}

export class GitHubAPI {
  private accessToken: string
  private baseUrl = 'https://api.github.com'

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  private async makeRequest<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    })

    if (!response.ok) {
      throw new Error(`GitHub API request failed: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async getUser(): Promise<GitHubUser> {
    return this.makeRequest<GitHubUser>('/user')
  }

  async getRepositories(): Promise<GitHubRepository[]> {
    return this.makeRequest<GitHubRepository[]>('/user/repos?sort=updated&per_page=100')
  }

  async getRepositoryLanguages(owner: string, repo: string): Promise<GitHubLanguages> {
    return this.makeRequest<GitHubLanguages>(`/repos/${owner}/${repo}/languages`)
  }

  async getRepositoryReadme(owner: string, repo: string): Promise<string | null> {
    try {
      const response = await this.makeRequest<{ content: string; encoding: string }>(`/repos/${owner}/${repo}/readme`)
      
      if (response.encoding === 'base64') {
        return atob(response.content)
      }
      
      return response.content
    } catch (readmeError) {
      // README not found or not accessible
      console.debug('README not found:', readmeError)
      return null
    }
  }

  async getRepositoryCommits(owner: string, repo: string, per_page = 10): Promise<GitHubCommit[]> {
    return this.makeRequest<GitHubCommit[]>(`/repos/${owner}/${repo}/commits?per_page=${per_page}`)
  }
}