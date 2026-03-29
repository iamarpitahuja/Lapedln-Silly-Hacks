# Posting UX & Post Differentiation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fake-input button with an inline expanding textarea, and visually distinguish the current user's own posts from others' with a badge, card accent, and context-aware action buttons.

**Architecture:** Two independent changes: (1) `StartPost` manages focus state on a single always-rendered `<textarea>`, showing the composer footer when focused or when draft has content; (2) `PostCard` receives an `isOwnPost` boolean prop from `Feed`, conditionally rendering a "· You" label, a CSS accent class, and omitting the X/Glaze buttons for own posts.

**Tech Stack:** React 19, Vitest, @testing-library/react, CSS Modules

---

## File Map

| File | Change |
|------|--------|
| `frontend/src/features/home/Feed/StartPost/StartPost.jsx` | Rewrite — inline textarea + focus-based footer |
| `frontend/src/features/home/Feed/StartPost/StartPost.module.css` | Modify — textarea resting/expanded states, remove `.input` |
| `frontend/src/features/home/Feed/StartPost/StartPost.test.jsx` | Create — new test file |
| `frontend/src/features/home/Feed/PostCard/PostCard.jsx` | Modify — accept `isOwnPost` prop, conditional rendering |
| `frontend/src/features/home/Feed/PostCard/PostCard.module.css` | Modify — add `.cardOwn`, `.youLabel` |
| `frontend/src/features/home/Feed/PostCard/PostCard.test.jsx` | Create — new test file |
| `frontend/src/features/home/Feed/Feed.jsx` | Modify — pass `isOwnPost` prop to PostCard |

---

## Task 1: StartPost — Write Failing Tests

**Files:**
- Create: `frontend/src/features/home/Feed/StartPost/StartPost.test.jsx`

- [ ] **Step 1: Write the failing tests**

```jsx
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
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd frontend && npx vitest run src/features/home/Feed/StartPost/StartPost.test.jsx --reporter verbose
```

Expected: all 6 tests FAIL (StartPost.test.jsx does not exist yet — import fails)

---

## Task 2: StartPost — Implement Inline Expansion

**Files:**
- Modify: `frontend/src/features/home/Feed/StartPost/StartPost.jsx`
- Modify: `frontend/src/features/home/Feed/StartPost/StartPost.module.css`

- [ ] **Step 1: Replace StartPost.jsx**

Replace the entire file with:

