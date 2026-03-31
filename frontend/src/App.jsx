import { AnimatePresence, motion as Motion, MotionConfig } from 'framer-motion'
import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import styles from './App.module.css'
import RatingToast from './components/RatingToast/RatingToast'
import TopNav from './components/TopNav/TopNav'
import { AuthProvider, useAuth } from './context/AuthContext'
import { MockDataProvider } from './context/MockDataContext'
import { UserProvider } from './context/UserContext'
import AuthPage from './features/auth/AuthPage'
import Home from './features/home/Home'
import { LarpMaxxer } from './features/larpmaxxer/index'
import Me from './features/me/Me'
import Messaging from './features/messaging/Messaging'
import Network from './features/network/Network'
import FeatureTour from './features/featureTour/FeatureTour'
import OnboardingPage from './features/onboarding/OnboardingPage'
import PublicProfile from './features/profile/PublicProfile'
import { easeOutQuint } from './lib/motion'
import JobsPage from './pages/JobsPage'
import NotificationsPage from './pages/NotificationsPage'
import PersonaSelect from './pages/PersonaSelect'
import { fetchProfile } from './services/api'

const FORCE_ONBOARDING_KEY = 'larpedin.forceOnboarding'
const FEATURE_TOUR_PENDING_KEY = 'larpedin.featureTourPending'

function isOnboardingIncomplete(profile) {
  if (!profile || typeof profile !== 'object') return true
  if (profile.onboarding_completed_at) return false

  const displayName = String(profile.display_name ?? '').trim()
  const job = String(profile?.job ?? profile?.title ?? '').trim()
  const bio = String(profile?.bio ?? '').trim()
  const skills = Array.isArray(profile?.skills) ? profile.skills : []
  const experience = Array.isArray(profile?.experience) ? profile.experience : []
  const hasDefaultName = !displayName || displayName === 'Anonymous Larper'
  const hasDefaultJob = !job || job === 'Aspiring Thought Leader'
  const hasNoProfileSignal = bio.length === 0 && skills.length === 0 && experience.length === 0

  return hasDefaultName || (hasDefaultJob && hasNoProfileSignal)
}

function LarpMaxxerPage() {
  const navigate = useNavigate()
  return <LarpMaxxer onExitTraining={() => navigate('/me')} />
}

function AppRoutes() {
  const { session, loading } = useAuth()
  const location = useLocation()
  const bypassOnboardingCheck = location.pathname === '/larpmaxxer' || location.pathname === '/persona-select'
  const [isNewUser, setIsNewUser] = useState(null)
  const [forceOnboarding, setForceOnboarding] = useState(false)
  const [isTourOpen, setIsTourOpen] = useState(
    () => typeof window !== 'undefined' && window.localStorage.getItem(FEATURE_TOUR_PENDING_KEY) === '1'
  )

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const raw = params.get('onboarding')?.toLowerCase()
    const isForce = raw === '1' || raw === 'true' || raw === 'force'
    const isClear = raw === '0' || raw === 'false' || raw === 'off'

    if (isForce) {
      window.localStorage.setItem(FORCE_ONBOARDING_KEY, '1')
      setForceOnboarding(true)
      return
    }

    if (isClear) {
      window.localStorage.removeItem(FORCE_ONBOARDING_KEY)
      setForceOnboarding(false)
      return
    }

    setForceOnboarding(window.localStorage.getItem(FORCE_ONBOARDING_KEY) === '1')
  }, [location.search])

  useEffect(() => {
    if (!session) {
      setIsNewUser(false)
      return
    }

    if (forceOnboarding) {
      setIsNewUser(false)
      return
    }

    if (bypassOnboardingCheck) {
      setIsNewUser(false)
      return
    }

    fetchProfile()
      .then(profile => {
        setIsNewUser(isOnboardingIncomplete(profile))
      })
      .catch(err => {
        const message = String(err?.message ?? '')
        const isMissingProfile = /404|406|not found|0 rows/i.test(message)
        setIsNewUser(isMissingProfile)
      })
  }, [session, bypassOnboardingCheck, forceOnboarding])

  if (loading || (!forceOnboarding && !bypassOnboardingCheck && isNewUser === null)) {
    return <div className={styles.loading}>Synergizing your session...</div>
  }

  if (!session) {
    return <AuthPage />
  }

  if (forceOnboarding && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  if (!forceOnboarding && isNewUser && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  if (!forceOnboarding && !isNewUser && location.pathname === '/onboarding') {
    return <Navigate to="/" replace />
  }

  return (
    <UserProvider>
      <MockDataProvider>
        <RatingToast />
        <Routes>
          {/* Full-screen routes — no TopNav */}
          <Route
            path="/onboarding"
            element={
              <OnboardingPage
                onComplete={() => {
                  setIsNewUser(false)
                  window.localStorage.setItem(FEATURE_TOUR_PENDING_KEY, '1')
                  setIsTourOpen(true)
                  window.localStorage.removeItem(FORCE_ONBOARDING_KEY)
                  setForceOnboarding(false)
                }}
              />
            }
          />
          <Route path="/larpmaxxer" element={<LarpMaxxerPage />} />
          <Route path="/persona-select" element={<PersonaSelect />} />

          {/* Standard layout routes */}
          <Route path="*" element={
            <>
              <TopNav />
              <main className={styles.main}>
                <AnimatePresence mode="wait">
                  <Motion.div
                    key={location.pathname}
                    className={styles.pageWrap}
                    initial={{ opacity: 0, y: 12 }} 
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.22, ease: easeOutQuint }}
                  >
                    <Routes location={location}>
                      <Route path="/" element={<Home />} />
                      <Route path="/network" element={<Network />} />
                      <Route path="/jobs" element={<JobsPage />} />
                      <Route path="/messaging" element={<Messaging />} />
                      <Route path="/notifications" element={<NotificationsPage />} />
                      <Route path="/me" element={<Me />} />
                      <Route path="/profile/:userId" element={<PublicProfile />} />
                    </Routes>
                  </Motion.div>
                </AnimatePresence>
              </main>
            </>
          } />
        </Routes>
        <FeatureTour
          isOpen={Boolean(session) && location.pathname !== '/onboarding' && isTourOpen}
          onFinish={() => {
            window.localStorage.removeItem(FEATURE_TOUR_PENDING_KEY)
            setIsTourOpen(false)
          }}
        />
      </MockDataProvider>
    </UserProvider>
  )
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </MotionConfig>
  )
}
