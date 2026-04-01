const API_BASE = '/api'

async function authFetchRaw(url, options = {}) {
  const token = localStorage.getItem('larpedin.access_token')

  const headers = { ...options.headers }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(url, { ...options, headers })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Request failed: ${res.status}`)
  }

  return res
}

async function authFetch(url, options = {}) {
  const res = await authFetchRaw(url, options)

  // 204 No Content — nothing to parse
  if (res.status === 204) return
  const contentType = res.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    const data = await res.json()

    // Intercept rating_change from any API response and broadcast it
    if (data && data.rating_change) {
      window.dispatchEvent(
        new CustomEvent('rating:change', { detail: data.rating_change })
      )
    }

    return data
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

// Browser SpeechSynthesis fallback — produces a silent-ish blob while the
// browser voice actually plays aloud.  Callers treat the returned blob like
// normal audio; the real sound comes from SpeechSynthesis.
function _browserTtsFallback(text, signal) {
  return new Promise((resolve, reject) => {
    if (!window.speechSynthesis) {
      return reject(new Error('Browser TTS not supported'))
    }

    if (signal?.aborted) return reject(new DOMException('Aborted', 'AbortError'))

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1.0
    utterance.pitch = 1.0

    // Try to pick a natural-sounding English voice
    const voices = window.speechSynthesis.getVoices()
    const preferred = voices.find(v => /english/i.test(v.name) && v.lang.startsWith('en'))
      || voices.find(v => v.lang.startsWith('en'))
    if (preferred) utterance.voice = preferred

    const onAbort = () => {
      window.speechSynthesis.cancel()
      reject(new DOMException('Aborted', 'AbortError'))
    }
    signal?.addEventListener('abort', onAbort, { once: true })

    utterance.onend = () => {
      signal?.removeEventListener('abort', onAbort)
      // Return a tiny valid silent mp3 so callers that create Audio objects
      // don't error — the real audio already played via SpeechSynthesis.
      const silentMp3 = new Uint8Array([
        0xFF, 0xFB, 0x90, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x49, 0x6E, 0x66, 0x6F,
      ])
      resolve(new Blob([silentMp3], { type: 'audio/mpeg' }))
    }

    utterance.onerror = (e) => {
      signal?.removeEventListener('abort', onAbort)
      if (e.error === 'canceled') {
        reject(new DOMException('Aborted', 'AbortError'))
      } else {
        reject(new Error(`Browser TTS failed: ${e.error}`))
      }
    }

    window.speechSynthesis.speak(utterance)
  })
}

export async function fetchLarpmaxxerTts({ text, characterId, signal }) {
  try {
    const res = await authFetchRaw(`${API_BASE}/larpmaxxer/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        characterId,
      }),
      signal,
    })
    return await res.blob()
  } catch (err) {
    if (err?.name === 'AbortError') throw err
    // ElevenLabs unavailable — fall back to browser voice
    return _browserTtsFallback(text, signal)
  }
}

export async function fetchRoleplayTts({ text, voiceId, signal }) {
  try {
    const res = await authFetchRaw(`${API_BASE}/roleplay/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        voice_id: voiceId,
      }),
      signal,
    })
    return await res.blob()
  } catch (err) {
    if (err?.name === 'AbortError') throw err
    return _browserTtsFallback(text, signal)
  }
}