```jsx
import { useState, useEffect, useRef } from 'react'
import { useMockData } from '../../../../context/MockDataContext'
import Icon from '../../../../components/Icon/Icon'
import styles from './StartPost.module.css'

const PLACEHOLDERS = [
  'What impossible milestone are you reflecting on today?',
  'Share a lesson from your made-up founder arc.',
  'Announce a role you technically never interviewed for.',
  'What thought leadership can you offer the ecosystem today?',
]

const ACTIONS = [
  { icon: 'party', label: 'Celebrate fake promotion', postType: 'Career Lore' },
  { icon: 'rocket', label: 'Announce stealth startup', postType: 'Stealth Build Update' },
  { icon: 'lightbulb', label: 'Share leadership insight', postType: 'Thought Leadership Incident' },
  { icon: 'mirror', label: 'Reflect on your journey', postType: 'Aura Farming' },
]

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

const POST_TYPES = [
  'Career Lore',
  'Humblebrag',
  'Thought Leadership Incident',
  'Aura Farming',
  'Corporate Trauma Dump',
  'Stealth Build Update',
  'Personal Update',
]

const MAX_POST_LENGTH = 500

export default function StartPost() {
  const { currentUser, createPost } = useMockData()
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [isFocused, setIsFocused] = useState(false)
  const [postType, setPostType] = useState(POST_TYPES[0])
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const textareaRef = useRef(null)

  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex(i => (i + 1) % PLACEHOLDERS.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  const showFooter = isFocused || draft.length > 0

  function handleContainerBlur(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      if (!draft.trim()) setIsFocused(false)
    }
  }

  function handleActionClick(nextPostType) {
    setPostType(nextPostType)
    setError('')
    setIsFocused(true)
    textareaRef.current?.focus()
  }

  function handleCancel() {
    setDraft('')
    setError('')
    setIsFocused(false)
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (isSubmitting) return

    setIsSubmitting(true)
    const result = createPost({ content: draft, type: postType })

    if (!result.ok) {
      setError(result.error ?? 'Could not publish this post. Please try again.')
      setIsSubmitting(false)
      return
    }

    setDraft('')
    setError('')
    setIsFocused(false)
    setIsSubmitting(false)
  }

  function handleKeyDown(event) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      handleSubmit(event)
    }
  }

  const charactersRemaining = MAX_POST_LENGTH - draft.length
  const isPostDisabled = !draft.trim() || isSubmitting

  return (
    <div className={styles.card} onBlur={handleContainerBlur}>
      <div className={styles.row}>
        <div className={styles.avatar}>{getInitials(currentUser.name)}</div>
        <textarea
          ref={textareaRef}
          className={`${styles.textarea} ${showFooter ? '' : styles.textareaResting}`}
          value={draft}
          onChange={event => setDraft(event.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          maxLength={MAX_POST_LENGTH}
          placeholder={
            showFooter
              ? 'Write your most career-defining paragraph...'
              : PLACEHOLDERS[placeholderIndex]
          }
          rows={showFooter ? 4 : 1}
        />
      </div>

      {showFooter && (
        <>
          <div className={styles.composerHeader}>
            <label htmlFor="post-type" className={styles.typeLabel}>Post type</label>
            <select
              id="post-type"
              className={styles.typeSelect}
              value={postType}
              onChange={event => setPostType(event.target.value)}
            >
              {POST_TYPES.map(typeOption => (
                <option key={typeOption} value={typeOption}>
                  {typeOption}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.composerMeta}>
            <p className={styles.metaHint}>Press Ctrl/Cmd + Enter to publish</p>
            <span
              className={`${styles.charCount} ${
                charactersRemaining < 40 ? styles.charCountWarn : ''
              }`}
            >
              {charactersRemaining}
            </span>
          </div>
          {error ? <p className={styles.error}>{error}</p> : null}
          <div className={styles.composerActions}>
            <button type="button" className={styles.cancelBtn} onClick={handleCancel}>
              Cancel
            </button>
            <button
              type="button"
              className={styles.publishBtn}
              disabled={isPostDisabled}
              onClick={handleSubmit}
            >
              {isSubmitting ? 'Posting…' : 'Post'}
            </button>
          </div>
        </>
      )}

      <div className={styles.actions}>
        {ACTIONS.map(action => (
          <button
            key={action.label}
            type="button"
            className={styles.action}
            onClick={() => handleActionClick(action.postType)}
          >
            <span className={styles.actionIcon}>
              <Icon name={action.icon} size={20} />
            </span>
            <span className={styles.actionLabel}>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update StartPost.module.css**

Replace the `.input` rule with two textarea states. Find and replace the `.input` block (lines 30–46 in the current file) and update the `.textarea` block. The full updated CSS:

```css
.card {
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  padding: 12px 16px;
  margin-bottom: 8px;
}

.row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 8px;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #0A66C2;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 4px;
}

/* Base textarea — expanded/active state */
.textarea {
  flex: 1;
  width: 100%;
  resize: vertical;
  min-height: 96px;
  border: 1px solid rgba(0, 0, 0, 0.16);
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 14px;
  line-height: 1.45;
  font-family: inherit;
  color: rgba(0, 0, 0, 0.9);
  transition: border-color 0.15s, box-shadow 0.15s;
}

.textarea:focus {
  outline: none;
  border-color: #0A66C2;
  box-shadow: 0 0 0 2px rgba(10, 102, 194, 0.15);
}

/* Resting / collapsed state — looks like the old pill input */
.textareaResting {
  min-height: unset;
  height: 44px;
  resize: none;
  overflow: hidden;
  border-radius: 35px;
  padding: 11px 16px;
  color: rgba(0, 0, 0, 0.6);
  cursor: pointer;
}

.textareaResting:hover {
  background: rgba(0, 0, 0, 0.04);
  border-color: rgba(0, 0, 0, 0.6);
}

.actions {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  padding-top: 8px;
  margin-top: 6px;
}

.action {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.6);
  transition: background 0.15s;
}

.action:hover {
  background: rgba(0, 0, 0, 0.06);
  color: rgba(0, 0, 0, 0.9);
}

.actionIcon {
  font-size: 16px;
}

.actionLabel {
  white-space: nowrap;
}

.composerHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.typeLabel {
  font-size: 12px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.6);
  letter-spacing: 0.02em;
}

