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

  return (
    <div className={styles.badge} style={{ '--tier-color': color, borderColor: `${color}55`, background: `${color}11` }}>
      <span className={styles.badgeLabel}>LARP RATING</span>
      <span className={styles.badgeValue} style={{ color, textShadow: `0 0 12px ${color}88` }}>{rating}</span>
      <span className={styles.badgeTier} style={{ color }}>{tier}</span>
    </div>
  )
}
