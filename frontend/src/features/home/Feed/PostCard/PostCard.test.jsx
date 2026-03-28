import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PostCard from './PostCard'
import { MockDataProvider } from '../../../../context/MockDataContext'

const basePost = {
  id: 1,
  author: {
    name: 'Priya Krishnamurthy',
    headline: 'Fractional Brand Philosopher',
    avatar: null,
    larpRating: 54.1,
  },
  type: 'Career Lore',
  timestamp: '1h',
  content: 'Excited to announce that I have accepted a role at myself.',
  reactions: { count: 12, comments: 3, relarps: 0 },
}

function renderCard(post = basePost, isOwnPost = false) {
  return render(
    <MockDataProvider>
      <PostCard post={post} isOwnPost={isOwnPost} />
    </MockDataProvider>
  )
}

describe('PostCard', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('does not show a "You" label for other users posts', () => {
    renderCard(basePost, false)
    expect(screen.queryByText('· You')).not.toBeInTheDocument()
  })

  it('shows dismiss and glaze controls for other users posts', () => {
    renderCard(basePost, false)
    expect(screen.getByRole('button', { name: /Dismiss/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Glaze$/i })).toBeInTheDocument()
  })

  it('shows own-post affordances for my posts', () => {
    renderCard(basePost, true)
    expect(screen.getByText('· You')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Dismiss/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Glaze$/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Comment$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Re-Larp$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^DM$/i })).toBeInTheDocument()
  })

  it('supports quick re-larp and allows undoing it', () => {
    renderCard(basePost, false)

    fireEvent.click(screen.getByRole('button', { name: /^Re-Larp$/i }))
    expect(screen.getByText('Re-Larp this post')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Quick Re-Larp/i }))

    const undoButton = screen.getByRole('button', { name: /Undo Re-Larp/i })
    expect(undoButton).toBeInTheDocument()
    expect(undoButton).not.toBeDisabled()

    fireEvent.click(undoButton)
    expect(screen.getByRole('button', { name: /^Re-Larp$/i })).toBeInTheDocument()
  })

  it('renders embedded source data on relarp posts', () => {
    const relarpPost = {
      ...basePost,
      id: 'relarp-1',
      author: {
        name: 'Arjun Malhotra',
        headline: 'Incoming Quant VC Product Strategist',
        avatar: null,
        larpRating: 67.2,
      },
      type: 'Re-Larp',
      content: 'This aged like a high-signal market thesis.',
      isRelarp: true,
      relarpOf: {
        id: 1,
        type: 'Career Lore',
        timestamp: '1h',
        content: 'Excited to announce that I have accepted a role at myself.',
        author: {
          name: 'Priya Krishnamurthy',
          headline: 'Fractional Brand Philosopher',
          avatar: null,
          larpRating: 54.1,
        },
      },
      reactions: { count: 1, comments: 0, relarps: 0 },
    }

    renderCard(relarpPost, true)

    expect(screen.getByText(/Re-Larped/i)).toBeInTheDocument()
    expect(screen.getByText('This aged like a high-signal market thesis.')).toBeInTheDocument()
    expect(screen.getByText('Fractional Brand Philosopher')).toBeInTheDocument()
  })
})
