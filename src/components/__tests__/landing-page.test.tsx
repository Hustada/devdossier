import { render, screen, fireEvent } from '@testing-library/react'
import { LandingPage } from '../landing-page'

// Mock the GitHubAuth class
jest.mock('@/lib/github-auth', () => ({
  GitHubAuth: jest.fn().mockImplementation(() => ({
    redirectToGitHub: jest.fn()
  }))
}))

describe('LandingPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('displays the main heading', () => {
    render(<LandingPage />)
    expect(screen.getByRole('heading', { name: /DevDossier/i })).toBeInTheDocument()
  })

  it('shows the tagline about GitHub integration', () => {
    render(<LandingPage />)
    expect(screen.getByText(/Transform your GitHub profile into a professional resume/i)).toBeInTheDocument()
  })

  it('displays the "Connect GitHub" button', () => {
    render(<LandingPage />)
    expect(screen.getByRole('button', { name: /Connect GitHub/i })).toBeInTheDocument()
  })

  it('shows key features', () => {
    render(<LandingPage />)
    expect(screen.getByText(/AI-Powered Resume Writing/i)).toBeInTheDocument()
    expect(screen.getByText(/Smart Project Analysis/i)).toBeInTheDocument()
    expect(screen.getByText(/ATS Optimization/i)).toBeInTheDocument()
  })

  it('handles GitHub connection click', () => {
    render(<LandingPage />)
    const button = screen.getByRole('button', { name: /Connect GitHub/i })
    fireEvent.click(button)
    
    // The button should show loading state
    expect(screen.getByText(/Connecting.../i)).toBeInTheDocument()
  })
})