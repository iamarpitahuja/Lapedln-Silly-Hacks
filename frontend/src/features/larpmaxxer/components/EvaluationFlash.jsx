import styles from './EvaluationFlash.module.css'

const ALIGNMENT_STYLE = {
  perfect:      { bg: 'var(--accent-relarp-soft)', color: 'var(--accent-cyan)', label: 'Perfect Alignment' },
  adjacent:     { bg: 'var(--neon-faint)', color: 'var(--neon)', label: 'Adjacent' },
  neutral:      { bg: 'var(--bg-deep)', color: 'var(--text-secondary)', label: 'Neutral' },
  off_persona:  { bg: 'var(--accent-danger-soft)', color: 'var(--accent-danger)', label: 'Off-Persona' },
  wildcard:     { bg: 'var(--neon-faint)', color: 'var(--accent-violet)', label: 'Wildcard' },
}

function DeltaChip({ label, value }) {
  const isPos = value > 0
  const isNeg = value < 0
  const bg = isPos ? 'var(--accent-relarp-soft)' : isNeg ? 'var(--accent-danger-soft)' : 'var(--bg-deep)'
  const color = isPos ? 'var(--accent-cyan)' : isNeg ? 'var(--accent-danger)' : 'var(--text-muted)'
  return (
    <span className={styles.delta} style={{ backgroundColor: bg, color }}>
      {label}: {value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1)}
    </span>
  )
}

export function EvaluationFlash({ data, onDismiss }) {
  const alignment = ALIGNMENT_STYLE[data.alignmentTier] ?? ALIGNMENT_STYLE.neutral

  return (
    <div className={styles.card}>
      <span
        className={styles.alignmentBadge}
        style={{ backgroundColor: alignment.bg, color: alignment.color }}
      >
        {alignment.label}
      </span>

      <p className={styles.thinks}>"{data.characterThinks}"</p>

      <div className={styles.deltas}>
        <DeltaChip label="Impressed" value={data.meterDeltas.impressed} />
        <DeltaChip label="Suspicion" value={data.meterDeltas.suspicion} />
      </div>

      <div className={styles.larpDelta} style={{ color: data.projectedLarpDelta >= 0 ? 'var(--accent-cyan)' : 'var(--accent-danger)' }}>
        Projected LR: {data.projectedLarpDelta > 0 ? '+' : ''}{data.projectedLarpDelta.toFixed(1)}
      </div>

      <button className={styles.dismissBtn} onClick={onDismiss}>Continue</button>
    </div>
  )
}

