import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion as Motion } from 'framer-motion'
import { DialogueBubble } from './DialogueBubble'
import { ResponseOptions } from './ResponseOptions'
import { EvaluationFlash } from './EvaluationFlash'
import { fetchLarpmaxxerTts } from '../../../services/api'
import styles from './DialogueScreen.module.css'

export function DialogueScreen({
  session,
  currentNode,
  character,
  isTyping,
  evaluationFlash,
  onSelectResponse,
  onDismissFlash,
}) {
  const bottomRef = useRef(null)
  const audioRef = useRef(null)
  const audioUrlRef = useRef(null)
  const ttsRequestRef = useRef(null)
  const errorResetTimerRef = useRef(null)
  const [ttsState, setTtsState] = useState({ index: null, state: 'idle' })

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
      setTtsState(prev => (prev.state === 'error' ? { index: null, state: 'idle' } : prev))
      errorResetTimerRef.current = null
    }, 900)
  }, [])

  const handleSpeakerClick = useCallback(async (entryIndex, text) => {
    if (!character?.id || !text?.trim()) return

    const isSameEntry = ttsState.index === entryIndex

    if (isSameEntry && ttsState.state === 'playing') {
      stopActiveTts()
      setTtsState({ index: null, state: 'idle' })
      return
    }

    if (isSameEntry && ttsState.state === 'loading') {
      stopActiveTts()
      setTtsState({ index: null, state: 'idle' })
      return
    }

    stopActiveTts()
    setTtsState({ index: entryIndex, state: 'loading' })

    const controller = new AbortController()
    ttsRequestRef.current = controller

    try {
      const audioBlob = await fetchLarpmaxxerTts({
        text,
        characterId: character.id,
        signal: controller.signal,
      })

      if (controller.signal.aborted) {
        setTtsState({ index: null, state: 'idle' })
        return
      }

      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)
      audioRef.current = audio
      audioUrlRef.current = audioUrl

      audio.onended = () => {
        if (audioRef.current !== audio) return
        clearAudioResources()
        setTtsState(prev => (prev.index === entryIndex ? { index: null, state: 'idle' } : prev))
      }

      audio.onerror = () => {
        if (audioRef.current !== audio) return
        clearAudioResources()
        setTtsState({ index: entryIndex, state: 'error' })
        queueErrorReset()
      }

      setTtsState({ index: entryIndex, state: 'playing' })
      await audio.play()
    } catch (error) {
      if (controller.signal.aborted || error?.name === 'AbortError') {
        setTtsState({ index: null, state: 'idle' })
        return
      }
      clearAudioResources()
      setTtsState({ index: entryIndex, state: 'error' })
      queueErrorReset()
    } finally {
      if (ttsRequestRef.current === controller) {
        ttsRequestRef.current = null
      }
    }
  }, [character?.id, clearAudioResources, queueErrorReset, stopActiveTts, ttsState.index, ttsState.state])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [session.history.length, isTyping])

  useEffect(() => () => {
    stopActiveTts()
  }, [stopActiveTts])

  return (
    <div className={styles.wrap}>
      <div className={styles.history}>
        {session.history.map((entry, i) => (
          <DialogueBubble
            key={i}
            speaker={entry.speaker}
            text={entry.text}
            flavorBadge={entry.flavorBadge}
            speakerName={entry.speaker === 'character' ? character.name : 'You'}
            showSpeaker={entry.speaker === 'character' && Boolean(character.voiceId)}
            ttsState={ttsState.index === i ? ttsState.state : 'idle'}
            onSpeakerClick={() => handleSpeakerClick(i, entry.text)}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      <ResponseOptions
        options={currentNode?.options ?? []}
        onSelect={onSelectResponse}
        isTyping={isTyping}
      />

      <AnimatePresence>
        {evaluationFlash && (
          <Motion.div
            className={styles.flashOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <EvaluationFlash data={evaluationFlash} onDismiss={onDismissFlash} />
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
