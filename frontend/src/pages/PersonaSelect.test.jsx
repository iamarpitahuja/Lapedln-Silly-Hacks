import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { UserProvider } from '../context/UserContext'
import PersonaSelect from './PersonaSelect'

const Wrapper = ({ children }) => (
  <UserProvider><MemoryRouter>{children}</MemoryRouter></UserProvider>
)

describe('PersonaSelect', () => {
  it('renders heading', () => {
    render(<PersonaSelect />, { wrapper: Wrapper })
    expect(screen.getByText('Choose your professional identity.')).toBeTruthy()
  })

  it('renders persona cards', () => {
    render(<PersonaSelect />, { wrapper: Wrapper })
    expect(screen.getByText('Finance Bro')).toBeTruthy()
  })
})
