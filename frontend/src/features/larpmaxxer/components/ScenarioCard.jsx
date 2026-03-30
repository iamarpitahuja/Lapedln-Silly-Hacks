import styles from './ScenarioCard.module.css'

const DIFFICULTY_BADGE = {
  easy:        { label: 'Easy',       bg: 'var(--accent-relarp-soft)', color: 'var(--accent-cyan)' },
  easy_medium: { label: 'E-M',        bg: 'var(--accent-relarp-soft)', color: 'var(--accent-cyan)' },
  medium:      { label: 'Medium',     bg: 'var(--accent-glaze-soft)', color: 'var(--accent-amber)' },
  hard:        { label: 'Hard',       bg: 'var(--accent-danger-soft)', color: 'var(--accent-danger)' },
  very_hard:   { label: 'Very Hard',  bg: 'var(--accent-danger-soft)', color: 'var(--accent-danger)' },
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
        <div className={styles.lockHint}>Locked: {unlockRequirement}</div>
      )}
    </button>
  )
}

