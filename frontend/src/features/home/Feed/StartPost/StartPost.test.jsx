import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('hides the composer footer by default', () => {
    renderStartPost()
    expect(screen.queryByLabelText('Post type')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Post' })).not.toBeInTheDocument()
  })

  it('shows the composer footer when the textarea is focused', () => {
    renderStartPost()
    fireEvent.focus(screen.getByRole('textbox'))
    expect(screen.getByLabelText('Post type')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Post' })).toBeInTheDocument()
  })

  it('keeps footer visible after blur if draft has content', () => {
    renderStartPost()
    const textarea = screen.getByRole('textbox')
    fireEvent.focus(textarea)
    fireEvent.change(textarea, { target: { value: 'Pivoting to AI-native serendipity.' } })
    fireEvent.blur(textarea)
    expect(screen.getByRole('button', { name: 'Post' })).toBeInTheDocument()
  })

  it('hides footer when Cancel is clicked', () => {
    renderStartPost()
    fireEvent.focus(screen.getByRole('textbox'))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('button', { name: 'Post' })).not.toBeInTheDocument()
  })

  it('action buttons expand the footer and pre-select the post type', () => {
    renderStartPost()
    fireEvent.click(screen.getByRole('button', { name: /Celebrate fake promotion/i }))
    expect(screen.getByLabelText('Post type')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Career Lore')).toBeInTheDocument()
  })
})
