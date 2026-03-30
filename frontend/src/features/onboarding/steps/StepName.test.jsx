import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StepName from './StepName'

vi.mock('../components/StepShell', () => ({
  default: ({ children, heading, skippable }) => (
    <div>
      <h1>{heading}</h1>
      {children}
      {skippable && <button>Skip for now</button>}
    </div>
  ),
}))

describe('StepName', () => {
  it('renders the name input', () => {
    render(<StepName onNext={vi.fn()} />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('submit button is disabled when name is empty', () => {
    render(<StepName onNext={vi.fn()} />)
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled()
  })

  it('calls onNext with display_name when submitted', async () => {
    const user = userEvent.setup()
    const onNext = vi.fn()
    render(<StepName onNext={onNext} />)
    await user.type(screen.getByRole('textbox'), 'Ada Lovelace')
    await user.click(screen.getByRole('button', { name: /next/i }))
    expect(onNext).toHaveBeenCalledWith({ display_name: 'Ada Lovelace' })
  })

  it('does not render a skip button', () => {
    render(<StepName onNext={vi.fn()} />)
    expect(screen.queryByRole('button', { name: /skip/i })).not.toBeInTheDocument()
  })
})
