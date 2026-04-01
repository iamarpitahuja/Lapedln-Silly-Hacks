import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import BuzzwordParticles from '../../onboarding/components/BuzzwordParticles'
import { easeOutQuint } from '../../../lib/motion'
import styles from './DojoDirections.module.css'

const SLIDES = [
  {
    key: 'dojo',
    heading: 'Welcome to the Dojo',
    items: [
      { icon: '⚔️', text: 'Pick a scenario — coffee chat, VC pitch, performance review, and more.' },
      { icon: '🤖', text: 'The character responds dynamically based on your choices.' },
      { icon: '🃏', text: '4 response options per turn, each tagged: Ambitious, Calculated, Alpha…' },
      { icon: '⏱️', text: 'Limited turns. Make every move count.' },
    ],
  },
  {
    key: 'rating',
    heading: 'Your LARP Rating',
    items: [
      { icon: '📊', text: 'Every response is graded on persona alignment.' },
      { icon: '⬆️', text: 'Perfect alignment → big LR gain. Off-persona → LR drops.' },
      { icon: '💀', text: '"You hurt yourself in confusion" — cringe responses trigger a red-flash LR penalty.' },
      { icon: '🔒', text: 'Harder scenarios = bigger swings. Locked scenarios unlock as your LR grows.' },
    ],
  },
]

const SLIDE_VARIANTS = {
  enter: direction => ({
    x: direction === 'forward' ? '100%' : '-100%',
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: direction => ({
    x: direction === 'forward' ? '-100%' : '100%',
    opacity: 0,
  }),
}

export function DojoDirections({ onDone }) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [direction, setDirection] = useState('forward')

  const slide = SLIDES[currentSlide]
  const isLast = currentSlide === SLIDES.length - 1

  function goNext() {
    if (!isLast) {
      setDirection('forward')
      setCurrentSlide(s => s + 1)
    } else {
      onDone()
    }
  }

  function goBack() {
    if (currentSlide > 0) {
      setDirection('backward')
      setCurrentSlide(s => s - 1)
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.particles}>
        <BuzzwordParticles count={7} />
      </div>

      <div className={styles.inner}>
        <div className={styles.dots}>
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className={`${styles.dot} ${i === currentSlide ? styles.dotActive : ''}`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={slide.key}
            custom={direction}
            variants={SLIDE_VARIANTS}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.45, ease: easeOutQuint }}
            className={styles.card}
          >
            <h1 className={styles.heading}>{slide.heading}</h1>

            <ul className={styles.list}>
              {slide.items.map((item, i) => (
                <li key={i} className={styles.listItem}>
                  <span className={styles.listItemIcon}>{item.icon}</span>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>

            <div className={styles.actions}>
              {currentSlide > 0 && (
                <button className={styles.btnBack} onClick={goBack} type="button">
                  ← Back
                </button>
              )}
              <button className={styles.btnPrimary} onClick={goNext} type="button">
                {isLast ? "Let's Go →" : 'Next →'}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
