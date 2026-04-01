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

// Ensure browser voices are loaded (they load async in most browsers).
let _voicesReady = false
function _ensureVoices() {
  return new Promise((resolve) => {
    if (_voicesReady || window.speechSynthesis.getVoices().length > 0) {
      _voicesReady = true
      return resolve()
    }
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      _voicesReady = true
      resolve()
    }, { once: true })
    // Safety timeout — some browsers never fire voiceschanged
    setTimeout(() => resolve(), 500)
  })
}

// Build a valid WAV blob containing `durationSec` of silence.
// This gives callers a real playable Audio object for lifecycle management
// while the actual sound comes from SpeechSynthesis.
function _silentWavBlob(durationSec) {
  const sampleRate = 8000
  const numSamples = Math.max(sampleRate * durationSec, sampleRate * 0.1)
  const dataSize = numSamples * 2 // 16-bit mono
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)

  // WAV header
  const writeStr = (offset, str) => { for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i)) }
  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true)        // chunk size
  view.setUint16(20, 1, true)         // PCM
  view.setUint16(22, 1, true)         // mono
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true) // byte rate
  view.setUint16(32, 2, true)         // block align
  view.setUint16(34, 16, true)        // bits per sample
  writeStr(36, 'data')
  view.setUint32(40, dataSize, true)
  // samples are all zero = silence

  return new Blob([buffer], { type: 'audio/wav' })
}

// Browser SpeechSynthesis fallback. Speaks aloud via the browser engine,
// returns a valid silent WAV blob whose duration matches the speech so
// callers' Audio lifecycle (onended, play/pause) works naturally.
function _browserTtsFallback(text, signal) {
  return new Promise(async (resolve, reject) => {
    if (!window.speechSynthesis) {
      return reject(new Error('Browser TTS not supported'))
    }
    if (signal?.aborted) return reject(new DOMException('Aborted', 'AbortError'))

    await _ensureVoices()

    // Cancel any lingering speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1.0
    utterance.pitch = 1.0

    const voices = window.speechSynthesis.getVoices()
    const preferred = voices.find(v => v.lang.startsWith('en') && v.localService)
      || voices.find(v => v.lang.startsWith('en'))
    if (preferred) utterance.voice = preferred

    const startTime = Date.now()

    const onAbort = () => {
      window.speechSynthesis.cancel()
      reject(new DOMException('Aborted', 'AbortError'))
    }
    signal?.addEventListener('abort', onAbort, { once: true })

    utterance.onend = () => {
      signal?.removeEventListener('abort', onAbort)
      const spokenSec = (Date.now() - startTime) / 1000
      resolve(_silentWavBlob(spokenSec))
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
