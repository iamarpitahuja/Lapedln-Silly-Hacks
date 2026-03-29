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

export async function updateProfilePatch(payload) {
  const res = await fetch(`${API_BASE}/me`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Profile patch failed: ${res.status}`)
  return res.json()
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

// ── Post Interactions ────────────────────────────────────────────────────────

export async function createPostComment(postId, content) {
  const res = await fetch(`${API_BASE}/posts/${postId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
  if (!res.ok) throw new Error(`Comment creation failed: ${res.status}`)
  return res.json()
}

export async function createRelarp(postId, commentary = '') {
  const res = await fetch(`${API_BASE}/posts/${postId}/relarp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ commentary }),
  })
  if (!res.ok) throw new Error(`Relarp failed: ${res.status}`)
  return res.json()
}

export async function removeRelarp(postId) {
  const res = await fetch(`${API_BASE}/posts/${postId}/relarp`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error(`Undo relarp failed: ${res.status}`)
}

export async function createLike(postId) {
  const res = await fetch(`${API_BASE}/posts/${postId}/like`, {
    method: 'POST',
  })
  if (!res.ok) throw new Error(`Like failed: ${res.status}`)
  return res.json()
}

export async function removeLike(postId) {
  const res = await fetch(`${API_BASE}/posts/${postId}/like`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error(`Undo like failed: ${res.status}`)
}

export async function createLove(postId) {
  const res = await fetch(`${API_BASE}/posts/${postId}/love`, {
    method: 'POST',
  })
  if (!res.ok) throw new Error(`Love failed: ${res.status}`)
  return res.json()
}

export async function removeLove(postId) {
  const res = await fetch(`${API_BASE}/posts/${postId}/love`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error(`Undo love failed: ${res.status}`)
}

export async function createGlaze(postId, content) {
  const res = await fetch(`${API_BASE}/posts/${postId}/glaze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
  if (!res.ok) throw new Error(`Glaze failed: ${res.status}`)
  return res.json()
}

export async function removeGlaze(postId) {
  const res = await fetch(`${API_BASE}/posts/${postId}/glaze`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error(`Undo glaze failed: ${res.status}`)
}

// ── Notifications ────────────────────────────────────────────────────────────

export async function fetchNotifications({ limit = 25 } = {}) {
  const res = await fetch(`${API_BASE}/notifications?limit=${limit}`)
  if (!res.ok) throw new Error(`Notifications fetch failed: ${res.status}`)
  return res.json()
}
