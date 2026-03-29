import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ProfileHero from './ProfileHero/ProfileHero'
import LarpStatus from './LarpStatus/LarpStatus'
import AboutSection from './AboutSection/AboutSection.jsx'
import ExperienceSection from './ExperienceSection/ExperienceSection.jsx'
import EducationSection from './EducationSection/EducationSection.jsx'
import SkillsSection from './SkillsSection/SkillsSection.jsx'
import LarpHistorySection from './LarpHistorySection/LarpHistorySection.jsx'
import GlazesSection from './GlazesSection/GlazesSection.jsx'
import { useUser } from '../../context/UserContext'
import styles from './Me.module.css'

const FEEDBACK_TIMEOUT_MS = 2000

export default function Me() {
  const [interactionNotice, setInteractionNotice] = useState('')
  const clearTimerRef = useRef(null)
  const navigate = useNavigate()
  const { personaId, larpRating, lastSessionResult, setLastSessionResult } = useUser()

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
        {/* Post-session result banner */}
        {lastSessionResult && (
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '20px' }}>⚔️</span>
              <span style={{ fontSize: '13px', color: '#000000e6' }}>
                <strong>{lastSessionResult.scenarioName}</strong>
                {' — '}Score{' '}
                <strong style={{ color: lastSessionResult.score >= 70 ? '#057642' : lastSessionResult.score >= 40 ? '#0a66c2' : '#cc1016' }}>
                  {lastSessionResult.score}
                </strong>
                {' — '}LarpRating{' '}
                <strong style={{ color: lastSessionResult.delta >= 0 ? '#057642' : '#cc1016' }}>
                  {lastSessionResult.delta >= 0 ? '+' : ''}{lastSessionResult.delta.toFixed(1)}
                </strong>
              </span>
            </div>
            <button onClick={() => setLastSessionResult(null)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#00000066', fontSize: '18px', lineHeight: 1, flexShrink: 0,
            }}>×</button>
          </div>
        )}

        <ProfileHero onNotice={showInteractionNotice} />
        <LarpStatus onNotice={showInteractionNotice} />
        <AboutSection onNotice={showInteractionNotice} />
        <ExperienceSection onNotice={showInteractionNotice} />
        <EducationSection onNotice={showInteractionNotice} />
        <SkillsSection onNotice={showInteractionNotice} />
        <LarpHistorySection />
        <GlazesSection />

        {/* LarpMaxxing Training Card */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '20px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>⚔️</div>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#000000e6',
              margin: '0 0 6px',
            }}>
              LarpMaxxing
            </h2>
            <p style={{
              fontSize: '13px',
              color: '#00000099',
              margin: '0 0 16px',
              lineHeight: 1.5,
            }}>
              Train for the conversations your future self deserves. Practice social simulations and boost your LarpRating.
            </p>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
              padding: '6px 14px',
              backgroundColor: '#eef3f8',
              borderRadius: '6px',
            }}>
              <span style={{ fontSize: '12px', color: '#00000099' }}>LarpRating</span>
              <span style={{
                backgroundColor: '#0a66c2',
                color: '#fff',
                borderRadius: '4px',
                padding: '1px 8px',
                fontSize: '13px',
                fontWeight: 700,
              }}>
                {larpRating.toFixed(1)}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button
                onClick={() => navigate(personaId ? '/larpmaxxer' : '/persona-select')}
                style={{
                  backgroundColor: '#0a66c2',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '24px',
                  padding: '8px 24px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Begin Training
              </button>
            </div>
          </div>
        </div>
      </div>
      {interactionNotice && (
        <p className={`${styles.notice} ${styles.noticeVisible}`} role="status" aria-live="polite">
          {interactionNotice}
        </p>
      )}
    </div>
  )
}
