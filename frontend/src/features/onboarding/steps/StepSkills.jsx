import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { springSnap } from '../../../lib/motion'
import StepShell from '../components/StepShell'
import styles from './steps.module.css'

export default function StepSkills({ onNext, onSkip, stepNumber = 6, totalSteps = 6 }) {
  const [skills, setSkills] = useState([])
  const [input, setInput] = useState('')

  function addSkill() {
    const trimmed = input.trim()
    if (!trimmed || skills.includes(trimmed)) {
      setInput('')
      return
    }
    setSkills(prev => [...prev, trimmed])
    setInput('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addSkill()
    }
  }

  function removeSkill(skill) {
    setSkills(prev => prev.filter(s => s !== skill))
  }

  function handleSubmit(e) {
    e.preventDefault()
    onNext({ skills })
  }

  return (
    <StepShell heading="Tag your superpowers." stepNumber={stepNumber} totalSteps={totalSteps} skippable onSkip={onSkip}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.tagList}>
          <AnimatePresence>
            {skills.map(skill => (
              <motion.span
                key={skill}
                className={styles.tag}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={springSnap}
              >
                {skill}
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => removeSkill(skill)}
                  aria-label={`Remove ${skill}`}
                  style={{ fontSize: '0.7rem', padding: '0 0.2rem' }}
                >
                  ✕
                </button>
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
        <input
          className={styles.input}
          placeholder="Add a skill and press Enter"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button type="submit" className={styles.nextBtn}>
          Complete Profile →
        </button>
      </form>
    </StepShell>
  )
}
