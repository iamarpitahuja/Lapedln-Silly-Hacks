import { useState, useEffect, useRef, useCallback } from 'react'
import { BattleSprite } from './BattleSprite'
import { BattleHPBar } from './BattleHPBar'
import { MoveGrid } from './MoveGrid'
import { BattleDialogueBox } from './BattleDialogueBox'
import { BattleEvalFlash } from './BattleEvalFlash'
import { fetchLarpmaxxerTts } from '../../../services/api'
import styles from './BattleScreen.module.css'

export function BattleScreen({
  session,
  currentNode,
  character,
  isTyping,
  evaluationFlash,
  onSelectResponse,
  onDismissFlash,
}) {
  const [enemyAnim, setEnemyAnim] = useState('')
  const [ttsState, setTtsState] = useState('idle')
  // Full conversation log — never clears
  const [log, setLog] = useState([])
  const prevFlash = useRef(null)
  const prevHistoryLen = useRef(0)
  const audioRef = useRef(null)
  const audioUrlRef = useRef(null)
  const ttsRequestRef = useRef(null)
  const errorResetTimerRef = useRef(null)

  // Append new history entries to the log
  useEffect(() => {
    const newEntries = session.history.slice(prevHistoryLen.current)
    if (newEntries.length > 0) {
      setLog(prev => [...prev, ...newEntries])
      prevHistoryLen.current = session.history.length
    }
  }, [session.history])

  // Derive who last spoke for sprite animation
  const lastEntry = session.history[session.history.length - 1] ?? null
  const lastSpeaker = lastEntry?.speaker ?? 'character'
  const latestCharacterEntry = [...session.history].reverse().find(e => e.speaker === 'character')
  const latestCharacterLine = latestCharacterEntry?.text ?? ''
  const characterTalking = isTyping || lastSpeaker === 'character'

  // Meter deltas from last user entry
  const lastUserEntry = [...session.history].reverse().find(e => e.speaker === 'user')
  const impressedDelta = lastUserEntry?.meterDeltas?.impressed ?? null
  const suspicionDelta = lastUserEntry?.meterDeltas?.suspicion ?? null

  // Hit animations on eval flash
  useEffect(() => {
    if (!evaluationFlash || evaluationFlash === prevFlash.current) return
    prevFlash.current = evaluationFlash
    const isPositive =
      evaluationFlash.alignmentTier === 'perfect' ||
      evaluationFlash.alignmentTier === 'adjacent' ||
      (evaluationFlash.meterDeltas?.impressed ?? 0) > 5
    if (isPositive && !evaluationFlash.cringe) {
      setEnemyAnim('spriteHit')
      setTimeout(() => setEnemyAnim(''), 500)
    }
  }, [evaluationFlash])

  const bgSrc = `/sprites/${session.scenarioId}_bg.png`

  // Current character line to show in dialogue box
  const currentCharacterLine = lastEntry?.speaker === 'character'
    ? lastEntry.text
    : (currentNode?.characterLine ?? '')

  const clearAudioResources = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.onended = null
      audioRef.current.onerror = null
      audioRef.current = null
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current)
      audioUrlRef.current = null
    }
  }, [])

  const stopActiveTts = useCallback(() => {
    if (ttsRequestRef.current) {
      ttsRequestRef.current.abort()
      ttsRequestRef.current = null
    }
    if (errorResetTimerRef.current) {
      clearTimeout(errorResetTimerRef.current)
      errorResetTimerRef.current = null
    }
    clearAudioResources()
  }, [clearAudioResources])

  const queueErrorReset = useCallback(() => {
    if (errorResetTimerRef.current) {
      clearTimeout(errorResetTimerRef.current)
    }
    errorResetTimerRef.current = setTimeout(() => {
      setTtsState(prev => (prev === 'error' ? 'idle' : prev))
      errorResetTimerRef.current = null
    }, 1000)
  }, [])

  const handleVoiceToggle = useCallback(async () => {
    const textToSpeak = latestCharacterLine.trim()
    if (!character?.id || !textToSpeak) return

    if (ttsState === 'playing' || ttsState === 'loading') {
      stopActiveTts()
      setTtsState('idle')
      return
    }

    stopActiveTts()
    setTtsState('loading')

    const controller = new AbortController()
    ttsRequestRef.current = controller

    try {
      const audioBlob = await fetchLarpmaxxerTts({
        text: textToSpeak,
        characterId: character.id,
        signal: controller.signal,
      })

      if (controller.signal.aborted) {
        setTtsState('idle')
        return
      }

      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)
      audioRef.current = audio
      audioUrlRef.current = audioUrl

      audio.onended = () => {
        if (audioRef.current !== audio) return
        clearAudioResources()
        setTtsState('idle')
      }

      audio.onerror = () => {
        if (audioRef.current !== audio) return
        clearAudioResources()
        setTtsState('error')
        queueErrorReset()
      }

      setTtsState('playing')
      await audio.play()
    } catch (error) {
      if (controller.signal.aborted || error?.name === 'AbortError') {
        setTtsState('idle')
        return
      }
      clearAudioResources()
      setTtsState('error')
      queueErrorReset()
    } finally {
      if (ttsRequestRef.current === controller) {
        ttsRequestRef.current = null
      }
    }
  }, [character?.id, clearAudioResources, latestCharacterLine, queueErrorReset, stopActiveTts, ttsState])

  useEffect(() => () => {
    stopActiveTts()
  }, [stopActiveTts])

  return (
    <div className={styles.root}>

      {/* ── Top arena ───────────────────────────────── */}
      <div className={styles.arena} style={{ backgroundImage: `url(${bgSrc})` }}>
        <div className={styles.arenaOverlay} />

        {/* Turn counter */}
        <div className={styles.turnBadge}>
          Turn {session.turnCount} / {session.maxTurns}
        </div>

        {/* Enemy stats — top left */}
        <div className={styles.enemyStats}>
          <div className={styles.statName}>{character.name}</div>
          <div className={styles.statRole}>{character.role} · {character.company}</div>
          <div className={styles.meters}>
            <BattleHPBar label="IMPRESSED" value={session.meters.impressed} delta={impressedDelta} />
            <BattleHPBar label="SUSPICION" value={session.meters.suspicion} delta={suspicionDelta} />
          </div>
        </div>

        {/* Character sprite — bottom left */}
        <div className={styles.playerSprite}>
          <BattleSprite characterId={character.id} talking={characterTalking} animClass={enemyAnim} />
        </div>



        {/* Eval flash overlay */}
        {evaluationFlash && (
          <BattleEvalFlash data={evaluationFlash} onDismiss={onDismissFlash} />
        )}
      </div>

      {/* ── Bottom section ───────────────────────────── */}
      <div className={styles.bottomSection}>

        {/* Dialogue box — left */}
        <div className={styles.dialogueSide}>
          <BattleDialogueBox
            text={currentCharacterLine}
            speakerName={character.name}
            isTyping={isTyping}
            log={log}
            ttsState={ttsState}
            onVoiceToggle={handleVoiceToggle}
            voiceDisabled={!latestCharacterLine.trim()}
          />
        </div>

        {/* Move grid — right */}
        <div className={styles.moveSide}>
          <MoveGrid
            options={currentNode?.options ?? []}
            onSelect={onSelectResponse}
            disabled={isTyping || !!evaluationFlash}
            turnCount={session.turnCount}
            maxTurns={session.maxTurns}
          />
        </div>

      </div>
    </div>
  )
}