.typeSelect {
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 999px;
  background: #fff;
  color: rgba(0, 0, 0, 0.8);
  font-size: 12px;
  font-weight: 600;
  padding: 6px 12px;
}

.composerMeta {
  margin-top: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.metaHint {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.5);
}

.charCount {
  font-size: 12px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.5);
}

.charCountWarn {
  color: #b45309;
}

.error {
  margin-top: 8px;
  color: #b91c1c;
  font-size: 12px;
  font-weight: 600;
}

.composerActions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

.cancelBtn,
.publishBtn {
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  padding: 8px 14px;
  transition: background 0.15s, color 0.15s, opacity 0.15s;
}

.cancelBtn {
  border: 1px solid rgba(0, 0, 0, 0.2);
  color: rgba(0, 0, 0, 0.65);
}

.cancelBtn:hover {
  background: rgba(0, 0, 0, 0.05);
}

.publishBtn {
  background: #0A66C2;
  color: #fff;
}

.publishBtn:hover:enabled {
  background: #084f95;
}

.publishBtn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

- [ ] **Step 3: Run tests to verify they pass**

```bash
cd frontend && npx vitest run src/features/home/Feed/StartPost/StartPost.test.jsx --reporter verbose
```

Expected: all 6 tests PASS

- [ ] **Step 4: Commit**

```bash
cd frontend && git add src/features/home/Feed/StartPost/StartPost.jsx src/features/home/Feed/StartPost/StartPost.module.css src/features/home/Feed/StartPost/StartPost.test.jsx
git commit -m "feat: inline expanding textarea replaces fake-input composer"
```

---

## Task 3: PostCard — Write Failing Tests

**Files:**
- Create: `frontend/src/features/home/Feed/PostCard/PostCard.test.jsx`

- [ ] **Step 1: Write the failing tests**

```jsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import PostCard from './PostCard'

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
    render(<PostCard post={basePost} isOwnPost={false} />)
    expect(screen.queryByText('· You')).not.toBeInTheDocument()
  })

  it('shows the X / dismiss button', () => {
    render(<PostCard post={basePost} isOwnPost={false} />)
    expect(screen.getByRole('button', { name: /Dismiss/i })).toBeInTheDocument()
  })

  it('shows the Glaze button', () => {
    render(<PostCard post={basePost} isOwnPost={false} />)
    expect(screen.getByRole('button', { name: /Glaze/i })).toBeInTheDocument()
  })
})

describe('PostCard — own posts (isOwnPost = true)', () => {
  it('shows a "· You" label next to the author name', () => {
    render(<PostCard post={basePost} isOwnPost={true} />)
    expect(screen.getByText('· You')).toBeInTheDocument()
  })

  it('does not show the X / dismiss button', () => {
    render(<PostCard post={basePost} isOwnPost={true} />)
    expect(screen.queryByRole('button', { name: /Dismiss/i })).not.toBeInTheDocument()
  })

  it('does not show the Glaze button', () => {
    render(<PostCard post={basePost} isOwnPost={true} />)
    expect(screen.queryByRole('button', { name: /Glaze/i })).not.toBeInTheDocument()
  })

  it('still shows Comment, Re-Larp, and DM buttons', () => {
    render(<PostCard post={basePost} isOwnPost={true} />)
    expect(screen.getByRole('button', { name: /Comment/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Re-Larp/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /DM/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd frontend && npx vitest run src/features/home/Feed/PostCard/PostCard.test.jsx --reporter verbose
```

Expected: tests for `isOwnPost = true` FAIL (prop not implemented), tests for `isOwnPost = false` may pass or fail depending on current button accessibility labels

---

## Task 4: PostCard + Feed — Implement Own-Post Differentiation

**Files:**
- Modify: `frontend/src/features/home/Feed/PostCard/PostCard.jsx`
- Modify: `frontend/src/features/home/Feed/PostCard/PostCard.module.css`
- Modify: `frontend/src/features/home/Feed/Feed.jsx`

- [ ] **Step 1: Update PostCard.jsx**

Replace the entire file with:

