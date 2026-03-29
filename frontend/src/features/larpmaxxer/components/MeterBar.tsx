import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type MeterBarProps = {
  value: number
  delta: number | null
  color: 'blue' | 'amber' | 'red' | 'purple'
  label: string
}

const COLOR_MAP: Record<MeterBarProps['color'], string> = {
  blue: '#0a66c2',
  amber: '#b45309',
  red: '#cc1016',
  purple: '#6b39c1',
}

const TRACK_MAP: Record<MeterBarProps['color'], string> = {
  blue: '#eef3f8',
  amber: '#fff7e6',
  red: '#fdecea',
  purple: '#f3eeff',
}

export function MeterBar({ value, delta, color, label }: MeterBarProps) {
  const barColor = COLOR_MAP[color]
  const trackColor = TRACK_MAP[color]
  const prevValue = useRef(value)
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    const prev = prevValue.current
    prevValue.current = value
    if ((label.toLowerCase().includes('suspicion') && value >= 70 && prev < 70) ||
        (label.toLowerCase().includes('impressed') && value >= 80 && prev < 80)) {
      const t = setTimeout(() => {
        setPulse(true)
        setTimeout(() => setPulse(false), 1000)
      }, 0)
      return () => clearTimeout(t)
    }
  }, [value, label])

  const clampedValue = Math.min(100, Math.max(0, value))
  const isPositiveDelta = delta !== null && delta > 0

  return (
    <div style={{ marginBottom: '10px' }}>
      {/* Label row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '4px',
      }}>
        <span style={{
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: '#00000099',
        }}>
          {label}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#000000e6' }}>
            {Math.round(clampedValue)}
          </span>
          <AnimatePresence>
            {delta !== null && delta !== 0 && (
              <motion.span
                key={`delta-${delta}`}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: isPositiveDelta ? '#057642' : '#cc1016',
                  minWidth: '28px',
                  textAlign: 'right',
                }}
              >
                {isPositiveDelta ? `+${delta}` : String(delta)}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bar track */}
      <div style={{
        width: '100%',
        height: '6px',
        backgroundColor: trackColor,
        borderRadius: '4px',
        overflow: 'hidden',
        position: 'relative',
      }}>
        <motion.div
          animate={{ width: `${clampedValue}%` }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          style={{
            height: '100%',
            backgroundColor: barColor,
            borderRadius: '4px',
            boxShadow: pulse ? `0 0 8px ${barColor}` : undefined,
          }}
        />
        {pulse && (
          <motion.div
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: barColor,
              borderRadius: '4px',
            }}
          />
        )}
      </div>
    </div>
  )
}
