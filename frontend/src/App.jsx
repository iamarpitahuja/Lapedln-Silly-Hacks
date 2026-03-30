import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { MotionConfig, AnimatePresence, motion as Motion } from 'framer-motion'
import { AuthProvider, useAuth } from './context/AuthContext'
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
import { easeOutQuint } from './lib/motion'
import styles from './App.module.css'

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
    <MockDataProvider>
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
    </MockDataProvider>
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

