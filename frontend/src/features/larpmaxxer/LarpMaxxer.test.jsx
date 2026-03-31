import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { UserProvider } from '../../context/UserContext'
import { LarpMaxxer } from './index'

const Wrapper = ({ children }) => (
  <UserProvider><MemoryRouter>{children}</MemoryRouter></UserProvider>
)

describe('LarpMaxxer', () => {
  it('renders EntryCard with LarpMaxxing heading on first load', () => {
    render(<LarpMaxxer onExitTraining={() => {}} />, { wrapper: Wrapper })
    expect(screen.getByText('LarpMaxxing')).toBeTruthy()
  })

  it('renders Begin Training button', () => {
    render(<LarpMaxxer onExitTraining={() => {}} />, { wrapper: Wrapper })
    expect(screen.getByText('Begin Training')).toBeTruthy()
  })
})
