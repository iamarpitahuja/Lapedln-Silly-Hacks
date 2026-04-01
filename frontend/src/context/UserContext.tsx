import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import type { PersonaId } from '../features/larpmaxxer/types'
import { fetchLarpmaxxerProgress, patchLarpmaxxerProgress, fetchProfile } from '../services/api'

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
  job: string
  personaId: PersonaId | null
  larpRating: number
  completedScenarios: CompletedScenario[]
}

type UserContextType = UserState & {
  hydrated: boolean
  setPersona: (id: PersonaId) => void
  updateLarpRating: (delta: number) => void
  recordScenarioCompletion: (scenarioId: string, score: number, larpRatingDelta: number) => void
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
  job: '',
  personaId: null,
  larpRating: INITIAL_LARP_RATING,
  completedScenarios: [],
}

const UserContext = createContext<UserContextType | null>(null)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<UserState>(() => {
    const stored = loadFromStorage()
    const base = stored ?? { ...defaultState, userId: generateUserId() }
    return { ...base }
  })
  const stateRef = useRef(state)
  const [hydrated, setHydrated] = useState(false)
  // Session-only — not persisted to localStorage
  const [lastSessionResult, setLastSessionResult] = useState<LastSessionResult | null>(null)

  useEffect(() => {
    stateRef.current = state
    saveToStorage(state)
  }, [state])

  useEffect(() => {
    let cancelled = false

    async function hydrateFromApi() {
      try {
        const [progress, profile] = await Promise.all([
          fetchLarpmaxxerProgress().catch(() => null),
          fetchProfile().catch(() => null),
        ])
        if (cancelled) return

        setState(prev => ({
          ...prev,
          userId: typeof progress?.userId === 'string' ? progress.userId : prev.userId,
          job: typeof profile?.job === 'string' ? profile.job : prev.job,
          personaId: progress?.personaId ?? prev.personaId,
          larpRating: typeof profile?.larp_rating === 'number' ? profile.larp_rating : prev.larpRating,
          completedScenarios: Array.isArray(progress?.completedScenarios)
            ? progress.completedScenarios
            : prev.completedScenarios,
        }))
      } catch {
        // Keep localStorage state when backend is unavailable.
      } finally {
        if (!cancelled) setHydrated(true)
      }
    }

    hydrateFromApi()
    return () => {
      cancelled = true
    }
  }, [])

  const syncProgress = useCallback((payload: Record<string, unknown>) => {
    void patchLarpmaxxerProgress(payload).catch(() => {
      // Best effort sync; local state remains source of truth when backend is unavailable.
    })
  }, [])

  const setPersona = useCallback((id: PersonaId) => {
    setState(prev => ({ ...prev, personaId: id }))
    syncProgress({ personaId: id })
  }, [syncProgress])

  const updateLarpRating = useCallback((delta: number) => {
    const nextRating = Math.max(
      MIN_LARP_RATING,
      Math.round((stateRef.current.larpRating + delta) * 10) / 10
    )
    setState(prev => ({
      ...prev,
      larpRating: nextRating,
    }))
    syncProgress({ larpRating: nextRating })
  }, [syncProgress])

  const recordScenarioCompletion = useCallback((
    scenarioId: string,
    score: number,
    larpRatingDelta: number
  ) => {
    const existing = stateRef.current.completedScenarios.find(c => c.scenarioId === scenarioId)
    const nextCompletedScenarios = existing
      ? stateRef.current.completedScenarios.map(c =>
          c.scenarioId === scenarioId
            ? { ...c, score, bestScore: Math.max(c.bestScore, score) }
            : c
        )
      : [...stateRef.current.completedScenarios, { scenarioId, score, bestScore: score }]

    setState(prev => {
      return { ...prev, completedScenarios: nextCompletedScenarios }
    })
    syncProgress({ completedScenarios: nextCompletedScenarios, larpRatingDelta })
  }, [syncProgress])

  return (
    <UserContext.Provider value={{ ...state, hydrated, setPersona, updateLarpRating, recordScenarioCompletion, lastSessionResult, setLastSessionResult }}>
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
