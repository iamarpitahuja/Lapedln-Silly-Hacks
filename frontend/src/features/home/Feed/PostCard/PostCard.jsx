import LarpRatingBadge from '../../../../components/LarpRatingBadge/LarpRatingBadge'
import SuggestedGlazes from '../SuggestedGlazes/SuggestedGlazes'
import Icon from '../../../../components/Icon/Icon'
import { getInitials } from '../../../../utils/strings'
import styles from './PostCard.module.css'

const AVATAR_COLORS = ['#0A66C2', '#057642', '#7c3aed', '#b45309', '#be123c', '#0891b2']

function getAvatarColor(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export default function PostCard({ post, isOwnPost = false }) {
  const { author, type, timestamp, content, reactions } = post

  return (
    <div className={`${styles.card} ${isOwnPost ? styles.cardOwn : ''}`}>
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
            {isOwnPost && <span className={styles.youLabel}>· You</span>}
            <LarpRatingBadge rating={author.larpRating} size="small" />
          </div>
          <p className={styles.headline}>{author.headline}</p>
          <p className={styles.timestamp}>
            {timestamp} •{' '}
            <span className={styles.postType}>{type}</span>
          </p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.iconBtn} aria-label="More options">
            <Icon name="more" size={16} />
          </button>
          {!isOwnPost && (
            <button className={styles.iconBtn} aria-label="Dismiss">
              <Icon name="x" size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className={styles.body}>
        <p className={styles.content}>{content}</p>
      </div>

      {/* Reactions */}
      <div className={styles.reactions}>
        <span className={styles.reactionEmojis}>
          <Icon name="thumbsUp" size={12} className={styles.reactionIcon} />
          <Icon name="heart" size={12} className={styles.reactionIcon} />
          <Icon name="flame" size={12} className={styles.reactionIcon} />
        </span>
        <span className={styles.reactionCount}>
          {reactions.count} • {reactions.comments} comments
        </span>
      </div>

      {/* Action bar */}
      <div className={styles.actions}>
        {!isOwnPost && (
          <button className={`${styles.action} ${styles.actionGlaze}`}>
            <Icon name="sparkles" size={18} /> <span>Glaze</span>
          </button>
        )}
        <button className={`${styles.action} ${styles.actionComment}`}>
          <Icon name="message" size={18} /> <span>Comment</span>
        </button>
        <button className={`${styles.action} ${styles.actionRelarp}`}>
          <Icon name="repeat" size={18} /> <span>Re-Larp</span>
        </button>
        <button className={`${styles.action} ${styles.actionDm}`}>
          <Icon name="mail" size={18} /> <span>DM</span>
        </button>
      </div>

      {/* Suggested glazes */}
      <SuggestedGlazes />
    </div>
  )
}
