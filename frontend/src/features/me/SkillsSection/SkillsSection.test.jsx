import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MockDataProvider } from '../../../context/MockDataContext'
import SkillsSection from './SkillsSection'

describe('SkillsSection', () => {
  it('renders Skills & Endorsements heading', () => {
    render(
      <MockDataProvider>
        <SkillsSection />
      </MockDataProvider>
    )
    expect(screen.getByText('Skills & Endorsements')).toBeTruthy()
  })

  it('renders Strategic Ambiguity skill', () => {
    render(
      <MockDataProvider>
        <SkillsSection />
      </MockDataProvider>
    )
    expect(screen.getByText('Strategic Ambiguity')).toBeTruthy()
  })

  it('increments endorsements when skill is endorsed', async () => {
    const user = userEvent.setup()

    render(
      <MockDataProvider>
        <SkillsSection />
      </MockDataProvider>
    )

    const endorseButtons = screen.getAllByRole('button', { name: 'Ask for Endorsement' })
    await user.click(endorseButtons[0])

    expect(screen.getByText('48 endorsements')).toBeTruthy()
  })
})
