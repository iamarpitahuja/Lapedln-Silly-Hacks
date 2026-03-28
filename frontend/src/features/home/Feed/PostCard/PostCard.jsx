import { useState } from 'react'
import LarpRatingBadge from '../../../../components/LarpRatingBadge/LarpRatingBadge'
import SuggestedGlazes from '../SuggestedGlazes/SuggestedGlazes'
import Icon from '../../../../components/Icon/Icon'
import { useMockData } from '../../../../context/MockDataContext'
import { getInitials } from '../../../../utils/strings'
import styles from './PostCard.module.css'

const AVATAR_COLORS = ['#0A66C2', '#057642', '#7c3aed', '#b45309', '#be123c', '#0891b2']
const MAX_COMMENT_LENGTH = 280
const MAX_RELARP_LENGTH = 220
const CONTENT_TRUNCATE_LENGTH = 300

function getAvatarColor(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export default function PostCard({ post, isOwnPost = false }) {
  const { author, type, timestamp, content, reactions } = post
  const relarpSource = post.isRelarp ? post.relarpOf : null
  const { currentUser, createComment, createRelarp, undoRelarp, hasUserRelarped } = useMockData()

  const [isGlazing, setIsGlazing] = useState(false)
  const [isGlazed, setIsGlazed] = useState(false)
  const [isLarped, setIsLarped] = useState(false)
  const [isLoved, setIsLoved] = useState(false)
  const [isCommentsOpen, setIsCommentsOpen] = useState(false)
  const [isContentExpanded, setIsContentExpanded] = useState(false)
  const [commentDraft, setCommentDraft] = useState('')
  const [commentError, setCommentError] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [isRelarpComposerOpen, setIsRelarpComposerOpen] = useState(false)
  const [relarpDraft, setRelarpDraft] = useState('')
  const [relarpError, setRelarpError] = useState('')
  const [isSubmittingRelarp, setIsSubmittingRelarp] = useState(false)
  const [isUndoingRelarp, setIsUndoingRelarp] = useState(false)

  const userAlreadyRelarped = hasUserRelarped(post.id)
  const canRelarp = !isOwnPost && !userAlreadyRelarped

  const shouldTruncateContent = content && content.length > CONTENT_TRUNCATE_LENGTH
  const displayContent = shouldTruncateContent && !isContentExpanded
    ? content.slice(0, CONTENT_TRUNCATE_LENGTH).trim() + '...'
    : content

  const handleGlazeClick = () => {
    setIsGlazing(!isGlazing)
  }

  const handleLarpClick = () => setIsLarped(!isLarped)
  const handleLoveClick = () => setIsLoved(!isLoved)
  const handleCommentClick = () => {
    setCommentError('')
    setIsCommentsOpen(isOpen => !isOpen)
  }

  const handleRelarpClick = () => {
    if (isOwnPost || isSubmittingRelarp || isUndoingRelarp) return

    if (userAlreadyRelarped) {
      setIsUndoingRelarp(true)
      const result = undoRelarp({ postId: post.id })

      if (!result.ok) {
        setRelarpError(result.error ?? 'Unable to undo this Re-Larp right now.')
        setIsUndoingRelarp(false)
        return
      }

      setRelarpError('')
      setRelarpDraft('')
      setIsRelarpComposerOpen(false)
      setIsUndoingRelarp(false)
      return
    }

    if (!canRelarp) return
    setRelarpError('')
    setIsRelarpComposerOpen(isOpen => !isOpen)
  }

  const handleSendGlaze = () => {
    if (!isGlazed) setIsGlazed(true)
  }

  const handleCommentSubmit = event => {
    event.preventDefault()
    if (isSubmittingComment) return

    setIsSubmittingComment(true)
    const result = createComment({ postId: post.id, content: commentDraft })

    if (!result.ok) {
      setCommentError(result.error ?? 'Unable to add comment right now.')
      setIsSubmittingComment(false)
      return
    }

    setCommentDraft('')
    setCommentError('')
    setIsCommentsOpen(true)
    setIsSubmittingComment(false)
  }

  const handleRelarpSubmit = event => {
    event.preventDefault()
    if (isSubmittingRelarp) return

    setIsSubmittingRelarp(true)
    const result = createRelarp({ postId: post.id, commentary: relarpDraft })

    if (!result.ok) {
      setRelarpError(result.error ?? 'Unable to Re-Larp right now.')
      setIsSubmittingRelarp(false)
      return
    }

    setRelarpDraft('')
    setRelarpError('')
    setIsRelarpComposerOpen(false)
    setIsSubmittingRelarp(false)
  }

  const handleCommentKeyDown = event => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      handleCommentSubmit(event)
    }
  }

  const handleRelarpKeyDown = event => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      handleRelarpSubmit(event)
    }
  }

  const comments = Array.isArray(post.comments) ? post.comments : []
  const totalCommentCount = reactions.comments || 0
  const hasUnloadedComments = totalCommentCount > comments.length
  const remainingCharacters = MAX_COMMENT_LENGTH - commentDraft.length
  const remainingRelarpCharacters = MAX_RELARP_LENGTH - relarpDraft.length

  const glazeCount = (reactions.insights || reactions.glazes || 0) + (isGlazed ? 1 : 0)
  const larpCount = (reactions.likes || 0) + (isLarped ? 1 : 0)
  const loveCount = (reactions.loves || 0) + (isLoved ? 1 : 0)
  const relarpCount = reactions.relarps || 0

  return (
    <div className={`${styles.card} ${isOwnPost ? styles.cardOwn : ''}`}>
      {relarpSource ? (
        <div className={styles.relarpBanner}>
          <Icon name="repeat" size={14} className={styles.relarpBannerIcon} />
          <p className={styles.relarpBannerText}>
            <strong>{author.name}</strong> Re-Larped <strong>{relarpSource.author.name}</strong>
          </p>
        </div>
      ) : null}

      <div className={styles.header}>
        <div
          className={styles.avatar}
          style={author.avatar ? {} : { background: getAvatarColor(author.name) }}
        >
          {author.avatar ? (
            <img src={author.avatar} alt={author.name} className={styles.avatarImg} />
          ) : (
            getInitials(author.name)
          )}
        </div>
        <div className={styles.meta}>
          <div className={styles.nameRow}>
            <span className={styles.name}>{author.name}</span>
            {isOwnPost ? <span className={styles.youLabel}>· You</span> : null}
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
          {!isOwnPost ? (
            <button className={styles.iconBtn} aria-label="Dismiss">
              <Icon name="x" size={16} />
            </button>
          ) : null}
        </div>
      </div>

      <div className={styles.body}>
        {content ? (
          <div className={styles.contentWrap}>
            <p className={styles.content}>{displayContent}</p>
            {shouldTruncateContent && !isContentExpanded && (
              <button
                className={styles.readMoreBtn}
                onClick={() => setIsContentExpanded(true)}
              >
                ...read more
              </button>
            )}
          </div>
        ) : null}
        {post.photo ? (
          <div className={styles.postPhotoWrap}>
            <img src={post.photo} alt="" className={styles.postPhoto} />
          </div>
        ) : null}

        {relarpSource ? (
          <article className={styles.relarpEmbed}>
            <div className={styles.relarpEmbedHeader}>
              <div
                className={styles.relarpEmbedAvatar}
                style={relarpSource.author.avatar ? {} : { background: getAvatarColor(relarpSource.author.name) }}
              >
                {relarpSource.author.avatar ? (
                  <img src={relarpSource.author.avatar} alt={relarpSource.author.name} className={styles.avatarImg} />
                ) : (
                  getInitials(relarpSource.author.name)
                )}
              </div>
              <div>
                <p className={styles.relarpEmbedAuthor}>{relarpSource.author.name}</p>
                <p className={styles.relarpEmbedHeadline}>{relarpSource.author.headline}</p>
                <p className={styles.relarpEmbedMeta}>
                  {relarpSource.timestamp} • <span>{relarpSource.type}</span>
                </p>
              </div>
            </div>
            <p className={styles.relarpEmbedContent}>{relarpSource.content}</p>
          </article>
        ) : null}
      </div>

      <div className={styles.reactions}>
        <div className={styles.reactionSummary}>
          <button
            className={`${styles.reactionGroup} ${isLarped ? styles.activeReaction : ''}`}
            title="Larps"
            onClick={handleLarpClick}
          >
            <Icon name="thumbsUp" size={14} className={`${styles.reactionIcon} ${styles.iconLike}`} />
            <span className={styles.individualCount}>{larpCount}</span>
          </button>
          <button
            className={`${styles.reactionGroup} ${isLoved ? styles.activeReaction : ''}`}
            title="Loves"
            onClick={handleLoveClick}
          >
            <Icon name="heart" size={14} className={`${styles.reactionIcon} ${styles.iconLove}`} />
            <span className={styles.individualCount}>{loveCount}</span>
          </button>
          <button
            className={`${styles.reactionGroup} ${isGlazed ? styles.activeReaction : ''}`}
            title="Glazes"
            onClick={handleGlazeClick}
          >
            <Icon name="sparkles" size={14} className={`${styles.reactionIcon} ${styles.iconGlaze}`} />
            <span className={styles.individualCount}>{glazeCount}</span>
          </button>
          <span className={styles.reactionStat} title="Re-Larps">
            <Icon name="repeat" size={14} className={`${styles.reactionIcon} ${styles.iconRelarp}`} />
            <span className={styles.individualCount}>{relarpCount}</span>
          </span>
        </div>
        <button
          className={styles.commentSummary}
          onClick={handleCommentClick}
          aria-label="View thread"
        >
          <Icon name="message" size={12} className={styles.commentIcon} />
          <span className={styles.commentCount} aria-hidden="true">{totalCommentCount} comments</span>
        </button>
      </div>

      <div className={styles.actions}>
        {!isOwnPost ? (
          <button
            className={`${styles.action} ${styles.actionGlaze} ${isGlazing ? styles.selected : ''}`}
            onClick={handleGlazeClick}
          >
            <Icon name="sparkles" size={18} /> <span>Glaze</span>
          </button>
        ) : null}
        <button
          className={`${styles.action} ${styles.actionComment}`}
          onClick={handleCommentClick}
          aria-label="Comment"
        >
          <Icon name="message" size={18} /> <span>Comment</span>
        </button>
        <button
          className={`${styles.action} ${styles.actionRelarp} ${
            isRelarpComposerOpen || userAlreadyRelarped ? styles.actionRelarpActive : ''
          }`}
          onClick={handleRelarpClick}
          disabled={isOwnPost || isSubmittingRelarp || isUndoingRelarp}
          aria-label={userAlreadyRelarped ? 'Undo Re-Larp' : 'Re-Larp'}
        >
          <Icon name="repeat" size={18} />
          <span>
            {isUndoingRelarp
              ? 'Undoing...'
              : userAlreadyRelarped
                ? 'Undo Re-Larp'
                : 'Re-Larp'}
          </span>
        </button>
        {!isOwnPost ? (
          <button className={`${styles.action} ${styles.actionDm}`} aria-label="DM">
            <Icon name="mail" size={18} /> <span>DM</span>
          </button>
        ) : null}
      </div>

      {isGlazing && !isOwnPost ? <SuggestedGlazes onGlaze={handleSendGlaze} isGlazed={isGlazed} /> : null}

      <div className={`${styles.expandable} ${isRelarpComposerOpen ? styles.expanded : ''}`}>
        <div className={styles.expandableInner}>
          <form className={styles.relarpComposer} onSubmit={handleRelarpSubmit}>
            <p className={styles.relarpTitle}>Re-Larp this post</p>
            <textarea
              className={styles.relarpInput}
              value={relarpDraft}
              onChange={event => setRelarpDraft(event.target.value)}
              onKeyDown={handleRelarpKeyDown}
              maxLength={MAX_RELARP_LENGTH}
              rows={3}
              placeholder="Add optional context before you Re-Larp..."
            />
            <div className={styles.relarpMeta}>
              <p className={styles.relarpHint}>Ctrl/Cmd + Enter to publish</p>
              <span
                className={`${styles.charCount} ${remainingRelarpCharacters < 30 ? styles.charCountWarn : ''}`}
              >
                {remainingRelarpCharacters}
              </span>
            </div>
            {relarpError ? <p className={styles.relarpError}>{relarpError}</p> : null}
            <div className={styles.relarpActions}>
              <button
                type="button"
                className={styles.relarpCancel}
                onClick={() => {
                  setRelarpDraft('')
                  setRelarpError('')
                  setIsRelarpComposerOpen(false)
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.relarpSubmit}
                disabled={isSubmittingRelarp || isUndoingRelarp}
              >
                {isSubmittingRelarp
                  ? 'Re-Larping...'
                  : relarpDraft.trim()
                    ? 'Publish Re-Larp'
                    : 'Quick Re-Larp'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className={`${styles.expandable} ${isCommentsOpen ? styles.expanded : ''}`}>
        <div className={styles.expandableInner}>
          <div className={styles.commentsSection}>
            <div className={styles.commentsHeader}>
              <h4 className={styles.commentsTitle}>Comments</h4>
              <span className={styles.commentsMeta}>
                {comments.length} shown
                {hasUnloadedComments ? ` • ${totalCommentCount} total` : ''}
              </span>
            </div>

            {comments.length ? (
              <ul className={styles.commentList}>
                {comments.map(comment => (
                  <li key={comment.id} className={styles.commentItem}>
                    <div
                      className={styles.commentAvatar}
                      style={comment.author.avatar ? {} : { background: getAvatarColor(comment.author.name) }}
                    >
                      {comment.author.avatar ? (
                        <img src={comment.author.avatar} alt={comment.author.name} className={styles.avatarImg} />
                      ) : (
                        getInitials(comment.author.name)
                      )}
                    </div>
                    <div className={styles.commentBody}>
                      <div className={styles.commentBubble}>
                        <p className={styles.commentAuthor}>{comment.author.name}</p>
                        <p className={styles.commentContent}>{comment.content}</p>
                      </div>
                      <p className={styles.commentTime}>{comment.timestamp}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.emptyComments}>No comments yet. Be the first to glaze this post.</p>
            )}

            <form className={styles.commentComposer} onSubmit={handleCommentSubmit}>
              <div
                className={styles.commentAvatar}
                style={currentUser.avatar ? {} : { background: getAvatarColor(currentUser.name) }}
              >
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.name} className={styles.avatarImg} />
                ) : (
                  getInitials(currentUser.name)
                )}
              </div>
              <div className={styles.commentComposerBody}>
                <textarea
                  className={styles.commentInput}
                  value={commentDraft}
                  onChange={event => setCommentDraft(event.target.value)}
                  onKeyDown={handleCommentKeyDown}
                  maxLength={MAX_COMMENT_LENGTH}
                  rows={2}
                  placeholder="Add your high-conviction comment..."
                />
                <div className={styles.commentComposerMeta}>
                  <p className={styles.commentHint}>Ctrl/Cmd + Enter to post</p>
                  <span
                    className={`${styles.charCount} ${remainingCharacters < 40 ? styles.charCountWarn : ''}`}
                  >
                    {remainingCharacters}
                  </span>
                </div>
                {commentError ? <p className={styles.commentError}>{commentError}</p> : null}
                <div className={styles.commentComposerActions}>
                  <button
                    type="button"
                    className={styles.commentCancel}
                    onClick={() => {
                      setCommentDraft('')
                      setCommentError('')
                    }}
                  >
                    Clear
                  </button>
                  <button
                    type="submit"
                    className={styles.commentSubmit}
                    disabled={!commentDraft.trim() || isSubmittingComment}
                  >
                    {isSubmittingComment ? 'Posting...' : 'Post comment'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
