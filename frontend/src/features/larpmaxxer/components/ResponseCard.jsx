import styles from './ResponseCard.module.css'

const BADGE_STYLE = {
  prestige:    { bg: 'var(--neon-faint)', color: 'var(--neon)' },
  ambitious:   { bg: 'var(--accent-glaze-soft)', color: 'var(--accent-amber)' },
  unhinged:    { bg: 'var(--accent-danger-soft)', color: 'var(--accent-danger)' },
  calculated:  { bg: 'var(--accent-relarp-soft)', color: 'var(--accent-cyan)' },
  wildcard:    { bg: 'var(--neon-faint)', color: 'var(--accent-violet)' },
  cringe_risk: { bg: 'var(--accent-danger-soft)', color: 'var(--accent-danger)' },
  alpha:       { bg: 'var(--neon-faint)', color: 'var(--neon)' },
  authentic:   { bg: 'var(--accent-relarp-soft)', color: 'var(--accent-cyan)' },
  glazed:      { bg: 'var(--accent-glaze-soft)', color: 'var(--accent-amber)' },
}

export function ResponseCard({ option, onSelect, disabled }) {
  const badgeStyle = BADGE_STYLE[option.flavorBadge] ?? { bg: 'var(--bg-deep)', color: 'var(--text-muted)' }

  return (
    <button className={styles.card} onClick={() => onSelect(option)} disabled={disabled}>
      <div className={styles.top}>
        <span className={styles.text}>{option.text}</span>
        <span className={styles.badge} style={{ backgroundColor: badgeStyle.bg, color: badgeStyle.color }}>
          {option.flavorBadge.replace('_', ' ')}
        </span>
      </div>
    </button>
  )
}

