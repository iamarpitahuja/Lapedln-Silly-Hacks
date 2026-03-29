import styles from './LarpRatingBadge.module.css'

function getTier(rating) {
  if (rating >= 95) return 'Post-human'
  if (rating >= 85) return 'Mythic'
  if (rating >= 70) return 'Terminally employable'
  if (rating >= 50) return 'Aspirational'
  return 'Regional'
}

function getTierColor(rating) {
  if (rating >= 95) return '#ff6b00'
  if (rating >= 85) return '#7c3aed'
  if (rating >= 70) return '#0A66C2'
  if (rating >= 50) return '#057642'
  return '#666'
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
          background: `${color}14`,
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
          stroke="#e8e8e8"
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
