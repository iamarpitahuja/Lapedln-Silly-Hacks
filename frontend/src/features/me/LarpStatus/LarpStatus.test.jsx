import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MockDataProvider } from '../../../context/MockDataContext'
import LarpStatus from './LarpStatus'

describe('LarpStatus', () => {
  it('renders Open to Larping heading', () => {
    render(<MockDataProvider><LarpStatus /></MockDataProvider>)
    expect(screen.getByText('Open to Larping')).toBeTruthy()
  })

  it('renders active persona', () => {
    render(<MockDataProvider><LarpStatus /></MockDataProvider>)
    expect(screen.getByText('Stealth Founder / Ex-McKinsey Adjacent')).toBeTruthy()
  })

  it('renders Switch Persona button', () => {
    render(<MockDataProvider><LarpStatus /></MockDataProvider>)
    expect(screen.getByText('Switch Persona')).toBeTruthy()
  })
})
