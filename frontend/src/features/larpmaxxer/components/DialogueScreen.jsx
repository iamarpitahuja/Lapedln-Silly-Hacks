import { useEffect, useRef } from 'react'
import { AnimatePresence, motion as Motion } from 'framer-motion'
import { DialogueBubble } from './DialogueBubble'
import { ResponseOptions } from './ResponseOptions'
import { EvaluationFlash } from './EvaluationFlash'
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [session.history.length, isTyping])

  return (
    <div className={styles.wrap}>
      <div className={styles.history}>
        {session.history.map((entry, i) => (
          <DialogueBubble
            key={i}
            speaker={entry.speaker}
            text={entry.text}
            flavorBadge={entry.flavorBadge}
            avatar={entry.speaker === 'character' ? character.avatar : undefined}
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
