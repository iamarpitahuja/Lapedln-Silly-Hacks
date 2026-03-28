import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MockDataProvider } from '../../../context/MockDataContext'
import ProfileHero from './ProfileHero'

describe('ProfileHero', () => {
  it('renders user name', () => {
    render(<MockDataProvider><ProfileHero /></MockDataProvider>)
    expect(screen.getByText('Arjun Malhotra')).toBeTruthy()
  })

  it('renders current persona', () => {
    render(<MockDataProvider><ProfileHero /></MockDataProvider>)
    expect(screen.getByText('Stealth Founder / Ex-McKinsey Adjacent')).toBeTruthy()
  })

  it('renders recruiter stat line', () => {
    render(<MockDataProvider><ProfileHero /></MockDataProvider>)
    expect(screen.getByText(/413 recruiters are monitoring/)).toBeTruthy()
  })
})
