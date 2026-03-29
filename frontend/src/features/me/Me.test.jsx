import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MockDataProvider } from '../../context/MockDataContext'
import Me from './Me'

describe('Me', () => {
  it('renders without crashing', () => {
    render(
      <MockDataProvider>
        <Me />
      </MockDataProvider>
    )
    expect(document.body).toBeTruthy()
  })

  it('shows feedback when about is saved', async () => {
    const user = userEvent.setup()

    render(
      <MockDataProvider>
        <Me />
      </MockDataProvider>
    )

    await user.click(screen.getByRole('button', { name: 'Edit about' }))
    await user.clear(screen.getByRole('textbox'))
    await user.type(screen.getByRole('textbox'), 'Updated about section from test')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(screen.getByRole('status')).toHaveTextContent('About updated')
  })
})
