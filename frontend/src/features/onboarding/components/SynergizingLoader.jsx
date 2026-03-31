import { motion } from 'framer-motion'
import { easeOutQuint } from '../../../lib/motion'
import styles from './SynergizingLoader.module.css'

export default function SynergizingLoader({ message, error, onRetry }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        {!error ? (
          <>
            <p className={styles.message}>{message}</p>
            <div role="progressbar" aria-label="Loading" className={styles.track}>
              <motion.div
                className={styles.bar}
                initial={{ width: '0%' }}
                animate={{ width: ['0%', '85%', '85%', '100%'] }}
                transition={{
                  duration: 1.8,
                  times: [0, 0.6, 0.9, 1],
                  ease: easeOutQuint,
                }}
              />
            </div>
          </>
        ) : (
          <>
            <p className={styles.error}>{error}</p>
            <button className={styles.retryBtn} onClick={onRetry} type="button">
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  )
}
