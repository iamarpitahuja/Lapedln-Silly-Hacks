import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MockDataProvider } from '../../../context/MockDataContext'
import ExperienceSection from './ExperienceSection'

describe('ExperienceSection', () => {
  it('renders Experience heading', () => {
    render(
      <MockDataProvider>
        <ExperienceSection />
      </MockDataProvider>
    )
    expect(screen.getByText('Experience')).toBeTruthy()
  })

  it('renders first role title', () => {
    render(
      <MockDataProvider>
        <ExperienceSection />
      </MockDataProvider>
    )
    expect(screen.getByText('Interim Global Strategy Vision Lead')).toBeTruthy()
  })

  it('adds a new experience entry', async () => {
    const user = userEvent.setup()

    render(
      <MockDataProvider>
        <ExperienceSection />
      </MockDataProvider>
    )

    await user.click(screen.getByRole('button', { name: 'Add experience' }))
    await user.type(screen.getByPlaceholderText('Title (e.g. Chief Warlock)'), 'Test Role')
    await user.type(screen.getByPlaceholderText('Guild / Company'), 'Test Co')
    await user.click(screen.getByRole('button', { name: 'Save Experience' }))

    expect(screen.getByText('Test Role')).toBeTruthy()
  })
})
