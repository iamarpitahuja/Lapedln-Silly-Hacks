import { motion as Motion } from 'framer-motion'
import { springSnap } from '../../../lib/motion'
import styles from './MessageBubble.module.css'

function parseMessageTimestamp(value) {
  if (!value) return null

  // Backend currently serializes UTC datetimes without a timezone suffix.
  // Treat naive ISO strings as UTC so they render correctly in local time.
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value) && !/[zZ]|[+\-]\d{2}:\d{2}$/.test(value)) {
    return new Date(`${value}Z`)
  }

  return new Date(value)
}

export default function MessageBubble({ message, isMine, showSender = false }) {
  const parsedTime = parseMessageTimestamp(message.created_at)
  const time = Number.isNaN(parsedTime?.getTime())
    ? ''
    : parsedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const senderName = message.sender?.display_name ?? null

  return (
    <Motion.div
      className={`${styles.wrap} ${isMine ? styles.mine : styles.theirs}`}
      initial={{ opacity: 0, scale: 0.85, y: 8, x: isMine ? 12 : -12 }}
      animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
      transition={springSnap}
    >
      {showSender && !isMine && senderName && (
        <span className={styles.senderName}>{senderName}</span>
      )}
      <div className={`${styles.bubble} ${isMine ? styles.bubbleMine : styles.bubbleTheirs}`}>
        {message.content}
      </div>
      <span className={styles.time}>{time}</span>
    </Motion.div>
  )
}

