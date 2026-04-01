import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { UserProvider } from '../../context/UserContext'
import { LarpMaxxer } from './index'

vi.mock('../../services/api', () => ({
  fetchLarpmaxxerProgress: vi.fn().mockResolvedValue(null),
  patchLarpmaxxerProgress: vi.fn().mockResolvedValue({}),
  fetchProfile: vi.fn().mockResolvedValue(null),
  fetchLarpmaxxerBootstrap: vi.fn().mockResolvedValue(null),
}))

const Wrapper = ({ children }) => (
  <UserProvider><MemoryRouter>{children}</MemoryRouter></UserProvider>
)

describe('LarpMaxxer', () => {
  beforeEach(() => {
    window.localStorage.setItem('larpedin.dojoDirectionsSeen', '1')
  })

  it('renders EntryCard with LarpMaxxing heading after dojo directions are dismissed', async () => {
    render(<LarpMaxxer onExitTraining={() => {}} />, { wrapper: Wrapper })
    expect(await screen.findByText('LarpMaxxing')).toBeTruthy()
  })

  it('renders Enter the Dojo button', async () => {
    render(<LarpMaxxer onExitTraining={() => {}} />, { wrapper: Wrapper })
    expect(await screen.findByText('Enter the Dojo')).toBeTruthy()
  })
})