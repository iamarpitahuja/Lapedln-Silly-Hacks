import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MockDataProvider, useMockData } from './MockDataContext'

function TestConsumer() {
  const {
    currentUser,
    feedPosts,
    allPosts,
    isAccessible,
    updateAbout,
    updateCurrentJob,
    addExperience,
    endorseSkill,
    createPost,
    createComment,
    createRelarp,
    undoRelarp,
    hasUserRelarped,
  } = useMockData()

  const sourcePost = allPosts.find(post => String(post.id) === '1')

  return (
    <div>
      <span data-testid="name">{currentUser.name}</span>
      <span data-testid="rating">{currentUser.larpRating}</span>
      <span data-testid="job">{currentUser.job}</span>
      <span data-testid="about">{currentUser.about}</span>
      <span data-testid="history-count">{currentUser.larpHistory.length}</span>
      <span data-testid="experience-count">{currentUser.experience.length}</span>
      <span data-testid="top-skill-endorsements">{currentUser.skills[0]?.endorsements ?? 0}</span>
      <span data-testid="post-count">{feedPosts.length}</span>
      <span data-testid="all-post-count">{allPosts.length}</span>
      <span data-testid="top-post-author">{allPosts[0]?.author?.name ?? ''}</span>
      <span data-testid="top-post-type">{allPosts[0]?.type ?? ''}</span>
      <span data-testid="top-is-relarp">{String(Boolean(allPosts[0]?.isRelarp))}</span>
      <span data-testid="top-post-comments">{allPosts[0]?.reactions?.comments ?? 0}</span>
      <span data-testid="top-thread-first-comment">{allPosts[0]?.comments?.[0]?.content ?? ''}</span>
      <span data-testid="source-post-relarps">{sourcePost?.reactions?.relarps ?? 0}</span>
      <span data-testid="has-user-relarped-source">{String(hasUserRelarped(sourcePost?.id))}</span>
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
      <button
        onClick={() =>
          createRelarp({ postId: sourcePost?.id, commentary: 'Relarp note from context test' })
        }
      >
        create-relarp
      </button>
      <button onClick={() => undoRelarp({ postId: sourcePost?.id })}>undo-relarp</button>
      <button onClick={() => updateAbout('Updated about from context test')}>update-about</button>
      <button onClick={() => updateCurrentJob('VC Nepo Baby')}>update-job</button>
      <button
        onClick={() =>
          addExperience({
            title: 'Added from context test',
            company: 'Context Corp',
            dates: 'Now',
            description: 'Context generated role',
          })
        }
      >
        add-experience
      </button>
      <button onClick={() => endorseSkill(currentUser.skills[0]?.id)}>endorse-top-skill</button>
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

  it('createRelarp adds a relarp post and increments relarp count on the source post', () => {
    render(<MockDataProvider><TestConsumer /></MockDataProvider>)

    const initialCount = Number(screen.getByTestId('all-post-count').textContent)
    const initialRelarpCount = Number(screen.getByTestId('source-post-relarps').textContent)

    fireEvent.click(screen.getByText('create-relarp'))

    const nextCount = Number(screen.getByTestId('all-post-count').textContent)
    const nextRelarpCount = Number(screen.getByTestId('source-post-relarps').textContent)

    expect(nextCount).toBe(initialCount + 1)
    expect(screen.getByTestId('top-post-author')).toHaveTextContent('Arjun Malhotra')
    expect(screen.getByTestId('top-post-type')).toHaveTextContent('Re-Larp')
    expect(screen.getByTestId('top-is-relarp')).toHaveTextContent('true')
    expect(nextRelarpCount).toBe(initialRelarpCount + 1)
    expect(screen.getByTestId('has-user-relarped-source')).toHaveTextContent('true')
  })

  it('undoRelarp removes the relarp post and decrements relarp count on the source post', () => {
    render(<MockDataProvider><TestConsumer /></MockDataProvider>)

    const initialCount = Number(screen.getByTestId('all-post-count').textContent)
    const initialRelarpCount = Number(screen.getByTestId('source-post-relarps').textContent)

    fireEvent.click(screen.getByText('create-relarp'))
    fireEvent.click(screen.getByText('undo-relarp'))

    const nextCount = Number(screen.getByTestId('all-post-count').textContent)
    const nextRelarpCount = Number(screen.getByTestId('source-post-relarps').textContent)

    expect(nextCount).toBe(initialCount)
    expect(nextRelarpCount).toBe(initialRelarpCount)
    expect(screen.getByTestId('has-user-relarped-source')).toHaveTextContent('false')
  })

  it('updateAbout saves the about text', () => {
    render(<MockDataProvider><TestConsumer /></MockDataProvider>)

    fireEvent.click(screen.getByText('update-about'))

    expect(screen.getByTestId('about')).toHaveTextContent('Updated about from context test')
  })

  it('updateCurrentJob updates the current larp and appends history entry', () => {
    render(<MockDataProvider><TestConsumer /></MockDataProvider>)

    const initialHistoryCount = Number(screen.getByTestId('history-count').textContent)
    fireEvent.click(screen.getByText('update-job'))

    expect(screen.getByTestId('job')).toHaveTextContent('VC Nepo Baby')
    expect(Number(screen.getByTestId('history-count').textContent)).toBe(initialHistoryCount + 1)
  })

  it('addExperience prepends a new experience entry', () => {
    render(<MockDataProvider><TestConsumer /></MockDataProvider>)

    const initialCount = Number(screen.getByTestId('experience-count').textContent)
    fireEvent.click(screen.getByText('add-experience'))

    expect(Number(screen.getByTestId('experience-count').textContent)).toBe(initialCount + 1)
  })

  it('endorseSkill increments endorsements', () => {
    render(<MockDataProvider><TestConsumer /></MockDataProvider>)

    const initialEndorsements = Number(screen.getByTestId('top-skill-endorsements').textContent)
    fireEvent.click(screen.getByText('endorse-top-skill'))

    expect(Number(screen.getByTestId('top-skill-endorsements').textContent)).toBe(
      initialEndorsements + 1
    )
  })
})
