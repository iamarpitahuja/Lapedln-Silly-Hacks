import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MockDataProvider } from '../../../context/MockDataContext'
import LarpStatus from './LarpStatus'

describe('LarpStatus', () => {
  it('renders Open to Larping heading', () => {
    render(<MockDataProvider><LarpStatus /></MockDataProvider>)
    expect(screen.getByText('Open to Larping')).toBeTruthy()
  })

  it('renders current job', () => {
    render(<MockDataProvider><LarpStatus /></MockDataProvider>)
    expect(screen.getAllByText('Finance Bro').length).toBeGreaterThan(0)
  })

  it('shows that the current larp is managed from the jobs page', () => {
    render(<MockDataProvider><LarpStatus /></MockDataProvider>)
    expect(screen.getByText('Current larp is managed from J*bs')).toBeTruthy()
  })
})
