import { useState, useEffect, useRef } from 'react'
import styles from './BattleDialogueBox.module.css'

const TYPEWRITER_SPEED = 20 // ms per character

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5.5v13l10-6.5-10-6.5z" fill="currentColor" />
    </svg>
  )
}

function StopIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="7" y="7" width="10" height="10" rx="1.5" fill="currentColor" />
    </svg>
  )
}

function WarningIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4.5L3.75 19h16.5L12 4.5zm0 4.2c.6 0 1 .4 1 1v4.1c0 .6-.4 1-1 1s-1-.4-1-1V9.7c0-.6.4-1 1-1zm0 8.2a1.2 1.2 0 110-2.4 1.2 1.2 0 010 2.4z" fill="currentColor" />
    </svg>
  )
}

export function BattleDialogueBox({
  text,
  speakerName,
  isTyping,
  log = [],
  ttsState = 'idle',
  onVoiceToggle = null,
  voiceDisabled = false,
}) {
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
  const isLoading = ttsState === 'loading'
  const isPlaying = ttsState === 'playing'
  const isError = ttsState === 'error'
  const canToggle = Boolean(onVoiceToggle) && (!voiceDisabled || isPlaying || isLoading)
  const voiceLabel = isLoading ? 'Loading voice' : isPlaying ? 'Stop voice' : 'Play voice'
  const statusLabel = isLoading
    ? 'Loading'
    : isPlaying
      ? 'Playing'
      : isError
        ? 'Error'
        : 'Ready'

  return (
    <div className={styles.box}>
      <div className={styles.voiceBar}>
        <button
          type="button"
          className={`${styles.voiceBtn} ${isPlaying ? styles.voiceBtnPlaying : ''} ${isError ? styles.voiceBtnError : ''}`}
          onClick={onVoiceToggle}
          disabled={!canToggle}
          aria-label={voiceLabel}
          title={voiceLabel}
        >
          <span className={styles.voiceIconWrap} aria-hidden="true">
            {isLoading ? <span className={styles.voiceSpinner} /> : isError ? <WarningIcon /> : isPlaying ? <StopIcon /> : <PlayIcon />}
          </span>
          <span className={styles.voiceBtnText}>{voiceLabel}</span>
        </button>
        <span className={`${styles.voiceStatus} ${isPlaying ? styles.voiceStatusPlaying : ''} ${isError ? styles.voiceStatusError : ''}`}>
          {statusLabel}
        </span>
      </div>

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
