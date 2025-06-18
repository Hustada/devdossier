import { render, screen, fireEvent } from '@testing-library/react'
import { GitHubConnectButton } from '../github-connect-button'

describe('GitHubConnectButton', () => {
  it('renders the connect button', () => {
    render(<GitHubConnectButton />)
    expect(screen.getByRole('button', { name: /Connect GitHub/i })).toBeInTheDocument()
  })

  it('shows GitHub icon', () => {
    render(<GitHubConnectButton />)
    const button = screen.getByRole('button', { name: /Connect GitHub/i })
    expect(button).toContainHTML('svg')
  })

  it('calls onClick when clicked', () => {
    const mockOnClick = jest.fn()
    render(<GitHubConnectButton onClick={mockOnClick} />)
    
    const button = screen.getByRole('button', { name: /Connect GitHub/i })
    fireEvent.click(button)
    
    expect(mockOnClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when loading', () => {
    render(<GitHubConnectButton loading={true} />)
    const button = screen.getByRole('button', { name: /Connecting.../i })
    expect(button).toBeDisabled()
  })

  it('shows loading text when loading', () => {
    render(<GitHubConnectButton loading={true} />)
    expect(screen.getByText(/Connecting.../i)).toBeInTheDocument()
  })
})