import { motion as Motion, AnimatePresence } from 'framer-motion'
import styles from './ConfirmModal.module.css'

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}) {
  return (
    <AnimatePresence>
      {open && (
        <Motion.div
          className={styles.backdrop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onCancel}
        >
          <Motion.div
            className={styles.modal}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            onClick={e => e.stopPropagation()}
          >
            <h3 className={styles.title}>{title}</h3>
            <p className={styles.message}>{message}</p>
            <div className={styles.actions}>
              <button className={styles.cancelBtn} onClick={onCancel}>
                {cancelLabel}
              </button>
              <button className={styles.confirmBtn} onClick={onConfirm}>
                {confirmLabel}
              </button>
            </div>
          </Motion.div>
        </Motion.div>
      )}
    </AnimatePresence>
  )
}
