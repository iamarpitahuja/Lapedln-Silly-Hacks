import { useState } from 'react'
import { AnimatePresence, motion as Motion } from 'framer-motion'
import { useMockData } from '../context/MockDataContext'
import { springBouncy } from '../lib/motion'
import styles from './JobsPage.module.css'

export default function JobsPage() {
  const { currentUser, jobOptions, updateCurrentJob } = useMockData()
  const [job, setJob] = useState('')
  const [status, setStatus] = useState(null) // 'updating' | 'success' | 'error'
  const [lastJob, setLastJob] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!job.trim()) return
    setStatus('updating')
    const result = await updateCurrentJob(job)
    if (result.ok) {
      setLastJob(result.job)
      setJob('')
      setStatus('success')
      setTimeout(() => setStatus(null), 3000)
    } else {
      setStatus('error')
      setTimeout(() => setStatus(null), 3000)
    }
  }

  function handleSuggestion(suggested) {
    setJob(suggested)
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h2 className={styles.heading}>J*bs</h2>
        <p className={styles.subheading}>
          Pick the exact fake profession you want to project. This now controls
          your professional headline everywhere on the app.
        </p>

        <div className={styles.current}>
          <span className={styles.currentLabel}>Current larp:</span>
          <span className={styles.currentValue}>{currentUser.job}</span>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="text"
            className={styles.input}
            placeholder="type ur fake bag here…"
            value={job}
            onChange={e => setJob(e.target.value)}
          />
          <Motion.button
            type="submit"
            className={styles.submitBtn}
            disabled={!job.trim() || status === 'updating'}
            whileTap={{ scale: 0.95 }}
            transition={springBouncy}
          >
            {status === 'updating' ? 'Rebranding...' : 'Claim Job'}
          </Motion.button>
        </form>

        <AnimatePresence mode="wait">
          {status === 'success' && (
            <Motion.p
              key="success"
              className={styles.success}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={springBouncy}
            >
              arc updated. u are now larping as &ldquo;{lastJob}&rdquo;.
            </Motion.p>
          )}
          {status === 'error' && (
            <Motion.p
              key="error"
              className={styles.error}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, x: [0, -6, 6, -4, 4, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              update flopped. ur delusion did not persist fr.
            </Motion.p>
          )}
        </AnimatePresence>

        <div className={styles.suggestions}>
          <p className={styles.suggestionsLabel}>need inspo? steal one of these arcs:</p>
          <div className={styles.pills}>
            {jobOptions.map(t => (
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

