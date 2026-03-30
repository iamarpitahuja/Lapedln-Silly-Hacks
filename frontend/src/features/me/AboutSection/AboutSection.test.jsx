import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MockDataProvider } from '../../../context/MockDataContext'
import AboutSection from './AboutSection'

describe('AboutSection', () => {
  it('renders About heading', () => {
    render(
      <MockDataProvider>
        <AboutSection />
      </MockDataProvider>
    )
    expect(screen.getByText('About')).toBeTruthy()
  })

  it('renders bio text', () => {
    render(
      <MockDataProvider>
        <AboutSection />
      </MockDataProvider>
    )
    expect(screen.getByText(/intersection of ambiguity and momentum/)).toBeTruthy()
  })

  it('updates about text after saving edit', async () => {
    const user = userEvent.setup()

    render(
      <MockDataProvider>
        <AboutSection />
      </MockDataProvider>
    )

    await user.click(screen.getByRole('button', { name: 'Edit about' }))
    await user.clear(screen.getByRole('textbox'))
    await user.type(screen.getByRole('textbox'), 'New about text from test')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(screen.getByText('New about text from test')).toBeTruthy()
  })
})
