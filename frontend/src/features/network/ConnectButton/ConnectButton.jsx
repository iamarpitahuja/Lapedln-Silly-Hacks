import { useState } from 'react'
import {
  sendConnectionRequest,
  acceptConnection,
  declineConnection,
  removeConnection,
} from '../../../services/api'
import styles from './ConnectButton.module.css'

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
      <button className={`${styles.btn} ${styles.connect}`} onClick={handleConnect} disabled={loading}>
        {loading ? 'Connecting…' : '+ Connect'}
      </button>
    )
  }

  if (connectionStatus === 'pending_sent') {
    return (
      <button className={`${styles.btn} ${styles.pending}`} onClick={handleRemove} disabled={loading}>
        {loading ? '…' : 'Pending'}
      </button>
    )
  }

  if (connectionStatus === 'pending_received') {
    return (
      <div className={styles.row}>
        <button className={`${styles.btn} ${styles.accept}`} onClick={handleAccept} disabled={loading}>
          {loading ? '…' : 'Accept'}
        </button>
        <button className={`${styles.btn} ${styles.decline}`} onClick={handleDecline} disabled={loading}>
          Ignore
        </button>
      </div>
    )
  }

  if (connectionStatus === 'accepted') {
    return (
      <button className={`${styles.btn} ${styles.connected}`} onClick={handleRemove} disabled={loading}>
        {loading ? '…' : 'Connected ✓'}
      </button>
    )
  }

  return null
}
