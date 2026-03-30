import { useCallback, useEffect, useRef, useState } from 'react'
import { motion as Motion, AnimatePresence } from 'framer-motion'
import ProfileHero from './ProfileHero/ProfileHero'
import LarpStatus from './LarpStatus/LarpStatus'
import AboutSection from './AboutSection/AboutSection.jsx'
import ExperienceSection from './ExperienceSection/ExperienceSection.jsx'
import EducationSection from './EducationSection/EducationSection.jsx'
import SkillsSection from './SkillsSection/SkillsSection.jsx'
import LarpHistorySection from './LarpHistorySection/LarpHistorySection.jsx'
import GlazesSection from './GlazesSection/GlazesSection.jsx'
import { easeOutQuint } from '../../lib/motion'
import styles from './Me.module.css'

const FEEDBACK_TIMEOUT_MS = 2000

const sectionMotion = {
  whileInView: { opacity: 1, y: 0 },
  initial: { opacity: 0, y: 16 },
  viewport: { once: true, margin: '-40px' },
}

export default function Me() {
  const [interactionNotice, setInteractionNotice] = useState('')
  const clearTimerRef = useRef(null)

  useEffect(() => {
    return () => {
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current)
      }
    }
  }, [])

  const showInteractionNotice = useCallback(label => {
    setInteractionNotice(`${label} activated`)

    if (clearTimerRef.current) {
      clearTimeout(clearTimerRef.current)
    }

    clearTimerRef.current = setTimeout(() => {
      setInteractionNotice('')
      clearTimerRef.current = null
    }, FEEDBACK_TIMEOUT_MS)
  }, [])

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <Motion.div {...sectionMotion} transition={{ duration: 0.3, ease: easeOutQuint, delay: 0 }}>
          <ProfileHero onNotice={showInteractionNotice} />
        </Motion.div>
        <Motion.div {...sectionMotion} transition={{ duration: 0.3, ease: easeOutQuint, delay: 0.06 }}>
          <LarpStatus onNotice={showInteractionNotice} />
        </Motion.div>
        <Motion.div {...sectionMotion} transition={{ duration: 0.3, ease: easeOutQuint, delay: 0.12 }}>
          <AboutSection onNotice={showInteractionNotice} />
        </Motion.div>
        <Motion.div {...sectionMotion} transition={{ duration: 0.3, ease: easeOutQuint, delay: 0.18 }}>
          <ExperienceSection onNotice={showInteractionNotice} />
        </Motion.div>
        <Motion.div {...sectionMotion} transition={{ duration: 0.3, ease: easeOutQuint, delay: 0.24 }}>
          <EducationSection onNotice={showInteractionNotice} />
        </Motion.div>
        <Motion.div {...sectionMotion} transition={{ duration: 0.3, ease: easeOutQuint, delay: 0.30 }}>
          <SkillsSection onNotice={showInteractionNotice} />
        </Motion.div>
        <Motion.div {...sectionMotion} transition={{ duration: 0.3, ease: easeOutQuint, delay: 0.36 }}>
          <LarpHistorySection />
        </Motion.div>
        <Motion.div {...sectionMotion} transition={{ duration: 0.3, ease: easeOutQuint, delay: 0.42 }}>
          <GlazesSection />
        </Motion.div>
      </div>
      <AnimatePresence>
        {interactionNotice && (
          <Motion.p
            className={`${styles.notice} ${styles.noticeVisible}`}
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: easeOutQuint }}
          >
            {interactionNotice}
          </Motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

