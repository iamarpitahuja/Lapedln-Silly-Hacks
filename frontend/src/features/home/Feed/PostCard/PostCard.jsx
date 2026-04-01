import { useState } from 'react'
import { AnimatePresence, motion as Motion } from 'framer-motion'
import LarpRatingBadge from '../../../../components/LarpRatingBadge/LarpRatingBadge'
import SuggestedGlazes from '../SuggestedGlazes/SuggestedGlazes'
import ProfilePopup from '../../../../components/ProfilePopup/ProfilePopup'
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
  deletePost as apiDeletePost,
} from '../../../../services/api'
import { useMockData } from '../../../../context/MockDataContext'
import { getInitials } from '../../../../utils/strings'
import styles from './PostCard.module.css'

const AVATAR_COLORS = ['#a78bfa', '#7db5ff', '#5ad7c1', '#b39bff', '#f1c75b', '#f289a8']
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
  const { currentUser, deletePost: contextDeletePost } = useMockData()

  const [popup, setPopup] = useState(null) // { author, x, y }
  const [isDeleting, setIsDeleting] = useState(false)

  const handleAvatarClick = (e, avatarAuthor) => {
    if (!avatarAuthor?.id) return
    e.stopPropagation()
    setPopup({ author: avatarAuthor, x: e.clientX, y: e.clientY })
  }

  const handleDelete = async () => {
    if (isDeleting) return
    setIsDeleting(true)
    const result = await contextDeletePost(post.id)
    if (!result.ok) setIsDeleting(false)
  }

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
  const totalReactionCount = larpCount + loveCount + glazeCount + relarpCount

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
          className={`${styles.avatar} ${styles.avatarClickable}`}
          style={author.avatar ? {} : { background: getAvatarColor(author.name) }}
          onClick={e => handleAvatarClick(e, author)}
          role="button"
          tabIndex={0}
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
          {isOwnPost ? (
            <button
              className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
              aria-label="Delete post"
              onClick={handleDelete}
              disabled={isDeleting}
              title="Delete post"
            >
              <Icon name="trash" size={16} />
            </button>
          ) : (
            <button className={styles.iconBtn} aria-label="Dismiss">
              <Icon name="x" size={16} />
            </button>
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

        {post.roastMemeUrl ? (
          <div className={styles.roastMemeWrap}>
            <p className={styles.roastMemeLabel}>🔥 AI Roast Meme</p>
            <img src={post.roastMemeUrl} alt="Roast meme" className={styles.roastMeme} />
          </div>
        ) : null}

        {relarpSource ? (
          <article className={styles.relarpEmbed}>
            <div className={styles.relarpEmbedHeader}>
              <div
                className={`${styles.relarpEmbedAvatar} ${styles.avatarClickable}`}
                style={relarpSource.author.avatar ? {} : { background: getAvatarColor(relarpSource.author.name) }}
                onClick={e => handleAvatarClick(e, relarpSource.author)}
                role="button"
                tabIndex={0}
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
        <div className={styles.reactionSummary} title="Total reactions">
          <div className={styles.reactionIconCluster} aria-hidden="true">
            <span className={styles.reactionChip} title="Likes">
              <Icon name="thumbsUp" size={12} className={`${styles.reactionIcon} ${styles.iconLike}`} />
            </span>
            <span className={styles.reactionChip} title="Loves">
              <Icon name="heart" size={12} className={`${styles.reactionIcon} ${styles.iconLove}`} />
            </span>
            <span className={styles.reactionChip} title="Glazes">
              <Icon name="sparkles" size={12} className={`${styles.reactionIcon} ${styles.iconGlaze}`} />
            </span>
            <span className={styles.reactionChip} title="Re-Larps">
              <Icon name="repeat" size={12} className={`${styles.reactionIcon} ${styles.iconRelarp}`} />
            </span>
          </div>
          <span className={styles.reactionStat} aria-live="polite">
            <AnimatePresence mode="popLayout" initial={false}>
              <Motion.span
                key={totalReactionCount}
                className={styles.totalReactionCount}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              >
                {totalReactionCount}
              </Motion.span>
            </AnimatePresence>
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
          <Motion.button
            className={`${styles.action} ${styles.actionLike} ${isLarped ? styles.actionLikeActive : ''}`}
            onClick={handleLarpClick}
            disabled={isUpdatingLike}
            aria-label={isLarped ? 'Unlike' : 'Like'}
            whileTap={{ scale: 0.92 }}
            whileHover={{ y: -1 }}
          >
            <Icon name="thumbsUp" size={18} />
            <span>{isLarped ? 'Liked' : 'Like'}{larpCount > 0 ? ` (${larpCount})` : ''}</span>
          </Motion.button>
        ) : null}
        {!blockReactions ? (
          <Motion.button
            className={`${styles.action} ${styles.actionLove} ${isLoved ? styles.actionLoveActive : ''}`}
            onClick={handleLoveClick}
            disabled={isUpdatingLove}
            aria-label={isLoved ? 'Unlove' : 'Love'}
            whileTap={{ scale: 0.92 }}
            whileHover={{ y: -1 }}
          >
            <Icon name="heart" size={18} />
            <span>{isLoved ? 'Loved' : 'Love'}{loveCount > 0 ? ` (${loveCount})` : ''}</span>
          </Motion.button>
        ) : null}
        {!blockReactions ? (
          <Motion.button
            className={`${styles.action} ${styles.actionGlaze} ${isGlazing ? styles.selected : ''}`}
            onClick={handleGlazeClick}
            disabled={isSubmittingGlaze}
            whileTap={{ scale: 0.92 }}
            whileHover={{ y: -1 }}
          >
            <Icon name="sparkles" size={18} /> <span>Glaze{glazeCount > 0 ? ` (${glazeCount})` : ''}</span>
          </Motion.button>
        ) : null}
        <Motion.button
          className={`${styles.action} ${styles.actionComment}`}
          onClick={handleCommentClick}
          aria-label="Comment"
          whileTap={{ scale: 0.92 }}
          whileHover={{ y: -1 }}
        >
          <Icon name="message" size={18} /> <span>Comment{totalCommentCount > 0 ? ` (${totalCommentCount})` : ''}</span>
        </Motion.button>
        <Motion.button
          className={`${styles.action} ${styles.actionRelarp} ${
            isRelarpComposerOpen || userAlreadyRelarped ? styles.actionRelarpActive : ''
          }`}
          onClick={handleRelarpClick}
          disabled={isOwnPost || isSubmittingRelarp || isUndoingRelarp}
          aria-label={userAlreadyRelarped ? 'Undo Re-Larp' : 'Re-Larp'}
          whileTap={{ scale: 0.92 }}
          whileHover={{ y: -1 }}
        >
          <Icon name="repeat" size={18} />
          <span>
            {isUndoingRelarp
              ? 'Undoing...'
              : userAlreadyRelarped
                ? 'Undo Re-Larp'
                : 'Re-Larp'}{relarpCount > 0 ? ` (${relarpCount})` : ''}
          </span>
        </Motion.button>
        {!isOwnPost ? (
          <Motion.button
            className={`${styles.action} ${styles.actionDm}`}
            aria-label="DM"
            onClick={handleDmClick}
            whileTap={{ scale: 0.92 }}
            whileHover={{ y: -1 }}
          >
            <Icon name="mail" size={18} /> <span>DM</span>
          </Motion.button>
        ) : null}
      </div>

      {reactionError ? <p className={styles.relarpError}>{reactionError}</p> : null}

      {isGlazing && !isOwnPost ? <SuggestedGlazes onGlaze={handleSendGlaze} isGlazed={isGlazed} /> : null}

      <div className={`${styles.expandable} ${isRelarpComposerOpen ? styles.expanded : ''}`}>
        <div className={styles.expandableInner}>
          <AnimatePresence>
            {isRelarpComposerOpen && (
              <Motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, delay: 0.1 }}
              >
                <form className={styles.relarpComposer} onSubmit={handleRelarpSubmit}>
                  <p className={styles.relarpTitle}>Re-Larp this post</p>
                  <textarea
                    className={styles.relarpInput}
                    value={relarpDraft}
                    onChange={event => setRelarpDraft(event.target.value)}
                    onKeyDown={handleRelarpKeyDown}
                    maxLength={MAX_RELARP_LENGTH}
                    rows={3}
                    placeholder="Add ur hot take before re-larping this into the timeline..."
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
              </Motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className={`${styles.expandable} ${isCommentsOpen ? styles.expanded : ''}`}>
        <div className={styles.expandableInner}>
          <AnimatePresence>
            {isCommentsOpen && (
              <Motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, delay: 0.1 }}
              >
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
                      <AnimatePresence initial={false}>
                        {comments.map(comment => {
                          const commentAuthor = comment.author ?? {}
                          const authorName = commentAuthor.name ?? 'Anonymous Larper'
                          const authorAvatar = commentAuthor.avatar ?? null
                          const commentTimestamp = comment.timestamp ?? 'Just now'
                          const isOwn = comment.isUserComment
                          const isEditing = editingCommentId === comment.id
                          const isDeleting = isDeletingComment === comment.id
                          return (
                            <Motion.li
                              key={comment.id}
                              className={styles.commentItem}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -8 }}
                              transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                            >
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
                            </Motion.li>
                          )
                        })}
                      </AnimatePresence>
                    </ul>
                  ) : (
                    <p className={styles.emptyComments}>Zero comments. This post is screaming into the void. Be the first glazer.</p>
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
                        placeholder="Drop a take (the more unhinged the better)..."
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
              </Motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {popup ? (
        <ProfilePopup
          author={popup.author}
          clickPos={{ x: popup.x, y: popup.y }}
          onClose={() => setPopup(null)}
        />
      ) : null}
    </div>
  )
}
