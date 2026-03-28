import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import PostCard from './PostCard'
import { MockDataProvider } from '../../../../context/MockDataContext'

const basePost = {
  id: 'test-1',
  author: {
    name: 'Priya Krishnamurthy',
    headline: 'Fractional Brand Philosopher',
    avatar: null,
    larpRating: 54.1,
  },
  type: 'Career Lore',
  timestamp: '1h',
  content: 'Excited to announce that I have accepted a role at myself.',
  reactions: { count: 12, comments: 3 },
}

describe('PostCard — others\' posts (isOwnPost = false)', () => {
  it('does not show a "You" label', () => {
    render(
      <MockDataProvider>
        <PostCard post={basePost} isOwnPost={false} />
      </MockDataProvider>
    )
    expect(screen.queryByText('· You')).not.toBeInTheDocument()
  })

  it('shows the X / dismiss button', () => {
    render(
      <MockDataProvider>
        <PostCard post={basePost} isOwnPost={false} />
      </MockDataProvider>
    )
    expect(screen.getByRole('button', { name: /Dismiss/i })).toBeInTheDocument()
  })

  it('shows the Glaze button', () => {
    render(
      <MockDataProvider>
        <PostCard post={basePost} isOwnPost={false} />
      </MockDataProvider>
    )
    expect(screen.getByRole('button', { name: /Glaze/i })).toBeInTheDocument()
  })
})

describe('PostCard — own posts (isOwnPost = true)', () => {
  it('shows a "· You" label next to the author name', () => {
    render(
      <MockDataProvider>
        <PostCard post={basePost} isOwnPost={true} />
      </MockDataProvider>
    )
    expect(screen.getByText('· You')).toBeInTheDocument()
  })

  it('does not show the X / dismiss button', () => {
    render(
      <MockDataProvider>
        <PostCard post={basePost} isOwnPost={true} />
      </MockDataProvider>
    )
    expect(screen.queryByRole('button', { name: /Dismiss/i })).not.toBeInTheDocument()
  })

  it('does not show the Glaze button', () => {
    render(
      <MockDataProvider>
        <PostCard post={basePost} isOwnPost={true} />
      </MockDataProvider>
    )
    expect(screen.queryByRole('button', { name: /Glaze/i })).not.toBeInTheDocument()
  })

  it('still shows Comment, Re-Larp, and DM buttons', () => {
    render(
      <MockDataProvider>
        <PostCard post={basePost} isOwnPost={true} />
      </MockDataProvider>
    )
    expect(screen.getByRole('button', { name: /Comment/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Re-Larp/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /DM/i })).toBeInTheDocument()
  })
})
