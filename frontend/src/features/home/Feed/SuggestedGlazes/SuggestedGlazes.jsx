import { useState } from 'react'
import styles from './SuggestedGlazes.module.css'

const TONE_GLAZES = {
  professional: [
    'Congratulations on this milestone.',
    'Well deserved recognition.',
    'Impressive work as always.',
    'The industry needed this.',
  ],
  founder: [
    'Insane execution. Big things ahead.',
    'This kind of velocity is rare. Actually unhinged output.',
    'Your trajectory needs to be studied by Stanford.',
    'The operator mindset is showing. Scary tbh.',
  ],
  unnatural: [
    'I am SOBBING at this post. Generational talent fr.',
    'Absolutely generational aura. No cap.',
    'This post just made me quit my job. I am INSPIRED.',
    'I showed this to my therapist and she started clapping.',
    'Yet another masterclass. The GOAT does not miss.',
    'I would literally run through a wall for this content.',
  ],
}

export default function SuggestedGlazes({ onGlaze, isGlazed }) {
  const [tone, setTone] = useState(0) // 0 = professional, 50 = founder, 100 = unnatural
  const [customGlaze, setCustomGlaze] = useState('')
  const [submitted, setSubmitted] = useState(null)

  function getToneKey(value) {
    if (value < 34) return 'professional'
    if (value < 67) return 'founder'
    return 'unnatural'
  }

  const glazes = TONE_GLAZES[getToneKey(tone)]

  function handleSelectPill(text) {
    if (isGlazed) return
    setCustomGlaze(text)
  }

  function handleSend() {
    if (!customGlaze.trim() || isGlazed) return

    const selected = customGlaze.trim()
    setSubmitted(selected)
    if (onGlaze) onGlaze(selected)
    setCustomGlaze('')
    setTimeout(() => setSubmitted(null), 3000)
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.label}>
        {isGlazed ? 'Glaze sent successfully' : 'Suggested Glazes'}
      </p>
      {submitted ? (
        <p className={styles.confirmation}>Glaze sent: &ldquo;{submitted}&rdquo;</p>
      ) : (
        <>
          <div className={styles.pills} key={getToneKey(tone)}>
            {glazes.slice(0, 3).map(g => (
              <button 
                key={g} 
                className={styles.pill} 
                onClick={() => handleSelectPill(g)}
                disabled={isGlazed}
              >
                {g}
              </button>
            ))}
          </div>
          <div className={styles.customRow}>
            <input
              type="text"
              className={styles.input}
              placeholder={isGlazed ? "Already glazed this post" : "Your own glaze..."}
              value={customGlaze}
              onChange={e => setCustomGlaze(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              disabled={isGlazed}
            />
            <button 
              className={styles.sendBtn} 
              onClick={handleSend}
              disabled={!customGlaze.trim() || isGlazed}
            >
              {isGlazed ? 'Sent' : 'Send'}
            </button>
          </div>
        </>
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
        <span className={styles.sliderLabel}>Unhinged glazing</span>
      </div>
    </div>
  )
}
