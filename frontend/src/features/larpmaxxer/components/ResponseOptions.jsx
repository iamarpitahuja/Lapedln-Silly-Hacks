import { ResponseCard } from './ResponseCard'
import styles from './ResponseOptions.module.css'

export function ResponseOptions({ options, onSelect, isTyping }) {
  if (isTyping) {
    return (
      <div className={styles.wrap}>
        <div className={styles.typing}>
          <span>...</span>
          <span>Thinking...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.title}>Your Response</p>
      <div className={styles.options}>
        {options.map(option => (
          <ResponseCard key={option.id} option={option} onSelect={onSelect} disabled={false} />
        ))}
      </div>
    </div>
  )
}
