import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { springBouncy } from '../../../lib/motion'
import StepShell from '../components/StepShell'
import styles from './steps.module.css'
import expStyles from './StepExperience.module.css'

const EMPTY_ENTRY = { company: '', title: '', start: '', end: '' }

export default function StepExperience({ onNext, onSkip }) {
  const [entries, setEntries] = useState([])
  const [draft, setDraft] = useState(null)

  function startAdding() {
    setDraft({ ...EMPTY_ENTRY })
  }

  function saveDraft() {
    if (!draft.company.trim()) return
    setEntries(prev => [...prev, draft])
    setDraft(null)
  }

  function removeEntry(i) {
    setEntries(prev => prev.filter((_, idx) => idx !== i))
  }

  function handleSubmit(e) {
    e.preventDefault()
    onNext({ experience: entries })
  }

  return (
    <StepShell heading="Document your corporate journey." stepNumber={4} totalSteps={5} skippable onSkip={onSkip}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <AnimatePresence>
          {entries.map((entry, i) => (
            <motion.div
              key={i}
              className={expStyles.entryCard}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={springBouncy}
            >
              <div className={expStyles.entryInfo}>
                <strong>{entry.title}</strong>
                <span>{entry.company}</span>
                <span className={expStyles.dates}>{entry.start}{entry.end ? ` – ${entry.end}` : ' – Present'}</span>
              </div>
              <button type="button" className={styles.removeBtn} onClick={() => removeEntry(i)} aria-label="Remove entry">
                ✕
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {draft !== null ? (
          <div className={expStyles.draftForm}>
            <input className={styles.input} placeholder="Company" value={draft.company} onChange={e => setDraft(d => ({ ...d, company: e.target.value }))} />
            <input className={styles.input} placeholder="Title / Role" value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} />
            <div className={expStyles.dateRow}>
              <input className={styles.input} placeholder="Start (e.g. 2022)" value={draft.start} onChange={e => setDraft(d => ({ ...d, start: e.target.value }))} />
              <input className={styles.input} placeholder="End (blank = Present)" value={draft.end} onChange={e => setDraft(d => ({ ...d, end: e.target.value }))} />
            </div>
            <button type="button" className={styles.nextBtn} onClick={saveDraft}>Save Entry</button>
          </div>
        ) : (
          <button type="button" className={styles.addBtn} onClick={startAdding}>+ Add Experience</button>
        )}

        <button type="submit" className={styles.nextBtn}>
          Next →
        </button>
      </form>
    </StepShell>
  )
}
