import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MockDataProvider } from '../../../context/MockDataContext'
import GlazesSection from './GlazesSection'

describe('GlazesSection', () => {
  it('renders Glazes Received heading', () => {
    render(
      <MockDataProvider>
        <GlazesSection />
      </MockDataProvider>
    )
    expect(screen.getByText('Glazes Received')).toBeTruthy()
  })

  it('renders first glazer name', () => {
    render(
      <MockDataProvider>
        <GlazesSection />
      </MockDataProvider>
    )
    expect(screen.getByText('Arjun Arjun')).toBeTruthy()
  })
})
