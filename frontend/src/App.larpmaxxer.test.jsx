import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// Minimal session stub
const fakeSession = { user: { id: 'test-user' } }
const fakeAuth = { session: fakeSession, loading: false }

vi.mock('./context/AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => fakeAuth,
}))

vi.mock('./services/api', () => ({
  fetchProfile: () => Promise.resolve({ display_name: 'Test User', larp_rating: 0 }),
}))

// Mock heavy features so the test stays fast
vi.mock('./features/home/Home', () => ({ default: () => <div>Home</div> }))
vi.mock('./features/larpmaxxer/index', () => ({ LarpMaxxer: () => <div>LarpMaxxer</div> }))
vi.mock('./pages/PersonaSelect', () => ({ default: () => <div>PersonaSelect</div> }))

import App from './App'

describe('App routing', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('renders /larpmaxxer without TopNav', () => {
    window.history.pushState({}, '', '/larpmaxxer')
    render(<App />)
    expect(screen.getByText('LarpMaxxer')).toBeTruthy()
    expect(screen.queryByRole('navigation')).toBeNull()
  })
})
