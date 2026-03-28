import { useState } from 'react'
import { useMockData } from '../context/MockDataContext'
import { updateTitle } from '../services/api'
import styles from './JobsPage.module.css'

const SUGGESTED_TITLES = [
  'Chief Vibes Officer',
  'Fractional Thought Leader',
  'Head of Disruption & Synergy',
  'VP of Looking Busy',
  'Senior Director of Paradigm Shifts',
  'Incoming Quantum Blockchain Evangelist',
  'Post-Exit Founder | Limited Partner | Aura Architect',
]

export default function JobsPage() {
  const { currentUser, updateProfile } = useMockData()
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState(null) // 'updating' | 'success' | 'error'
  const [lastTitle, setLastTitle] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return
    setStatus('updating')
    try {
      const result = await updateTitle(title)
      await updateProfile({ headline: result.new_title })
      setLastTitle(result.new_title)
      setTitle('')
      setStatus('success')
      setTimeout(() => setStatus(null), 3000)
    } catch {
      setStatus('error')
      setTimeout(() => setStatus(null), 3000)
    }
  }

  function handleSuggestion(suggested) {
    setTitle(suggested)
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h2 className={styles.heading}>J*bs</h2>
        <p className={styles.subheading}>
          Instantly overwrite your professional title. No questions asked.
          No validation. No length check. No profanity filter. That&apos;s the joke.
        </p>

        <div className={styles.current}>
          <span className={styles.currentLabel}>Current title:</span>
          <span className={styles.currentValue}>{currentUser.headline}</span>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="text"
            className={styles.input}
            placeholder="Enter your new prestigious title..."
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={!title.trim() || status === 'updating'}
          >
            {status === 'updating' ? 'Ascending...' : 'Claim Title'}
          </button>
        </form>

        {status === 'success' && (
          <p className={styles.success}>
            Prestige updated. You are now &ldquo;{lastTitle}&rdquo;. No one can take this from you.
          </p>
        )}
        {status === 'error' && (
          <p className={styles.error}>
            Title update failed. Even the backend rejects your ambition. (Is it running?)
          </p>
        )}

        <div className={styles.suggestions}>
          <p className={styles.suggestionsLabel}>Need inspiration? Try one of these:</p>
          <div className={styles.pills}>
            {SUGGESTED_TITLES.map(t => (
              <button key={t} className={styles.pill} onClick={() => handleSuggestion(t)}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
