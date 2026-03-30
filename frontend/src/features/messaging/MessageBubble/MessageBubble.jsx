import { motion as Motion } from 'framer-motion'
import { springSnap } from '../../../lib/motion'
import styles from './MessageBubble.module.css'

export default function MessageBubble({ message, isMine, showSender = false }) {
  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

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

