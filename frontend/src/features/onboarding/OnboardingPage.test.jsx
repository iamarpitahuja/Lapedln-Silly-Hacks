import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import OnboardingPage from './OnboardingPage'

vi.mock('../../services/api', () => ({
  updateProfilePatch: vi.fn().mockResolvedValue({}),
  updateJob: vi.fn().mockResolvedValue({}),
  fetchProfile: vi.fn().mockResolvedValue({ larp_rating: 5.0, display_name: 'Ada' }),
  fetchJobOptions: vi.fn().mockResolvedValue(['Chaos Pilot']),
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...p }) => <div {...p}>{children}</div>,
    span: ({ children, ...p }) => <span {...p}>{children}</span>,
    p: ({ children, ...p }) => <p {...p}>{children}</p>,
    img: ({ ...p }) => <img {...p} />,
    button: ({ children, ...p }) => <button {...p}>{children}</button>,
  },
  AnimatePresence: ({ children }) => children,
  MotionConfig: ({ children }) => children,
}))

vi.mock('./components/BuzzwordParticles', () => ({ default: () => null }))
vi.mock('./components/SynergizingLoader', () => ({ default: () => <div>Synergizing...</div> }))
vi.mock('./components/LarpCounter', () => ({
  default: ({ target, onComplete }) => {
    onComplete?.()
    return <p>{target.toFixed(2)}</p>
  },
}))
vi.mock('canvas-confetti', () => ({ default: vi.fn() }))

function renderPage(onComplete = vi.fn()) {
  return render(
    <MemoryRouter>
      <OnboardingPage onComplete={onComplete} />
    </MemoryRouter>
  )
}

describe('OnboardingPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders StepName first', () => {
    renderPage()
    expect(screen.getByText(/what should the algorithm call you/i)).toBeInTheDocument()
  })

  it('advances to StepJob after entering a name', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByRole('textbox'), 'Ada')
    await user.click(screen.getByRole('button', { name: /next/i }))
    await waitFor(() => {
      expect(screen.getByText(/choose your corporate identity/i)).toBeInTheDocument()
    })
  })
})
