import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion as Motion } from 'framer-motion'
import { useMockData } from '../../../../context/MockDataContext'
import Icon from '../../../../components/Icon/Icon'
import { getInitials } from '../../../../utils/strings'
import { springBouncy, easeOutQuint } from '../../../../lib/motion'
import styles from './StartPost.module.css'

const PLACEHOLDERS = [
  'What are you building? (Or pretending to build?)',
  'Drop your hottest take on the ecosystem.',
  'Announce the role you technically haven\'t accepted yet.',
  'Share some hard-earned wisdom from your founder journey.',
]

const ACTIONS = [
  {
    icon: 'party',
    label: 'Announce the career move',
    postType: 'Career Lore',
    suggestions: [
      'Thrilled to share that I have accepted a role as Chief Vibe Strategist at Nimbus Dynamics. Grateful for everyone who believed in my journey. The ecosystem is ready for what comes next.',
      'Honored to announce my promotion to Senior Prompt Engineer. This one goes out to the mentors who saw my potential before I did. Onwards and upwards.',
      'Big news: I am joining Quantum Synergy Group as Principal Alignment Wizard. Massive thanks to the leadership team for backing this vision from day one.',
    ],
  },
  {
    icon: 'rocket',
    label: 'Drop the stealth reveal',
    postType: 'Stealth Build Update',
    suggestions: [
      'After months in stealth, we are launching Project Moonshot for founders. Our first mission: replace meetings with autonomous execution. The future ships today.',
      'Excited to bring SignalFlow OS out of stealth. Built for revenue teams who are tired of strategy decks that never ship. We compress a week of work into one workflow.',
      'Introducing AuraStack — built for ops leaders who believe compounding clarity is the only real moat. We have been heads-down. Now we are heads-up. Let us grow together.',
    ],
  },
  {
    icon: 'lightbulb',
    label: 'Share a thought leadership take',
    postType: 'Thought Leadership Incident',
    suggestions: [
      'Leadership insight: when uncertainty is high, optimize for clarity. This week we practiced it by documenting decisions in public, and it unlocked faster alignment across every team.',
      'The best teams optimize for fast feedback loops. We shipped smaller daily releases this week and the momentum was immediate. Clarity compounds.',
      'Ownership is a force multiplier. When we asked harder questions earlier, the whole org moved faster. Simple principle. Profound results.',
    ],
  },
  {
    icon: 'mirror',
    label: 'Post a personal reflection',
    postType: 'Aura Farming',
    suggestions: [
      'Looking back, my biggest shift was moving from waiting for permission to shipping before certainty. That mindset produced my most meaningful quarter yet.',
      'The moment I stopped chasing perfect plans and started learning in public, everything changed. Compounding confidence is the real north star.',
      'Choosing consistency over chasing perfect plans gave me a totally new level of execution. The journey is the product. Keep going.',
    ],
  },
]

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
  const [activeSuggestions, setActiveSuggestions] = useState([])
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [photo, setPhoto] = useState(null)
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex(i => (i + 1) % PLACEHOLDERS.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  const showFooter = isFocused || draft.trim().length > 0 || photo

  function handleContainerBlur(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      if (!draft.trim() && !photo) setIsFocused(false)
    }
  }

  function handlePhotoUpload(event) {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }

    const reader = new FileReader()
    reader.onload = e => {
      setPhoto(e.target.result)
      setIsFocused(true)
    }
    reader.readAsDataURL(file)
  }

  function removePhoto() {
    setPhoto(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleDraftChange(event) {
    setDraft(event.target.value)
  }

  function handleSuggestionSelect(text) {
    setDraft(text)
    setActiveSuggestions([])
    textareaRef.current?.focus()
  }

  function handleCancel() {
    setDraft('')
    setPhoto(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setActiveSuggestions([])
    setError('')
    setIsFocused(false)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (isSubmitting) return

    setIsSubmitting(true)
    const result = await createPost({ content: draft, type: postType, photo })

    if (!result.ok) {
      setError(result.error ?? 'Could not publish this post. Please try again.')
      setIsSubmitting(false)
      return
    }

    setDraft('')
    setPhoto(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setActiveSuggestions([])
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
  const isPostDisabled = (!draft.trim() && !photo) || isSubmitting

  return (
    <div className={styles.card} onBlur={handleContainerBlur}>
      <div className={styles.row}>
        <div className={styles.avatar}>
          {currentUser.avatar ? (
            <img src={currentUser.avatar} alt={currentUser.name} className={styles.avatarImg} />
          ) : (
            getInitials(currentUser.name)
          )}
        </div>
        <textarea
          ref={textareaRef}
          aria-label="Post content"
          className={`${styles.textarea} ${showFooter ? '' : styles.textareaResting}`}
          value={draft}
          onChange={handleDraftChange}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          maxLength={MAX_POST_LENGTH}
          placeholder={
            showFooter
              ? 'What\'s your post about?'
              : PLACEHOLDERS[placeholderIndex]
          }
          style={{ '--placeholder-key': placeholderIndex }}
          rows={showFooter ? 4 : 1}
        />
      </div>

      <AnimatePresence>
        {photo && (
          <Motion.div
            className={styles.photoPreviewWrap}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={springBouncy}
          >
            <img src={photo} alt="Post preview" className={styles.photoPreview} />
            <button type="button" className={styles.removePhotoBtn} onClick={removePhoto} aria-label="Remove photo">
              <Icon name="x" size={16} />
            </button>
          </Motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeSuggestions.length > 0 && (
          <Motion.div
            className={styles.suggestionCards}
            data-testid="suggestion-cards"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {activeSuggestions.map((text, index) => (
              <Motion.button
                key={index}
                type="button"
                className={styles.suggestionCard}
                data-testid="suggestion-card"
                onClick={() => handleSuggestionSelect(text)}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.18, ease: easeOutQuint, delay: index * 0.05 }}
              >
                {text}
              </Motion.button>
            ))}
          </Motion.div>
        )}
      </AnimatePresence>

      <div className={`${styles.expandable} ${showFooter ? styles.expanded : ''}`}>
        {showFooter ? (
          <div className={styles.expandableInner}>
            <div className={styles.composerHeader}>
              <label htmlFor="post-type" className={styles.typeLabel}>
                Post type
              </label>
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
              <span
                className={`${styles.charCount} ${
                  charactersRemaining < 40 ? styles.charCountWarn : ''
                }`}
              >
                {charactersRemaining}
              </span>
              <p className={styles.metaHint}>Ctrl/Cmd + Enter to post</p>
            </div>
            {error ? <p className={styles.error}>{error}</p> : null}
            <div className={styles.composerActions}>
              <button
                type="button"
                className={styles.mediaBtn}
                onClick={() => fileInputRef.current?.click()}
                aria-label="Add media"
              >
                <Icon name="camera" size={18} />
                <span>Media</span>
              </button>
              <div className={styles.composerActionsPrimary}>
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
            </div>
          </div>
        ) : null}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className={styles.hiddenInput}
        accept="image/*"
        onChange={handlePhotoUpload}
      />
    </div>
  )
}

