import { useState, useEffect, useRef } from 'react'
import { fetchMessageableUsers } from '../../../services/api'
import { getInitials } from '../../../utils/strings'
import styles from './ComposeModal.module.css'

const AVATAR_COLORS = ['#0A66C2', '#057642', '#7c3aed', '#b45309', '#be123c', '#0891b2']

function getAvatarColor(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export default function ComposeModal({ onClose, onStartDm, onCreateGroup }) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState([])
  const [connections, setConnections] = useState([])
  const [others, setOthers] = useState([])
  const [loading, setLoading] = useState(true)
  const searchRef = useRef(null)

  useEffect(() => {
    fetchMessageableUsers()
      .then(data => {
        setConnections(data.connections ?? [])
        setOthers(data.others ?? [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    searchRef.current?.focus()
  }, [])

  const isSelected = (userId) => selected.some(u => u.id === userId)

  const toggleUser = (user) => {
    if (isSelected(user.id)) {
      setSelected(prev => prev.filter(u => u.id !== user.id))
    } else {
      setSelected(prev => [...prev, user])
    }
  }

  const removeSelected = (userId) => {
    setSelected(prev => prev.filter(u => u.id !== userId))
  }

  const filterUsers = (users) =>
    users.filter(u =>
      (u.display_name || '').toLowerCase().includes(search.toLowerCase())
    )

  const filteredConnections = filterUsers(connections)
  const filteredOthers = filterUsers(others)

  const handleStart = () => {
    if (selected.length === 0) return
    if (selected.length === 1) {
      onStartDm(selected[0])
    } else {
      onCreateGroup(selected.map(u => u.id))
    }
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose()
  }

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick} onKeyDown={handleKeyDown}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3 className={styles.title}>New message</h3>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        {selected.length > 0 && (
          <div className={styles.selectedArea}>
            {selected.map(user => (
              <span key={user.id} className={styles.pill}>
                {user.display_name}
                <button
                  className={styles.pillRemove}
                  onClick={() => removeSelected(user.id)}
                  aria-label={`Remove ${user.display_name}`}
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}

        <div className={styles.searchWrap}>
          <input
            ref={searchRef}
            className={styles.searchInput}
            placeholder="Search people..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.userList}>
          {loading && <p className={styles.state}>Loading...</p>}

          {!loading && filteredConnections.length > 0 && (
            <>
              <p className={styles.sectionLabel}>Connections</p>
              {filteredConnections.map(user => (
                <button
                  key={user.id}
                  className={`${styles.userItem} ${isSelected(user.id) ? styles.userItemSelected : ''}`}
                  onClick={() => toggleUser(user)}
                >
                  <div className={styles.avatar} style={{ background: getAvatarColor(user.display_name || '') }}>
                    {user.avatar_url
                      ? <img src={user.avatar_url} alt={user.display_name} className={styles.avatarImg} />
                      : getInitials(user.display_name || '')}
                  </div>
                  <div className={styles.userInfo}>
                    <span className={styles.userName}>{user.display_name}</span>
                    <span className={styles.userJob}>{user.job || 'Aspiring Thought Leader'}</span>
                  </div>
                  {isSelected(user.id) && <span className={styles.check}>&#10003;</span>}
                </button>
              ))}
            </>
          )}

          {!loading && filteredOthers.length > 0 && (
            <>
              <p className={styles.sectionLabel}>Others</p>
              {filteredOthers.map(user => (
                <button
                  key={user.id}
                  className={`${styles.userItem} ${isSelected(user.id) ? styles.userItemSelected : ''}`}
                  onClick={() => toggleUser(user)}
                >
                  <div className={styles.avatar} style={{ background: getAvatarColor(user.display_name || '') }}>
                    {user.avatar_url
                      ? <img src={user.avatar_url} alt={user.display_name} className={styles.avatarImg} />
                      : getInitials(user.display_name || '')}
                  </div>
                  <div className={styles.userInfo}>
                    <span className={styles.userName}>{user.display_name}</span>
                    <span className={styles.userJob}>{user.job || 'Aspiring Thought Leader'}</span>
                  </div>
                  {isSelected(user.id) && <span className={styles.check}>&#10003;</span>}
                </button>
              ))}
            </>
          )}

          {!loading && filteredConnections.length === 0 && filteredOthers.length === 0 && (
            <p className={styles.state}>No users found.</p>
          )}
        </div>

        <div className={styles.footer}>
          <span className={styles.footerHint}>
            {selected.length === 0
              ? 'Select people to message'
              : selected.length === 1
                ? `DM ${selected[0].display_name}`
                : `Group with ${selected.length} people`}
          </span>
          <button
            className={styles.startBtn}
            disabled={selected.length === 0}
            onClick={handleStart}
          >
            {selected.length <= 1 ? 'Start conversation' : 'Create group'}
          </button>
        </div>
      </div>
    </div>
  )
}
