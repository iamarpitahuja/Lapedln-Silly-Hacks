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
        style={{ color, borderColor: color }}
        title={`LarpRating: ${rating} — ${tier}`}
      >
        {rating}
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
          stroke="#e0e0e0"
          strokeWidth="8"
        />
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={`${progress} ${circumference}`}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div className={styles.gaugeInner}>
        <span className={styles.gaugeValue}>{rating}</span>
        <span className={styles.gaugeTier} style={{ color }}>({tier})</span>
      </div>
    </div>
  )
}
