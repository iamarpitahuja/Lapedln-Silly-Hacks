import styles from './EvaluationFlash.module.css'

const ALIGNMENT_STYLE = {
  perfect:      { bg: '#e8f5ef', color: '#057642', label: 'Perfect Alignment' },
  adjacent:     { bg: '#eef3f8', color: '#0a66c2', label: 'Adjacent' },
  neutral:      { bg: '#f3f2ef', color: 'rgba(0,0,0,0.55)', label: 'Neutral' },
  off_persona:  { bg: '#fdecea', color: '#cc1016', label: 'Off-Persona' },
  wildcard:     { bg: '#f3e8ff', color: '#7c3aed', label: 'Wildcard' },
}

function DeltaChip({ label, value }) {
  const isPos = value > 0
  const isNeg = value < 0
  const bg = isPos ? '#e8f5ef' : isNeg ? '#fdecea' : '#f3f2ef'
  const color = isPos ? '#057642' : isNeg ? '#cc1016' : 'rgba(0,0,0,0.4)'
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

      <div className={styles.larpDelta} style={{ color: data.projectedLarpDelta >= 0 ? '#057642' : '#cc1016' }}>
        Projected LR: {data.projectedLarpDelta > 0 ? '+' : ''}{data.projectedLarpDelta.toFixed(1)}
      </div>

      <button className={styles.dismissBtn} onClick={onDismiss}>Continue</button>
    </div>
  )
}
