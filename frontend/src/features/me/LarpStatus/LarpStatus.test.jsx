import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MockDataProvider } from '../../../context/MockDataContext'
import LarpStatus from './LarpStatus'

describe('LarpStatus', () => {
  it('renders Open to Larping heading', () => {
    render(<MockDataProvider><LarpStatus /></MockDataProvider>)
    expect(screen.getByText('Open to Larping')).toBeTruthy()
  })

  it('renders active persona', () => {
    render(<MockDataProvider><LarpStatus /></MockDataProvider>)
    expect(screen.getAllByText('Stealth Founder / Ex-McKinsey Adjacent').length).toBeGreaterThan(0)
  })

  it('renders Cycle Persona button', () => {
    render(<MockDataProvider><LarpStatus /></MockDataProvider>)
    expect(screen.getByText('Cycle Persona')).toBeTruthy()
  })

  it('switches persona when switch button is clicked', async () => {
    const user = userEvent.setup()

    render(<MockDataProvider><LarpStatus /></MockDataProvider>)
    await user.click(screen.getByRole('button', { name: 'Cycle Persona' }))

    expect(screen.getAllByText('Fractional Visionary').length).toBeGreaterThan(0)
  })
})
