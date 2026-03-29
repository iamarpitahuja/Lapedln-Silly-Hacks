const API_BASE = '/api'

export async function fetchFeed({ limit = 20, offset = 0 } = {}) {
  const res = await fetch(`${API_BASE}/feed?limit=${limit}&offset=${offset}`)
  if (!res.ok) throw new Error(`Feed fetch failed: ${res.status}`)
  return res.json()
}

export async function createPost({ content, postType = 'Career Lore' }) {
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
