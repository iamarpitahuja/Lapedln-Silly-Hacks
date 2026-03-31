import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import App from './App'
import * as authCtx from './context/AuthContext'
import * as api from './services/api'

vi.mock('./services/api', () => ({
  fetchProfile: vi.fn(),
  fetchFeed: vi.fn().mockResolvedValue({ posts: [], trending_delusions: [], buzzwords: [] }),
  fetchJobOptions: vi.fn().mockResolvedValue([]),
  fetchConnections: vi.fn().mockResolvedValue([]),
  fetchConnectionSuggestions: vi.fn().mockResolvedValue([]),
}))

vi.mock('./context/AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: vi.fn(),
}))

vi.mock('./features/onboarding/OnboardingPage', () => ({
  default: () => <h1>What should the algorithm call you?</h1>,
}))

vi.mock('./components/TopNav/TopNav', () => ({
  default: () => <nav>TopNav</nav>,
}))

vi.mock('./features/home/Home', () => ({
  default: () => <div>Home</div>,
}))

vi.mock('./features/featureTour/FeatureTour', () => ({
  default: () => null,
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

describe('App new-user redirect', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.history.pushState({}, '', '/')
    vi.clearAllMocks()
  })

  it('renders OnboardingPage when user has default display_name', async () => {
    authCtx.useAuth.mockReturnValue({
      session: { access_token: 'tok', user: { id: 'u1' } },
      loading: false,
    })
    api.fetchProfile.mockResolvedValue({ display_name: 'Anonymous Larper', larp_rating: 0 })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText(/what should the algorithm call you/i)).toBeInTheDocument()
    })
  })

  it('renders OnboardingPage for Google-style new profile with default onboarding fields', async () => {
    authCtx.useAuth.mockReturnValue({
      session: { access_token: 'tok', user: { id: 'u1' } },
      loading: false,
    })
    api.fetchProfile.mockResolvedValue({
      display_name: 'Ada Lovelace',
      job: 'Aspiring Thought Leader',
      bio: '',
      skills: [],
      experience: [],
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText(/what should the algorithm call you/i)).toBeInTheDocument()
    })
  })

  it('renders OnboardingPage when manual override query param is set', async () => {
    authCtx.useAuth.mockReturnValue({
      session: { access_token: 'tok', user: { id: 'u1' } },
      loading: false,
    })
    api.fetchProfile.mockResolvedValue({
      display_name: 'Ada Lovelace',
      job: 'Principal Engineer',
      bio: 'Already filled out profile',
      skills: [{ name: 'React' }],
      experience: [{ title: 'Engineer' }],
    })

    window.history.pushState({}, '', '/?onboarding=1')
    render(<App />)

    await waitFor(() => {
      expect(screen.getByText(/what should the algorithm call you/i)).toBeInTheDocument()
    })
  })

  it('skips onboarding when onboarding_completed_at is already set', async () => {
    authCtx.useAuth.mockReturnValue({
      session: { access_token: 'tok', user: { id: 'u1' } },
      loading: false,
    })
    api.fetchProfile.mockResolvedValue({
      display_name: 'Ada Lovelace',
      onboarding_completed_at: '2026-03-30T12:00:00.000Z',
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.queryByText(/what should the algorithm call you/i)).not.toBeInTheDocument()
    })
  })
})
