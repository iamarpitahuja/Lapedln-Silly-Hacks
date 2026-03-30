import { useState } from 'react'
import { AnimatePresence, motion as Motion } from 'framer-motion'
import {
  sendConnectionRequest,
  acceptConnection,
  declineConnection,
  removeConnection,
} from '../../../services/api'
import { springBouncy, easeOutQuint } from '../../../lib/motion'
import styles from './ConnectButton.module.css'

function AnimatedLabel({ labelKey, children }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Motion.span
        key={labelKey}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.15, ease: easeOutQuint }}
      >
        {children}
      </Motion.span>
    </AnimatePresence>
  )
}

// connectionStatus: 'none' | 'pending_sent' | 'pending_received' | 'accepted'
export default function ConnectButton({ userId, connectionStatus, connectionId, onStatusChange }) {
  const [loading, setLoading] = useState(false)

  async function handleConnect() {
    setLoading(true)
    try {
      const data = await sendConnectionRequest(userId)
      onStatusChange('pending_sent', data.id)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleAccept() {
    setLoading(true)
    try {
      await acceptConnection(connectionId)
      onStatusChange('accepted', connectionId)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleDecline() {
    setLoading(true)
    try {
      await declineConnection(connectionId)
      onStatusChange('declined', connectionId)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleRemove() {
    setLoading(true)
    try {
      await removeConnection(connectionId)
      onStatusChange('none', null)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (connectionStatus === 'none') {
    return (
      <Motion.button
        className={`${styles.btn} ${styles.connect}`}
        onClick={handleConnect}
        disabled={loading}
        whileTap={{ scale: 0.95 }}
        transition={springBouncy}
      >
        <AnimatedLabel labelKey={loading ? 'loading' : 'idle'}>
          {loading ? 'Connecting…' : '+ Connect'}
        </AnimatedLabel>
      </Motion.button>
    )
  }

  if (connectionStatus === 'pending_sent') {
    return (
      <Motion.button
        className={`${styles.btn} ${styles.pending}`}
        onClick={handleRemove}
        disabled={loading}
        whileTap={{ scale: 0.95 }}
        transition={springBouncy}
      >
        <AnimatedLabel labelKey={loading ? 'loading' : 'pending'}>
          {loading ? '…' : 'Pending'}
        </AnimatedLabel>
      </Motion.button>
    )
  }

  if (connectionStatus === 'pending_received') {
    return (
      <div className={styles.row}>
        <Motion.button
          className={`${styles.btn} ${styles.accept}`}
          onClick={handleAccept}
          disabled={loading}
          whileTap={{ scale: 0.95 }}
          transition={springBouncy}
        >
          <AnimatedLabel labelKey={loading ? 'loading-accept' : 'accept'}>
            {loading ? '…' : 'Accept'}
          </AnimatedLabel>
        </Motion.button>
        <Motion.button
          className={`${styles.btn} ${styles.decline}`}
          onClick={handleDecline}
          disabled={loading}
          whileTap={{ scale: 0.95 }}
          transition={springBouncy}
        >
          <AnimatedLabel labelKey={loading ? 'loading-ignore' : 'ignore'}>
            {loading ? '…' : 'Ignore'}
          </AnimatedLabel>
        </Motion.button>
      </div>
    )
  }

  if (connectionStatus === 'accepted') {
    return (
      <Motion.button
        className={`${styles.btn} ${styles.connected}`}
        onClick={handleRemove}
        disabled={loading}
        whileTap={{ scale: 0.95 }}
        transition={springBouncy}
      >
        <AnimatedLabel labelKey={loading ? 'loading' : 'connected'}>
          {loading ? '…' : <><span className={styles.connectedLabel}>Connected ✓</span><span className={styles.removeLabel}>Remove</span></>}
        </AnimatedLabel>
      </Motion.button>
    )
  }

  return null
}

