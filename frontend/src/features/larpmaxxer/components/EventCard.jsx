import styles from './EventCard.module.css'

export function EventCard({ data, larpRatingDelta, onContinue }) {
  const isBreakthrough = data.type === 'breakthrough'
  const typeBg = isBreakthrough ? '#e8f5ef' : '#fdecea'
  const typeColor = isBreakthrough ? '#057642' : '#cc1016'
  const typeLabel = isBreakthrough ? '🎯 Breakthrough' : '💀 Exposed'
  const icon = isBreakthrough ? '🎯' : '💀'

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.icon}>{icon}</div>
        <span className={styles.type} style={{ backgroundColor: typeBg, color: typeColor }}>
          {typeLabel}
        </span>
        <p className={styles.characterLine}>"{data.characterLine}"</p>
        <div
          className={styles.larpDelta}
          style={{ color: larpRatingDelta >= 0 ? '#057642' : '#cc1016' }}
        >
          {larpRatingDelta > 0 ? '+' : ''}{larpRatingDelta.toFixed(1)} LR
        </div>
        <p className={styles.progress}>Turn {data.endTurn} of {data.maxTurns}</p>
        <button className={styles.continueBtn} onClick={onContinue}>Continue →</button>
      </div>
    </div>
  )
}
