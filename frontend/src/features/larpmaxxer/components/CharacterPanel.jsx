import { MeterBar } from './MeterBar'
import { getInitials } from '../../../utils/strings'
import styles from './CharacterPanel.module.css'

const MOOD_STYLE = {
  neutral:   { bg: 'var(--bg-deep)', color: 'var(--text-muted)' },
  curious:   { bg: 'var(--neon-faint)', color: 'var(--neon)' },
  skeptical: { bg: 'var(--accent-danger-soft)', color: 'var(--accent-danger)' },
  impressed: { bg: 'var(--accent-relarp-soft)', color: 'var(--accent-cyan)' },
  done:      { bg: 'var(--accent-glaze-soft)', color: 'var(--accent-amber)' },
}

export function CharacterPanel({ character, meters, moodState, meterDeltas }) {
  const mood = MOOD_STYLE[moodState] ?? MOOD_STYLE.neutral

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.avatar}>{getInitials(character.name)}</div>
        <p className={styles.name}>{character.name}</p>
        <p className={styles.role}>{character.role} | {character.company}</p>
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

