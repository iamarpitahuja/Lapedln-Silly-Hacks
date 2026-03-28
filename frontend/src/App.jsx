import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MockDataProvider } from './context/MockDataContext'
import TopNav from './components/TopNav/TopNav'
import Home from './features/home/Home'
import Me from './features/me/Me'
import JobsPage from './pages/JobsPage'
import StubPage from './pages/StubPage'
import styles from './App.module.css'

export default function App() {
  return (
    <MockDataProvider>
      <BrowserRouter>
        <TopNav />
        <main className={styles.main}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/network" element={<StubPage title="My Network" />} />
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/messaging" element={<StubPage title="Messaging" />} />
            <Route path="/notifications" element={<StubPage title="Notifications" />} />
            <Route path="/me" element={<Me />} />
          </Routes>
        </main>
      </BrowserRouter>
    </MockDataProvider>
  )
}
