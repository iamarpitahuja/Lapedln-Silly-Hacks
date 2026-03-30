import styles from './LarpRatingBadge.module.css'

function getTier(rating) {
  if (rating >= 95) return 'NPC evolved'
  if (rating >= 85) return 'Mythic'
  if (rating >= 70) return 'chronically online'
  if (rating >= 50) return 'Larp Ascended'
  return 'local NPC'
}

function getTierColor(rating) {
  if (rating >= 95) return '#a78bfa'
  if (rating >= 85) return '#7db5ff'
  if (rating >= 70) return '#5ad7c1'
  if (rating >= 50) return '#b39bff'
  return '#f289a8'
}

export default function LarpRatingBadge({ rating, size = 'large' }) {
  const tier = getTier(rating)
  const color = getTierColor(rating)

  if (size === 'small') {
    return (
      <span
        className={styles.small}
        style={{
          color,
          borderColor: color,
          background: `${color}22`,
          '--tier-color': color,
        }}
        title={`LarpRating: ${rating} — ${tier}`}
      >
        <span className={styles.smallValue}>{rating}</span>
        <span className={styles.smallTier}>{tier}</span>
      </span>
    )
  }

  // Large circular gauge
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const progress = (rating / 100) * circumference

  return (
    <div className={styles.gauge}>
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke="rgba(167, 139, 250, 0.18)"
          strokeWidth="10"
        />
        <circle
          className={styles.gaugeCircle}
          cx="50" cy="50" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={`${progress} ${circumference}`}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{ filter: `drop-shadow(0 0 5px ${color}66)` }}
        />
      </svg>
      <div className={styles.gaugeInner}>
        <span className={styles.gaugeValue} style={{ textShadow: `0 1px 4px ${color}55` }}>{rating}</span>
        <span className={styles.gaugeTier} style={{ color }}>({tier})</span>
      </div>
    </div>
  )
}
