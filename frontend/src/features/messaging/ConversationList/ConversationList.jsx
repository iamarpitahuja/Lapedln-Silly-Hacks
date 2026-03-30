import { useState } from 'react'
import { motion as Motion } from 'framer-motion'
import { getInitials } from '../../../utils/strings'
import { easeOutQuint } from '../../../lib/motion'
import styles from './ConversationList.module.css'

const AVATAR_COLORS = ['#a78bfa', '#7db5ff', '#5ad7c1', '#b39bff', '#f1c75b', '#f289a8']

function getAvatarColor(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export default function ConversationList({
  conversations,
  groups = [],
  activeUserId,
  activeGroupId,
  onSelect,
  onSelectGroup,
  onNewMessage,
}) {
  const [search, setSearch] = useState('')

  const filteredConvs = conversations.filter(c =>
    (c.other_user?.display_name || '').toLowerCase().includes(search.toLowerCase())
  )
  const filteredGroups = groups.filter(g =>
    (g.name || '').toLowerCase().includes(search.toLowerCase())
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

      <div className={styles.list}>
        {/* 1:1 Messages section */}
        {filteredConvs.length > 0 && (
          <>
            <p className={styles.sectionLabel}>Messages</p>
            <ul className={styles.section}>
              {filteredConvs.map((conv, index) => {
                const user = conv.other_user
                const name = user?.display_name || 'Anonymous Larper'
                const isActive = !activeGroupId && activeUserId === user?.id
                return (
                  <Motion.li
                    key={user?.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, ease: easeOutQuint, delay: index * 0.04 }}
                  >
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
                  </Motion.li>
                )
              })}
            </ul>
          </>
        )}

        {/* Groups section */}
        {filteredGroups.length > 0 && (
          <>
            <p className={styles.sectionLabel}>Groups</p>
            <ul className={styles.section}>
              {filteredGroups.map((group, index) => {
                const isActive = activeGroupId === group.id
                const memberCount = group.members?.length ?? 0
                return (
                  <Motion.li
                    key={group.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, ease: easeOutQuint, delay: index * 0.04 }}
                  >
                    <button
                      className={`${styles.item} ${isActive ? styles.itemActive : ''}`}
                      onClick={() => onSelectGroup(group)}
                    >
                      <div className={styles.groupAvatar}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                        </svg>
                      </div>
                      <div className={styles.info}>
                        <div className={styles.nameRow}>
                          <span className={styles.name}>{group.name}</span>
                        </div>
                        <span className={styles.preview}>
                          {group.latest_message || `${memberCount} members`}
                        </span>
                      </div>
                    </button>
                  </Motion.li>
                )
              })}
            </ul>
          </>
        )}

        {filteredConvs.length === 0 && filteredGroups.length === 0 && (
          <p className={styles.empty}>
            {search ? 'No conversations match your search.' : 'No conversations yet. Click the pencil to start one.'}
          </p>
        )}
      </div>
    </div>
  )
}

