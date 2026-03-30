import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SynergizingLoader from './SynergizingLoader'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => children,
}))

describe('SynergizingLoader', () => {
  it('renders the loading message', () => {
    render(<SynergizingLoader message="Synergizing your professional essence..." />)
    expect(screen.getByText('Synergizing your professional essence...')).toBeInTheDocument()
  })

  it('renders the progress bar element', () => {
    const { container } = render(<SynergizingLoader message="Loading..." />)
    expect(container.querySelector('[role="progressbar"]')).toBeInTheDocument()
  })

  it('shows error state and retry button when error prop is set', async () => {
    const onRetry = vi.fn()
    const user = userEvent.setup()
    render(<SynergizingLoader message="Loading..." error="Save failed" onRetry={onRetry} />)
    expect(screen.getByText('Save failed')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(onRetry).toHaveBeenCalledOnce()
  })
})
