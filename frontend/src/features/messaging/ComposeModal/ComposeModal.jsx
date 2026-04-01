import { useState, useEffect, useRef } from 'react'
import { motion as Motion } from 'framer-motion'
import { fetchMessageableUsers } from '../../../services/api'
import { getInitials } from '../../../utils/strings'
import { springSnap } from '../../../lib/motion'
import styles from './ComposeModal.module.css'

const AVATAR_COLORS = ['#a78bfa', '#7db5ff', '#5ad7c1', '#b39bff', '#f1c75b', '#f289a8']

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
    <Motion.div
      className={styles.backdrop}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <Motion.div
        className={styles.modal}
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={springSnap}
      >
        <div className={styles.header}>
          <h3 className={styles.title}>New message (it's networking not flirting)</h3>
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
            placeholder="Search for someone to professionally bother..."
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
                    <span className={styles.userJob}>{user.job || 'Between pivots'}</span>
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
                    <span className={styles.userJob}>{user.job || 'Between pivots'}</span>
                  </div>
                  {isSelected(user.id) && <span className={styles.check}>&#10003;</span>}
                </button>
              ))}
            </>
          )}

          {!loading && filteredConnections.length === 0 && filteredOthers.length === 0 && (
            <p className={styles.state}>No users found. Everyone is dodging you rn.</p>
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
      </Motion.div>
    </Motion.div>
  )
}

