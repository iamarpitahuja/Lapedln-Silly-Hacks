import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock(
  '../../../../context/MockDataContext',
  () => ({
    MockDataProvider: ({ children }) => children,
    useMockData: () => ({
      currentUser: { name: 'Taylor Voss' },
      createPost: () => ({ ok: true }),
    }),
  }),
  { virtual: true }
)

import { MockDataProvider } from '../../../../context/MockDataContext'
import StartPost from './StartPost'

function renderStartPost() {
  return render(
    <MockDataProvider>
      <StartPost />
    </MockDataProvider>
  )
}

describe('StartPost', () => {
  it('renders a textarea directly — no button click required', () => {
    renderStartPost()
    expect(screen.getByLabelText('Post content')).toBeInTheDocument()
  })

  it('hides the composer footer by default', () => {
    renderStartPost()
    expect(screen.queryByLabelText('Post type')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Post' })).not.toBeInTheDocument()
  })

  it('shows the composer footer when the textarea is focused', () => {
    renderStartPost()
    fireEvent.focus(screen.getByLabelText('Post content'))
    expect(screen.getByLabelText('Post type')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Post' })).toBeInTheDocument()
  })

  it('keeps footer visible after blur if draft has content', () => {
    renderStartPost()
    const textarea = screen.getByLabelText('Post content')
    fireEvent.focus(textarea)
    fireEvent.change(textarea, { target: { value: 'Pivoting to AI-native serendipity.' } })
    fireEvent.blur(textarea)
    expect(screen.getByRole('button', { name: 'Post' })).toBeInTheDocument()
  })

  it('hides footer and clears draft when Cancel is clicked', () => {
    renderStartPost()
    const textarea = screen.getByLabelText('Post content')
    fireEvent.focus(textarea)
    fireEvent.change(textarea, { target: { value: 'Half-baked hot take.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('button', { name: 'Post' })).not.toBeInTheDocument()
    expect(screen.getByLabelText('Post content')).toHaveValue('')
  })

  it('action buttons expand the footer, select type, and inject blank template text', () => {
    renderStartPost()
    fireEvent.click(screen.getByRole('button', { name: /Celebrate fake promotion/i }))
    expect(screen.getByLabelText('Post type')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Career Lore')).toBeInTheDocument()
    expect(screen.getByLabelText('Post content')).toHaveValue(
      'Thrilled to share that I have been promoted to ____ROLE TITLE____ at ____COMPANY NAME____. Massive thanks to ____WHO TO THANK____ for backing this journey.'
    )
  })

  it('fills a specific blank from slot suggestions', () => {
    renderStartPost()
    fireEvent.click(screen.getByRole('button', { name: /Celebrate fake promotion/i }))
    fireEvent.click(screen.getByRole('button', { name: /role title/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Senior Prompt Engineer' }))
    expect(screen.getByLabelText('Post content')).toHaveValue(
      'Thrilled to share that I have been promoted to Senior Prompt Engineer at ____COMPANY NAME____. Massive thanks to ____WHO TO THANK____ for backing this journey.'
    )
  })
})
