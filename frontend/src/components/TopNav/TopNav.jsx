import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { motion as Motion } from 'framer-motion'
import { useMockData } from '../../context/MockDataContext'
import { useAuth } from '../../context/AuthContext'
import { getInitials } from '../../utils/strings'
import { fetchConversations } from '../../services/api'
import { springSnap } from '../../lib/motion'
import styles from './TopNav.module.css'

const NAV_ITEMS = [
  {
    path: '/',
    label: 'Feed',
    tooltip: 'The timeline (it\'s cooked)',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
        <path d="M23 9v2h-2v7a3 3 0 01-3 3h-4v-6h-4v6H6a3 3 0 01-3-3v-7H1V9l11-7 11 7z" />
      </svg>
    ),
  },
  {
    path: '/network',
    label: 'Network',
    tooltip: 'People who tolerate you professionally',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
        <path d="M12 16v6H3v-6a3 3 0 013-3h3a3 3 0 013 3zm5.5-3A3.5 3.5 0 1014 9.5a3.5 3.5 0 003.5 3.5zm1 2h-2a2.5 2.5 0 00-2.5 2.5V22h7v-4.5a2.5 2.5 0 00-2.5-2.5zM7.5 2A4.5 4.5 0 1012 6.5 4.49 4.49 0 007.5 2z" />
      </svg>
    ),
  },
  {
    path: '/jobs',
    label: 'J*bs',
    tooltip: 'Pick a new identity crisis',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
        <path d="M17 6V5a3 3 0 00-3-3h-4a3 3 0 00-3 3v1H2v4a3 3 0 003 3h14a3 3 0 003-3V6zM9 5a1 1 0 011-1h4a1 1 0 011 1v1H9zm10 9a4 4 0 003-1.38V17a3 3 0 01-3 3H5a3 3 0 01-3-3v-4.38A4 4 0 005 14z" />
      </svg>
    ),
  },
  {
    path: '/messaging',
    label: 'Messages',
    tooltip: 'Slide into someone\'s professional DMs (it\'s networking not flirting)',
    isMessaging: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
        <path d="M16 4H8a7 7 0 000 14h4l4 4v-4a7 7 0 000-14z" />
      </svg>
    ),
  },
  {
    path: '/notifications',
    label: 'Notifications',
    tooltip: 'Proof that someone noticed you',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
        <path d="M22 19h-6.18C15.4 20.77 13.85 22 12 22s-3.4-1.23-3.82-3H2v-2l2-2V9a8 8 0 0116 0v6l2 2zM12 4a6 6 0 00-6 6v7h12V10a6 6 0 00-6-6z" />
      </svg>
    ),
  },
  {
    path: '/me',
    label: 'Me',
    tooltip: 'Your profile',
    isMe: true,
  },
]

export default function TopNav() {
  const { currentUser } = useMockData()
  const { signOut } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  useEffect(() => {
    fetchConversations()
      .then(data => {
        const total = (data.conversations ?? []).reduce((sum, c) => sum + (c.unread_count ?? 0), 0)
        setUnreadCount(total)
      })
      .catch(() => {}) // Silently fail if backend is down
  }, [])

  return (
    <header className={styles.nav} data-tour="top-nav">
      <div className={styles.inner}>
        {/* Left: Logo + Search */}
        <div className={styles.left}>
          <NavLink to="/" className={styles.logo}>
            <img src="/logoDarkMode.png" alt="LarpedIn" className={styles.logoImg} />
            <span className={styles.logoText}>LarpedIn</span>
          </NavLink>
          <div className={styles.searchWrap}>
            <svg
              className={styles.searchIcon}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className={styles.search}
              placeholder="Search"
            />
          </div>
        </div>

        {/* Right: Nav items */}
        <nav className={styles.tabs}>
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `${styles.tab} ${isActive ? styles.tabActive : ''}`
              }
              title={item.tooltip}
            >
              {({ isActive }) => (
                <>
                  <Motion.span
                    className={styles.tabIcon}
                    animate={isActive ? { scaleY: [1, 1.2, 1] } : { scaleY: 1 }}
                    transition={springSnap}
                  >
                    {item.isMe ? (
                      currentUser.avatar ? (
                        <img
                          src={currentUser.avatar}
                          alt={currentUser.name}
                          className={styles.avatarSmallImg}
                        />
                      ) : (
                        <span className={styles.avatarSmall}>{getInitials(currentUser.name)}</span>
                      )
                    ) : (
                      <span className={styles.iconWrap}>
                        {item.icon}
                        {item.isMessaging && unreadCount > 0 && (
                          <span className={styles.unreadDot} />
                        )}
                      </span>
                    )}
                  </Motion.span>
                  <span className={styles.tabLabel}>{item.label}</span>
                  {isActive && (
                    <Motion.div
                      layoutId="activeTab"
                      className={styles.activeIndicator}
                      transition={springSnap}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
          <button className={styles.signOut} onClick={signOut} title="Sign out">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </nav>
      </div>
    </header>
  )
}
