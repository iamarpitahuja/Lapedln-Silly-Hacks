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
