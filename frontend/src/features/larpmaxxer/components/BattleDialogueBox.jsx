import { useState, useEffect, useRef } from 'react'
import styles from './BattleDialogueBox.module.css'

const TYPEWRITER_SPEED = 20 // ms per character

export function BattleDialogueBox({ text, speakerName, isTyping, log = [] }) {
  // Typewriter state for the latest character line
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  const prevText = useRef('')
  const intervalRef = useRef(null)
  const scrollRef = useRef(null)

  // Typewriter effect on current character line
  useEffect(() => {
    if (isTyping) {
      setDisplayed('')
      setDone(false)
      return
    }

    if (!text || text === prevText.current) return
    prevText.current = text

    if (intervalRef.current) clearInterval(intervalRef.current)
    setDisplayed('')
    setDone(false)

    let i = 0
    intervalRef.current = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(intervalRef.current)
        setDone(true)
      }
    }, TYPEWRITER_SPEED)

    return () => clearInterval(intervalRef.current)
  }, [text, isTyping])

  // Auto-scroll to bottom when log grows or typewriter updates
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [log, displayed, isTyping])

  // All committed log entries shown as-is
  // The NPC's live line (text prop) is shown as an extra entry when it's not yet in the log
  const latestLogEntry = log[log.length - 1] ?? null
  // Show a live NPC line when text differs from the last committed log entry
  const showLiveLine = !isTyping && text && text !== latestLogEntry?.text

  return (
    <div className={styles.box}>
      <div className={styles.scrollArea} ref={scrollRef}>
        {/* Full committed conversation history */}
        {log.map((entry, i) => (
          <div
            key={i}
            className={`${styles.entry} ${entry.speaker === 'user' ? styles.userEntry : styles.charEntry}`}
          >
            <span className={styles.entryLabel}>
              {entry.speaker === 'user' ? 'YOU' : speakerName}:
            </span>
            <span className={styles.entryText}>{entry.text}</span>
          </div>
        ))}

        {/* Thinking dots while NPC is generating */}
        {isTyping && (
          <div className={`${styles.entry} ${styles.charEntry}`}>
            <span className={styles.entryLabel}>{speakerName}:</span>
            <span className={styles.dots}>
              <span className={styles.dot} style={{ animationDelay: '0s' }}>●</span>
              <span className={styles.dot} style={{ animationDelay: '0.25s' }}>●</span>
              <span className={styles.dot} style={{ animationDelay: '0.5s' }}>●</span>
            </span>
          </div>
        )}

        {/* Live NPC line — typewriter until committed to log */}
        {showLiveLine && (
          <div className={`${styles.entry} ${styles.charEntry}`}>
            <span className={styles.entryLabel}>{speakerName}:</span>
            <span className={styles.entryText}>
              {displayed}
              {done && <span className={styles.cursor}>▼</span>}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
