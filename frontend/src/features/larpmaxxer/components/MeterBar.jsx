import styles from './MeterBar.module.css'

export function MeterBar({ label, value, delta }) {
  const pct = Math.max(0, Math.min(100, value))
  const color = pct >= 60 ? 'var(--accent-cyan)' : pct >= 30 ? 'var(--neon)' : 'var(--accent-danger)'

  return (
    <div className={styles.wrap}>
      <div className={styles.labelRow}>
        <span className={styles.label}>{label}</span>
        <span className={styles.value}>
          {Math.round(pct)}%{delta != null && delta !== 0 && (
            <span style={{ color: delta > 0 ? 'var(--accent-cyan)' : 'var(--accent-danger)', marginLeft: 4 }}>
              {delta > 0 ? `+${delta}` : delta}
            </span>
          )}
        </span>
      </div>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

