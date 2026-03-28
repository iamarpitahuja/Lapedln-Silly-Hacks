import { useCallback, useEffect, useRef, useState } from 'react'
import ProfileHero from './ProfileHero/ProfileHero'
import LarpStatus from './LarpStatus/LarpStatus'
import AboutSection from './AboutSection/AboutSection.jsx'
import ExperienceSection from './ExperienceSection/ExperienceSection.jsx'
import EducationSection from './EducationSection/EducationSection.jsx'
import SkillsSection from './SkillsSection/SkillsSection.jsx'
import LarpHistorySection from './LarpHistorySection/LarpHistorySection.jsx'
import GlazesSection from './GlazesSection/GlazesSection.jsx'
import styles from './Me.module.css'

const FEEDBACK_TIMEOUT_MS = 2000

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
        <ProfileHero onNotice={showInteractionNotice} />
        <LarpStatus onNotice={showInteractionNotice} />
        <AboutSection onNotice={showInteractionNotice} />
        <ExperienceSection onNotice={showInteractionNotice} />
        <EducationSection onNotice={showInteractionNotice} />
        <SkillsSection onNotice={showInteractionNotice} />
        <LarpHistorySection />
        <GlazesSection />
      </div>
      {interactionNotice && (
        <p className={`${styles.notice} ${styles.noticeVisible}`} role="status" aria-live="polite">
          {interactionNotice}
        </p>
      )}
    </div>
  )
}
