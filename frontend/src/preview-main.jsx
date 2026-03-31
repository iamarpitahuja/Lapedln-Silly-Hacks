import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import { UserProvider } from './context/UserContext'
import { LarpMaxxer } from './features/larpmaxxer/index'
import './index.css'

function PreviewApp() {
  const navigate = useNavigate()
  return (
    <UserProvider>
      <LarpMaxxer onExitTraining={() => navigate('/')} />
    </UserProvider>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<PreviewApp />} />
        </Routes>
      </BrowserRouter>
    </MotionConfig>
  </StrictMode>
)
