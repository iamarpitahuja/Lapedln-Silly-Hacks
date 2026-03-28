import LarpRatingBadge from '../../../../components/LarpRatingBadge/LarpRatingBadge'
import SuggestedGlazes from '../SuggestedGlazes/SuggestedGlazes'
import styles from './PostCard.module.css'

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

const AVATAR_COLORS = ['#0A66C2', '#057642', '#7c3aed', '#b45309', '#be123c', '#0891b2']

function getAvatarColor(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export default function PostCard({ post }) {
  const { author, type, timestamp, content, reactions } = post

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.header}>
        <div
          className={styles.avatar}
          style={{ background: getAvatarColor(author.name) }}
        >
          {getInitials(author.name)}
        </div>
        <div className={styles.meta}>
          <div className={styles.nameRow}>
            <span className={styles.name}>{author.name}</span>
            <LarpRatingBadge rating={author.larpRating} size="small" />
          </div>
          <p className={styles.headline}>{author.headline}</p>
          <p className={styles.timestamp}>
            {timestamp} •{' '}
            <span className={styles.postType}>{type}</span>
          </p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.iconBtn}>···</button>
          <button className={styles.iconBtn}>✕</button>
        </div>
      </div>

      {/* Body */}
      <div className={styles.body}>
        <p className={styles.content}>{content}</p>
      </div>

      {/* Reactions */}
      <div className={styles.reactions}>
        <span className={styles.reactionEmojis}>👍❤️🔥</span>
        <span className={styles.reactionCount}>
          {reactions.count} • {reactions.comments} comments
        </span>
      </div>

      {/* Action bar */}
      <div className={styles.actions}>
        <button className={styles.action}>
          <span>👍</span> Glaze
        </button>
        <button className={styles.action}>
          <span>💬</span> Comment
        </button>
        <button className={styles.action}>
          <span>🔁</span> Re-Larp
        </button>
        <button className={styles.action}>
          <span>✉️</span> DM
        </button>
      </div>

      {/* Suggested glazes */}
      <SuggestedGlazes />
    </div>
  )
}
