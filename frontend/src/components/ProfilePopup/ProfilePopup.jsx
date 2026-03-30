import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import LarpRatingBadge from '../LarpRatingBadge/LarpRatingBadge'
import { getInitials } from '../../utils/strings'
import styles from './ProfilePopup.module.css'

const AVATAR_COLORS = ['#0A66C2', '#057642', '#7c3aed', '#b45309', '#be123c', '#0891b2']

function getAvatarColor(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

const POPUP_WIDTH = 280
const POPUP_HEIGHT_EST = 160

export default function ProfilePopup({ author, clickPos, onClose }) {
  const popupRef = useRef(null)
  const navigate = useNavigate()
  const [pos, setPos] = useState({ top: 0, left: 0 })

  // Position near the click, clamped to viewport
  useLayoutEffect(() => {
    if (!clickPos) return
    const vw = window.innerWidth
    const vh = window.innerHeight

    let left = clickPos.x
    let top = clickPos.y + 12

    // If popup would overflow right edge, shift left
    if (left + POPUP_WIDTH > vw - 8) {
      left = vw - POPUP_WIDTH - 8
    }
    // If popup would overflow bottom, show above the click
    if (top + POPUP_HEIGHT_EST > vh - 8) {
      top = clickPos.y - POPUP_HEIGHT_EST - 12
    }
    // Clamp
    left = Math.max(8, left)
    top = Math.max(8, top)

    setPos({ top, left })
  }, [clickPos])

  useEffect(() => {
    function handleClickOutside(e) {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose()
      }
    }
    function handleEscape(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    window.addEventListener('scroll', onClose, true)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
      window.removeEventListener('scroll', onClose, true)
    }
  }, [onClose])

  if (!author) return null

  return createPortal(
    <div
      ref={popupRef}
      className={styles.popup}
      style={{ top: pos.top, left: pos.left }}
    >
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
        <div className={styles.info}>
          <span className={styles.name}>{author.name}</span>
          <span className={styles.headline}>{author.headline}</span>
          <LarpRatingBadge rating={author.larpRating} size="small" />
        </div>
      </div>
      <div className={styles.actions}>
        <button
          className={styles.viewBtn}
          onClick={() => {
            onClose()
            navigate(`/profile/${author.id}`)
          }}
        >
          View Profile
        </button>
        <button
          className={styles.dmBtn}
          onClick={() => {
            onClose()
            navigate(`/messaging?userId=${encodeURIComponent(author.id)}`)
          }}
        >
          Message
        </button>
      </div>
    </div>,
    document.body
  )
}
