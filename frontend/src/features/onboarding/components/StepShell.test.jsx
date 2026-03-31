import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StepShell from './StepShell'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }) => children,
}))

describe('StepShell', () => {
  it('renders heading and children', () => {
    render(
      <StepShell heading="What should the algorithm call you?" stepNumber={1} totalSteps={6}>
        <input />
      </StepShell>
    )
    expect(screen.getByText('What should the algorithm call you?')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('shows skip button when skippable=true', () => {
    const onSkip = vi.fn()
    render(
      <StepShell heading="heading" stepNumber={3} totalSteps={6} skippable onSkip={onSkip}>
        <input />
      </StepShell>
    )
    expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument()
  })

  it('does not show skip button when skippable=false', () => {
    render(
      <StepShell heading="heading" stepNumber={1} totalSteps={6} skippable={false}>
        <input />
      </StepShell>
    )
    expect(screen.queryByRole('button', { name: /skip/i })).not.toBeInTheDocument()
  })

  it('calls onSkip when skip button is clicked', async () => {
    const user = userEvent.setup()
    const onSkip = vi.fn()
    render(
      <StepShell heading="heading" stepNumber={3} totalSteps={6} skippable onSkip={onSkip}>
        <input />
      </StepShell>
    )
    await user.click(screen.getByRole('button', { name: /skip/i }))
    expect(onSkip).toHaveBeenCalledOnce()
  })
})
