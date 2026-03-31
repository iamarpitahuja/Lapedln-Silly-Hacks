import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import styles from './AuthPage.module.css'

const TAGLINES = [
  'Where delusion meets opportunity.',
  'Fake it till they fund it.',
  'Your network is your net worth (literally, we score it).',
  'Be the thought leader you pretend to be.',
  'Synergize your personal brand into the stratosphere.',
]

export default function AuthPage() {
  const { signIn, signUp } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmSent] = useState(false)
  const logoSrc = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'light'
    ? '/logoLightMode.png'
    : '/logoDarkMode.png'

  const tagline = TAGLINES[Math.floor(Date.now() / 60000) % TAGLINES.length]

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
          {isSignUp ? 'Begin your ascension' : 'Welcome back, thought leader'}
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
                placeholder="Your thought leadership identity"
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
              placeholder={isSignUp ? 'Min 6 characters of pure ambition' : 'Your secret sauce'}
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
        By joining, you agree to have your professional delusions scored by AI.
      </p>
    </div>
  )
}
