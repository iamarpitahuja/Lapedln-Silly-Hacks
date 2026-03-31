import { useEffect, useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import styles from './RatingToast.module.css'

const TOAST_DURATION = 3000
let toastIdCounter = 0

export default function RatingToast() {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((detail) => {
    if (!detail || typeof detail.delta !== 'number') return
    const id = ++toastIdCounter
    setToasts(prev => [...prev, { id, ...detail }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, TOAST_DURATION)
  }, [])

  useEffect(() => {
    const handler = (e) => addToast(e.detail)
    window.addEventListener('rating:change', handler)
    return () => window.removeEventListener('rating:change', handler)
  }, [addToast])

  return (
    <div className={styles.container}>
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            className={`${styles.toast} ${toast.delta >= 0 ? styles.positive : styles.negative}`}
            initial={{ opacity: 0, x: 80, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.9 }}
            transition={{ duration: 0.25 }}
          >
            <span className={styles.delta}>
              {toast.delta >= 0 ? '+' : ''}{toast.delta.toFixed(1)}
            </span>
            <span className={styles.reason}>{toast.reason}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
