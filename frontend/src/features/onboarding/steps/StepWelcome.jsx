import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { springBouncy } from '../../../lib/motion'
import LarpCounter from '../components/LarpCounter'
import styles from './StepWelcome.module.css'

export default function StepWelcome({ larpRating = 0, onEnter }) {
  const [showCta, setShowCta] = useState(false)
  const logoSrc = '/logoDarkMode.png'

  function handleCounterComplete() {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#7db5ff', '#a78bfa', '#f1c75b', '#f289a8'],
    })
    setShowCta(true)
  }

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <motion.img
          src={logoSrc}
          alt="LarpedIn logo"
          className={styles.logo}
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={springBouncy}
        />

        <p className={styles.kicker}>Profile Activated</p>
        <h2 className={styles.title}>You are officially employable on paper. Congrats on the delusion.</h2>

        <motion.p
          className={styles.label}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          YOUR LARP RATING
        </motion.p>

        <div className={styles.ratingWrap}>
          <LarpCounter target={larpRating} duration={2500} onComplete={handleCounterComplete} />
        </div>

        <AnimatePresence>
          {showCta && (
            <motion.button
              className={styles.enterBtn}
              onClick={onEnter}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={springBouncy}
            >
              Enter the Simulation →
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
