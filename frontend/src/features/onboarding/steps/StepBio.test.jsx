import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StepBio from './StepBio'

vi.mock('../components/StepShell', () => ({
  default: ({ children, heading, skippable, onSkip }) => (
    <div>
      <h1>{heading}</h1>
      {children}
      {skippable && <button onClick={onSkip}>Skip for now</button>}
    </div>
  ),
}))

describe('StepBio', () => {
  it('renders a textarea', () => {
    render(<StepBio onNext={vi.fn()} onSkip={vi.fn()} />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('calls onNext with bio content', async () => {
    const user = userEvent.setup()
    const onNext = vi.fn()
    render(<StepBio onNext={onNext} onSkip={vi.fn()} />)
    await user.type(screen.getByRole('textbox'), 'Building at the intersection of ambiguity.')
    await user.click(screen.getByRole('button', { name: /next/i }))
    expect(onNext).toHaveBeenCalledWith({ bio: 'Building at the intersection of ambiguity.' })
  })

  it('calls onSkip when skip is clicked', async () => {
    const user = userEvent.setup()
    const onSkip = vi.fn()
    render(<StepBio onNext={vi.fn()} onSkip={onSkip} />)
    await user.click(screen.getByRole('button', { name: /skip/i }))
    expect(onSkip).toHaveBeenCalledOnce()
  })

  it('allows submitting with empty bio', async () => {
    const user = userEvent.setup()
    const onNext = vi.fn()
    render(<StepBio onNext={onNext} onSkip={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: /next/i }))
    expect(onNext).toHaveBeenCalledWith({ bio: '' })
  })
})
