import { useState, useEffect, useCallback, useRef } from 'react'
import { motion as Motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import styles from './AuthPage.module.css'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

const TAGLINES = [
  'Where delusion meets opportunity.',
  'Fake it till they fund it.',
  'Your network is your net worth (literally, we score it).',
  'Be the thought leader you pretend to be.',
  'Synergize your personal brand into the stratosphere.',
  'Rizz your way to Series A.',
  'No cap, your LinkedIn is mid. We can fix that.',
  'POV: you just made unemployment look like a founder arc.',
  'The professional networking platform that glazes back.',
  'Turning red flags into green flags since 2025.',
]

export default function AuthPage() {
  const { signIn, signUp, signInWithGoogle } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmSent] = useState(false)
  const logoSrc = '/logoDarkMode.png'

  const tagline = TAGLINES[Math.floor(Date.now() / 60000) % TAGLINES.length]

  const googleReady = useRef(false)

  const handleGoogleResponse = useCallback(async (response) => {
    setError('')
    setLoading(true)
    try {
      await signInWithGoogle(response.credential)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [signInWithGoogle])

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = () => {
      window.google?.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      })
      googleReady.current = true
    }
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
  }, [handleGoogleResponse])

  const handleGoogleClick = () => {
    if (googleReady.current && window.google) {
      window.google.accounts.id.prompt()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isSignUp) {
        await signUp(email, password, displayName.trim() || 'Anonymous Larper')
      } else {
        await signIn(email, password)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (confirmSent) return null

  return (
    <div className={styles.page}>
      <div className={styles.backdrop} />

      <div className={styles.card}>
        <div className={styles.logoBlock}>
          <img src={logoSrc} alt="LarpedIn logo" className={styles.logo} />
          <span className={styles.logoText}>LarpedIn</span>
        </div>

        <p className={styles.tagline}>{tagline}</p>

        <h1 className={styles.heading}>
          {isSignUp ? 'Begin your ascension' : 'Welcome back, you absolute visionary'}
        </h1>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          {isSignUp && (
            <label className={styles.label}>
              <span>Full Name</span>
              <input
                type="text"
                className={styles.input}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your main character name"
                required
                autoComplete="name"
              />
            </label>
          )}

          <label className={styles.label}>
            <span>Email</span>
            <input
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="visionary@disruption.io"
              required
              autoComplete="email"
            />
          </label>

          <label className={styles.label}>
            <span>Password</span>
            <input
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isSignUp ? 'Min 6 characters (make it your safe word from standup)' : 'Your secret sauce'}
              required
              minLength={6}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
            />
          </label>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading
              ? 'Synergizing...'
              : isSignUp
                ? 'Create Account'
                : 'Sign In'}
          </button>
        </form>

        {GOOGLE_CLIENT_ID && (
          <>
            <div className={styles.divider}>or</div>
            <Motion.button
              type="button"
              className={styles.googleBtn}
              onClick={handleGoogleClick}
              disabled={loading}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
              whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(167, 139, 250, 0.15)' }}
              whileTap={{ scale: 0.97 }}
            >
              <svg className={styles.googleIcon} width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9s0 1.452.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 2.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </Motion.button>
          </>
        )}

        <p className={styles.switchText}>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          <button
            className={styles.switchBtn}
            onClick={() => { setIsSignUp(!isSignUp); setError('') }}
          >
            {isSignUp ? 'Sign in' : 'Sign up'}
          </button>
        </p>
      </div>

      <p className={styles.footer}>
        By joining, you consent to having your entire personality scored by AI. No takebacks.
      </p>
    </div>
  )
}
