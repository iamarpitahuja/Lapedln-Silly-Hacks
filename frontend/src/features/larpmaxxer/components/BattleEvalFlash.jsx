import { motion as Motion, AnimatePresence } from 'framer-motion'
import { springBouncy } from '../../../lib/motion'
import styles from './BattleEvalFlash.module.css'

const EFFECTIVENESS = {
  perfect:    { text: "It's super effective!",          color: '#5ad7c1' },
  adjacent:   { text: "It's effective!",                color: '#78C850' },
  neutral:    { text: "...",                            color: '#c0bcd8' },
  off_persona:{ text: "It's not very effective...",     color: '#f8d878' },
  wildcard:   { text: "A critical hit!",                color: '#F8D030' },
}

function fmt(n) {
  return n >= 0 ? `+${n}` : `${n}`
}

export function BattleEvalFlash({ data, onDismiss }) {
  if (!data) return null

  const cringe = data.cringe
  const effectiveness = cringe
    ? { text: "You hurt yourself in confusion!", color: '#f85888' }
    : (EFFECTIVENESS[data.alignmentTier] ?? EFFECTIVENESS.neutral)

  return (
    <AnimatePresence>
      <div className={styles.overlay} onClick={onDismiss}>
        <Motion.div
          className={styles.card}
          initial={{ opacity: 0, scale: 0.7, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -10 }}
          transition={springBouncy}
          onClick={e => e.stopPropagation()}
        >
          <div
            className={styles.effectText}
            style={{ color: effectiveness.color, textShadow: `0 0 20px ${effectiveness.color}80` }}
          >
            {effectiveness.text}
          </div>

          {data.characterThinks && (
            <div className={styles.thinks}>
              "{data.characterThinks}"
            </div>
          )}

          <div className={styles.deltas}>
            {data.meterDeltas.impressed !== 0 && (
              <span
                className={styles.delta}
                style={{ color: data.meterDeltas.impressed > 0 ? '#5ad7c1' : '#f85888' }}
              >
                IMPRESSED {fmt(data.meterDeltas.impressed)}
              </span>
            )}
            {data.meterDeltas.suspicion !== 0 && (
              <span
                className={styles.delta}
                style={{ color: data.meterDeltas.suspicion < 0 ? '#5ad7c1' : '#f85888' }}
              >
                SUSPICION {fmt(data.meterDeltas.suspicion)}
              </span>
            )}
          </div>

          {data.projectedLarpDelta !== 0 && (
            <div
              className={styles.lr}
              style={{ color: data.projectedLarpDelta >= 0 ? '#5ad7c1' : '#f85888' }}
            >
              {fmt(data.projectedLarpDelta.toFixed(1))} LR
            </div>
          )}

          <button className={styles.continueBtn} onClick={onDismiss}>
            Continue
          </button>
        </Motion.div>
      </div>
    </AnimatePresence>
  )
}
