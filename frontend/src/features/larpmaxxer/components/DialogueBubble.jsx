import styles from './DialogueBubble.module.css'

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

export function DialogueBubble({ speaker, text, flavorBadge, avatar }) {
  const isUser = speaker === 'user'
  const badgeStyle = flavorBadge ? BADGE_STYLE[flavorBadge] : null

  return (
    <div className={`${styles.bubble} ${isUser ? styles.user : ''}`}>
      <div className={styles.avatarWrap}>
        {avatar ?? (isUser ? '🧑' : '🤝')}
      </div>
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
