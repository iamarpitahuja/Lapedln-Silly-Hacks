import { createContext, useContext, useEffect, useState } from 'react'

const TOKEN_KEY = 'larpedin.access_token'
const USER_KEY = 'larpedin.user'

const DEFAULT_AUTH_CONTEXT = {
  session: null,
  user: null,
  accessToken: null,
  loading: false,
  signUp: async () => ({ user: null }),
  signIn: async () => ({ user: null }),
  signInWithGoogle: async () => ({ user: null }),
  signOut: async () => undefined,
}

const AuthContext = createContext(DEFAULT_AUTH_CONTEXT)

function parseJwt(token) {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload))
  } catch {
    return null
  }
}

function isTokenExpired(token) {
  const payload = parseJwt(token)
  if (!payload?.exp) return true
  return Date.now() / 1000 > payload.exp
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore session from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    const userStr = localStorage.getItem(USER_KEY)

    if (token && !isTokenExpired(token) && userStr) {
      try {
        const user = JSON.parse(userStr)
        setSession({ access_token: token, user })
      } catch {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
      }
    }
    setLoading(false)
  }, [])

  const _setAuth = (token, user) => {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    setSession({ access_token: token, user })
  }

  const signUp = async (email, password, displayName) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, display_name: displayName }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.detail || 'Registration failed')
    }
    const data = await res.json()
    _setAuth(data.access_token, data.user)
    return data
  }

  const signIn = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.detail || 'Login failed')
    }
    const data = await res.json()
    _setAuth(data.access_token, data.user)
    return data
  }

  const signInWithGoogle = async (credential) => {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.detail || 'Google sign-in failed')
    }
    const data = await res.json()
    _setAuth(data.access_token, data.user)
    return data
  }

  const signOut = async () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      accessToken: session?.access_token ?? null,
      loading,
      signUp,
      signIn,
      signInWithGoogle,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  return ctx ?? DEFAULT_AUTH_CONTEXT
}
