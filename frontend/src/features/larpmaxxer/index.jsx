import { useState, useEffect, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion as Motion, AnimatePresence } from 'framer-motion'
import { useSimulation } from './hooks/useSimulation'
import { useUser } from '../../context/UserContext'
import { getUnlockedScenarios } from './engine/unlockLogic'
import { CHARACTERS } from '../../content/characters'
import { SCENARIOS } from '../../content/scenarios'
import { PERSONAS } from '../../content/personas'
import { fetchLarpmaxxerBootstrap } from '../../services/api'

import { ScenarioPanel } from './components/ScenarioPanel'
import { PreBrief } from './components/PreBrief'
import { DialogueScreen } from './components/DialogueScreen'
import { EventCard } from './components/EventCard'
import { SummaryScreen } from './components/SummaryScreen'
import { CharacterPanel } from './components/CharacterPanel'
import { EntryCard } from './components/EntryCard'
import { ConfirmModal } from './components/ConfirmModal'
import styles from './LarpMaxxer.module.css'

export function LarpMaxxer({ onExitTraining }) {
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
  const [selectedScenarioId, setSelectedScenarioId] = useState(null)
  const [scenarios, setScenarios] = useState(SCENARIOS)
  const [personas, setPersonas] = useState(PERSONAS)
  const [characters, setCharacters] = useState(CHARACTERS)
  const prevCringeCount = useRef(0)
  const [cringeShake, setCringeShake] = useState(false)
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    action: null,
  })
  const logoSrc = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'light'
    ? '/logoLightMode.png'
    : '/logoDarkMode.png'

  function openConfirm({ title, message, confirmLabel = 'Confirm', action }) {
    setConfirmState({
      open: true,
      title,
      message,
      confirmLabel,
      action,
    })
  }

  function closeConfirm() {
    setConfirmState(prev => ({ ...prev, open: false, action: null }))
  }

  function confirmAction() {
    const action = confirmState.action
    closeConfirm()
    action?.()
  }

  function handleSessionEnd(delta, scenarioId, score) {
    updateLarpRating(delta)
    recordScenarioCompletion(scenarioId, score)
    const scenarioName = scenarios.find(s => s.id === scenarioId)?.name ?? scenarioId
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

  useEffect(() => {
    let cancelled = false
    async function hydrateBootstrap() {
      try {
        const bootstrap = await fetchLarpmaxxerBootstrap()
        if (cancelled) return
        if (Array.isArray(bootstrap?.scenarios) && bootstrap.scenarios.length > 0) {
          setScenarios(bootstrap.scenarios)
        }
        if (Array.isArray(bootstrap?.personas) && bootstrap.personas.length > 0) {
          setPersonas(bootstrap.personas)
        }
        if (Array.isArray(bootstrap?.characters) && bootstrap.characters.length > 0) {
          setCharacters(bootstrap.characters)
        }
      } catch {
        // Keep bundled content when bootstrap API is unavailable.
      }
    }
    hydrateBootstrap()
    return () => {
      cancelled = true
    }
  }, [])

  const characterMap = useMemo(() => new Map(characters.map(character => [character.id, character])), [characters])

  const activeCharacterId = session?.characterId
    ?? scenarios.find(s => s.id === selectedScenarioId)?.characterId
  const character = activeCharacterId ? characterMap.get(activeCharacterId) ?? null : null
  const persona = personaId ? personas.find(p => p.id === personaId) ?? null : null
  const unlockedIds = getUnlockedScenarios(completedScenarios, larpRating)
  const activeScenarioId = session?.scenarioId ?? selectedScenarioId
  const activeScenario = scenarios.find(s => s.id === activeScenarioId) ?? null

  const lastPlayed = completedScenarios.length > 0
    ? completedScenarios[completedScenarios.length - 1] : null
  const lastPlayedScenario = lastPlayed
    ? scenarios.find(s => s.id === lastPlayed.scenarioId) ?? null : null
  const tier1Unlocked = scenarios.filter(s => s.unlockTier === 1 && unlockedIds.includes(s.id))

  function handleWarmUp() {
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

  function handleSelectScenario(id) {
    if (session && session.status === 'active') {
      openConfirm({
        title: 'Switch Scenario?',
        message: 'Your current simulation will be abandoned and progress for this run will be lost.',
        confirmLabel: 'Switch',
        action: () => {
          resetSession()
          setSelectedScenarioId(id)
          startSession(id)
        },
      })
      return
    }
    setSelectedScenarioId(id)
    startSession(id)
  }

  function handleExitTraining() {
    if (session && (session.status === 'active' || session.status === 'prebriefing')) {
      openConfirm({
        title: 'Exit Training?',
        message: 'Your active simulation will be abandoned and unsaved progress in this run will be lost.',
        confirmLabel: 'Exit',
        action: () => {
          resetSession()
          onExitTraining()
        },
      })
      return
    }
    resetSession()
    onExitTraining()
  }

  function handleReplay() {
    if (selectedScenarioId) { resetSession(); startSession(selectedScenarioId) }
  }

  // Determine center screen
  let centerScreen = 'idle'
  if (!hasEntered) centerScreen = 'entry'
  else if (summary) centerScreen = 'summary'
  else if (eventCard) centerScreen = 'event'
  else if (session?.status === 'active') centerScreen = 'active'
  else if (session?.status === 'prebriefing') centerScreen = 'prebriefing'

  const showCharacterPanel = character !== null &&
    (centerScreen === 'active' || centerScreen === 'event' || centerScreen === 'summary')

  const meterDeltas = session?.history.length
    ? (() => {
        const last = [...session.history].reverse().find(e => e.speaker === 'user')
        return last?.meterDeltas ?? null
      })()
    : null

  if (!hasEntered) {
    return (
      <div className={styles.root} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <EntryCard
          larpRating={larpRating}
          personaName={persona?.name ?? 'No Persona'}
          lastScenarioName={lastPlayedScenario?.name ?? null}
          onEnter={() => setHasEntered(true)}
          onEnterSimulation={handleEnterSimulation}
          onWarmUp={handleWarmUp}
        />
      </div>
    )
  }

  return (
    <Motion.div
      className={styles.root}
      animate={cringeShake ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Top bar */}
      <div className={styles.topBar}>
        <div className={styles.topLeft}>
          <Link to="/" className={styles.logoWrap}>
            <img src={logoSrc} alt="LarpedIn logo" className={styles.logoImg} />
            <span className={styles.logo}>LarpedIn</span>
          </Link>
          <span className={styles.mode}>Larp Dojo</span>
        </div>
        <div className={styles.topRight}>
          {persona && (
            <span className={styles.personaTag}>{persona.name}</span>
          )}
          <span className={styles.lrBadge}>{larpRating.toFixed(1)} LR</span>
          <button className={styles.exitBtn} onClick={handleExitTraining}>Tap Out</button>
        </div>
      </div>

      {/* Panels */}
      <div className={styles.panels}>
        <div className={styles.leftPanel}>
          <ScenarioPanel
            scenarios={scenarios}
            unlockedIds={unlockedIds}
            activeScenarioId={activeScenarioId ?? null}
            completedScenarios={completedScenarios}
            larpRating={larpRating}
            session={session}
            onSelectScenario={handleSelectScenario}
          />
        </div>

        <div className={styles.centerPanel}>
          <AnimatePresence mode="wait">
            {centerScreen === 'idle' && (
              <Motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className={styles.idleState}>
                {loadError ? (
                  <div className={styles.errorCard}>
                    <p className={styles.errorMsg}>{loadError}</p>
                    <div className={styles.errorActions}>
                      <button className={styles.btnSmPrimary}
                        onClick={() => selectedScenarioId && startSession(selectedScenarioId)}>
                        Retry
                      </button>
                      <button className={styles.btnSmSecondary}
                        onClick={() => { resetSession(); setSelectedScenarioId(null) }}>
                        Choose Different
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={styles.idleIcon}>LM</div>
                    <p className={styles.idleText}>pick a scenario and lock in.</p>
                  </>
                )}
              </Motion.div>
            )}

            {centerScreen === 'prebriefing' && session && activeScenario && character && (
              <Motion.div key="prebriefing" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }} style={{ height: '100%', overflowY: 'auto', background: 'var(--bg-deep)' }}>
                <PreBrief
                  scenario={activeScenario}
                  character={character}
                  personaId={personaId}
                  openingLine={scenarioContent?.openingLine ?? '...'}
                  onConfirm={confirmStart}
                  onBack={() => { resetSession(); setSelectedScenarioId(null) }}
                />
              </Motion.div>
            )}

            {centerScreen === 'active' && session && character && currentNode && (
              <Motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                exit={{ opacity: 0 }} style={{ height: '100%', overflow: 'hidden' }}>
                <DialogueScreen
                  session={session}
                  currentNode={currentNode}
                  character={character}
                  isTyping={isTyping}
                  evaluationFlash={evaluationFlash}
                  onSelectResponse={selectResponse}
                  onDismissFlash={dismissFlash}
                />
              </Motion.div>
            )}

            {centerScreen === 'event' && eventCard && (
              <Motion.div key="event" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                exit={{ opacity: 0 }} style={{ height: '100%' }}>
                <EventCard
                  data={eventCard}
                  larpRatingDelta={session?.larpRatingDelta ?? 0}
                  onContinue={endSession}
                />
              </Motion.div>
            )}

            {centerScreen === 'summary' && summary && activeScenario && persona && session && (
              <Motion.div key="summary" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }} style={{ height: '100%', overflowY: 'auto', background: 'var(--bg-deep)' }}>
                <SummaryScreen
                  summary={summary}
                  scenario={activeScenario}
                  persona={persona}
                  session={session}
                  onReplay={handleReplay}
                  onNewScenario={() => { resetSession(); setSelectedScenarioId(null) }}
                  onExit={() => { resetSession(); setSelectedScenarioId(null) }}
                />
              </Motion.div>
            )}
          </AnimatePresence>
        </div>

        {showCharacterPanel && character && session && (
          <div className={styles.rightPanel}>
            <CharacterPanel
              character={character}
              meters={session.meters}
              moodState={moodState}
              meterDeltas={meterDeltas}
            />
          </div>
        )}
      </div>

      <ConfirmModal
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel}
        onCancel={closeConfirm}
        onConfirm={confirmAction}
      />
    </Motion.div>
  )
}

