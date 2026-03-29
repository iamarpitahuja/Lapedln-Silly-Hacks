import { motion } from 'framer-motion'
import type { EventCardData } from '../types'

type EventCardProps = {
  data: EventCardData
  larpRatingDelta: number
  onContinue: () => void
}

export function EventCard({ data, larpRatingDelta, onContinue }: EventCardProps) {
  const isExposure = data.type === 'exposure'

  const accentColor = isExposure ? '#cc1016' : '#057642'
  const accentBg = isExposure ? '#fdecea' : '#e8f5ef'
  const headerText = isExposure ? 'EXPOSURE EVENT' : 'BREAKTHROUGH MOMENT'
  const flavorText = isExposure
    ? 'Your narrative has developed internal contradictions.'
    : 'Maximum social extraction achieved.'

  const isPositiveDelta = larpRatingDelta > 0

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(243,242,239,0.92)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '24px',
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: '#ffffff',
          border: `1px solid ${accentColor}55`,
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        }}
      >
        {/* Header band */}
        <div style={{
          backgroundColor: accentBg,
          borderBottom: `1px solid ${accentColor}44`,
          padding: '14px 20px',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.12em',
            color: accentColor,
            textTransform: 'uppercase',
            marginBottom: '4px',
          }}>
            {isExposure ? '⚠' : '⚡'} {headerText}
          </div>
          <div style={{ fontSize: '13px', color: '#00000099', fontStyle: 'italic' }}>
            {flavorText}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '20px' }}>
          {/* Character closing line */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              color: '#00000099',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}>
              {data.characterName} says
            </div>
            <blockquote style={{
              margin: 0,
              borderLeft: `3px solid ${accentColor}`,
              paddingLeft: '12px',
              fontSize: '14px',
              fontStyle: 'italic',
              color: '#000000e6',
              lineHeight: 1.6,
            }}>
              "{data.characterLine}"
            </blockquote>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '18px' }}>
            <div style={{
              flex: 1,
              backgroundColor: '#f3f2ef',
              borderRadius: '6px',
              padding: '10px 12px',
              textAlign: 'center',
              border: '1px solid #e0e0e0',
            }}>
              <div style={{ fontSize: '10px', color: '#00000099', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Turns
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#000000e6' }}>
                {data.endTurn}/{data.maxTurns}
              </div>
            </div>
            <div style={{
              flex: 1,
              backgroundColor: '#f3f2ef',
              borderRadius: '6px',
              padding: '10px 12px',
              textAlign: 'center',
              border: '1px solid #e0e0e0',
            }}>
              <div style={{ fontSize: '10px', color: '#00000099', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                LarpRating
              </div>
              <div style={{
                fontSize: '18px',
                fontWeight: 800,
                color: larpRatingDelta === 0 ? '#00000099' : isPositiveDelta ? '#057642' : '#cc1016',
              }}>
                {larpRatingDelta === 0 ? '—' : isPositiveDelta ? `+${larpRatingDelta.toFixed(1)}` : larpRatingDelta.toFixed(1)}
              </div>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={onContinue}
            style={{
              width: '100%',
              backgroundColor: accentColor,
              border: 'none',
              borderRadius: '24px',
              padding: '11px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 700,
              color: '#fff',
              letterSpacing: '0.02em',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.opacity = '1'
            }}
          >
            View Summary
          </button>
        </div>
      </motion.div>
    </div>
  )
}
