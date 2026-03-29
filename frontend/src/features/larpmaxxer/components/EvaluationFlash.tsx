import { motion, AnimatePresence } from 'framer-motion'
import type { EvaluationFlashData } from '../types'
import { getAlignmentLabel } from '../engine/personaAlignment'

type EvaluationFlashProps = {
  data: EvaluationFlashData
  onDismiss: () => void
}

function DeltaRow({ label, value }: { label: string; value: number }) {
  const isPositive = value > 0
  const isNeutral = value === 0
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '3px 0',
    }}>
      <span style={{ fontSize: '12px', color: '#00000099' }}>{label}</span>
      <span style={{
        fontSize: '12px',
        fontWeight: 700,
        color: isNeutral ? '#00000099' : isPositive ? '#057642' : '#cc1016',
      }}>
        {isNeutral ? '—' : isPositive ? `+${value}` : String(value)}
      </span>
    </div>
  )
}

function MeterDeltaRow({ label, value }: { label: string; value: number }) {
  const isPositive = value > 0
  const isNeutral = value === 0
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '3px 0',
    }}>
      <span style={{ fontSize: '12px', color: '#00000099' }}>{label}</span>
      <span style={{
        fontSize: '12px',
        fontWeight: 700,
        color: isNeutral ? '#00000099' : isPositive ? '#057642' : '#cc1016',
      }}>
        {isNeutral ? '—' : isPositive ? `+${value}` : String(value)}
      </span>
    </div>
  )
}

export function EvaluationFlash({ data, onDismiss }: EvaluationFlashProps) {
  const alignmentLabel = getAlignmentLabel(data.alignmentTier)
  const tierColorMap: Record<typeof data.alignmentTier, string> = {
    perfect: '#057642',
    adjacent: '#0a66c2',
    neutral: '#00000099',
    off_persona: '#b45309',
    wildcard: '#92610a',
  }
  const tierColor = tierColorMap[data.alignmentTier]

  const isPositiveLarp = data.projectedLarpDelta > 0

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 120, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 120, opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{
          position: 'fixed',
          top: '80px',
          right: '16px',
          width: '300px',
          zIndex: 9999,
          backgroundColor: '#ffffff',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '14px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '10px',
        }}>
          <div>
            <div style={{
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: '#00000099',
              textTransform: 'uppercase',
              marginBottom: '3px',
            }}>
              Response Evaluated
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: tierColor }}>
              {alignmentLabel}
            </div>
          </div>
          <button
            onClick={onDismiss}
            style={{
              background: 'none',
              border: 'none',
              color: '#00000099',
              cursor: 'pointer',
              fontSize: '16px',
              padding: '0',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Cringe badge */}
        {data.cringe && (
          <div style={{
            backgroundColor: '#fdecea',
            border: '1px solid #cc101644',
            borderRadius: '6px',
            padding: '5px 10px',
            marginBottom: '10px',
            fontSize: '11px',
            fontWeight: 700,
            color: '#cc1016',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}>
            ⚠ Cringe Incident Recorded
          </div>
        )}

        {/* Metric deltas */}
        <div style={{
          borderBottom: '1px solid #e0e0e0',
          marginBottom: '8px',
          paddingBottom: '8px',
        }}>
          <div style={{
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.07em',
            color: '#00000099',
            textTransform: 'uppercase',
            marginBottom: '4px',
          }}>
            Metrics
          </div>
          <DeltaRow label="Aura" value={data.metricDeltas.aura} />
          <DeltaRow label="Social Footing" value={data.metricDeltas.socialFooting} />
          <DeltaRow label="Plausibility" value={data.metricDeltas.plausibility} />
          <DeltaRow label="Larp Continuity" value={data.metricDeltas.larpContinuity} />
          <DeltaRow label="Respect" value={data.metricDeltas.respect} />
        </div>

        {/* Meter deltas */}
        <div style={{
          borderBottom: '1px solid #e0e0e0',
          marginBottom: '8px',
          paddingBottom: '8px',
        }}>
          <div style={{
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.07em',
            color: '#00000099',
            textTransform: 'uppercase',
            marginBottom: '4px',
          }}>
            Meters
          </div>
          <MeterDeltaRow label="Impressed" value={data.meterDeltas.impressed} />
          <MeterDeltaRow label="Suspicion" value={data.meterDeltas.suspicion} />
        </div>

        {/* Character thinks */}
        <div style={{
          backgroundColor: '#f3f2ef',
          borderRadius: '6px',
          padding: '8px 10px',
          marginBottom: '10px',
        }}>
          <div style={{
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.07em',
            color: '#00000099',
            textTransform: 'uppercase',
            marginBottom: '3px',
          }}>
            Character thinks
          </div>
          <p style={{
            fontSize: '12px',
            color: '#000000e6',
            fontStyle: 'italic',
            margin: 0,
            lineHeight: 1.5,
          }}>
            "{data.characterThinks}"
          </p>
        </div>

        {/* Projected LarpRating delta */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 600,
            color: '#00000099',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}>
            Projected LarpRating
          </span>
          <span style={{
            fontSize: '13px',
            fontWeight: 700,
            color: isPositiveLarp ? '#057642' : '#cc1016',
          }}>
            {isPositiveLarp
              ? `+${data.projectedLarpDelta.toFixed(1)}`
              : data.projectedLarpDelta.toFixed(1)}
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
