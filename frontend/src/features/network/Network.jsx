import { useState, useEffect } from 'react'
import { AnimatePresence, motion as Motion } from 'framer-motion'
import {
  fetchConnectionSuggestions,
  fetchPendingConnections,
  fetchConnections,
  fetchOutgoingConnections,
} from '../../services/api'
import { easeOutQuint } from '../../lib/motion'
import UserCard from './UserCard/UserCard'
import styles from './Network.module.css'

const TABS = ['Suggestions', 'Pending', 'My Connections']

export default function Network() {
  const [activeTab, setActiveTab] = useState('Suggestions')
  const [suggestions, setSuggestions] = useState([])
  const [pending, setPending] = useState([])
  const [outgoing, setOutgoing] = useState([])
  const [connections, setConnections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [s, p, c] = await Promise.all([
          fetchConnectionSuggestions(),
          fetchPendingConnections(),
          fetchConnections(),
        ])
        setSuggestions(s.suggestions ?? [])
        setPending(p.pending ?? [])
        setConnections(c.connections ?? [])
        fetchOutgoingConnections()
          .then(o => setOutgoing(o.outgoing ?? []))
          .catch(() => {})
      } catch {
        setError('Failed to load network data. Is the backend running?')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.heading}>My Network</h1>

        <div className={styles.tabs}>
          {TABS.map(tab => (
            <button
              key={tab}
              className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
              {tab === 'Pending' && pending.length > 0 && (
                <span className={styles.badge}>{pending.length}</span>
              )}
            </button>
          ))}
        </div>

        {loading && <p className={styles.state}>Loading your network…</p>}
        {error && <p className={styles.stateError}>{error}</p>}

        {!loading && !error && (
          <AnimatePresence mode="wait">
            <Motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: easeOutQuint }}
            >
              {activeTab === 'Suggestions' && (
                <Motion.div
                  className={styles.grid}
                  initial="hidden"
                  animate="show"
                  variants={{ show: { transition: { staggerChildren: 0.05 } } }}
                >
                  {suggestions.length === 0 && outgoing.length === 0 ? (
                    <p className={styles.empty}>No suggestions right now. You know everyone!</p>
                  ) : (
                    <>
                      {outgoing.map(conn => (
                        <Motion.div key={conn.id} variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
                          <UserCard
                            user={conn.addressee}
                            initialStatus="pending_sent"
                            connectionId={conn.id}
                          />
                        </Motion.div>
                      ))}
                      {suggestions.map(user => (
                        <Motion.div key={user.id} variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
                          <UserCard user={user} initialStatus="none" />
                        </Motion.div>
                      ))}
                    </>
                  )}
                </Motion.div>
              )}

              {activeTab === 'Pending' && (
                <div>
                  {pending.length === 0 ? (
                    <p className={styles.empty}>No pending requests.</p>
                  ) : (
                    <Motion.div
                      className={styles.grid}
                      initial="hidden"
                      animate="show"
                      variants={{ show: { transition: { staggerChildren: 0.05 } } }}
                    >
                      {pending.map(conn => (
                        <Motion.div key={conn.id} variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
                          <UserCard
                            user={conn.requester}
                            initialStatus="pending_received"
                            connectionId={conn.id}
                          />
                        </Motion.div>
                      ))}
                    </Motion.div>
                  )}
                </div>
              )}

              {activeTab === 'My Connections' && (
                <Motion.div
                  className={styles.grid}
                  initial="hidden"
                  animate="show"
                  variants={{ show: { transition: { staggerChildren: 0.05 } } }}
                >
                  {connections.length === 0 ? (
                    <p className={styles.empty}>No connections yet. Start connecting!</p>
                  ) : (
                    connections.map(conn => (
                      <Motion.div key={conn.id} variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
                        <UserCard
                          user={conn.profile}
                          initialStatus="accepted"
                          connectionId={conn.id}
                        />
                      </Motion.div>
                    ))
                  )}
                </Motion.div>
              )}
            </Motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}

