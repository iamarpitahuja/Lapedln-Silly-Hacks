import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StepWelcome from './StepWelcome'

vi.mock('canvas-confetti', () => ({ default: vi.fn() }))
vi.mock('../components/LarpCounter', () => ({
  default: ({ target, onComplete }) => {
    onComplete?.()
    return <p>{target.toFixed(2)}</p>
  },
}))
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...p }) => <div {...p}>{children}</div>,
    img: ({ ...p }) => <img {...p} />,
    p: ({ children, ...p }) => <p {...p}>{children}</p>,
    button: ({ children, ...p }) => <button {...p}>{children}</button>,
  },
  AnimatePresence: ({ children }) => children,
}))

describe('StepWelcome', () => {
  it('renders YOUR LARP RATING heading', () => {
    render(<StepWelcome larpRating={42.5} onEnter={vi.fn()} />)
    expect(screen.getByText(/your larp rating/i)).toBeInTheDocument()
  })

  it('displays the larp rating value', () => {
    render(<StepWelcome larpRating={42.5} onEnter={vi.fn()} />)
    expect(screen.getByText('42.50')).toBeInTheDocument()
  })

  it('shows Enter the Platform button after counter completes', () => {
    render(<StepWelcome larpRating={42.5} onEnter={vi.fn()} />)
    expect(screen.getByRole('button', { name: /enter the platform/i })).toBeInTheDocument()
  })

  it('calls onEnter when button is clicked', async () => {
    const user = userEvent.setup()
    const onEnter = vi.fn()
    render(<StepWelcome larpRating={42.5} onEnter={onEnter} />)
    await user.click(screen.getByRole('button', { name: /enter the platform/i }))
    expect(onEnter).toHaveBeenCalledOnce()
  })
})
