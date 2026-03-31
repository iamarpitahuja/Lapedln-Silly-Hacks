import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { springBouncy } from '../../../lib/motion'

function cubicBezierEase(t) {
  return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2
}

export default function LarpCounter({ target = 0, duration = 2500, onComplete }) {
  const [displayed, setDisplayed] = useState(0)
  const startTimeRef = useRef(null)
  const rafRef = useRef(null)
  const completedRef = useRef(false)

  useEffect(() => {
    completedRef.current = false
    startTimeRef.current = performance.now()

    function tick(now) {
      const elapsed = now - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      const eased = cubicBezierEase(progress)
      setDisplayed(eased * target)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        setDisplayed(target)
        if (!completedRef.current) {
          completedRef.current = true
          onComplete?.()
        }
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [target, duration, onComplete])

  return (
    <motion.p
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={springBouncy}
      style={{
        fontSize: 'clamp(3rem, 10vw, 6rem)',
        fontWeight: 900,
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1,
        color: 'var(--text-primary)',
      }}
    >
      {displayed.toFixed(2)}
    </motion.p>
  )
}
