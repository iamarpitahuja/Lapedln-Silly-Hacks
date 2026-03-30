import styles from './PreBrief.module.css'

const DIFFICULTY_BADGE = {
  easy:        { label: 'Easy',      bg: '#e8f5ef', color: '#057642' },
  easy_medium: { label: 'Easy–Med',  bg: '#e8f5ef', color: '#057642' },
  medium:      { label: 'Medium',    bg: '#fff7e6', color: '#b45309' },
  hard:        { label: 'Hard',      bg: '#fdecea', color: '#cc1016' },
  very_hard:   { label: 'Very Hard', bg: '#fdecea', color: '#cc1016' },
}

export function PreBrief({ scenario, character, personaId, openingLine, onConfirm, onBack }) {
  const diff = DIFFICULTY_BADGE[scenario.difficulty] ?? DIFFICULTY_BADGE.medium

  const isBestFit = scenario.bestPersonas.includes(personaId)
  const isToughFit = scenario.toughPersonas.includes(personaId)
  const personaFit = isBestFit
    ? { label: '✓ Strong fit for your persona', bg: '#e8f5ef', color: '#057642' }
    : isToughFit
    ? { label: '⚠ Tough match for your persona', bg: '#fdecea', color: '#cc1016' }
    : { label: '~ Neutral fit for your persona', bg: '#f3f2ef', color: 'rgba(0,0,0,0.55)' }

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
          <div className={styles.charAvatar}>{character.avatar}</div>
          <div>
            <p className={styles.charName}>{character.name}</p>
            <p className={styles.charRole}>{character.role} · {character.company}</p>
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
              <span>›</span>
              <span>{obj}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.actions}>
        <button className={styles.btnBack} onClick={onBack}>← Back</button>
        <button className={styles.btnConfirm} onClick={onConfirm}>Enter Simulation →</button>
      </div>
    </div>
  )
}
