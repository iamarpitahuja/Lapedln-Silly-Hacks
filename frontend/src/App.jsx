import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { MockDataProvider } from './context/MockDataContext'
import { UserProvider } from './context/UserContext'
import TopNav from './components/TopNav/TopNav'
import Home from './features/home/Home'
import Me from './features/me/Me'
import StubPage from './pages/StubPage'
import PersonaSelect from './pages/PersonaSelect'
import { LarpMaxxer } from './features/larpmaxxer'
import styles from './App.module.css'

function LarpMaxxerPage() {
  const navigate = useNavigate()
  return <LarpMaxxer onExitTraining={() => navigate('/me')} />
}

export default function App() {
  return (
    <UserProvider>
      <MockDataProvider>
        <BrowserRouter>
          <Routes>
            {/* LarpMaxxer — full-screen, no TopNav */}
            <Route path="/larpmaxxer" element={<LarpMaxxerPage />} />
            <Route path="/persona-select" element={<PersonaSelect />} />

            {/* All other routes get the TopNav */}
            <Route path="*" element={
              <>
                <TopNav />
                <main className={styles.main}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/network" element={<StubPage title="My Network" />} />
                    <Route path="/jobs" element={<StubPage title="J*bs" />} />
                    <Route path="/messaging" element={<StubPage title="Messaging" />} />
                    <Route path="/notifications" element={<StubPage title="Notifications" />} />
                    <Route path="/me" element={<Me />} />
                  </Routes>
                </main>
              </>
            } />
          </Routes>
        </BrowserRouter>
      </MockDataProvider>
    </UserProvider>
  )
}
