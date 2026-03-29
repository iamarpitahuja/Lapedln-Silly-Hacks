import type { ConversationEntry, FlavorBadge, MoodState } from '../types'

type DialogueBubbleProps = {
  entry: ConversationEntry
  characterName: string
  characterAvatar: string
}

const MOOD_BORDER: Record<MoodState, string> = {
  impressed: '#0a66c2',
  done: '#cc1016',
  curious: '#6b39c1',
  skeptical: '#b45309',
  neutral: '#e0e0e0',
}

const FLAVOR_COLORS: Record<FlavorBadge, { bg: string; text: string }> = {
  prestige: { bg: '#eef3f8', text: '#0a66c2' },
  ambitious: { bg: '#f3eeff', text: '#6b39c1' },
  unhinged: { bg: '#fdecea', text: '#cc1016' },
  calculated: { bg: '#fff7e6', text: '#b45309' },
  wildcard: { bg: '#fffbe6', text: '#92610a' },
  cringe_risk: { bg: '#fdecea', text: '#cc1016' },
  alpha: { bg: '#f3eeff', text: '#6b39c1' },
  authentic: { bg: '#e8f5ef', text: '#057642' },
  glazed: { bg: '#eef3f8', text: '#0a66c2' },
}

function formatPersonaTag(tag: string): string {
  return tag.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function formatFlavorBadge(badge: FlavorBadge): string {
  return badge.replace(/_/g, ' ').toUpperCase()
}

export function DialogueBubble({ entry, characterName, characterAvatar }: DialogueBubbleProps) {
  const isCharacter = entry.speaker === 'character'
  const mood = entry.moodState ?? 'neutral'
  const moodBorder = MOOD_BORDER[mood]

  if (isCharacter) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        marginBottom: '12px',
      }}>
        {/* Avatar */}
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          backgroundColor: '#f3f2ef',
          border: `2px solid ${moodBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          flexShrink: 0,
          transition: 'border-color 0.3s',
        }}>
          {characterAvatar}
        </div>

        {/* Bubble */}
        <div style={{ maxWidth: '75%' }}>
          <div style={{
            fontSize: '10px',
            color: '#00000099',
            marginBottom: '4px',
            fontWeight: 600,
            letterSpacing: '0.04em',
          }}>
            {characterName}
          </div>
          <div style={{
            backgroundColor: '#f3f2ef',
            border: `1px solid ${moodBorder}`,
            borderRadius: '0 8px 8px 8px',
            padding: '10px 13px',
          }}>
            <p style={{
              fontSize: '13px',
              lineHeight: 1.6,
              color: '#000000e6',
              margin: 0,
            }}>
              {entry.text}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // User turn — right aligned
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      marginBottom: '12px',
    }}>
      {/* Tags row */}
      <div style={{
        display: 'flex',
        gap: '6px',
        marginBottom: '4px',
        alignItems: 'center',
      }}>
        {entry.personaTag && (
          <span style={{
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.06em',
            color: '#00000099',
            textTransform: 'uppercase',
          }}>
            {formatPersonaTag(entry.personaTag)}
          </span>
        )}
        {entry.flavorBadge && (() => {
          const style = FLAVOR_COLORS[entry.flavorBadge]
          return (
            <span style={{
              fontSize: '9px',
              fontWeight: 700,
              letterSpacing: '0.06em',
              backgroundColor: style.bg,
              color: style.text,
              borderRadius: '4px',
              padding: '2px 6px',
            }}>
              {formatFlavorBadge(entry.flavorBadge)}
            </span>
          )
        })()}
      </div>

      {/* Bubble */}
      <div style={{
        maxWidth: '75%',
        backgroundColor: '#eef3f8',
        border: '1px solid #0a66c244',
        borderRadius: '8px 0 8px 8px',
        padding: '10px 13px',
      }}>
        <p style={{
          fontSize: '13px',
          lineHeight: 1.6,
          color: '#000000e6',
          margin: 0,
          fontStyle: 'italic',
        }}>
          "{entry.text}"
        </p>
      </div>

      {entry.cringe && (
        <div style={{
          fontSize: '10px',
          color: '#cc1016',
          marginTop: '3px',
          fontWeight: 600,
        }}>
          ⚠ cringe incident
        </div>
      )}
    </div>
  )
}
