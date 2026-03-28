import { useState, useEffect } from 'react'
import {
  fetchConnectionSuggestions,
  fetchPendingConnections,
  fetchConnections,
} from '../../services/api'
import UserCard from './UserCard/UserCard'
import styles from './Network.module.css'

const TABS = ['Suggestions', 'Pending', 'My Connections']

export default function Network() {
  const [activeTab, setActiveTab] = useState('Suggestions')
  const [suggestions, setSuggestions] = useState([])
  const [pending, setPending] = useState([])
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
      } catch (e) {
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
          <>
            {activeTab === 'Suggestions' && (
              <div className={styles.grid}>
                {suggestions.length === 0 ? (
                  <p className={styles.empty}>No suggestions right now. You know everyone!</p>
                ) : (
                  suggestions.map(user => (
                    <UserCard key={user.id} user={user} initialStatus="none" />
                  ))
                )}
              </div>
            )}

            {activeTab === 'Pending' && (
              <div>
                {pending.length === 0 ? (
                  <p className={styles.empty}>No pending requests.</p>
                ) : (
                  <div className={styles.grid}>
                    {pending.map(conn => (
                      <UserCard
                        key={conn.id}
                        user={conn.requester}
                        initialStatus="pending_received"
                        connectionId={conn.id}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'My Connections' && (
              <div className={styles.grid}>
                {connections.length === 0 ? (
                  <p className={styles.empty}>No connections yet. Start connecting!</p>
                ) : (
                  connections.map(conn => (
                    <UserCard
                      key={conn.id}
                      user={conn.profile}
                      initialStatus="accepted"
                      connectionId={conn.id}
                    />
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
