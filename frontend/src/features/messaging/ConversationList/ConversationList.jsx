import { useState } from 'react'
import { getInitials } from '../../../utils/strings'
import styles from './ConversationList.module.css'

const AVATAR_COLORS = ['#0A66C2', '#057642', '#7c3aed', '#b45309', '#be123c', '#0891b2']

function getAvatarColor(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export default function ConversationList({ conversations, activeUserId, onSelect, onNewMessage }) {
  const [search, setSearch] = useState('')
  const filtered = conversations.filter(c =>
    (c.other_user?.display_name || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.heading}>Messaging</h2>
        <button className={styles.newBtn} onClick={onNewMessage} title="New message">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75z"/>
          </svg>
        </button>
      </div>

      <div className={styles.searchWrap}>
        <input
          className={styles.searchInput}
          placeholder="Search messages"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 && (
        <p className={styles.empty}>
          {search ? 'No conversations match your search.' : 'No conversations yet. DM someone from the Network page.'}
        </p>
      )}

      <ul className={styles.list}>
        {filtered.map(conv => {
          const user = conv.other_user
          const name = user?.display_name || 'Anonymous Larper'
          const isActive = activeUserId === user?.id
          return (
            <li key={user?.id}>
              <button
                className={`${styles.item} ${isActive ? styles.itemActive : ''}`}
                onClick={() => onSelect(user)}
              >
                <div className={styles.avatar} style={{ background: getAvatarColor(name) }}>
                  {user?.avatar_url
                    ? <img src={user.avatar_url} alt={name} className={styles.avatarImg} />
                    : getInitials(name)
                  }
                </div>
                <div className={styles.info}>
                  <div className={styles.nameRow}>
                    <span className={styles.name}>{name}</span>
                    {conv.unread_count > 0 && (
                      <span className={styles.unreadBadge}>{conv.unread_count}</span>
                    )}
                  </div>
                  <span className={styles.preview}>{conv.latest_message}</span>
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
