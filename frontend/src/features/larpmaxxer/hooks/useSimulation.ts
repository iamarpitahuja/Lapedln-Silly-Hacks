import { useReducer, useCallback, useRef, useEffect } from 'react'
import type {
  SimulationSession,
  SimulationStatus,
  ResponseOption,
  ConversationEntry,
  CumulativeStats,
  Meters,
  MoodState,
  EvaluationFlashData,
  EventCardData,
  SessionSummary,
  DialogueNode,
} from '../types'
import type { PersonaId } from '../types'
import { getAlignmentTier } from '../engine/personaAlignment'
import { isCringeIncident, computeProjectedDelta, computeSummaryMetrics } from '../engine/scoring'
import { SCENARIO_MAP } from '../../../content/scenarios'
import { CHARACTER_MAP } from '../../../content/characters'

// ─── Dynamic scenario content loader ─────────────────────────────────────────

async function loadScenarioContent(scenarioId: string) {
  const modules: Record<string, () => Promise<{ scenarioContent: import('../types').ScenarioContent }>> = {
    'coffee-chat': () => import('../../../content/scenarios/coffee-chat'),
    'networking-event': () => import('../../../content/scenarios/networking-event'),
    'first-day': () => import('../../../content/scenarios/first-day'),
    'interview': () => import('../../../content/scenarios/interview'),
    'finance-bro': () => import('../../../content/scenarios/finance-bro'),
    'liberal-arts': () => import('../../../content/scenarios/liberal-arts'),
    'homeless-cs': () => import('../../../content/scenarios/homeless-cs'),
    'richer-than-you': () => import('../../../content/scenarios/richer-than-you'),
    'cooler-than-you': () => import('../../../content/scenarios/cooler-than-you'),
    'vc-mixer': () => import('../../../content/scenarios/vc-mixer'),
    'prestige-internship': () => import('../../../content/scenarios/prestige-internship'),
    'founder-dinner': () => import('../../../content/scenarios/founder-dinner'),
    'startup-pitch': () => import('../../../content/scenarios/startup-pitch'),
    'startup-billionaire': () => import('../../../content/scenarios/startup-billionaire'),
  }
  const loader = modules[scenarioId]
  if (!loader) throw new Error(`No content for scenario: ${scenarioId}`)
  const mod = await loader()
  return mod.scenarioContent
}

// ─── State shape ──────────────────────────────────────────────────────────────

type SimState = {
  session: SimulationSession | null
  currentNode: DialogueNode | null
  scenarioContent: import('../types').ScenarioContent | null
  evaluationFlash: EvaluationFlashData | null
  eventCard: EventCardData | null
  summary: SessionSummary | null
  moodState: MoodState
  isTyping: boolean
  isLoading: boolean
  loadError: string | null
}

type Action =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_CONTENT'; content: import('../types').ScenarioContent; session: SimulationSession }
  | { type: 'LOAD_ERROR'; message: string }
  | { type: 'CONFIRM_START' }
  | { type: 'RESPONSE_SELECTED'; entry: ConversationEntry; flash: EvaluationFlashData; newMeters: Meters; newCumulative: CumulativeStats; newStatus: SimulationStatus; nextNode: DialogueNode | null }
  | { type: 'DISMISS_FLASH' }
  | { type: 'SHOW_TYPING' }
  | { type: 'HIDE_TYPING' }
  | { type: 'ADVANCE_CHARACTER_LINE'; entry: ConversationEntry; moodState: MoodState }
  | { type: 'TRIGGER_EVENT'; eventCard: EventCardData; newStatus: SimulationStatus; larpDelta: number }
  | { type: 'SHOW_SUMMARY'; summary: SessionSummary }
  | { type: 'RESET' }

const initialState: SimState = {
  session: null,
  currentNode: null,
  scenarioContent: null,
  evaluationFlash: null,
  eventCard: null,
  summary: null,
  moodState: 'neutral',
  isTyping: false,
  isLoading: false,
  loadError: null,
}

function deriveMoodState(meters: Meters): MoodState {
  if (meters.suspicion >= 70) return 'done'
  if (meters.impressed >= 80) return 'impressed'
  if (meters.impressed >= 50) return 'curious'
  return 'skeptical'
}

function clamp(val: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, val))
}

