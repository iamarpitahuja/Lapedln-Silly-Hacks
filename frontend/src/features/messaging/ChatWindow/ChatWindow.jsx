import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../../lib/supabase'
import {
  fetchMessageHistory,
  sendMessage,
  fetchGroupMessageHistory,
  sendGroupMessage,
} from '../../../services/api'
import MessageBubble from '../MessageBubble/MessageBubble'
import { getInitials } from '../../../utils/strings'
import styles from './ChatWindow.module.css'

const AVATAR_COLORS = ['#a78bfa', '#7db5ff', '#5ad7c1', '#b39bff', '#f1c75b', '#f289a8']

function getAvatarColor(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export default function ChatWindow({ otherUser, group, currentUserId }) {
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef(null)

  const isGroup = Boolean(group)
  const otherUserId = otherUser?.id ?? null
  const groupId = group?.id ?? null

  // Load history on conversation change
  useEffect(() => {
    if (!otherUserId && !groupId) return
    setLoading(true)
    setMessages([])

    const loadMessages = isGroup
      ? fetchGroupMessageHistory(groupId)
      : fetchMessageHistory(otherUserId)

    loadMessages
      .then(data => setMessages(data.messages ?? []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [otherUserId, groupId, isGroup])

  // Supabase Realtime for 1:1
  useEffect(() => {
    if (!otherUserId || !currentUserId || isGroup) return

    const channel = supabase
      .channel(`messages-${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${currentUserId}`,
        },
        (payload) => {
          if (payload.new.sender_id === otherUserId) {
            setMessages(prev => [...prev, payload.new])
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [otherUserId, currentUserId, isGroup])

  // Supabase Realtime for groups
  useEffect(() => {
    if (!groupId || !currentUserId || !isGroup) return

    const channel = supabase
      .channel(`group-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `conversation_id=eq.${groupId}`,
        },
        (payload) => {
          if (payload.new.sender_id !== currentUserId) {
            setMessages(prev => [...prev, payload.new])
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [groupId, currentUserId, isGroup])

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    const content = draft.trim()
    if (!content || sending) return
    if (!isGroup && (!otherUserId || !currentUserId)) return
    if (isGroup && !groupId) return

    setSending(true)
    setDraft('')

    const optimistic = {
      id: `opt-${Date.now()}`,
      sender_id: currentUserId,
      receiver_id: isGroup ? null : otherUserId,
      conversation_id: isGroup ? groupId : null,
      content,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])

    try {
      const saved = isGroup
        ? await sendGroupMessage(groupId, content)
        : await sendMessage(otherUserId, content)
      setMessages(prev => prev.map(m => m.id === optimistic.id ? saved : m))
    } catch (e) {
      console.error(e)
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
      setDraft(content)
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!otherUser && !group) {
    return (
      <div className={styles.empty}>
        <p>Select a conversation to start messaging</p>
      </div>
    )
  }

  const headerName = isGroup
    ? group.name
    : (otherUser.display_name || 'Anonymous Larper')

  const headerSubtitle = isGroup
    ? `${group.members?.length ?? 0} members`
    : (otherUser.job ?? otherUser.title ?? 'Aspiring Thought Leader')

  return (
    <div className={styles.window}>
      <div className={styles.header}>
        {isGroup ? (
          <div className={styles.groupAvatar}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
          </div>
        ) : (
          <div className={styles.avatar} style={{ background: getAvatarColor(headerName) }}>
            {otherUser.avatar_url
              ? <img src={otherUser.avatar_url} alt={headerName} className={styles.avatarImg} />
              : getInitials(headerName)
            }
          </div>
        )}
        <div>
          <div className={styles.headerName}>{headerName}</div>
          <div className={styles.headerTitle}>{headerSubtitle}</div>
        </div>
      </div>

      <div className={styles.messages}>
        {loading && <p className={styles.state}>Loading messages…</p>}
        {!loading && messages.length === 0 && (
          <p className={styles.state}>
            {isGroup
              ? 'No messages yet. Start the group conversation.'
              : 'No messages yet. Break the ice with some synergy.'}
          </p>
        )}
        {messages.map(msg => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isMine={msg.sender_id === currentUserId}
            showSender={isGroup}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className={styles.inputBar}>
        <textarea
          className={styles.input}
          placeholder="Write a message… (Enter to send)"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={sending}
        />
        <button
          className={styles.sendBtn}
          onClick={handleSend}
          disabled={!draft.trim() || sending}
        >
          Send
        </button>
      </div>
    </div>
  )
}
