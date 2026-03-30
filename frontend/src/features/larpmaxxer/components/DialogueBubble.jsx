import styles from './DialogueBubble.module.css'

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

function initialLabel(name) {
  if (!name) return 'NA'
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function DialogueBubble({ speaker, text, flavorBadge, speakerName }) {
  const isUser = speaker === 'user'
  const badgeStyle = flavorBadge ? BADGE_STYLE[flavorBadge] : null
  const avatarLabel = initialLabel(speakerName ?? (isUser ? 'You' : 'Character'))

  return (
    <div className={`${styles.bubble} ${isUser ? styles.user : ''}`}>
      <div className={styles.avatarWrap}>{avatarLabel}</div>
      <div className={styles.content}>
        <div className={styles.text}>{text}</div>
        {badgeStyle && (
          <span
            className={styles.badge}
            style={{ backgroundColor: badgeStyle.bg, color: badgeStyle.color }}
          >
            {flavorBadge.replace('_', ' ')}
          </span>
        )}
      </div>
    </div>
  )
}

