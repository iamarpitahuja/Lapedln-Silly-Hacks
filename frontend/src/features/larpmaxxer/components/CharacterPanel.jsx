import { MeterBar } from './MeterBar'
import styles from './CharacterPanel.module.css'

const MOOD_STYLE = {
  neutral:   { bg: '#f3f2ef', color: 'rgba(0,0,0,0.5)' },
  curious:   { bg: '#eef3f8', color: '#0a66c2' },
  skeptical: { bg: '#fdecea', color: '#cc1016' },
  impressed: { bg: '#e8f5ef', color: '#057642' },
  done:      { bg: '#fff7e6', color: '#b45309' },
}

export function CharacterPanel({ character, meters, moodState, meterDeltas }) {
  const mood = MOOD_STYLE[moodState] ?? MOOD_STYLE.neutral

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.avatar}>{character.avatar}</div>
        <p className={styles.name}>{character.name}</p>
        <p className={styles.role}>{character.role} · {character.company}</p>
        <div className={styles.moodRow}>
          <span
            className={styles.moodBadge}
            style={{ backgroundColor: mood.bg, color: mood.color }}
          >
            {moodState}
          </span>
        </div>
      </div>

      <div className={styles.meters}>
        <p className={styles.metersTitle}>Relationship Meters</p>
        <MeterBar
          label="Impressed"
          value={meters.impressed}
          delta={meterDeltas?.impressed}
        />
        <MeterBar
          label="Suspicion"
          value={meters.suspicion}
          delta={meterDeltas?.suspicion}
        />
        <MeterBar
          label="Status"
          value={meters.status}
        />
      </div>

      <div className={styles.traits}>
        <p className={styles.traitsTitle}>Personality</p>
        {character.personalityTraits.map(t => (
          <span key={t} className={styles.trait}>{t}</span>
        ))}
      </div>
    </div>
  )
}
