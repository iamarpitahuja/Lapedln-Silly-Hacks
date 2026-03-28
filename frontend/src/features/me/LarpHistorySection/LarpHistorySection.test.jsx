import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MockDataProvider } from '../../../context/MockDataContext'
import LarpHistorySection from './LarpHistorySection'

describe('LarpHistorySection', () => {
  it('renders Larp History heading', () => {
    render(
      <MockDataProvider>
        <LarpHistorySection />
      </MockDataProvider>
    )
    expect(screen.getByText('Larp History')).toBeTruthy()
  })

  it('renders LarpedIn exclusive label', () => {
    render(
      <MockDataProvider>
        <LarpHistorySection />
      </MockDataProvider>
    )
    expect(screen.getByText('LarpedIn')).toBeTruthy()
  })

  it('renders first persona transition', () => {
    render(
      <MockDataProvider>
        <LarpHistorySection />
      </MockDataProvider>
    )
    expect(screen.getAllByText(/Regional Hustler/).length).toBeGreaterThan(0)
  })
})
