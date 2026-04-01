import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion as Motion } from 'framer-motion'
import { fetchNotifications } from '../services/api'
import { easeOutQuint } from '../lib/motion'
import styles from './NotificationsPage.module.css'

function timeAgo(isoString) {
  if (!isoString) return 'just now'
  const diffMs = Date.now() - new Date(isoString).getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h`
  return `${Math.floor(diffHours / 24)}d`
}

function destinationForNotification(notification) {
  if (notification.type === 'connection_request') return '/network'
  if (notification.type === 'message') return '/messaging'
  return '/'
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchNotifications()
      .then(data => {
        const nowMs = Date.now()
        const enriched = (data.notifications ?? []).map(notification => ({
          ...notification,
          is_today: nowMs - new Date(notification.created_at).getTime() < 24 * 60 * 60 * 1000,
        }))
        setNotifications(enriched)
      })
      .catch(() => setError('Failed to load notifications. Is the backend running?'))
      .finally(() => setLoading(false))
  }, [])
  const today = notifications.filter(notification => notification.is_today)
  const older = notifications.filter(notification => !notification.is_today)

  return (
    <div className={styles.page}>
      <div className={styles.card} data-tour="notifications-card">
        <h2 className={styles.heading}>Notifications</h2>
        <p className={styles.subheading}>People who want something from you, ranked by audacity.</p>

        {loading ? <p className={styles.state}>Loading…</p> : null}
        {!loading && error ? <p className={styles.stateError}>{error}</p> : null}

        {!loading && !error && notifications.length === 0 ? (
          <p className={styles.empty}>Nothing new. The algorithm has forgotten about you. Post harder.</p>
        ) : null}

        {!loading && !error && notifications.length > 0 ? (
          <div className={styles.listWrap}>
            {today.length > 0 ? (
              <Motion.section
                className={styles.section}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, ease: easeOutQuint }}
              >
                <h3 className={styles.sectionTitle}>Today</h3>
                <ul className={styles.list}>
                  <AnimatePresence initial={false}>
                    {today.map((notification, index) => (
                      <Motion.li
                        key={notification.id}
                        className={styles.item}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -12 }}
                        transition={{ duration: 0.2, ease: easeOutQuint, delay: index * 0.04 }}
                      >
                        <p className={styles.itemTitle}>{notification.title}</p>
                        <p className={styles.itemBody}>{notification.body}</p>
                        <div className={styles.itemMeta}>
                          <span>{timeAgo(notification.created_at)}</span>
                          <Link className={styles.openLink} to={destinationForNotification(notification)}>
                            View
                          </Link>
                        </div>
                      </Motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              </Motion.section>
            ) : null}

            {older.length > 0 ? (
              <Motion.section
                className={styles.section}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, ease: easeOutQuint }}
              >
                <h3 className={styles.sectionTitle}>Earlier</h3>
                <ul className={styles.list}>
                  <AnimatePresence initial={false}>
                    {older.map((notification, index) => (
                      <Motion.li
                        key={notification.id}
                        className={styles.item}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -12 }}
                        transition={{ duration: 0.2, ease: easeOutQuint, delay: index * 0.04 }}
                      >
                        <p className={styles.itemTitle}>{notification.title}</p>
                        <p className={styles.itemBody}>{notification.body}</p>
                        <div className={styles.itemMeta}>
                          <span>{timeAgo(notification.created_at)}</span>
                          <Link className={styles.openLink} to={destinationForNotification(notification)}>
                            View
                          </Link>
                        </div>
                      </Motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              </Motion.section>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