```jsx
import LarpRatingBadge from '../../../../components/LarpRatingBadge/LarpRatingBadge'
import SuggestedGlazes from '../SuggestedGlazes/SuggestedGlazes'
import Icon from '../../../../components/Icon/Icon'
import { getInitials } from '../../../../utils/strings'
import styles from './PostCard.module.css'

const AVATAR_COLORS = ['#0A66C2', '#057642', '#7c3aed', '#b45309', '#be123c', '#0891b2']

function getAvatarColor(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export default function PostCard({ post, isOwnPost = false }) {
  const { author, type, timestamp, content, reactions } = post

  return (
    <div className={`${styles.card} ${isOwnPost ? styles.cardOwn : ''}`}>
      {/* Header */}
      <div className={styles.header}>
        <div
          className={styles.avatar}
          style={{ background: getAvatarColor(author.name) }}
        >
          {getInitials(author.name)}
        </div>
        <div className={styles.meta}>
          <div className={styles.nameRow}>
            <span className={styles.name}>{author.name}</span>
            {isOwnPost && <span className={styles.youLabel}>· You</span>}
            <LarpRatingBadge rating={author.larpRating} size="small" />
          </div>
          <p className={styles.headline}>{author.headline}</p>
          <p className={styles.timestamp}>
            {timestamp} •{' '}
            <span className={styles.postType}>{type}</span>
          </p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.iconBtn} aria-label="More options">
            <Icon name="more" size={16} />
          </button>
          {!isOwnPost && (
            <button className={styles.iconBtn} aria-label="Dismiss">
              <Icon name="x" size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className={styles.body}>
        <p className={styles.content}>{content}</p>
      </div>

      {/* Reactions */}
      <div className={styles.reactions}>
        <span className={styles.reactionEmojis}>
          <Icon name="thumbsUp" size={12} className={styles.reactionIcon} />
          <Icon name="heart" size={12} className={styles.reactionIcon} />
          <Icon name="flame" size={12} className={styles.reactionIcon} />
        </span>
        <span className={styles.reactionCount}>
          {reactions.count} • {reactions.comments} comments
        </span>
      </div>

      {/* Action bar */}
      <div className={styles.actions}>
        {!isOwnPost && (
          <button className={`${styles.action} ${styles.actionGlaze}`}>
            <Icon name="sparkles" size={18} /> <span>Glaze</span>
          </button>
        )}
        <button className={`${styles.action} ${styles.actionComment}`}>
          <Icon name="message" size={18} /> <span>Comment</span>
        </button>
        <button className={`${styles.action} ${styles.actionRelarp}`}>
          <Icon name="repeat" size={18} /> <span>Re-Larp</span>
        </button>
        <button className={`${styles.action} ${styles.actionDm}`}>
          <Icon name="mail" size={18} /> <span>DM</span>
        </button>
      </div>

      {/* Suggested glazes */}
      <SuggestedGlazes />
    </div>
  )
}
```

- [ ] **Step 2: Add `.cardOwn` and `.youLabel` to PostCard.module.css**

Append to the end of `frontend/src/features/home/Feed/PostCard/PostCard.module.css`:

```css
.cardOwn {
  border-left: 3px solid #0A66C2;
  background: rgba(10, 102, 194, 0.03);
}

.youLabel {
  font-size: 12px;
  font-weight: 600;
  color: #0A66C2;
}
```

- [ ] **Step 3: Update Feed.jsx to pass isOwnPost**

Replace the entire file with:

```jsx
import { useState, useEffect } from 'react'
import { useMockData } from '../../../context/MockDataContext'
import StartPost from './StartPost/StartPost'
import PostCard from './PostCard/PostCard'
import LockedPostCard from './LockedPostCard/LockedPostCard'
import styles from './Feed.module.css'

export default function Feed() {
  const { currentUser, allPosts, isAccessible } = useMockData()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={styles.feed}>
      <StartPost />
      {loading ? (
        <p className={styles.loadingText}>Recalculating prestige hierarchy…</p>
      ) : (
        <div className={styles.posts}>
          {allPosts.map(post =>
            isAccessible(post.author.larpRating) ? (
              <PostCard
                key={post.id}
                post={post}
                isOwnPost={!!post.isUserPost || post.author.name === currentUser.name}
              />
            ) : (
              <LockedPostCard key={post.id} />
            )
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run all tests**

```bash
cd frontend && npx vitest run --reporter verbose
```

Expected: all tests PASS including the 6 new StartPost tests and 7 new PostCard tests

- [ ] **Step 5: Commit**

```bash
cd frontend && git add src/features/home/Feed/PostCard/PostCard.jsx src/features/home/Feed/PostCard/PostCard.module.css src/features/home/Feed/PostCard/PostCard.test.jsx src/features/home/Feed/Feed.jsx
git commit -m "feat: own-post badge, card accent, and context-aware action buttons"
```
