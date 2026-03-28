import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MockDataProvider, useMockData } from './MockDataContext'

function TestConsumer() {
  const { currentUser, feedPosts, allPosts, isAccessible, createPost, createComment } = useMockData()
  return (
    <div>
      <span data-testid="name">{currentUser.name}</span>
      <span data-testid="rating">{currentUser.larpRating}</span>
      <span data-testid="post-count">{feedPosts.length}</span>
      <span data-testid="all-post-count">{allPosts.length}</span>
      <span data-testid="top-post-author">{allPosts[0]?.author?.name ?? ''}</span>
      <span data-testid="top-post-comments">{allPosts[0]?.reactions?.comments ?? 0}</span>
      <span data-testid="top-thread-first-comment">{allPosts[0]?.comments?.[0]?.content ?? ''}</span>
      <span data-testid="accessible-low">{String(isAccessible(40))}</span>
      <span data-testid="accessible-high">{String(isAccessible(90))}</span>
      <button
        onClick={() => createPost({ content: 'Test draft from context test', type: 'Humblebrag' })}
      >
        create-post
      </button>
      <button
        onClick={() => createComment({ postId: allPosts[0]?.id, content: 'Comment from context test' })}
      >
        create-comment
      </button>
    </div>
  )
}

describe('MockDataContext', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('provides currentUser with larpRating', () => {
    render(<MockDataProvider><TestConsumer /></MockDataProvider>)
    expect(screen.getByTestId('name')).toHaveTextContent('Arjun Malhotra')
    expect(screen.getByTestId('rating')).toHaveTextContent('67.2')
  })

  it('provides feedPosts filtered by larpRating', () => {
    render(<MockDataProvider><TestConsumer /></MockDataProvider>)
    const count = parseInt(screen.getByTestId('post-count').textContent)
    expect(count).toBeGreaterThan(0)
  })

  it('isAccessible returns true when target rating is below current user rating', () => {
    render(<MockDataProvider><TestConsumer /></MockDataProvider>)
    expect(screen.getByTestId('accessible-low')).toHaveTextContent('true')
  })

  it('isAccessible returns false when target rating exceeds current user rating', () => {
    render(<MockDataProvider><TestConsumer /></MockDataProvider>)
    expect(screen.getByTestId('accessible-high')).toHaveTextContent('false')
  })

  it('createPost adds a post to the top of allPosts', () => {
    render(<MockDataProvider><TestConsumer /></MockDataProvider>)
    const initialCount = Number(screen.getByTestId('all-post-count').textContent)

    fireEvent.click(screen.getByText('create-post'))

    const nextCount = Number(screen.getByTestId('all-post-count').textContent)
    expect(nextCount).toBe(initialCount + 1)
    expect(screen.getByTestId('top-post-author')).toHaveTextContent('Arjun Malhotra')
  })

  it('createComment increments comment count and stores the latest comment on the post', () => {
    render(<MockDataProvider><TestConsumer /></MockDataProvider>)

    const initialCommentCount = Number(screen.getByTestId('top-post-comments').textContent)

    fireEvent.click(screen.getByText('create-comment'))

    const nextCommentCount = Number(screen.getByTestId('top-post-comments').textContent)
    expect(nextCommentCount).toBe(initialCommentCount + 1)
    expect(screen.getByTestId('top-thread-first-comment')).toHaveTextContent('Comment from context test')
  })
})
