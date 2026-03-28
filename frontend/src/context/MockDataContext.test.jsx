import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MockDataProvider, useMockData } from './MockDataContext'

function TestConsumer() {
  const { currentUser, feedPosts, isAccessible } = useMockData()
  return (
    <div>
      <span data-testid="name">{currentUser.name}</span>
      <span data-testid="rating">{currentUser.larpRating}</span>
      <span data-testid="post-count">{feedPosts.length}</span>
      <span data-testid="accessible-low">{String(isAccessible(40))}</span>
      <span data-testid="accessible-high">{String(isAccessible(90))}</span>
    </div>
  )
}

describe('MockDataContext', () => {
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
})
