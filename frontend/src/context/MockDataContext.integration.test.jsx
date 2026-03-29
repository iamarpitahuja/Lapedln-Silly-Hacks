import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MockDataProvider, useMockData } from './MockDataContext'

vi.mock('../services/api', () => ({
  createPost: vi.fn(async () => ({ id: 'new-post' })),
  createPostComment: vi.fn(async () => ({ id: 'new-comment' })),
  createRelarp: vi.fn(async () => ({ id: 'new-relarp' })),
  fetchFeed: vi.fn(async () => ({
    posts: [
      {
        id: 'feed-1',
        profiles: {
          id: 'author-1',
          display_name: 'Priya Krishnamurthy',
          title: 'Fractional Brand Philosopher',
          avatar_url: null,
          larp_rating: 54.1,
        },
        post_type: 'Humblebrag',
        created_at: '2026-03-29T14:00:00.000Z',
        content: 'Synergy and velocity for stakeholder alignment.',
        comment_count: 2,
        relarp_count: 1,
        like_count: 5,
        love_count: 3,
        glaze_count: 4,
        has_user_relarped: true,
        has_user_liked: true,
        has_user_loved: false,
        has_user_glazed: true,
        comments: [],
      },
    ],
    trending_delusions: ['Humblebrag · 1 posts'],
    buzzwords: ['Synergy', 'Velocity'],
  })),
  fetchProfile: vi.fn(async () => ({
    id: '00000000-0000-0000-0000-000000000000',
    display_name: 'Arjun Malhotra',
    title: 'Incoming Quant VC Product Strategist',
    avatar_url: null,
    cover_photo_url: null,
    larp_rating: 67.2,
    persona: 'Stealth Founder / Ex-McKinsey Adjacent',
    bio: 'Building at the intersection of ambiguity and momentum.',
    stats: {
      recruiterViews: 413,
      impressionVelocity: 'High',
      weeklyAuraGrowth: 3.8,
      weeklyAuraGrowthPct: '+9%',
    },
    glazers: [],
    larp_status: { opportunities: ['Stealth Founder / Ex-McKinsey Adjacent', 'Fractional Visionary'] },
    experience: [],
    education: [],
    skills: [],
    larp_history: [],
    glazes_received: [],
  })),
  removeRelarp: vi.fn(async () => undefined),
  updateProfilePatch: vi.fn(async payload => payload),
}))

function Consumer() {
  const { currentUser, allPosts, trendingDelusions, buzzwords } = useMockData()
  const firstPost = allPosts[0]

  return (
    <div>
      <span data-testid="profile-name">{currentUser.name}</span>
      <span data-testid="profile-rating">{currentUser.larpRating}</span>
      <span data-testid="post-type">{firstPost?.type ?? ''}</span>
      <span data-testid="post-like-count">{firstPost?.reactions?.likes ?? 0}</span>
      <span data-testid="post-glaze-flag">{String(Boolean(firstPost?.has_user_glazed))}</span>
      <span data-testid="trending">{trendingDelusions.join('|')}</span>
      <span data-testid="buzzwords">{buzzwords.join('|')}</span>
    </div>
  )
}

describe('MockDataContext integration mapping', () => {
  it('maps backend profile/feed payloads into frontend context shape', async () => {
    render(
      <MockDataProvider testMode={false}>
        <Consumer />
      </MockDataProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('profile-name')).toHaveTextContent('Arjun Malhotra')
    })

    expect(screen.getByTestId('profile-rating')).toHaveTextContent('67.2')
    expect(screen.getByTestId('post-type')).toHaveTextContent('Humblebrag')
    expect(screen.getByTestId('post-like-count')).toHaveTextContent('5')
    expect(screen.getByTestId('post-glaze-flag')).toHaveTextContent('true')
    expect(screen.getByTestId('trending')).toHaveTextContent('Humblebrag · 1 posts')
    expect(screen.getByTestId('buzzwords')).toHaveTextContent('Synergy|Velocity')
  })
})
