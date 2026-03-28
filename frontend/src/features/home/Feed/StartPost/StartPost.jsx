import { useState, useEffect } from 'react'
import { useMockData } from '../../../../context/MockDataContext'
import styles from './StartPost.module.css'

const PLACEHOLDERS = [
  'What impossible milestone are you reflecting on today?',
  'Share a lesson from your made-up founder arc.',
  'Announce a role you technically never interviewed for.',
  'What thought leadership can you offer the ecosystem today?',
]

const ACTIONS = [
  { icon: '🎉', label: 'Celebrate fake promotion' },
  { icon: '🚀', label: 'Announce stealth startup' },
  { icon: '💡', label: 'Share leadership insight' },
  { icon: '🪞', label: 'Reflect on your journey' },
]

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

export default function StartPost() {
  const { currentUser } = useMockData()
  const [placeholderIndex, setPlaceholderIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex(i => (i + 1) % PLACEHOLDERS.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className={styles.card}>
      <div className={styles.row}>
        <div className={styles.avatar}>{getInitials(currentUser.name)}</div>
        <button className={styles.input}>
          {PLACEHOLDERS[placeholderIndex]}
        </button>
      </div>
      <div className={styles.actions}>
        {ACTIONS.map(action => (
          <button key={action.label} className={styles.action}>
            <span className={styles.actionIcon}>{action.icon}</span>
            <span className={styles.actionLabel}>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
