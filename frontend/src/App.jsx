import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { MockDataProvider } from './context/MockDataContext'
import TopNav from './components/TopNav/TopNav'
import Home from './features/home/Home'
import Me from './features/me/Me'
import Network from './features/network/Network'
import Messaging from './features/messaging/Messaging'
import JobsPage from './pages/JobsPage'
import NotificationsPage from './pages/NotificationsPage'
import PublicProfile from './features/profile/PublicProfile'
import AuthPage from './features/auth/AuthPage'
import styles from './App.module.css'

function AppRoutes() {
  const { session, loading } = useAuth()

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
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/network" element={<Network />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/messaging" element={<Messaging />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/me" element={<Me />} />
          <Route path="/profile/:userId" element={<PublicProfile />} />
        </Routes>
      </main>
    </MockDataProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
