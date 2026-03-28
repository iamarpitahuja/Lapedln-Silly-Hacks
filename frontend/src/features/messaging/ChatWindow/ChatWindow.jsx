import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../../lib/supabase'
import { fetchMessageHistory, sendMessage } from '../../../services/api'
import MessageBubble from '../MessageBubble/MessageBubble'
import { getInitials } from '../../../utils/strings'
import styles from './ChatWindow.module.css'

const AVATAR_COLORS = ['#0A66C2', '#057642', '#7c3aed', '#b45309', '#be123c', '#0891b2']

function getAvatarColor(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export default function ChatWindow({ otherUser, currentUserId }) {
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef(null)

  // Load history on conversation change
  useEffect(() => {
    if (!otherUser) return
    setLoading(true)
    setMessages([])
    fetchMessageHistory(otherUser.id)
      .then(data => setMessages(data.messages ?? []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [otherUser?.id])

  // Supabase Realtime: subscribe to incoming messages for current user
  useEffect(() => {
    if (!otherUser || !currentUserId) return

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
          // Only append if it's from the active conversation partner
          if (payload.new.sender_id === otherUser.id) {
            setMessages(prev => [...prev, payload.new])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [otherUser?.id, currentUserId])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    const content = draft.trim()
    if (!content || sending) return
    setSending(true)
    setDraft('')

    // Optimistic update
    const optimistic = {
      id: `opt-${Date.now()}`,
      sender_id: currentUserId,
      receiver_id: otherUser.id,
      content,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])

    try {
      const saved = await sendMessage(otherUser.id, content)
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

  if (!otherUser) {
    return (
      <div className={styles.empty}>
        <p>Select a conversation to start messaging</p>
      </div>
    )
  }

  const name = otherUser.display_name || 'Anonymous Larper'

  return (
    <div className={styles.window}>
      <div className={styles.header}>
        <div className={styles.avatar} style={{ background: getAvatarColor(name) }}>
          {otherUser.avatar_url
            ? <img src={otherUser.avatar_url} alt={name} className={styles.avatarImg} />
            : getInitials(name)
          }
        </div>
        <div>
          <div className={styles.headerName}>{name}</div>
          <div className={styles.headerTitle}>{otherUser.title ?? 'Aspiring Thought Leader'}</div>
        </div>
      </div>

      <div className={styles.messages}>
        {loading && <p className={styles.state}>Loading messages…</p>}
        {!loading && messages.length === 0 && (
          <p className={styles.state}>No messages yet. Break the ice with some synergy.</p>
        )}
        {messages.map(msg => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isMine={msg.sender_id === currentUserId}
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
