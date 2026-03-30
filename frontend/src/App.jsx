import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { MotionConfig, AnimatePresence, motion as Motion } from 'framer-motion'
import { AuthProvider, useAuth } from './context/AuthContext'
import { UserProvider } from './context/UserContext'
import { MockDataProvider } from './context/MockDataContext'
import TopNav from './components/TopNav/TopNav'
import Home from './features/home/Home'
import Me from './features/me/Me'
import PublicProfile from './features/profile/PublicProfile'
import Network from './features/network/Network'
import Messaging from './features/messaging/Messaging'
import JobsPage from './pages/JobsPage'
import NotificationsPage from './pages/NotificationsPage'
import AuthPage from './features/auth/AuthPage'
import { LarpMaxxer } from './features/larpmaxxer/index'
import PersonaSelect from './pages/PersonaSelect'
import { easeOutQuint } from './lib/motion'
import styles from './App.module.css'

function LarpMaxxerPage() {
  const navigate = useNavigate()
  return <LarpMaxxer onExitTraining={() => navigate('/me')} />
}

function AppRoutes() {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className={styles.loading}>Synergizing your session...</div>
  }

  if (!session) {
    return <AuthPage />
  }

  return (
    <UserProvider>
      <MockDataProvider>
        <Routes>
          {/* Full-screen routes — no TopNav */}
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
