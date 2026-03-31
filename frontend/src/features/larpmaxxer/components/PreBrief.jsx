import styles from './PreBrief.module.css'
import { getInitials } from '../../../utils/strings'

const DIFFICULTY_BADGE = {
  easy:        { label: 'Easy',      bg: 'var(--accent-relarp-soft)', color: 'var(--accent-cyan)' },
  easy_medium: { label: 'Easy-Med',  bg: 'var(--accent-relarp-soft)', color: 'var(--accent-cyan)' },
  medium:      { label: 'Medium',    bg: 'var(--accent-glaze-soft)', color: 'var(--accent-amber)' },
  hard:        { label: 'Hard',      bg: 'var(--accent-danger-soft)', color: 'var(--accent-danger)' },
  very_hard:   { label: 'Very Hard', bg: 'var(--accent-danger-soft)', color: 'var(--accent-danger)' },
}

export function PreBrief({ scenario, character, personaId, openingLine, onConfirm, onBack }) {
  const diff = DIFFICULTY_BADGE[scenario.difficulty] ?? DIFFICULTY_BADGE.medium

  const isBestFit = scenario.bestPersonas.includes(personaId)
  const isToughFit = scenario.toughPersonas.includes(personaId)
  const personaFit = isBestFit
    ? { label: 'Strong fit for your persona', bg: 'var(--accent-relarp-soft)', color: 'var(--accent-cyan)' }
    : isToughFit
    ? { label: 'Tough match for your persona', bg: 'var(--accent-danger-soft)', color: 'var(--accent-danger)' }
    : { label: 'Neutral fit for your persona', bg: 'var(--bg-deep)', color: 'var(--text-secondary)' }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.headerRow}>
          <div>
            <h2 className={styles.scenarioName}>{scenario.name}</h2>
            <p className={styles.setting}>{scenario.setting}</p>
          </div>
          <span
            className={styles.diffBadge}
            style={{ backgroundColor: diff.bg, color: diff.color }}
          >
            {diff.label}
          </span>
        </div>

        <div className={styles.characterRow}>
          <div className={styles.charAvatar}>{getInitials(character.name)}</div>
          <div>
            <p className={styles.charName}>{character.name}</p>
            <p className={styles.charRole}>{character.role} | {character.company}</p>
          </div>
        </div>

        <p className={styles.openingLine}>"{openingLine}"</p>

        <div
          className={styles.personaFit}
          style={{ backgroundColor: personaFit.bg, color: personaFit.color }}
        >
          {personaFit.label}
        </div>

        <div className={styles.objectives}>
          <p className={styles.objectivesTitle}>Objectives</p>
          {scenario.objectives.map((obj, i) => (
            <div key={i} className={styles.objectiveItem}>
              <span>{'>'}</span>
              <span>{obj}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.actions}>
        <button className={styles.btnBack} onClick={onBack}>Back</button>
        <button className={styles.btnConfirm} onClick={onConfirm}>Enter Simulation</button>
      </div>
    </div>
  )
}

