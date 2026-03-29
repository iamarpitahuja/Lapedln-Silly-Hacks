import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { PersonaId } from '../features/larpmaxxer/types'

type CompletedScenario = {
  scenarioId: string
  score: number
  bestScore: number
}

type LastSessionResult = {
  scenarioName: string
  delta: number
  score: number
}

type UserState = {
  userId: string
  displayName: string
  personaId: PersonaId | null
  larpRating: number
  completedScenarios: CompletedScenario[]
}

type UserContextType = UserState & {
  setPersona: (id: PersonaId) => void
  updateLarpRating: (delta: number) => void
  recordScenarioCompletion: (scenarioId: string, score: number) => void
  lastSessionResult: LastSessionResult | null
  setLastSessionResult: (result: LastSessionResult | null) => void
}

const STORAGE_KEY = 'larped_in_user'
const INITIAL_LARP_RATING = 50.0
const MIN_LARP_RATING = 1.0

function generateUserId(): string {
  return 'user_' + Math.random().toString(36).slice(2, 11)
}

function loadFromStorage(): UserState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as UserState
  } catch {
    return null
  }
}

function saveToStorage(state: UserState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // storage quota exceeded — ignore
  }
}

const defaultState: UserState = {
  userId: generateUserId(),
  displayName: 'Anonymous Larper',
  personaId: null,
  larpRating: INITIAL_LARP_RATING,
  completedScenarios: [],
}

const UserContext = createContext<UserContextType | null>(null)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<UserState>(() => {
    const stored = loadFromStorage()
    return stored ?? { ...defaultState, userId: generateUserId() }
  })
  // Session-only — not persisted to localStorage
  const [lastSessionResult, setLastSessionResult] = useState<LastSessionResult | null>(null)

  useEffect(() => {
    saveToStorage(state)
  }, [state])

  const setPersona = useCallback((id: PersonaId) => {
    setState(prev => ({ ...prev, personaId: id }))
  }, [])

  const updateLarpRating = useCallback((delta: number) => {
    setState(prev => ({
      ...prev,
      larpRating: Math.max(MIN_LARP_RATING, Math.round((prev.larpRating + delta) * 10) / 10),
    }))
  }, [])

  const recordScenarioCompletion = useCallback((scenarioId: string, score: number) => {
    setState(prev => {
      const existing = prev.completedScenarios.find(c => c.scenarioId === scenarioId)
      const updated = existing
        ? prev.completedScenarios.map(c =>
            c.scenarioId === scenarioId
              ? { ...c, score, bestScore: Math.max(c.bestScore, score) }
              : c
          )
        : [...prev.completedScenarios, { scenarioId, score, bestScore: score }]
      return { ...prev, completedScenarios: updated }
    })
  }, [])

  return (
    <UserContext.Provider value={{ ...state, setPersona, updateLarpRating, recordScenarioCompletion, lastSessionResult, setLastSessionResult }}>
      {children}
    </UserContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUser(): UserContextType {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}