function reducer(state: SimState, action: Action): SimState {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, isLoading: true, loadError: null }

    case 'LOAD_CONTENT':
      return {
        ...state,
        isLoading: false,
        loadError: null,
        scenarioContent: action.content,
        session: action.session,
        moodState: 'neutral',
        currentNode: null,
        evaluationFlash: null,
        eventCard: null,
        summary: null,
      }

    case 'LOAD_ERROR':
      return { ...state, isLoading: false, loadError: action.message }

    case 'CONFIRM_START': {
      if (!state.scenarioContent || !state.session) return state
      const firstNode = state.scenarioContent.dialogueNodes[0] ?? null
      return {
        ...state,
        session: { ...state.session, status: 'active' },
        currentNode: firstNode,
      }
    }

    case 'RESPONSE_SELECTED': {
      if (!state.session) return state
      const updatedHistory = [...state.session.history, action.entry]
      return {
        ...state,
        session: {
          ...state.session,
          meters: action.newMeters,
          cumulative: action.newCumulative,
          turnCount: state.session.turnCount + 1,
          history: updatedHistory,
          status: action.newStatus,
        },
        evaluationFlash: action.flash,
        currentNode: action.nextNode ?? state.currentNode,
        moodState: deriveMoodState(action.newMeters),
      }
    }

    case 'DISMISS_FLASH':
      return { ...state, evaluationFlash: null }

    case 'SHOW_TYPING':
      return { ...state, isTyping: true }

    case 'HIDE_TYPING':
      return { ...state, isTyping: false }

    case 'ADVANCE_CHARACTER_LINE': {
      if (!state.session) return state
      return {
        ...state,
        isTyping: false,
        session: {
          ...state.session,
          history: [...state.session.history, action.entry],
        },
        moodState: action.moodState,
      }
    }

    case 'TRIGGER_EVENT': {
      if (!state.session) return state
      return {
        ...state,
        eventCard: action.eventCard,
        session: {
          ...state.session,
          status: action.newStatus,
          larpRatingDelta: action.larpDelta,
        },
      }
    }

    case 'SHOW_SUMMARY':
      return { ...state, summary: action.summary, eventCard: null }

    case 'RESET':
      return initialState

    default:
      return state
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSimulation(
  userId: string,
  personaId: PersonaId | null,
  onSessionEnd?: (delta: number, scenarioId: string, score: number) => void
) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    }
  }, [])

  const startSession = useCallback(async (scenarioId: string) => {
    if (!personaId) return
    dispatch({ type: 'LOAD_START' })

    const scenario = SCENARIO_MAP.get(scenarioId)
    const character = scenario ? CHARACTER_MAP.get(scenario.characterId) : null
    if (!scenario || !character) return

    // Apply character persona affinities to base meters
    const affinities = character.personaAffinities[personaId] ?? { impressed: 0, suspicion: 0 }
    const basemeters: Meters = {
      impressed: clamp(45 + affinities.impressed),
      suspicion: clamp(25 - affinities.suspicion),
      status: 65,
    }

    const session: SimulationSession = {
      sessionId: 'sim_' + Date.now(),
      userId,
      personaId,
      scenarioId,
      characterId: character.id,
      startedAt: Date.now(),
      turnCount: 0,
      maxTurns: scenario.maxTurns,
      meters: basemeters,
      cumulative: {
        sessionAura: 0,
        socialFooting: 0,
        larpContinuity: 0,
        respect: 0,
        cringeCount: 0,
        perfectAlignments: 0,
        adjacentAlignments: 0,
        offPersonaCount: 0,
        missedGlazeOps: 0,
        totalTurns: 0,
      },
      history: [],
      status: 'prebriefing',
    }

    try {
      const content = await loadScenarioContent(scenarioId)
      const openingEntry: ConversationEntry = {
        turn: 0,
        speaker: 'character',
        text: content.openingLine,
        moodState: 'neutral',
      }
      dispatch({ type: 'LOAD_CONTENT', content, session: { ...session, history: [openingEntry] } })
    } catch (e) {
      console.error('Failed to load scenario content', e)
      dispatch({ type: 'LOAD_ERROR', message: 'Failed to load scenario. Please try again.' })
    }
  }, [personaId, userId])

  const confirmStart = useCallback(() => {
    dispatch({ type: 'CONFIRM_START' })
  }, [])

  // ─── handleSessionEnd must be declared BEFORE selectResponse ─────────────────
  const handleSessionEnd = useCallback((
    status: SimulationStatus,
    prevSession: SimulationSession
  ) => {
    const character = CHARACTER_MAP.get(prevSession.characterId)
    const charName = character?.name ?? 'the character'

    if (status === 'exposure_ended' || status === 'breakthrough_ended') {
      const exposureLines = [
        "Wait — something isn't adding up here.",
        "I need to be somewhere. This was... informative.",
        "Actually, I think I've heard enough.",
      ]
      const breakthroughLines = [
        "Okay. I want to hear more. Can we get 30 minutes next week?",
        "This is actually interesting. I'll have someone reach out.",
        "You're more interesting than I expected. Let's talk properly.",
      ]
      const lines = status === 'exposure_ended' ? exposureLines : breakthroughLines

      dispatch({
        type: 'TRIGGER_EVENT',
        eventCard: {
          type: status === 'exposure_ended' ? 'exposure' : 'breakthrough',
          characterName: charName,
          characterLine: lines[Math.floor(Math.random() * lines.length)],
          endTurn: prevSession.turnCount + 1,
          maxTurns: prevSession.maxTurns,
        },
        newStatus: status,
        larpDelta: 0,
      })
    }
  }, [])

  const selectResponse = useCallback((option: ResponseOption) => {
    const { session, scenarioContent } = state
    if (!session || !scenarioContent || !personaId) return
    if (session.status !== 'active') return

    const alignmentTier = getAlignmentTier(option.personaTag, personaId, option.flavorBadge)
    const cringe = isCringeIncident(option.metricDeltas)

    // Update cumulative stats
    const newCumulative: CumulativeStats = {
      sessionAura: session.cumulative.sessionAura + option.metricDeltas.aura,
      socialFooting: session.cumulative.socialFooting + option.metricDeltas.socialFooting,
      larpContinuity: session.cumulative.larpContinuity + option.metricDeltas.larpContinuity,
      respect: session.cumulative.respect + option.metricDeltas.respect,
      cringeCount: session.cumulative.cringeCount + (cringe ? 1 : 0),
      perfectAlignments: session.cumulative.perfectAlignments + (alignmentTier === 'perfect' ? 1 : 0),
      adjacentAlignments: session.cumulative.adjacentAlignments + (alignmentTier === 'adjacent' ? 1 : 0),
      offPersonaCount: session.cumulative.offPersonaCount + (alignmentTier === 'off_persona' ? 1 : 0),
      missedGlazeOps: session.cumulative.missedGlazeOps,
      totalTurns: session.cumulative.totalTurns + 1,
    }

    // Update meters — status is derived from respect delta (0.6× weight, no content changes needed)
    const statusDelta = Math.round(option.metricDeltas.respect * 0.6)
    const newMeters: Meters = {
      impressed: clamp(session.meters.impressed + option.meterDeltas.impressed),
      suspicion: clamp(session.meters.suspicion + option.meterDeltas.suspicion),
      status: clamp(session.meters.status + statusDelta),
    }

    const nextTurnIndex = session.turnCount
    const nextNode = scenarioContent.dialogueNodes[nextTurnIndex] ?? null

    // Compute projected delta for flash
    const tempSession = { ...session, cumulative: newCumulative, meters: newMeters }
    const scenario = SCENARIO_MAP.get(session.scenarioId)
    const projectedDelta = scenario
      ? computeProjectedDelta(tempSession, scenario.maxLarpGain)
      : 0

    const userEntry: ConversationEntry = {
      turn: session.turnCount + 1,
      speaker: 'user',
      text: option.text,
      personaTag: option.personaTag,
      flavorBadge: option.flavorBadge,
      personaAlignment: alignmentTier,
      metricDeltas: option.metricDeltas,
      meterDeltas: option.meterDeltas,
      characterThinks: option.characterThinks,
      cringe,
    }

    const flash: EvaluationFlashData = {
      alignmentTier,
      metricDeltas: option.metricDeltas,
      meterDeltas: option.meterDeltas,
      characterThinks: option.characterThinks,
      projectedLarpDelta: projectedDelta,
      cringe,
    }

    // Check end conditions
    let newStatus: SimulationStatus = 'active'
    if (newMeters.suspicion >= 90) newStatus = 'exposure_ended'
    else if (newMeters.impressed >= 95) newStatus = 'breakthrough_ended'
    else if (session.turnCount + 1 >= session.maxTurns) newStatus = 'completed'

    dispatch({
      type: 'RESPONSE_SELECTED',
      entry: userEntry,
      flash,
      newMeters,
      newCumulative,
      newStatus,
      nextNode,
    })

    // Auto-dismiss flash after 2.5s
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
    flashTimerRef.current = setTimeout(() => {
      dispatch({ type: 'DISMISS_FLASH' })

      if (newStatus !== 'active') {
        handleSessionEnd(newStatus, session)
      } else if (nextNode) {
        // Show typing then character line
        dispatch({ type: 'SHOW_TYPING' })
        typingTimerRef.current = setTimeout(() => {
          const charEntry: ConversationEntry = {
            turn: session.turnCount + 1,
            speaker: 'character',
            text: nextNode.characterLine,
            moodState: deriveMoodState(newMeters),
          }
          dispatch({ type: 'ADVANCE_CHARACTER_LINE', entry: charEntry, moodState: deriveMoodState(newMeters) })
        }, 800)
      }
    }, 2500)
  }, [state, personaId, handleSessionEnd])

  const endSession = useCallback(() => {
    const { session } = state
    if (!session) return

    const scenario = SCENARIO_MAP.get(session.scenarioId)
    const character = CHARACTER_MAP.get(session.characterId)
    if (!scenario || !character) return

    const summary = computeSummaryMetrics(session, scenario, character.name)
    dispatch({ type: 'SHOW_SUMMARY', summary })

    if (onSessionEnd) {
      onSessionEnd(summary.larpRatingDelta, session.scenarioId, summary.performanceScore)
    }
  }, [state, onSessionEnd])

  const resetSession = useCallback(() => {
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    dispatch({ type: 'RESET' })
  }, [])

  const dismissFlash = useCallback(() => {
    dispatch({ type: 'DISMISS_FLASH' })
  }, [])

  return {
    ...state,
    startSession,
    confirmStart,
    selectResponse,
    endSession,
    resetSession,
    dismissFlash,
  }
}
