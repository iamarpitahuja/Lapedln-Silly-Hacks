import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fetchConversations } from '../../services/api'
import ConversationList from './ConversationList/ConversationList'
import ChatWindow from './ChatWindow/ChatWindow'
import styles from './Messaging.module.css'

// In dev mode (skip_auth=True), backend uses this as the current user
const DEV_USER_ID = '00000000-0000-0000-0000-000000000000'

export default function Messaging() {
  const [searchParams] = useSearchParams()
  const [conversations, setConversations] = useState([])
  const [activeUser, setActiveUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const initialUserId = searchParams.get('userId')

  useEffect(() => {
    fetchConversations()
      .then(data => {
        const convs = data.conversations ?? []
        setConversations(convs)
        if (initialUserId) {
          const existing = convs.find(c => c.other_user?.id === initialUserId)
          if (existing) {
            setActiveUser(existing.other_user)
          } else {
            setActiveUser({ id: initialUserId, display_name: 'Loading…' })
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [initialUserId])

  return (
    <div className={styles.page}>
      {loading ? (
        <p className={styles.loading}>Loading conversations…</p>
      ) : (
        <div className={styles.layout}>
          <ConversationList
            conversations={conversations}
            activeUserId={activeUser?.id}
            onSelect={setActiveUser}
            onNewMessage={() => setActiveUser(null)}
          />
          <div className={styles.chat}>
            <ChatWindow
              otherUser={activeUser}
              currentUserId={DEV_USER_ID}
            />
          </div>
        </div>
      )}
    </div>
  )
}
