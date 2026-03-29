import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MockDataProvider } from './context/MockDataContext'
import TopNav from './components/TopNav/TopNav'
import Home from './features/home/Home'
import Me from './features/me/Me'
import Network from './features/network/Network'
import Messaging from './features/messaging/Messaging'
import JobsPage from './pages/JobsPage'
import NotificationsPage from './pages/NotificationsPage'
import styles from './App.module.css'

export default function App() {
  return (
    <MockDataProvider>
      <BrowserRouter>
        <TopNav />
        <main className={styles.main}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/network" element={<Network />} />
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/messaging" element={<Messaging />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/me" element={<Me />} />
          </Routes>
        </main>
      </BrowserRouter>
    </MockDataProvider>
  )
}
