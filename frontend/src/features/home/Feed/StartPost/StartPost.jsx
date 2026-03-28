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
