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

  // Build the list of past log entries (everything except the last character line,
  // which we show with typewriter below)
  const pastEntries = log.slice(0, -1)
  const latestEntry = log[log.length - 1] ?? null

  return (
    <div className={styles.box}>
      <div className={styles.scrollArea} ref={scrollRef}>
        {/* Past conversation history */}
        {pastEntries.map((entry, i) => (
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

        {/* Current line — typewriter for character, plain for user */}
        {isTyping ? (
          <div className={`${styles.entry} ${styles.charEntry}`}>
            <span className={styles.entryLabel}>{speakerName}:</span>
            <span className={styles.dots}>
              <span className={styles.dot} style={{ animationDelay: '0s' }}>●</span>
              <span className={styles.dot} style={{ animationDelay: '0.25s' }}>●</span>
              <span className={styles.dot} style={{ animationDelay: '0.5s' }}>●</span>
            </span>
          </div>
        ) : latestEntry ? (
          <div
            className={`${styles.entry} ${latestEntry.speaker === 'user' ? styles.userEntry : styles.charEntry}`}
          >
            <span className={styles.entryLabel}>
              {latestEntry.speaker === 'user' ? 'YOU' : speakerName}:
            </span>
            <span className={styles.entryText}>
              {latestEntry.speaker === 'character' ? displayed : latestEntry.text}
              {latestEntry.speaker === 'character' && done && (
                <span className={styles.cursor}>▼</span>
              )}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  )
}
