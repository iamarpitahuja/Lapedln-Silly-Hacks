import styles from './ScenarioCard.module.css'

const DIFFICULTY_BADGE = {
  easy:        { label: 'Easy',       bg: '#e8f5ef', color: '#057642' },
  easy_medium: { label: 'E–M',        bg: '#e8f5ef', color: '#057642' },
  medium:      { label: 'Medium',     bg: '#fff7e6', color: '#b45309' },
  hard:        { label: 'Hard',       bg: '#fdecea', color: '#cc1016' },
  very_hard:   { label: 'Very Hard',  bg: '#fdecea', color: '#cc1016' },
}

export function ScenarioCard({ scenario, isUnlocked, isActive, bestScore, unlockRequirement, onSelect }) {
  const diff = DIFFICULTY_BADGE[scenario.difficulty] ?? DIFFICULTY_BADGE.medium
  const cls = [styles.card, isActive && styles.active, !isUnlocked && styles.locked]
    .filter(Boolean).join(' ')

  return (
    <button className={cls} onClick={isUnlocked ? onSelect : undefined} disabled={!isUnlocked}>
      <div className={styles.top}>
        <span className={styles.name}>{scenario.name}</span>
        <span
          className={styles.badge}
          style={{ backgroundColor: diff.bg, color: diff.color }}
        >
          {diff.label}
        </span>
      </div>
      <div className={styles.meta}>{scenario.setting}</div>
      {bestScore != null && (
        <div className={styles.score}>Best: {Math.round(bestScore)}%</div>
      )}
      {!isUnlocked && unlockRequirement && (
        <div className={styles.lockHint}>🔒 {unlockRequirement}</div>
      )}
    </button>
  )
}
