import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StepSkills from './StepSkills'

vi.mock('framer-motion', () => ({
  motion: { span: ({ children, ...p }) => <span {...p}>{children}</span> },
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

describe('StepSkills', () => {
  it('renders skill input field', () => {
    render(<StepSkills onNext={vi.fn()} onSkip={vi.fn()} />)
    expect(screen.getByPlaceholderText(/add a skill/i)).toBeInTheDocument()
  })

  it('adds a skill tag when Enter is pressed', async () => {
    const user = userEvent.setup()
    render(<StepSkills onNext={vi.fn()} onSkip={vi.fn()} />)
    await user.type(screen.getByPlaceholderText(/add a skill/i), 'Synergy{Enter}')
    expect(screen.getByText('Synergy')).toBeInTheDocument()
  })

  it('removes a skill tag when remove button is clicked', async () => {
    const user = userEvent.setup()
    render(<StepSkills onNext={vi.fn()} onSkip={vi.fn()} />)
    await user.type(screen.getByPlaceholderText(/add a skill/i), 'Synergy{Enter}')
    await user.click(screen.getByRole('button', { name: /remove synergy/i }))
    expect(screen.queryByText('Synergy')).not.toBeInTheDocument()
  })

  it('calls onNext with skills array when submitted', async () => {
    const user = userEvent.setup()
    const onNext = vi.fn()
    render(<StepSkills onNext={onNext} onSkip={vi.fn()} />)
    await user.type(screen.getByPlaceholderText(/add a skill/i), 'Pivot{Enter}')
    await user.type(screen.getByPlaceholderText(/add a skill/i), 'Scale{Enter}')
    await user.click(screen.getByRole('button', { name: /complete profile/i }))
    expect(onNext).toHaveBeenCalledWith({ skills: ['Pivot', 'Scale'] })
  })

  it('does not add duplicate skills', async () => {
    const user = userEvent.setup()
    render(<StepSkills onNext={vi.fn()} onSkip={vi.fn()} />)
    await user.type(screen.getByPlaceholderText(/add a skill/i), 'Synergy{Enter}')
    await user.type(screen.getByPlaceholderText(/add a skill/i), 'Synergy{Enter}')
    expect(screen.getAllByText('Synergy')).toHaveLength(1)
  })
})
