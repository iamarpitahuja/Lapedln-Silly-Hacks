import { useRef, useEffect } from 'react'
import type {
  SimulationSession,
  DialogueNode,
  CharacterProfile,
  EvaluationFlashData,
  ResponseOption,
} from '../types'
import { DialogueBubble } from './DialogueBubble'
import { ResponseOptions } from './ResponseOptions'
import { EvaluationFlash } from './EvaluationFlash'

type DialogueScreenProps = {
  session: SimulationSession
  currentNode: DialogueNode | null
  character: CharacterProfile
  isTyping: boolean
  evaluationFlash: EvaluationFlashData | null
  onSelectResponse: (option: ResponseOption) => void
  onDismissFlash: () => void
}

function TypingIndicator() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '0 4px 8px',
    }}>
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="typing-dot"
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: '#00000099',
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: '12px', color: '#00000099', fontStyle: 'italic' }}>
        thinking...
      </span>
    </div>
  )
}

export function DialogueScreen({
  session,
  currentNode,
  character,
  isTyping,
  evaluationFlash,
  onSelectResponse,
  onDismissFlash,
}: DialogueScreenProps) {
  const historyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight
    }
  }, [session.history, isTyping])

  const isResponseDisabled = evaluationFlash !== null || isTyping || session.status !== 'active'
  const turnsLeft = session.maxTurns - session.turnCount

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#ffffff',
      position: 'relative',
    }}>
      {/* Evaluation Flash overlay */}
      {evaluationFlash && (
        <EvaluationFlash data={evaluationFlash} onDismiss={onDismissFlash} />
      )}

      {/* Turn counter header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 16px',
        borderBottom: '1px solid #e0e0e0',
        backgroundColor: '#f3f2ef',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#000000e6' }}>
            {character.name}
          </span>
          <span style={{ fontSize: '18px' }}>{character.avatar}</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {session.cumulative.cringeCount > 0 && (
            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              color: '#cc1016',
              backgroundColor: '#fdecea',
              padding: '2px 8px',
              borderRadius: '4px',
            }}>
              Cringe ×{session.cumulative.cringeCount}
            </span>
          )}
          <span style={{
            fontSize: '11px',
            color: turnsLeft <= 2 ? '#cc1016' : '#00000099',
            fontWeight: turnsLeft <= 2 ? 700 : 400,
          }}>
            Turn {session.turnCount}/{session.maxTurns}
          </span>
        </div>
      </div>

      {/* Conversation history */}
      <div
        ref={historyRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
        }}
      >
        {session.history.map((entry, idx) => (
          <DialogueBubble
            key={`${entry.turn}-${entry.speaker}-${idx}`}
            entry={entry}
            characterName={character.name}
            characterAvatar={character.avatar}
          />
        ))}
        {isTyping && <TypingIndicator />}
      </div>

      {/* Response options */}
      {currentNode && session.status === 'active' && (
        <div style={{
          borderTop: '1px solid #e0e0e0',
          padding: '8px 12px 10px',
          backgroundColor: '#f3f2ef',
          flexShrink: 0,
          height: '38vh',
          overflowY: 'auto',
        }}>
          <div style={{
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            color: '#00000099',
            textTransform: 'uppercase',
            marginBottom: '6px',
          }}>
            Your response — {turnsLeft} turn{turnsLeft === 1 ? '' : 's'} remaining
          </div>
          <ResponseOptions
            options={currentNode.options}
            onSelect={onSelectResponse}
            disabled={isResponseDisabled}
          />
        </div>
      )}

      {session.status !== 'active' && (
        <div style={{
          borderTop: '1px solid #e0e0e0',
          padding: '16px',
          backgroundColor: '#f3f2ef',
          textAlign: 'center',
          flexShrink: 0,
        }}>
          <p style={{
            fontSize: '13px',
            color: '#00000099',
            fontStyle: 'italic',
            margin: 0,
          }}>
            Simulation complete.
          </p>
        </div>
      )}
    </div>
  )
}
