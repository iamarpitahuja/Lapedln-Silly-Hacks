import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion as Motion } from 'framer-motion'
import {
  fetchConversations,
  fetchProfile,
  fetchUserProfile,
  createGroupConversation,
} from '../../services/api'
import { easeOutQuint } from '../../lib/motion'
import ConversationList from './ConversationList/ConversationList'
import ChatWindow from './ChatWindow/ChatWindow'
import ComposeModal from './ComposeModal/ComposeModal'
import styles from './Messaging.module.css'

export default function Messaging() {
  const [searchParams] = useSearchParams()
  const [conversations, setConversations] = useState([])
  const [groups, setGroups] = useState([])
  const [activeUser, setActiveUser] = useState(null)
  const [activeGroup, setActiveGroup] = useState(null)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCompose, setShowCompose] = useState(false)

  const initialUserId = searchParams.get('userId')

  function loadConversations() {
    return fetchConversations().then(data => {
      setConversations(data.conversations ?? [])
      setGroups(data.groups ?? [])
      return data
    })
  }

  useEffect(() => {
    let cancelled = false

    Promise.all([loadConversations(), fetchProfile()])
      .then(([conversationsData, profile]) => {
        if (cancelled) return
        setCurrentUserId(profile?.id ?? null)
        if (initialUserId) {
          const convs = conversationsData.conversations ?? []
          const existing = convs.find(c => c.other_user?.id === initialUserId)
          if (existing) {
            setActiveUser(existing.other_user)
          } else {
            fetchUserProfile(initialUserId)
              .then(p => { if (!cancelled) setActiveUser(p) })
              .catch(() => { if (!cancelled) setActiveUser({ id: initialUserId, display_name: 'Unknown User' }) })
          }
        }
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [initialUserId])

  const handleSelectUser = (user) => {
    setActiveUser(user)
    setActiveGroup(null)
  }

  const handleSelectGroup = (group) => {
    setActiveGroup(group)
    setActiveUser(null)
  }

  const handleStartDm = (user) => {
    setShowCompose(false)
    setActiveUser(user)
    setActiveGroup(null)
  }

  const handleCreateGroup = async (memberIds) => {
    try {
      const group = await createGroupConversation(memberIds)
      setShowCompose(false)
      setActiveGroup(group)
      setActiveUser(null)
      loadConversations()
    } catch (e) {
      console.error('Failed to create group:', e)
    }
  }

  return (
    <div className={styles.page}>
      {loading ? (
        <p className={styles.loading}>Loading conversations…</p>
      ) : (
        <div className={styles.layout}>
          <ConversationList
            conversations={conversations}
            groups={groups}
            activeUserId={activeUser?.id}
            activeGroupId={activeGroup?.id}
            onSelect={handleSelectUser}
            onSelectGroup={handleSelectGroup}
            onNewMessage={() => setShowCompose(true)}
          />
          <div className={styles.chat}>
            <AnimatePresence mode="wait">
              <Motion.div
                key={activeGroup?.id ?? activeUser?.id ?? 'empty'}
                style={{ height: '100%' }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2, ease: easeOutQuint }}
              >
                <ChatWindow
                  otherUser={activeGroup ? null : activeUser}
                  group={activeGroup}
                  currentUserId={currentUserId}
                />
              </Motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showCompose && (
          <ComposeModal
            onClose={() => setShowCompose(false)}
            onStartDm={handleStartDm}
            onCreateGroup={handleCreateGroup}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

