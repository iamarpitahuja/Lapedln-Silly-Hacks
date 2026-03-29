import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSimulation } from './hooks/useSimulation'
import { useUser } from '../../context/UserContext'
import { getUnlockedScenarios } from './engine/unlockLogic'
import { CHARACTER_MAP } from '../../content/characters'
import { SCENARIOS } from '../../content/scenarios'
import { PERSONAS } from '../../content/personas'

import { ScenarioPanel } from './components/ScenarioPanel'
import { PreBrief } from './components/PreBrief'
import { DialogueScreen } from './components/DialogueScreen'
import { EventCard } from './components/EventCard'
import { SummaryScreen } from './components/SummaryScreen'
import { CharacterPanel } from './components/CharacterPanel'
import { EntryCard } from './components/EntryCard'

type LarpMaxxerProps = {
  onExitTraining: () => void
}

export function LarpMaxxer({ onExitTraining }: LarpMaxxerProps) {
  const {
    userId,
    personaId,
    larpRating,
    completedScenarios,
    updateLarpRating,
    recordScenarioCompletion,
    setLastSessionResult,
  } = useUser()

  const [hasEntered, setHasEntered] = useState(false)
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null)
  const prevCringeCount = useRef(0)
  const [cringeShake, setCringeShake] = useState(false)

  const handleSessionEnd = (delta: number, scenarioId: string, score: number) => {
    updateLarpRating(delta)
    recordScenarioCompletion(scenarioId, score)
    const scenarioName = SCENARIOS.find(s => s.id === scenarioId)?.name ?? scenarioId
    setLastSessionResult({ scenarioName, delta, score })
  }

  const {
    session,
    currentNode,
    scenarioContent,
    evaluationFlash,
    eventCard,
    summary,
    moodState,
    isTyping,
    loadError,
    startSession,
    confirmStart,
    selectResponse,
    endSession,
    resetSession,
    dismissFlash,
  } = useSimulation(userId, personaId, handleSessionEnd)

  // Screen shake when cringe count increments — deferred to avoid setState in effect body
  useEffect(() => {
    const currentCringe = session?.cumulative.cringeCount ?? 0
    if (currentCringe > prevCringeCount.current) {
      prevCringeCount.current = currentCringe
      const t = setTimeout(() => {
        setCringeShake(true)
        setTimeout(() => setCringeShake(false), 600)
      }, 0)
      return () => clearTimeout(t)
    }
  }, [session?.cumulative.cringeCount])

  const activeCharacterId = session?.characterId
    ?? SCENARIOS.find(s => s.id === selectedScenarioId)?.characterId
  const character = activeCharacterId ? CHARACTER_MAP.get(activeCharacterId) ?? null : null

  const persona = personaId ? PERSONAS.find(p => p.id === personaId) ?? null : null

  const unlockedIds = getUnlockedScenarios(completedScenarios, larpRating)

  const activeScenarioId = session?.scenarioId ?? selectedScenarioId
  const activeScenario = SCENARIOS.find(s => s.id === activeScenarioId) ?? null

  // ─── Entry card quick-action handlers ─────────────────────────────────────
  const lastPlayed = completedScenarios.length > 0
    ? completedScenarios[completedScenarios.length - 1] : null
  const lastPlayedScenario = lastPlayed
    ? SCENARIOS.find(s => s.id === lastPlayed.scenarioId) ?? null : null

  const tier1Unlocked = SCENARIOS.filter(s => s.unlockTier === 1 && unlockedIds.includes(s.id))

  const handleWarmUp = () => {
    const pick = tier1Unlocked[Math.floor(Math.random() * tier1Unlocked.length)]
    if (pick) {
      setHasEntered(true)
      setSelectedScenarioId(pick.id)
      startSession(pick.id)
    }
  }

  const handleEnterSimulation = lastPlayedScenario ? () => {
    setHasEntered(true)
    setSelectedScenarioId(lastPlayedScenario.id)
    startSession(lastPlayedScenario.id)
  } : null

  // ─── Scenario selection ────────────────────────────────────────────────────
  function handleSelectScenario(id: string) {
    if (session && session.status === 'active') {
      if (!window.confirm('You have an active simulation. Abandon it?')) return
      resetSession()
    }
    setSelectedScenarioId(id)
    startSession(id)
  }

  function handleExitTraining() {
    if (session && (session.status === 'active' || session.status === 'prebriefing')) {
      if (!window.confirm('Abandon active simulation and exit?')) return
    }
    resetSession()
    onExitTraining()
  }

  function handleReplay() {
    if (selectedScenarioId) {
      resetSession()
      startSession(selectedScenarioId)
    }
  }

  function handleNewScenario() {
    resetSession()
    setSelectedScenarioId(null)
  }

  type CenterScreen = 'entry' | 'idle' | 'prebriefing' | 'active' | 'event' | 'summary'
  let centerScreen: CenterScreen = 'idle'

  if (!hasEntered) {
    centerScreen = 'entry'
  } else if (summary) {
    centerScreen = 'summary'
  } else if (eventCard) {
    centerScreen = 'event'
  } else if (session?.status === 'active') {
    centerScreen = 'active'
  } else if (session?.status === 'prebriefing') {
    centerScreen = 'prebriefing'
  } else {
    centerScreen = 'idle'
  }

  const showCharacterPanel = character !== null &&
    (centerScreen === 'active' || centerScreen === 'event' || centerScreen === 'summary')

  const meterDeltas = session?.history.length
    ? (() => {
        const lastUserEntry = [...session.history].reverse().find(e => e.speaker === 'user')
        return lastUserEntry?.meterDeltas ?? null
      })()
    : null

  if (!hasEntered) {
    return (
      <div style={{
        height: '100vh',
        backgroundColor: '#f3f2ef',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        <EntryCard
          larpRating={larpRating}
          personaName={persona?.name ?? 'No Persona'}
          personaIcon={persona?.icon ?? '❓'}
          lastScenarioName={lastPlayedScenario?.name ?? null}
          onEnter={() => setHasEntered(true)}
          onEnterSimulation={handleEnterSimulation}
          onWarmUp={handleWarmUp}
        />
      </div>
    )
  }

  return (
    <motion.div
      animate={cringeShake ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        height: '100vh',
        backgroundColor: '#f3f2ef',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      {/* Top bar — LinkedIn style */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        height: '52px',
        borderBottom: '1px solid #e0e0e0',
        backgroundColor: '#ffffff',
        flexShrink: 0,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            fontWeight: 900,
            fontSize: '20px',
            color: '#0a66c2',
            letterSpacing: '-0.03em',
            fontFamily: 'Georgia, serif',
          }}>
            LarpedIn
          </span>
          <span style={{
            fontSize: '12px',
            color: '#00000099',
            borderLeft: '1px solid #e0e0e0',
            paddingLeft: '12px',
          }}>
            Training Mode
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {persona && (
            <span style={{ fontSize: '12px', color: '#00000099' }}>
              {persona.icon} {persona.name}
            </span>
          )}
          <span style={{
            fontSize: '12px',
            fontWeight: 700,
            color: '#0a66c2',
            backgroundColor: '#eef3f8',
            border: '1px solid #0a66c233',
            borderRadius: '4px',
            padding: '2px 8px',
          }}>
            {larpRating.toFixed(1)} LR
          </span>
          <button
            onClick={handleExitTraining}
            style={{
              backgroundColor: 'transparent',
              border: '1.5px solid #0a66c2',
              borderRadius: '24px',
              padding: '5px 14px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              color: '#0a66c2',
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0a66c20d'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
            }}
          >
            ← Exit Training
          </button>
        </div>
      </div>

      {/* Main 3-panel layout */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Left panel — ScenarioPanel (25%) */}
        <div style={{
          width: '25%',
          minWidth: '200px',
          maxWidth: '280px',
          flexShrink: 0,
          overflow: 'hidden',
        }}>
          <ScenarioPanel
            scenarios={SCENARIOS}
            unlockedIds={unlockedIds}
            activeScenarioId={activeScenarioId ?? null}
            completedScenarios={completedScenarios}
            larpRating={larpRating}
            session={session}
            onSelectScenario={handleSelectScenario}
          />
        </div>

        {/* Center panel — dynamic (50%) */}
        <div style={{
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
          borderLeft: '1px solid #e0e0e0',
          borderRight: showCharacterPanel ? '1px solid #e0e0e0' : undefined,
        }}>
          <AnimatePresence mode="wait">
            {centerScreen === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '32px',
                  backgroundColor: '#f3f2ef',
                }}
              >
                {loadError ? (
                  <div style={{
                    maxWidth: '360px',
                    textAlign: 'center',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cc101644',
                    borderRadius: '8px',
                    padding: '24px',
                  }}>
                    <div style={{ fontSize: '28px', marginBottom: '12px' }}>⚠️</div>
                    <p style={{
                      fontSize: '14px',
                      color: '#000000e6',
                      marginBottom: '20px',
                      lineHeight: 1.5,
                    }}>
                      {loadError}
                    </p>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        onClick={() => selectedScenarioId && startSession(selectedScenarioId)}
                        className="li-btn-primary"
                        style={{ padding: '8px 18px', fontSize: '13px' }}
                      >
                        Retry
                      </button>
                      <button
                        onClick={() => { resetSession(); setSelectedScenarioId(null) }}
                        className="li-btn-secondary"
                        style={{ padding: '7px 17px', fontSize: '13px' }}
                      >
                        Choose Different
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', maxWidth: '320px' }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚔️</div>
                    <p style={{
                      fontSize: '15px',
                      color: '#00000099',
                      lineHeight: 1.6,
                      fontStyle: 'italic',
                    }}>
                      Select a scenario to begin your simulation.
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {centerScreen === 'prebriefing' && session && activeScenario && character && (
              <motion.div
                key="prebriefing"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                style={{ height: '100%', overflowY: 'auto', backgroundColor: '#f3f2ef' }}
              >
                <PreBrief
                  scenario={activeScenario}
                  character={character}
                  personaId={personaId!}
                  openingLine={scenarioContent?.openingLine ?? '...'}
                  onConfirm={confirmStart}
                  onBack={() => {
                    resetSession()
                    setSelectedScenarioId(null)
                  }}
                />
              </motion.div>
            )}

            {centerScreen === 'active' && session && character && (
              <motion.div
                key="active"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ height: '100%', overflow: 'hidden' }}
              >
                {currentNode ? (
                  <DialogueScreen
                    session={session}
                    currentNode={currentNode}
                    character={character}
                    isTyping={isTyping}
                    evaluationFlash={evaluationFlash}
                    onSelectResponse={selectResponse}
                    onDismissFlash={dismissFlash}
                  />
                ) : (
                  <div style={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#ffffff',
                  }}>
                    <span style={{ fontSize: '13px', color: '#00000099', fontStyle: 'italic' }}>
                      Loading...
                    </span>
                  </div>
                )}
              </motion.div>
            )}

            {centerScreen === 'event' && eventCard && (
              <motion.div
                key="event"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ height: '100%' }}
              >
                <EventCard
                  data={eventCard}
                  larpRatingDelta={session?.larpRatingDelta ?? 0}
                  onContinue={endSession}
                />
              </motion.div>
            )}

            {centerScreen === 'summary' && summary && activeScenario && persona && session && (
              <motion.div
                key="summary"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                style={{ height: '100%', overflowY: 'auto', backgroundColor: '#f3f2ef' }}
              >
                <SummaryScreen
                  summary={summary}
                  scenario={activeScenario}
                  persona={persona}
                  session={session}
                  onReplay={handleReplay}
                  onNewScenario={handleNewScenario}
                  onExit={() => {
                    resetSession()
                    setSelectedScenarioId(null)
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right panel — CharacterPanel (25%) */}
        {showCharacterPanel && character && session && (
          <div style={{
            width: '25%',
            minWidth: '200px',
            maxWidth: '280px',
            flexShrink: 0,
            overflow: 'hidden',
          }}>
            <CharacterPanel
              character={character}
              meters={session.meters}
              moodState={moodState}
              meterDeltas={meterDeltas}
            />
          </div>
        )}
      </div>
    </motion.div>
  )
}
