import { useEffect, useRef, useState } from 'react'
import styles from './BattleHPBar.module.css'

function getBarColor(value) {
  if (value > 50) return '#58d858'
  if (value > 20) return '#f8d878'
  return '#f85888'
}

export function BattleHPBar({ label, value, delta = null }) {
  const [displayDelta, setDisplayDelta] = useState(null)
  const [shake, setShake] = useState(false)
  const prevDelta = useRef(null)

  useEffect(() => {
    if (delta !== null && delta !== prevDelta.current) {
      prevDelta.current = delta
      setDisplayDelta(delta)
      if (delta < -10) {
        setShake(true)
        setTimeout(() => setShake(false), 400)
      }
      const t = setTimeout(() => setDisplayDelta(null), 900)
      return () => clearTimeout(t)
    }
  }, [delta])

  const clamped = Math.max(0, Math.min(100, value))
  const color = getBarColor(clamped)

  return (
    <div className={`${styles.wrap} ${shake ? styles.shake : ''}`}>
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
      </div>
      <div className={styles.track}>
        <div
          className={styles.fill}
          style={{ width: `${clamped}%`, backgroundColor: color }}
        />
      </div>
      {displayDelta !== null && (
        <span
          key={Date.now()}
          className={`${styles.delta} ${displayDelta >= 0 ? styles.pos : styles.neg}`}
        >
          {displayDelta >= 0 ? `+${displayDelta}` : displayDelta}
        </span>
      )}
    </div>
  )
}
