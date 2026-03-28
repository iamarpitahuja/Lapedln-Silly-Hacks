const API_BASE = '/api'

export async function fetchFeed({ limit = 20, offset = 0 } = {}) {
  const res = await fetch(`${API_BASE}/feed?limit=${limit}&offset=${offset}`)
  if (!res.ok) throw new Error(`Feed fetch failed: ${res.status}`)
  return res.json()
}

export async function createPost({ content, postType = 'thought_leadership' }) {
  const res = await fetch(`${API_BASE}/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, post_type: postType }),
  })
  if (!res.ok) throw new Error(`Post creation failed: ${res.status}`)
  return res.json()
}

export async function updateTitle(title) {
  const res = await fetch(`${API_BASE}/jobs/title`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  })
  if (!res.ok) throw new Error(`Title update failed: ${res.status}`)
  return res.json()
}

export async function fetchProfile() {
  const res = await fetch(`${API_BASE}/me`)
  if (!res.ok) throw new Error(`Profile fetch failed: ${res.status}`)
  return res.json()
}

export async function checkHealth() {
  const res = await fetch('/health')
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`)
  return res.json()
}

// ── Connections ──────────────────────────────────────────────────────────────

export async function fetchConnections() {
  const res = await fetch(`${API_BASE}/connections`)
  if (!res.ok) throw new Error(`Connections fetch failed: ${res.status}`)
  return res.json()
}

export async function fetchPendingConnections() {
  const res = await fetch(`${API_BASE}/connections/pending`)
  if (!res.ok) throw new Error(`Pending connections fetch failed: ${res.status}`)
  return res.json()
}

export async function fetchConnectionSuggestions() {
  const res = await fetch(`${API_BASE}/connections/suggestions`)
  if (!res.ok) throw new Error(`Suggestions fetch failed: ${res.status}`)
  return res.json()
}

export async function sendConnectionRequest(addresseeId) {
  const res = await fetch(`${API_BASE}/connections/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ addressee_id: addresseeId }),
  })
  if (!res.ok) throw new Error(`Connection request failed: ${res.status}`)
  return res.json()
}

export async function acceptConnection(connectionId) {
  const res = await fetch(`${API_BASE}/connections/${connectionId}/accept`, {
    method: 'PATCH',
  })
  if (!res.ok) throw new Error(`Accept failed: ${res.status}`)
  return res.json()
}

export async function declineConnection(connectionId) {
  const res = await fetch(`${API_BASE}/connections/${connectionId}/decline`, {
    method: 'PATCH',
  })
  if (!res.ok) throw new Error(`Decline failed: ${res.status}`)
  return res.json()
}

export async function removeConnection(connectionId) {
  const res = await fetch(`${API_BASE}/connections/${connectionId}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error(`Remove connection failed: ${res.status}`)
}

// ── Messages ─────────────────────────────────────────────────────────────────

export async function fetchConversations() {
  const res = await fetch(`${API_BASE}/messages/conversations`)
  if (!res.ok) throw new Error(`Conversations fetch failed: ${res.status}`)
  return res.json()
}

export async function fetchMessageHistory(otherUserId) {
  const res = await fetch(`${API_BASE}/messages/${otherUserId}`)
  if (!res.ok) throw new Error(`Message history fetch failed: ${res.status}`)
  return res.json()
}

export async function sendMessage(receiverId, content) {
  const res = await fetch(`${API_BASE}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ receiver_id: receiverId, content }),
  })
  if (!res.ok) throw new Error(`Send message failed: ${res.status}`)
  return res.json()
}
