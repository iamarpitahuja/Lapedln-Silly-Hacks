import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import styles from './AuthPage.module.css'

const TAGLINES = [
  'delulu is the solulu. we made it an app.',
  'fake it till they VC it.',
  'ur circle is ur net worth (we literally score it fr).',
  'be the sigma you were always meant to larp.',
  'rizz up your personal brand into the stratosphere no cap.',
]

export default function AuthPage() {
  const { signIn, signUp, signInWithGoogle } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmSent, setConfirmSent] = useState(false)

  const tagline = TAGLINES[Math.floor(Date.now() / 60000) % TAGLINES.length]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isSignUp) {
        await signUp(email, password)
        setConfirmSent(true)
      } else {
        await signIn(email, password)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(err.message)
    }
  }

  if (confirmSent) {
    return (
      <div className={styles.page}>
        <div className={styles.backdrop} />
        <div className={styles.card}>
          <div className={styles.logoBlock}>
            <img src="/logo.png" alt="LarpedIn" className={styles.logo} />
            <span className={styles.logoText}>LarpedIn</span>
          </div>
          <div className={styles.confirmBox}>
            <div className={styles.confirmIcon}>&#9993;</div>
            <h2 className={styles.confirmTitle}>check ur situationship (inbox)</h2>
            <p className={styles.confirmBody}>
              we slid a confirmation link to <strong>{email}</strong>.
              click it to activate ur arc and begin the ascension era.
            </p>
            <button
              className={styles.switchBtn}
              onClick={() => { setConfirmSent(false); setIsSignUp(false) }}
            >
              back to signin bestie
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.backdrop} />

      <div className={styles.card}>
        <div className={styles.logoBlock}>
          <img src="/logo.png" alt="LarpedIn" className={styles.logo} />
          <span className={styles.logoText}>LarpedIn</span>
        </div>

        <p className={styles.tagline}>{tagline}</p>

        <h1 className={styles.heading}>
          {isSignUp ? 'start ur era rn' : 'welcome back king/queen/liege'}
        </h1>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>
            <span>Email</span>
            <input
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sigma@disruption.io"
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
              placeholder={isSignUp ? 'min 6 chars of uncut delusion' : 'ur secret weapon bestie'}
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
              ? 'on it…'
              : isSignUp
                ? 'Start the arc'
                : 'Let me in fr'}
          </button>
        </form>

        <div className={styles.divider}>
          <span>or</span>
        </div>

        <button className={styles.googleBtn} onClick={handleGoogle}>
          <svg className={styles.googleIcon} viewBox="0 0 24 24" width="20" height="20">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#7db5ff"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#a78bfa"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#f1c75b"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#f289a8"/>
          </svg>
          hit different with Google
        </button>

        <p className={styles.switchText}>
          {isSignUp ? 'already got an acc?' : "no acc? that's lowkey wild"}
          <button
            className={styles.switchBtn}
            onClick={() => { setIsSignUp(!isSignUp); setError('') }}
          >
            {isSignUp ? 'sign in bestie' : 'join the arc'}
          </button>
        </p>
      </div>

      <p className={styles.footer}>
        by joining u consent to having ur delulu rated by AI. it's giving legal.
      </p>
    </div>
  )
}
