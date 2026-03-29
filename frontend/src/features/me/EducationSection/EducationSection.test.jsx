import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MockDataProvider } from '../../../context/MockDataContext'
import EducationSection from './EducationSection'

describe('EducationSection', () => {
  it('renders Education heading', () => {
    render(
      <MockDataProvider>
        <EducationSection />
      </MockDataProvider>
    )
    expect(screen.getByText('Education')).toBeTruthy()
  })

  it('renders first school', () => {
    render(
      <MockDataProvider>
        <EducationSection />
      </MockDataProvider>
    )
    expect(screen.getByText('University of Networking')).toBeTruthy()
  })

  it('adds a new education entry', async () => {
    const user = userEvent.setup()

    render(
      <MockDataProvider>
        <EducationSection />
      </MockDataProvider>
    )

    await user.click(screen.getByRole('button', { name: 'Add education' }))
    await user.type(screen.getByPlaceholderText('Academy / Monastery / School'), 'Test University')
    await user.type(screen.getByPlaceholderText('Degree or Field of Study'), 'B.S. Testing')
    await user.click(screen.getByRole('button', { name: 'Enroll' }))

    expect(screen.getByText('Test University')).toBeTruthy()
  })
})
