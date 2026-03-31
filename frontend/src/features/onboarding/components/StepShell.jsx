import { motion } from 'framer-motion'
import { springBouncy } from '../../../lib/motion'
import BuzzwordParticles from './BuzzwordParticles'
import styles from './StepShell.module.css'

export default function StepShell({
  heading,
  stepNumber,
  totalSteps,
  skippable = false,
  onSkip,
  children,
}) {
  return (
    <div className={styles.shell}>
      <BuzzwordParticles count={7} />

      <div className={styles.progress}>
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            className={`${styles.dot} ${i < stepNumber ? styles.dotDone : ''} ${i === stepNumber - 1 ? styles.dotActive : ''}`}
          />
        ))}
      </div>

      <h1 className={styles.heading}>
        {heading}
      </h1>

      <motion.div
        className={styles.content}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springBouncy, delay: 0.1 }}
      >
        {children}
      </motion.div>

      {skippable && (
        <button className={styles.skipBtn} onClick={onSkip} type="button">
          Skip for now
        </button>
      )}
    </div>
  )
}
