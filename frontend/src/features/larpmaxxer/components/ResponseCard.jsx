import styles from './ResponseCard.module.css'

const BADGE_STYLE = {
  prestige:    { bg: '#eef3f8', color: '#0a66c2' },
  ambitious:   { bg: '#fff7e6', color: '#b45309' },
  unhinged:    { bg: '#fdecea', color: '#cc1016' },
  calculated:  { bg: '#e8f5ef', color: '#057642' },
  wildcard:    { bg: '#f3e8ff', color: '#7c3aed' },
  cringe_risk: { bg: '#fdecea', color: '#cc1016' },
  alpha:       { bg: '#eef3f8', color: '#0a66c2' },
  authentic:   { bg: '#e8f5ef', color: '#057642' },
  glazed:      { bg: '#fff7e6', color: '#b45309' },
}

export function ResponseCard({ option, onSelect, disabled }) {
  const badgeStyle = BADGE_STYLE[option.flavorBadge] ?? { bg: '#f3f2ef', color: 'rgba(0,0,0,0.5)' }

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
