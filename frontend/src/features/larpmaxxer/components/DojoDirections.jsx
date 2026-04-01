import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import BuzzwordParticles from '../../onboarding/components/BuzzwordParticles'
import { easeOutQuint } from '../../../lib/motion'
import styles from './DojoDirections.module.css'

function DojoIcon({ name, className }) {
  switch (name) {
    case 'swords':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true" focusable="false">
          <path d="M4 20L10 14M8 4l12 12M14 4l6 6M4 14l6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'bot':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true" focusable="false">
          <rect x="5" y="7" width="14" height="11" rx="3" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="10" cy="12.5" r="1.1" fill="currentColor" />
          <circle cx="14" cy="12.5" r="1.1" fill="currentColor" />
          <path d="M12 7V4m0 0l-2 2m2-2l2 2M9 17h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'cards':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true" focusable="false">
          <rect x="4" y="7" width="9" height="13" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <rect x="11" y="4" width="9" height="13" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M14.5 8.5h2m-1-1v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      )
    case 'timer':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true" focusable="false">
          <circle cx="12" cy="13" r="7" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 13l3-2m-5-7h4m-2 0v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'chart':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true" focusable="false">
          <path d="M4 19h16M7 16v-3m5 3V8m5 8v-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'trendUp':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true" focusable="false">
          <path d="M5 16l5-5 3 3 6-6M15 8h4v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'skull':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true" focusable="false">
          <path d="M12 4a7 7 0 0 0-7 7v2.5A2.5 2.5 0 0 0 7.5 16h9a2.5 2.5 0 0 0 2.5-2.5V11a7 7 0 0 0-7-7Z" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="9.5" cy="11.5" r="1.1" fill="currentColor" />
          <circle cx="14.5" cy="11.5" r="1.1" fill="currentColor" />
          <path d="M10 16v3m2-3v3m2-3v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      )
    case 'lock':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true" focusable="false">
          <rect x="6" y="11" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M8.5 11V8.8a3.5 3.5 0 1 1 7 0V11" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="12" cy="15.5" r="1.1" fill="currentColor" />
        </svg>
      )
    default:
      return null
  }
}

const SLIDES = [
  {
    key: 'dojo',
    heading: 'Welcome to the Dojo',
    items: [
      { icon: 'swords', text: 'Pick a scenario — coffee chat, VC pitch, performance review, and more.' },
      { icon: 'bot', text: 'The character responds dynamically based on your choices.' },
      { icon: 'cards', text: '4 response options per turn, each tagged: Ambitious, Calculated, Alpha…' },
      { icon: 'timer', text: 'Limited turns. Make every move count.' },
    ],
  },
  {
    key: 'rating',
    heading: 'Your LARP Rating',
    items: [
      { icon: 'chart', text: 'Every response is graded on persona alignment.' },
      { icon: 'trendUp', text: 'Perfect alignment → big LR gain. Off-persona → LR drops.' },
      { icon: 'skull', text: '"You hurt yourself in confusion" — cringe responses trigger a red-flash LR penalty.' },
      { icon: 'lock', text: 'Harder scenarios = bigger swings. Locked scenarios unlock as your LR grows.' },
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
                  <DojoIcon name={item.icon} className={styles.listItemIcon} />
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
