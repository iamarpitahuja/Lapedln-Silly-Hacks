import { useState, useCallback } from 'react'
import LarpRatingBadge from '../../../../components/LarpRatingBadge/LarpRatingBadge'
import ProfilePopup from '../../../../components/ProfilePopup/ProfilePopup'
import SuggestedGlazes from '../SuggestedGlazes/SuggestedGlazes'
import Icon from '../../../../components/Icon/Icon'
import {
  createGlaze as apiCreateGlaze,
  createLike as apiCreateLike,
  createLove as apiCreateLove,
  createPostComment,
  editPostComment as apiEditComment,
  deletePostComment as apiDeleteComment,
  createRelarp as apiCreateRelarp,
  removeLike as apiRemoveLike,
  removeLove as apiRemoveLove,
  removeRelarp as apiRemoveRelarp,
  createRelarpLike as apiCreateRelarpLike,
  removeRelarpLike as apiRemoveRelarpLike,
  createRelarpLove as apiCreateRelarpLove,
  removeRelarpLove as apiRemoveRelarpLove,
  createRelarpGlaze as apiCreateRelarpGlaze,
  removeRelarpGlaze as apiRemoveRelarpGlaze,
} from '../../../../services/api'
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
  const { currentUser, deletePost } = useMockData()
  const [isDeleting, setIsDeleting] = useState(false)
  const [popupPos, setPopupPos] = useState(null)

  const handleAuthorClick = useCallback((e) => {
    if (isOwnPost) return
    setPopupPos({ x: e.clientX, y: e.clientY })
  }, [isOwnPost])

  const [isGlazing, setIsGlazing] = useState(false)
  const [isGlazed, setIsGlazed] = useState(Boolean(post.has_user_glazed))
  const [isLarped, setIsLarped] = useState(Boolean(post.has_user_liked))
  const [isLoved, setIsLoved] = useState(Boolean(post.has_user_loved))
  const [isUpdatingLike, setIsUpdatingLike] = useState(false)
  const [isUpdatingLove, setIsUpdatingLove] = useState(false)
  const [isSubmittingGlaze, setIsSubmittingGlaze] = useState(false)
  const [reactionError, setReactionError] = useState('')
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
  const [comments, setComments] = useState(Array.isArray(post.comments) ? post.comments : [])
  const [totalCommentCount, setTotalCommentCount] = useState(
    Number(reactions?.comments ?? (Array.isArray(post.comments) ? post.comments.length : 0))
  )
  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editCommentDraft, setEditCommentDraft] = useState('')
  const [isEditingComment, setIsEditingComment] = useState(false)
  const [isDeletingComment, setIsDeletingComment] = useState(null)
  const [glazeCount, setGlazeCount] = useState(Number(reactions?.glazes ?? reactions?.insights ?? 0))
  const [larpCount, setLarpCount] = useState(Number(reactions?.likes ?? 0))
  const [loveCount, setLoveCount] = useState(Number(reactions?.loves ?? 0))
  const [relarpCount, setRelarpCount] = useState(Number(reactions?.relarps ?? 0))
  const [userAlreadyRelarped, setUserAlreadyRelarped] = useState(Boolean(post.has_user_relarped))
  const canRelarp = !isOwnPost && !userAlreadyRelarped

  const shouldTruncateContent = content && content.length > CONTENT_TRUNCATE_LENGTH
  const displayContent = shouldTruncateContent && !isContentExpanded
    ? content.slice(0, CONTENT_TRUNCATE_LENGTH).trim() + '...'
    : content

  const blockReactions = isOwnPost && !post.isRelarp

  const handleGlazeClick = async () => {
    if (blockReactions || isSubmittingGlaze) return

    if (post.isRelarp) {
      setIsSubmittingGlaze(true)
      setReactionError('')
      try {
        if (isGlazed) {
          await apiRemoveRelarpGlaze(post.id)
          setIsGlazed(false)
          setGlazeCount(prev => Math.max(0, prev - 1))
        } else {
          await apiCreateRelarpGlaze(post.id)
          setIsGlazed(true)
          setGlazeCount(prev => prev + 1)
        }
      } catch {
        setReactionError('Unable to update your reaction right now.')
      } finally {
        setIsSubmittingGlaze(false)
      }
      return
    }

    setIsGlazing(!isGlazing)
  }

  const handleLarpClick = async () => {
    if (blockReactions || isUpdatingLike) return

    setIsUpdatingLike(true)
    setReactionError('')
    const removeFn = post.isRelarp ? apiRemoveRelarpLike : apiRemoveLike
    const createFn = post.isRelarp ? apiCreateRelarpLike : apiCreateLike
    const shouldLike = !isLarped

    setIsLarped(shouldLike)
    setLarpCount(prev => Math.max(0, prev + (shouldLike ? 1 : -1)))

    try {
      if (shouldLike) {
        await createFn(post.id)
      } else {
        await removeFn(post.id)
      }
    } catch {
      setIsLarped(!shouldLike)
      setLarpCount(prev => Math.max(0, prev + (shouldLike ? -1 : 1)))
      setReactionError('Unable to update your reaction right now.')
    } finally {
      setIsUpdatingLike(false)
    }
  }

  const handleLoveClick = async () => {
    if (blockReactions || isUpdatingLove) return

    setIsUpdatingLove(true)
    setReactionError('')
    const removeFn = post.isRelarp ? apiRemoveRelarpLove : apiRemoveLove
    const createFn = post.isRelarp ? apiCreateRelarpLove : apiCreateLove
    const shouldLove = !isLoved

    setIsLoved(shouldLove)
    setLoveCount(prev => Math.max(0, prev + (shouldLove ? 1 : -1)))

    try {
      if (shouldLove) {
        await createFn(post.id)
      } else {
        await removeFn(post.id)
      }
    } catch {
      setIsLoved(!shouldLove)
      setLoveCount(prev => Math.max(0, prev + (shouldLove ? -1 : 1)))
      setReactionError('Unable to update your reaction right now.')
    } finally {
      setIsUpdatingLove(false)
    }
  }

  const handleCommentClick = () => {
    setCommentError('')
    setIsCommentsOpen(isOpen => !isOpen)
  }

  const handleRelarpClick = async () => {
    if (isOwnPost || isSubmittingRelarp || isUndoingRelarp) return

    if (userAlreadyRelarped) {
      setIsUndoingRelarp(true)
      try {
        await apiRemoveRelarp(post.id)
        setUserAlreadyRelarped(false)
        setRelarpCount(prev => Math.max(0, prev - 1))
        setRelarpError('')
        setRelarpDraft('')
        setIsRelarpComposerOpen(false)
        window.dispatchEvent(new Event('feed:refresh'))
      } catch {
        setRelarpError('Unable to undo this Re-Larp right now.')
        setIsUndoingRelarp(false)
        return
      }
      setIsUndoingRelarp(false)
      return
    }

    if (!canRelarp) return
    setRelarpError('')
    setIsRelarpComposerOpen(isOpen => !isOpen)
  }

  const handleSendGlaze = async glazeContent => {
    if (isGlazed || isSubmittingGlaze || blockReactions) return

    setIsSubmittingGlaze(true)
    setReactionError('')
    try {
      await apiCreateGlaze(post.id, glazeContent)
      setIsGlazed(true)
      setGlazeCount(prev => prev + 1)
      setIsGlazing(false)
    } catch {
      setReactionError('Unable to send glaze right now.')
    } finally {
      setIsSubmittingGlaze(false)
    }
  }

  const handleDmClick = () => {
    if (typeof window !== 'undefined') {
      const destination = author?.id
        ? `/messaging?userId=${encodeURIComponent(author.id)}`
        : '/messaging'
      window.location.assign(destination)
    }
  }

  const handleCommentSubmit = async event => {
    event.preventDefault()
    if (isSubmittingComment) return
    const trimmed = commentDraft.trim()
    if (!trimmed) return

    setIsSubmittingComment(true)
    try {
      const created = await createPostComment(post.id, trimmed)
      setComments(prev => [created, ...prev])
      setTotalCommentCount(prev => prev + 1)
      setCommentDraft('')
      setCommentError('')
      setIsCommentsOpen(true)
      setIsSubmittingComment(false)
      return
    } catch {
      setCommentError('Unable to add comment right now.')
      setIsSubmittingComment(false)
      return
    }
  }

  const handleEditCommentStart = (comment) => {
    setEditingCommentId(comment.id)
    setEditCommentDraft(comment.content)
    setCommentError('')
  }

  const handleEditCommentCancel = () => {
    setEditingCommentId(null)
    setEditCommentDraft('')
  }

  const handleEditCommentSave = async (commentId) => {
    const trimmed = editCommentDraft.trim()
    if (!trimmed) return
    setIsEditingComment(true)
    try {
      const updated = await apiEditComment(post.id, commentId, trimmed)
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, content: updated.content } : c))
      setEditingCommentId(null)
      setEditCommentDraft('')
      setCommentError('')
    } catch {
      setCommentError('Unable to edit comment right now.')
    } finally {
      setIsEditingComment(false)
    }
  }

  const handleDeleteComment = async (commentId) => {
    setIsDeletingComment(commentId)
    try {
      await apiDeleteComment(post.id, commentId)
      setComments(prev => prev.filter(c => c.id !== commentId))
      setTotalCommentCount(prev => Math.max(0, prev - 1))
      setCommentError('')
    } catch {
      setCommentError('Unable to delete comment right now.')
    } finally {
      setIsDeletingComment(null)
    }
  }

  const handleEditCommentKeyDown = (event, commentId) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      handleEditCommentSave(commentId)
    }
    if (event.key === 'Escape') {
      handleEditCommentCancel()
    }
  }

  const handleRelarpSubmit = async event => {
    event.preventDefault()
    if (isSubmittingRelarp) return

    setIsSubmittingRelarp(true)
    try {
      await apiCreateRelarp(post.id, relarpDraft)
      setUserAlreadyRelarped(true)
      setRelarpCount(prev => prev + 1)
      setRelarpDraft('')
      setRelarpError('')
      setIsRelarpComposerOpen(false)
      setIsSubmittingRelarp(false)
      window.dispatchEvent(new Event('feed:refresh'))
      return
    } catch {
      setRelarpError('Unable to Re-Larp right now.')
      setIsSubmittingRelarp(false)
      return
    }
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

  const hasUnloadedComments = totalCommentCount > comments.length
  const remainingCharacters = MAX_COMMENT_LENGTH - commentDraft.length
  const remainingRelarpCharacters = MAX_RELARP_LENGTH - relarpDraft.length

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
          className={`${styles.avatar} ${!isOwnPost ? styles.clickable : ''}`}
          style={author.avatar ? {} : { background: getAvatarColor(author.name) }}
          onClick={handleAuthorClick}
        >
          {author.avatar ? (
            <img src={author.avatar} alt={author.name} className={styles.avatarImg} />
          ) : (
            getInitials(author.name)
          )}
        </div>
        <div className={styles.meta}>
          <div className={styles.nameRow}>
            <span
              className={`${styles.name} ${!isOwnPost ? styles.clickable : ''}`}
              onClick={handleAuthorClick}
            >
              {author.name}
            </span>
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
          {isOwnPost ? (
            <button
              className={styles.iconBtn}
              aria-label="Delete post"
              disabled={isDeleting}
              onClick={async () => {
                if (!confirm('Delete this post and all its comments, reactions, and relarps?')) return
                setIsDeleting(true)
                await deletePost(post.id)
                window.dispatchEvent(new Event('feed:refresh'))
              }}
            >
              <Icon name="x" size={16} />
            </button>
          ) : (
            <>
              <button className={styles.iconBtn} aria-label="More options">
                <Icon name="more" size={16} />
              </button>
              <button className={styles.iconBtn} aria-label="Dismiss">
                <Icon name="x" size={16} />
              </button>
            </>
          )}
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
            title="Likes"
            onClick={handleLarpClick}
            disabled={isUpdatingLike}
          >
            <Icon name="thumbsUp" size={14} className={`${styles.reactionIcon} ${styles.iconLike}`} />
            <span className={styles.individualCount}>{larpCount}</span>
          </button>
          <button
            className={`${styles.reactionGroup} ${isLoved ? styles.activeReaction : ''}`}
            title="Loves"
            onClick={handleLoveClick}
            disabled={isUpdatingLove}
          >
            <Icon name="heart" size={14} className={`${styles.reactionIcon} ${styles.iconLove}`} />
            <span className={styles.individualCount}>{loveCount}</span>
          </button>
          <button
            className={`${styles.reactionGroup} ${isGlazed ? styles.activeReaction : ''}`}
            title="Glazes"
            onClick={handleGlazeClick}
            disabled={isSubmittingGlaze}
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
          <span className={styles.commentCount} aria-hidden="true">{totalCommentCount} comment{totalCommentCount === 1 ? '' : 's'}</span>
        </button>
      </div>

      <div className={styles.actions}>
        {!blockReactions ? (
          <button
            className={`${styles.action} ${styles.actionLike} ${isLarped ? styles.actionLikeActive : ''}`}
            onClick={handleLarpClick}
            disabled={isUpdatingLike}
            aria-label={isLarped ? 'Unlike' : 'Like'}
          >
            <Icon name="thumbsUp" size={18} />
            <span>{isLarped ? 'Liked' : 'Like'}</span>
          </button>
        ) : null}
        {!blockReactions ? (
          <button
            className={`${styles.action} ${styles.actionLove} ${isLoved ? styles.actionLoveActive : ''}`}
            onClick={handleLoveClick}
            disabled={isUpdatingLove}
            aria-label={isLoved ? 'Unlove' : 'Love'}
          >
            <Icon name="heart" size={18} />
            <span>{isLoved ? 'Loved' : 'Love'}</span>
          </button>
        ) : null}
        {!blockReactions ? (
          <button
            className={`${styles.action} ${styles.actionGlaze} ${isGlazing ? styles.selected : ''}`}
            onClick={handleGlazeClick}
            disabled={isSubmittingGlaze}
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
          <button className={`${styles.action} ${styles.actionDm}`} aria-label="DM" onClick={handleDmClick}>
            <Icon name="mail" size={18} /> <span>DM</span>
          </button>
        ) : null}
      </div>

      {reactionError ? <p className={styles.relarpError}>{reactionError}</p> : null}

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
                {comments.map(comment => {
                  const commentAuthor = comment.author ?? {}
                  const authorName = commentAuthor.name ?? 'Anonymous Larper'
                  const authorAvatar = commentAuthor.avatar ?? null
                  const commentTimestamp = comment.timestamp ?? 'Just now'
                  const isOwn = comment.isUserComment
                  const isEditing = editingCommentId === comment.id
                  const isDeleting = isDeletingComment === comment.id
                  return (
                    <li key={comment.id} className={styles.commentItem}>
                      <div
                        className={styles.commentAvatar}
                        style={authorAvatar ? {} : { background: getAvatarColor(authorName) }}
                      >
                        {authorAvatar ? (
                          <img src={authorAvatar} alt={authorName} className={styles.avatarImg} />
                        ) : (
                          getInitials(authorName)
                        )}
                      </div>
                      <div className={styles.commentBody}>
                        {isEditing ? (
                          <div className={styles.commentEditWrap}>
                            <textarea
                              className={styles.commentEditInput}
                              value={editCommentDraft}
                              onChange={e => setEditCommentDraft(e.target.value)}
                              onKeyDown={e => handleEditCommentKeyDown(e, comment.id)}
                              maxLength={MAX_COMMENT_LENGTH}
                              rows={2}
                              autoFocus
                            />
                            <div className={styles.commentEditActions}>
                              <button
                                type="button"
                                className={styles.commentEditCancel}
                                onClick={handleEditCommentCancel}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                className={styles.commentEditSave}
                                onClick={() => handleEditCommentSave(comment.id)}
                                disabled={isEditingComment || !editCommentDraft.trim()}
                              >
                                {isEditingComment ? 'Saving...' : 'Save'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className={styles.commentBubble}>
                              <p className={styles.commentAuthor}>{authorName}</p>
                              <p className={styles.commentContent}>{comment.content}</p>
                            </div>
                            <div className={styles.commentFooter}>
                              <p className={styles.commentTime}>{commentTimestamp}</p>
                              {isOwn ? (
                                <div className={styles.commentOwnActions}>
                                  <button
                                    className={styles.commentActionBtn}
                                    onClick={() => handleEditCommentStart(comment)}
                                    aria-label="Edit comment"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    className={`${styles.commentActionBtn} ${styles.commentDeleteBtn}`}
                                    onClick={() => handleDeleteComment(comment.id)}
                                    disabled={isDeleting}
                                    aria-label="Delete comment"
                                  >
                                    {isDeleting ? 'Deleting...' : 'Delete'}
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          </>
                        )}
                      </div>
                    </li>
                  )
                })}
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
      {popupPos && !isOwnPost ? (
        <ProfilePopup
          author={author}
          clickPos={popupPos}
          onClose={() => setPopupPos(null)}
        />
      ) : null}
    </div>
  )
}
