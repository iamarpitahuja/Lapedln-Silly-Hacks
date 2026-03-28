import { supabase } from '../lib/supabase'

const API_BASE = '/api'

async function authFetch(url, options = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  const headers = { ...options.headers }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(url, { ...options, headers })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Request failed: ${res.status}`)
  }
  // Some endpoints (DELETE) may return no body
  const contentType = res.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    return res.json()
  }
}

export async function fetchFeed({ limit = 20, offset = 0 } = {}) {
  return authFetch(`${API_BASE}/feed?limit=${limit}&offset=${offset}`)
}

export async function createPost({ content, postType = 'thought_leadership' }) {
  return authFetch(`${API_BASE}/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, post_type: postType }),
  })
}

export async function updateTitle(title) {
  return authFetch(`${API_BASE}/jobs/title`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  })
}

export async function fetchProfile() {
  return authFetch(`${API_BASE}/me`)
}

export async function checkHealth() {
  const res = await fetch('/health')
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`)
  return res.json()
}

// ── Connections ──────────────────────────────────────────────────────────────

export async function fetchConnections() {
  return authFetch(`${API_BASE}/connections`)
}

export async function fetchPendingConnections() {
  return authFetch(`${API_BASE}/connections/pending`)
}

export async function fetchConnectionSuggestions() {
  return authFetch(`${API_BASE}/connections/suggestions`)
}

export async function sendConnectionRequest(addresseeId) {
  return authFetch(`${API_BASE}/connections/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ addressee_id: addresseeId }),
  })
}

export async function acceptConnection(connectionId) {
  return authFetch(`${API_BASE}/connections/${connectionId}/accept`, {
    method: 'PATCH',
  })
}

export async function declineConnection(connectionId) {
  return authFetch(`${API_BASE}/connections/${connectionId}/decline`, {
    method: 'PATCH',
  })
}

export async function removeConnection(connectionId) {
  return authFetch(`${API_BASE}/connections/${connectionId}`, {
    method: 'DELETE',
  })
}

// ── Messages ─────────────────────────────────────────────────────────────────

export async function fetchConversations() {
  return authFetch(`${API_BASE}/messages/conversations`)
}

export async function fetchMessageHistory(otherUserId) {
  return authFetch(`${API_BASE}/messages/${otherUserId}`)
}

export async function sendMessage(receiverId, content) {
  return authFetch(`${API_BASE}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ receiver_id: receiverId, content }),
  })
}
