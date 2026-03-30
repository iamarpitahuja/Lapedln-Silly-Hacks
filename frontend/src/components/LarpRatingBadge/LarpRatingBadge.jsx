import styles from './LarpRatingBadge.module.css'

function getTier(rating) {
  if (rating >= 95) return 'Post-human'
  if (rating >= 85) return 'Mythic'
  if (rating >= 70) return 'Terminally employable'
  if (rating >= 50) return 'Aspirational'
  return 'Regional'
}

function getTierColor(rating) {
  if (rating >= 95) return '#a78bfa'
  if (rating >= 85) return '#7db5ff'
  if (rating >= 70) return '#5ad7c1'
  if (rating >= 50) return '#b39bff'
  return '#f289a8'
}

function formatRating(rating) {
  const n = Number(rating) || 0
  return Number.isInteger(n) ? n : n.toFixed(1)
}

export default function LarpRatingBadge({ rating, size = 'large' }) {
  const tier = getTier(rating)
  const color = getTierColor(rating)

  if (size === 'small') {
    return (
      <span
        className={styles.small}
        style={{ color }}
        title={`LarpRating: ${rating} — ${tier}`}
      >
        <span className={styles.smallValue}>{formatRating(rating)}</span>
        <span className={styles.smallDivider}>·</span>
        <span className={styles.smallTier}>{tier}</span>
      </span>
    )
  }

  // Large display — unbounded number, no fake progress ring
  return (
    <div className={styles.gauge}>
      <div
        className={styles.gaugeBadge}
        style={{
          borderColor: `${color}55`,
          boxShadow: `0 0 24px ${color}33, inset 0 0 32px ${color}0d`,
        }}
      >
        <span
          className={styles.gaugeValue}
          style={{ color, textShadow: `0 0 14px ${color}88` }}
        >
          {formatRating(rating)}
        </span>
      </div>
      <span className={styles.gaugeTier} style={{ color }}>{tier}</span>
    </div>
  )
}
