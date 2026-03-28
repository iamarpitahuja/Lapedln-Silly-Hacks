import styles from './MessageBubble.module.css'

export default function MessageBubble({ message, isMine }) {
  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className={`${styles.wrap} ${isMine ? styles.mine : styles.theirs}`}>
      <div className={`${styles.bubble} ${isMine ? styles.bubbleMine : styles.bubbleTheirs}`}>
        {message.content}
      </div>
      <span className={styles.time}>{time}</span>
    </div>
  )
}
