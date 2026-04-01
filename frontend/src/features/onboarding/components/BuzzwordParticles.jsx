import { useMemo } from 'react'
import { motion } from 'framer-motion'

const WORDS = ['synergy', 'leverage', 'disrupt', 'pivot', 'scale', 'ideate', 'KPIs', 'bandwidth', 'alignment', 'velocity']

function randomBetween(min, max) {
  return Math.random() * (max - min) + min
}

export default function BuzzwordParticles({ count = 7 }) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        word: WORDS[i % WORDS.length],
        x: randomBetween(5, 90),
        delay: randomBetween(0, 0.6),
        rotate: randomBetween(-15, 15),
        duration: randomBetween(1.8, 2.8),
        repeatDelay: randomBetween(0.5, 1.5),
      })),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  )

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
      {particles.map(p => (
        <motion.span
          key={p.id}
          initial={{ opacity: 0, y: 0, rotate: 0 }}
          animate={{ opacity: [0, 0.35, 0], y: -180, rotate: p.rotate }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeOut', repeat: Infinity, repeatDelay: p.repeatDelay }}
          style={{
            position: 'absolute',
            bottom: '10%',
            left: `${p.x}%`,
            fontSize: '0.7rem',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--neon)',
            whiteSpace: 'nowrap',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        >
          {p.word}
        </motion.span>
      ))}
    </div>
  )
}
