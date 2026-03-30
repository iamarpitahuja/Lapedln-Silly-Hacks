import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MockDataProvider } from '../../../context/MockDataContext'
import LarpStatus from './LarpStatus'

function renderLarpStatus() {
  render(
    <MemoryRouter>
      <MockDataProvider>
        <LarpStatus />
      </MockDataProvider>
    </MemoryRouter>
  )
}

describe('LarpStatus', () => {
  it('renders Open to Larping heading', () => {
    renderLarpStatus()
    expect(screen.getByText('Open to Larping')).toBeTruthy()
  })

  it('renders current job', () => {
    renderLarpStatus()
    expect(screen.getAllByText('Finance Bro').length).toBeGreaterThan(0)
  })

  it('shows that the current larp is managed from the jobs page', () => {
    renderLarpStatus()
    expect(screen.getByText('Current larp is managed from J*bs')).toBeTruthy()
  })
})
