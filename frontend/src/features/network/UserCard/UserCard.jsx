import { useState } from 'react'
import LarpRatingBadge from '../../../components/LarpRatingBadge/LarpRatingBadge'
import ConnectButton from '../ConnectButton/ConnectButton'
import { getInitials } from '../../../utils/strings'
import styles from './UserCard.module.css'

const AVATAR_COLORS = ['#0A66C2', '#057642', '#7c3aed', '#b45309', '#be123c', '#0891b2']

function getAvatarColor(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export default function UserCard({ user, initialStatus = 'none', connectionId: initialConnectionId = null }) {
  const [status, setStatus] = useState(initialStatus)
  const [connectionId, setConnectionId] = useState(initialConnectionId)

  function handleStatusChange(newStatus, newId) {
    setStatus(newStatus)
    setConnectionId(newId)
  }

  const name = user.display_name || 'Anonymous Larper'
  const title = user.title || 'Aspiring Thought Leader'

  return (
    <div className={styles.card}>
      <div className={styles.avatarWrap}>
        {user.avatar_url ? (
          <img src={user.avatar_url} alt={name} className={styles.avatarImg} />
        ) : (
          <div className={styles.avatar} style={{ background: getAvatarColor(name) }}>
            {getInitials(name)}
          </div>
        )}
      </div>
      <div className={styles.info}>
        <span className={styles.name}>{name}</span>
        <span className={styles.title}>{title}</span>
        <div className={styles.badge}>
          <LarpRatingBadge rating={user.larp_rating ?? 0} size="small" />
        </div>
      </div>
      <div className={styles.actions}>
        <ConnectButton
          userId={user.id}
          connectionStatus={status}
          connectionId={connectionId}
          onStatusChange={handleStatusChange}
        />
      </div>
    </div>
  )
}
