import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StepExperience from './StepExperience'

vi.mock('framer-motion', () => ({
  motion: { div: ({ children, ...p }) => <div {...p}>{children}</div> },
  AnimatePresence: ({ children }) => children,
}))

vi.mock('../components/StepShell', () => ({
  default: ({ children, heading, skippable, onSkip }) => (
    <div>
      <h1>{heading}</h1>
      {children}
      {skippable && <button onClick={onSkip}>Skip for now</button>}
    </div>
  ),
}))

describe('StepExperience', () => {
  it('renders Add Experience button', () => {
    render(<StepExperience onNext={vi.fn()} onSkip={vi.fn()} />)
    expect(screen.getByRole('button', { name: /add experience/i })).toBeInTheDocument()
  })

  it('shows entry form when Add Experience is clicked', async () => {
    const user = userEvent.setup()
    render(<StepExperience onNext={vi.fn()} onSkip={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: /add experience/i }))
    expect(screen.getByPlaceholderText(/company/i)).toBeInTheDocument()
  })

  it('calls onNext with experience array when submitted', async () => {
    const user = userEvent.setup()
    const onNext = vi.fn()
    render(<StepExperience onNext={onNext} onSkip={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: /add experience/i }))
    await user.type(screen.getByPlaceholderText(/company/i), 'Synergy Corp')
    await user.type(screen.getByPlaceholderText(/title/i), 'Chief Disruption Officer')
    await user.type(screen.getByPlaceholderText(/start/i), '2022')
    await user.click(screen.getByRole('button', { name: /save entry/i }))
    await user.click(screen.getByRole('button', { name: /next/i }))
    expect(onNext).toHaveBeenCalledWith({
      experience: [{ company: 'Synergy Corp', title: 'Chief Disruption Officer', start: '2022', end: '' }],
    })
  })

  it('calls onSkip when skip is clicked', async () => {
    const user = userEvent.setup()
    const onSkip = vi.fn()
    render(<StepExperience onNext={vi.fn()} onSkip={onSkip} />)
    await user.click(screen.getByRole('button', { name: /skip/i }))
    expect(onSkip).toHaveBeenCalledOnce()
  })
})
