import { useState } from 'react'
import styles from './SuggestedGlazes.module.css'

const TONE_GLAZES = {
  professional: [
    'Congratulations on this milestone.',
    'Well deserved recognition.',
    'Impressive work as always.',
    'Continued excellence.',
  ],
  founder: [
    'Insane execution. Big things ahead.',
    'This kind of velocity is rare.',
    'Your trajectory needs to be studied.',
    'The operator mindset is showing.',
  ],
  unnatural: [
    'This is huge. So well deserved.',
    'Absolutely generational aura.',
    'The clarity, the vision, the execution.',
    'I am in awe of your continued excellence.',
    'Yet another masterclass.',
    'Massive inspiration for the ecosystem.',
  ],
  investor: [
    'This kind of velocity is impossible to ignore.',
    'Strong signal. Watching closely.',
    'Rare founder energy on display.',
    'The market will notice.',
  ],
}

export default function SuggestedGlazes() {
  const [tone, setTone] = useState(0) // 0 = professional, 50 = founder, 100 = unnatural
  const [submitted, setSubmitted] = useState(null)

  function getToneKey(value) {
    if (value < 34) return 'professional'
    if (value < 67) return 'founder'
    return 'unnatural'
  }

  const glazes = TONE_GLAZES[getToneKey(tone)]

  function handleGlaze(text) {
    setSubmitted(text)
    setTimeout(() => setSubmitted(null), 2000)
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.label}>Suggested Glazes</p>
      {submitted ? (
        <p className={styles.confirmation}>Glaze sent: &ldquo;{submitted}&rdquo;</p>
      ) : (
        <div className={styles.pills}>
          {glazes.slice(0, 3).map(g => (
            <button key={g} className={styles.pill} onClick={() => handleGlaze(g)}>
              {g}
            </button>
          ))}
        </div>
      )}
      <div className={styles.sliderRow}>
        <span className={styles.sliderLabel}>Professional</span>
        <input
          type="range"
          min="0"
          max="100"
          value={tone}
          onChange={e => setTone(Number(e.target.value))}
          className={styles.slider}
        />
        <span className={styles.sliderLabel}>Unnaturally supportive</span>
      </div>
    </div>
  )
}
