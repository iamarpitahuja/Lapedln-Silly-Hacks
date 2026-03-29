import type { ScenarioMeta, Difficulty } from '../types'

type ScenarioCardProps = {
  scenario: ScenarioMeta
  isUnlocked: boolean
  isActive: boolean
  bestScore?: number
  unlockRequirement: string | null
  onSelect: () => void
}

const DIFFICULTY_COLORS: Record<Difficulty, { bg: string; text: string; label: string }> = {
  easy: { bg: '#e8f5ef', text: '#057642', label: 'Easy' },
  easy_medium: { bg: '#e8f5ef', text: '#057642', label: 'Easy–Med' },
  medium: { bg: '#fff7e6', text: '#b45309', label: 'Medium' },
  hard: { bg: '#fdecea', text: '#cc1016', label: 'Hard' },
  very_hard: { bg: '#fdecea', text: '#cc1016', label: 'Very Hard' },
}

export function ScenarioCard({
  scenario,
  isUnlocked,
  isActive,
  bestScore,
  unlockRequirement,
  onSelect,
}: ScenarioCardProps) {
  const difficulty = DIFFICULTY_COLORS[scenario.difficulty]

  if (!isUnlocked) {
    return (
      <div style={{
        backgroundColor: '#f3f2ef',
        border: '1px solid #e0e0e0',
        borderRadius: '6px',
        padding: '10px 12px',
        opacity: 0.65,
        cursor: 'not-allowed',
        marginBottom: '6px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <span style={{ fontSize: '13px' }}>🔒</span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#00000099' }}>
                {scenario.name}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#00000066' }}>
              {unlockRequirement ?? 'Locked'}
            </div>
          </div>
          <span style={{
            fontSize: '10px',
            fontWeight: 700,
            backgroundColor: difficulty.bg,
            color: difficulty.text,
            borderRadius: '4px',
            padding: '2px 6px',
          }}>
            {difficulty.label}
          </span>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={onSelect}
      style={{
        width: '100%',
        textAlign: 'left',
        backgroundColor: isActive ? '#eef3f8' : '#ffffff',
        border: `1px solid ${isActive ? '#0a66c2' : '#e0e0e0'}`,
        borderRadius: '6px',
        padding: '10px 12px',
        cursor: 'pointer',
        marginBottom: '6px',
        transition: 'border-color 0.15s, background-color 0.15s',
      }}
      onMouseEnter={e => {
        if (!isActive) {
          (e.currentTarget as HTMLButtonElement).style.borderColor = '#0a66c2'
          ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f3f2ef'
        }
      }}
      onMouseLeave={e => {
        if (!isActive) {
          (e.currentTarget as HTMLButtonElement).style.borderColor = '#e0e0e0'
          ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = '#ffffff'
        }
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '12px',
            fontWeight: 600,
            color: '#000000e6',
            marginBottom: '2px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            {isActive && (
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#0a66c2',
                flexShrink: 0,
                display: 'inline-block',
              }} />
            )}
            {scenario.name}
          </div>
          <div style={{
            fontSize: '11px',
            color: '#00000099',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {scenario.setting}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px', flexShrink: 0, marginLeft: '8px' }}>
          <span style={{
            fontSize: '10px',
            fontWeight: 700,
            backgroundColor: difficulty.bg,
            color: difficulty.text,
            borderRadius: '4px',
            padding: '2px 6px',
          }}>
            {difficulty.label}
          </span>
          {bestScore !== undefined && (
            <span style={{ fontSize: '10px', color: '#00000099', fontWeight: 600 }}>
              Best: {bestScore}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
