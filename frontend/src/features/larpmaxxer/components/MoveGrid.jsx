import styles from './MoveGrid.module.css'

// Corporate-themed flavor → accent color (no Pokemon labels)
const FLAVOR_COLOR = {
  prestige:    '#A8A878',
  ambitious:   '#F08030',
  alpha:       '#C03028',
  calculated:  '#F85888',
  authentic:   '#78C850',
  unhinged:    '#705848',
  cringe_risk: '#A040A0',
  wildcard:    '#F8D030',
  glazed:      '#EE99AC',
}

// Human-readable flavor label
const FLAVOR_LABEL = {
  prestige:    'Prestige',
  ambitious:   'Ambitious',
  alpha:       'Alpha',
  calculated:  'Calculated',
  authentic:   'Authentic',
  unhinged:    'Unhinged',
  cringe_risk: 'Cringe Risk',
  wildcard:    'Wild Card',
  glazed:      'Glazed',
}

export function MoveGrid({ options = [], onSelect, disabled = false, turnCount = 0, maxTurns = 7 }) {
  const ppRemaining = Math.max(0, maxTurns - turnCount)

  if (disabled) {
    return (
      <div className={styles.thinking}>
        <span className={styles.dot} style={{ animationDelay: '0s' }}>●</span>
        <span className={styles.dot} style={{ animationDelay: '0.2s' }}>●</span>
        <span className={styles.dot} style={{ animationDelay: '0.4s' }}>●</span>
      </div>
    )
  }

  return (
    <div className={styles.grid}>
      {options.slice(0, 4).map((option) => {
        const color = FLAVOR_COLOR[option.flavorBadge] ?? '#A8A878'
        const flavorLabel = FLAVOR_LABEL[option.flavorBadge] ?? option.flavorBadge
        return (
          <button
            key={option.id}
            className={styles.move}
            style={{ '--type-color': color }}
            onClick={() => onSelect(option)}
            title={option.text}
          >
            <span className={styles.moveText}>{option.text}</span>
            <div className={styles.moveMeta}>
              <span className={styles.flavorTag} style={{ color, borderColor: `${color}55` }}>
                {flavorLabel}
              </span>
              <span className={styles.pp}>{ppRemaining}/{maxTurns}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
