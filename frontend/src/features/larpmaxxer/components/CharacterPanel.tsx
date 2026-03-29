import type { CharacterProfile, Meters, MoodState } from '../types'
import { MeterBar } from './MeterBar'

type CharacterPanelProps = {
  character: CharacterProfile
  meters: Meters
  moodState: MoodState
  meterDeltas?: { impressed: number; suspicion: number } | null
}

const MOOD_LABELS: Record<MoodState, string> = {
  neutral: 'Processing you',
  curious: 'Skeptical but open',
  skeptical: 'Skeptical but curious',
  impressed: 'Genuinely interested',
  done: 'Professionally done',
}

const MOOD_COLORS: Record<MoodState, string> = {
  neutral: '#00000099',
  curious: '#6b39c1',
  skeptical: '#b45309',
  impressed: '#0a66c2',
  done: '#cc1016',
}

export function CharacterPanel({ character, meters, moodState, meterDeltas }: CharacterPanelProps) {
  const moodLabel = MOOD_LABELS[moodState]
  const moodColor = MOOD_COLORS[moodState]

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderLeft: '1px solid #e0e0e0',
      padding: '16px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      height: '100%',
      overflowY: 'auto',
    }}>
      {/* Character avatar */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: '48px',
          lineHeight: 1,
          marginBottom: '10px',
        }}>
          {character.avatar}
        </div>
        <div style={{
          fontSize: '15px',
          fontWeight: 700,
          color: '#000000e6',
          marginBottom: '2px',
        }}>
          {character.name}
        </div>
        <div style={{ fontSize: '12px', color: '#00000099', marginBottom: '1px' }}>
          {character.role}
        </div>
        <div style={{ fontSize: '11px', color: '#00000099', marginBottom: '6px' }}>
          {character.company}
        </div>
        <div style={{
          fontSize: '11px',
          color: '#00000099',
          fontStyle: 'italic',
          borderTop: '1px solid #e0e0e0',
          paddingTop: '8px',
          lineHeight: 1.4,
        }}>
          {character.subtext}
        </div>
      </div>

      {/* Current read */}
      <div style={{
        backgroundColor: '#f3f2ef',
        borderRadius: '6px',
        padding: '10px 12px',
        border: `1px solid ${moodColor}44`,
      }}>
        <div style={{
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.08em',
          color: '#00000099',
          textTransform: 'uppercase',
          marginBottom: '4px',
        }}>
          Current read
        </div>
        <div style={{
          fontSize: '13px',
          fontWeight: 600,
          color: moodColor,
        }}>
          {moodLabel}
        </div>
      </div>

      {/* Meters */}
      <div>
        <div style={{
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.08em',
          color: '#00000099',
          textTransform: 'uppercase',
          marginBottom: '10px',
        }}>
          Meters
        </div>
        <MeterBar
          value={meters.impressed}
          delta={meterDeltas?.impressed ?? null}
          color="blue"
          label="Impressed"
        />
        <MeterBar
          value={meters.suspicion}
          delta={meterDeltas?.suspicion ?? null}
          color="amber"
          label="Suspicion"
        />
        <MeterBar
          value={meters.status}
          delta={null}
          color="purple"
          label="Status"
        />
      </div>

      {/* Age badge */}
      <div style={{
        fontSize: '10px',
        color: '#00000099',
        textAlign: 'center',
        borderTop: '1px solid #e0e0e0',
        paddingTop: '10px',
      }}>
        Age {character.age} · {character.personalityTraits.slice(0, 2).join(', ')}
      </div>
    </div>
  )
}
