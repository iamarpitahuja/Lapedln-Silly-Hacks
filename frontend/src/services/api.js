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
  // 204 No Content — nothing to parse
  if (res.status === 204) return
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

export async function deletePost(postId) {
  return authFetch(`${API_BASE}/posts/${postId}`, { method: 'DELETE' })
}

export async function fetchJobOptions() {
  return authFetch(`${API_BASE}/jobs/options`)
}

export async function updateJob(job) {
  return authFetch(`${API_BASE}/jobs/current`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ job }),
  })
}

export async function fetchProfile() {
  return authFetch(`${API_BASE}/me`)
}

export async function fetchUserProfile(userId) {
  return authFetch(`${API_BASE}/users/${userId}`)
}

export async function updateProfilePatch(payload) {
  return authFetch(`${API_BASE}/me`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
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

export async function fetchOutgoingConnections() {
  return authFetch(`${API_BASE}/connections/outgoing`)
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

export async function fetchMessageableUsers() {
  return authFetch(`${API_BASE}/messages/users`)
}

export async function createGroupConversation(memberIds, name = '') {
  return authFetch(`${API_BASE}/messages/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ member_ids: memberIds, name }),
  })
}

export async function fetchGroupMessageHistory(conversationId) {
  return authFetch(`${API_BASE}/messages/groups/${conversationId}`)
}

export async function sendGroupMessage(conversationId, content) {
  return authFetch(`${API_BASE}/messages/groups/${conversationId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
}

// ── Post Interactions ────────────────────────────────────────────────────────

export async function createPostComment(postId, content) {
  return authFetch(`${API_BASE}/posts/${postId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
}

export async function editPostComment(postId, commentId, content) {
  return authFetch(`${API_BASE}/posts/${postId}/comments/${commentId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
}

export async function deletePostComment(postId, commentId) {
  return authFetch(`${API_BASE}/posts/${postId}/comments/${commentId}`, {
    method: 'DELETE',
  })
}

export async function createRelarp(postId, commentary = '') {
  return authFetch(`${API_BASE}/posts/${postId}/relarp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ commentary }),
  })
}

export async function removeRelarp(postId) {
  return authFetch(`${API_BASE}/posts/${postId}/relarp`, {
    method: 'DELETE',
  })
}

export async function createLike(postId) {
  return authFetch(`${API_BASE}/posts/${postId}/like`, {
    method: 'POST',
  })
}

export async function removeLike(postId) {
  return authFetch(`${API_BASE}/posts/${postId}/like`, {
    method: 'DELETE',
  })
}

export async function createLove(postId) {
  return authFetch(`${API_BASE}/posts/${postId}/love`, {
    method: 'POST',
  })
}

export async function removeLove(postId) {
  return authFetch(`${API_BASE}/posts/${postId}/love`, {
    method: 'DELETE',
  })
}

export async function createGlaze(postId, content) {
  return authFetch(`${API_BASE}/posts/${postId}/glaze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
}

export async function removeGlaze(postId) {
  return authFetch(`${API_BASE}/posts/${postId}/glaze`, {
    method: 'DELETE',
  })
}

// ── Relarp Reactions ─────────────────────────────────────────────────────────

export async function createRelarpLike(relarpId) {
  return authFetch(`${API_BASE}/relarps/${relarpId}/like`, { method: 'POST' })
}

export async function removeRelarpLike(relarpId) {
  return authFetch(`${API_BASE}/relarps/${relarpId}/like`, { method: 'DELETE' })
}

export async function createRelarpLove(relarpId) {
  return authFetch(`${API_BASE}/relarps/${relarpId}/love`, { method: 'POST' })
}

export async function removeRelarpLove(relarpId) {
  return authFetch(`${API_BASE}/relarps/${relarpId}/love`, { method: 'DELETE' })
}

export async function createRelarpGlaze(relarpId) {
  return authFetch(`${API_BASE}/relarps/${relarpId}/glaze`, { method: 'POST' })
}

export async function removeRelarpGlaze(relarpId) {
  return authFetch(`${API_BASE}/relarps/${relarpId}/glaze`, { method: 'DELETE' })
}

// ── Notifications ────────────────────────────────────────────────────────────

export async function fetchNotifications({ limit = 25 } = {}) {
  return authFetch(`${API_BASE}/notifications?limit=${limit}`)
}

// ── Games ───────────────────────────────────────────────────────────────────

export async function claimGameReward(game) {
  return authFetch(`${API_BASE}/games/claim-reward`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ game }),
  })
}

// ── LarpMaxxer ───────────────────────────────────────────────────────────────

export async function fetchLarpmaxxerBootstrap() {
  return authFetch(`${API_BASE}/larpmaxxer/bootstrap`)
}

export async function fetchLarpmaxxerScenarioContent(scenarioId) {
  return authFetch(`${API_BASE}/larpmaxxer/scenarios/${scenarioId}/content`)
}

export async function fetchLarpmaxxerProgress() {
  return authFetch(`${API_BASE}/larpmaxxer/progress`)
}

export async function patchLarpmaxxerProgress(payload) {
  return authFetch(`${API_BASE}/larpmaxxer/progress`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}
