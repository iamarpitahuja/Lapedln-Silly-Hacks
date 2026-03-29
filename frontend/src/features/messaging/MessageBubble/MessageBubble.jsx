import styles from './MessageBubble.module.css'

export default function MessageBubble({ message, isMine, showSender = false }) {
  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  const senderName = message.sender?.display_name ?? null

  return (
    <div className={`${styles.wrap} ${isMine ? styles.mine : styles.theirs}`}>
      {showSender && !isMine && senderName && (
        <span className={styles.senderName}>{senderName}</span>
      )}
      <div className={`${styles.bubble} ${isMine ? styles.bubbleMine : styles.bubbleTheirs}`}>
        {message.content}
      </div>
      <span className={styles.time}>{time}</span>
    </div>
  )
}
