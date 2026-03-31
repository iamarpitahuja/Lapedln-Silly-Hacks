import styles from './EventCard.module.css'

export function EventCard({ data, larpRatingDelta, onContinue }) {
  const isBreakthrough = data.type === 'breakthrough'
  const typeBg = isBreakthrough ? 'var(--accent-relarp-soft)' : 'var(--accent-danger-soft)'
  const typeColor = isBreakthrough ? 'var(--accent-cyan)' : 'var(--accent-danger)'
  const typeLabel = isBreakthrough ? 'Breakthrough' : 'Exposed'

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <span className={styles.type} style={{ backgroundColor: typeBg, color: typeColor }}>
          {typeLabel}
        </span>
        <p className={styles.characterLine}>"{data.characterLine}"</p>
        <div
          className={styles.larpDelta}
          style={{ color: larpRatingDelta >= 0 ? 'var(--accent-cyan)' : 'var(--accent-danger)' }}
        >
          {larpRatingDelta > 0 ? '+' : ''}{larpRatingDelta.toFixed(1)} LR
        </div>
        <p className={styles.progress}>Turn {data.endTurn} of {data.maxTurns}</p>
        <button className={styles.continueBtn} onClick={onContinue}>Continue</button>
      </div>
    </div>
  )
}

