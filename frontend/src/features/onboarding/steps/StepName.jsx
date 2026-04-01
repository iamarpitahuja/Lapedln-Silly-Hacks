import { useState } from 'react'
import StepShell from '../components/StepShell'
import styles from './steps.module.css'

export default function StepName({ onNext, stepNumber = 1, totalSteps = 6 }) {
  const [name, setName] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    onNext({ display_name: name.trim() })
  }

  return (
    <StepShell heading="What should the algorithm call you? (choose wisely, this is ur brand now)" stepNumber={stepNumber} totalSteps={totalSteps} skippable={false}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          className={styles.input}
          type="text"
          placeholder="Your name, thought leader"
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
        />
        <button
          type="submit"
          className={styles.nextBtn}
          disabled={!name.trim()}
        >
          Next →
        </button>
      </form>
    </StepShell>
  )
}
