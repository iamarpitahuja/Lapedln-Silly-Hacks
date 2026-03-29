import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fetchConversations, fetchProfile, fetchUserProfile } from '../../services/api'
import ConversationList from './ConversationList/ConversationList'
import ChatWindow from './ChatWindow/ChatWindow'
import styles from './Messaging.module.css'

export default function Messaging() {
  const [searchParams] = useSearchParams()
  const [conversations, setConversations] = useState([])
  const [activeUser, setActiveUser] = useState(null)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [loading, setLoading] = useState(true)

  const initialUserId = searchParams.get('userId')

  useEffect(() => {
    let cancelled = false

    Promise.all([fetchConversations(), fetchProfile()])
      .then(([conversationsData, profile]) => {
        if (cancelled) return
        const convs = conversationsData.conversations ?? []
        setConversations(convs)
        setCurrentUserId(profile?.id ?? null)
        if (initialUserId) {
          const existing = convs.find(c => c.other_user?.id === initialUserId)
          if (existing) {
            setActiveUser(existing.other_user)
          } else {
            fetchUserProfile(initialUserId)
              .then(profile => { if (!cancelled) setActiveUser(profile) })
              .catch(() => { if (!cancelled) setActiveUser({ id: initialUserId, display_name: 'Unknown User' }) })
          }
        }
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
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
              currentUserId={currentUserId}
            />
          </div>
        </div>
      )}
    </div>
  )
}
