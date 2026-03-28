import { useState, useEffect } from 'react'
import { useMockData } from '../../../../context/MockDataContext'
import { createPost } from '../../../../services/api'
import Icon from '../../../../components/Icon/Icon'
import styles from './StartPost.module.css'

const PLACEHOLDERS = [
  'What impossible milestone are you reflecting on today?',
  'Share a lesson from your made-up founder arc.',
  'Announce a role you technically never interviewed for.',
  'What thought leadership can you offer the ecosystem today?',
]

const POST_TYPES = [
  { icon: 'party', label: 'Celebrate fake promotion', type: 'humble_brag' },
  { icon: 'rocket', label: 'Announce stealth startup', type: 'announcement' },
  { icon: 'lightbulb', label: 'Share leadership insight', type: 'thought_leadership' },
  { icon: 'mirror', label: 'Reflect on your journey', type: 'hot_take' },
]

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

export default function StartPost() {
  const { currentUser, addPost } = useMockData()
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [content, setContent] = useState('')
  const [postType, setPostType] = useState('thought_leadership')
  const [status, setStatus] = useState(null) // 'posting' | 'success' | 'error'

  useEffect(() => {
    if (isOpen) return
    const timer = setInterval(() => {
      setPlaceholderIndex(i => (i + 1) % PLACEHOLDERS.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [isOpen])

  async function handleSubmit() {
    if (!content.trim()) return
    setStatus('posting')
    try {
      const post = await createPost({ content, postType })
      addPost({
        id: post.id || Date.now(),
        author: {
          name: currentUser.name,
          headline: currentUser.headline,
          avatar: currentUser.avatar,
          larpRating: currentUser.larpRating,
        },
        type: postType.replace('_', ' '),
        timestamp: 'just now',
        content,
        reactions: { count: 0, comments: 0 },
      })
      setContent('')
      setIsOpen(false)
      setStatus('success')
      setTimeout(() => setStatus(null), 2000)
    } catch {
      setStatus('error')
      setTimeout(() => setStatus(null), 3000)
    }
  }

  if (!isOpen) {
    return (
      <div className={styles.card}>
        <div className={styles.row}>
          <div className={styles.avatar}>{getInitials(currentUser.name)}</div>
          <button className={styles.input} onClick={() => setIsOpen(true)}>
            {status === 'success' ? 'Post launched into the feed!' : PLACEHOLDERS[placeholderIndex]}
          </button>
        </div>
        <div className={styles.actions}>
          {POST_TYPES.map(action => (
            <button
              key={action.label}
              className={styles.action}
              onClick={() => { setPostType(action.type); setIsOpen(true) }}
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

  return (
    <div className={styles.card}>
      <div className={styles.row}>
        <div className={styles.avatar}>{getInitials(currentUser.name)}</div>
        <textarea
          className={styles.textarea}
          placeholder={PLACEHOLDERS[placeholderIndex]}
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={3}
          autoFocus
        />
      </div>
      <div className={styles.actions}>
        {POST_TYPES.map(action => (
          <button
            key={action.label}
            className={`${styles.action} ${postType === action.type ? styles.actionActive : ''}`}
            onClick={() => setPostType(action.type)}
          >
            <span className={styles.actionIcon}>
              <Icon name={action.icon} size={20} />
            </span>
            <span className={styles.actionLabel}>{action.label}</span>
          </button>
        ))}
      </div>
      <div className={styles.submitRow}>
        <button className={styles.cancelBtn} onClick={() => { setIsOpen(false); setContent('') }}>
          Cancel
        </button>
        <button
          className={styles.submitBtn}
          onClick={handleSubmit}
          disabled={!content.trim() || status === 'posting'}
        >
          {status === 'posting' ? 'Posting...' : 'Post'}
        </button>
      </div>
      {status === 'error' && (
        <p className={styles.error}>Failed to post. Backend might be down.</p>
      )}
    </div>
  )
}
