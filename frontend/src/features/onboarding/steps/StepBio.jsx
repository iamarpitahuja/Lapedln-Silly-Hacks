import { useState } from 'react'
import StepShell from '../components/StepShell'
import styles from './steps.module.css'

export default function StepBio({ onNext, onSkip, stepNumber = 4, totalSteps = 6 }) {
  const [bio, setBio] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    onNext({ bio })
  }

  return (
    <StepShell heading="Describe your personal brand in buzzwords." stepNumber={stepNumber} totalSteps={totalSteps} skippable onSkip={onSkip}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <textarea
          className={styles.textarea}
          placeholder="e.g. Serial disruptor. Building at the intersection of ambiguity and momentum."
          value={bio}
          onChange={e => setBio(e.target.value)}
          rows={5}
        />
        <button type="submit" className={styles.nextBtn}>
          Next →
        </button>
      </form>
    </StepShell>
  )
}
