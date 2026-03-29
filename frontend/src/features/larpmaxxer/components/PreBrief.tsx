import type { ScenarioMeta, CharacterProfile, PersonaId, Difficulty } from '../types'

type PreBriefProps = {
  scenario: ScenarioMeta
  character: CharacterProfile
  personaId: PersonaId
  openingLine: string
  onConfirm: () => void
  onBack: () => void
}

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  easy_medium: 'Easy–Medium',
  medium: 'Medium',
  hard: 'Hard',
  very_hard: 'Very Hard',
}

const DIFFICULTY_COLORS: Record<Difficulty, { text: string; bg: string }> = {
  easy: { text: '#057642', bg: '#e8f5ef' },
  easy_medium: { text: '#057642', bg: '#e8f5ef' },
  medium: { text: '#b45309', bg: '#fff7e6' },
  hard: { text: '#cc1016', bg: '#fdecea' },
  very_hard: { text: '#cc1016', bg: '#fdecea' },
}

export function PreBrief({
  scenario,
  character,
  personaId,
  openingLine,
  onConfirm,
  onBack,
}: PreBriefProps) {
  const diff = DIFFICULTY_COLORS[scenario.difficulty]
  const diffLabel = DIFFICULTY_LABELS[scenario.difficulty]

  const isBestFit = scenario.bestPersonas.includes(personaId)
  const isToughFit = scenario.toughPersonas.includes(personaId)

  let personaFitLabel: string
  let personaFitBg: string
  let personaFitBorder: string
  let personaFitColor: string
  if (isBestFit) {
    personaFitLabel = 'Strong fit for your persona'
    personaFitColor = '#057642'
    personaFitBg = '#e8f5ef'
    personaFitBorder = '#057642'
  } else if (isToughFit) {
    personaFitLabel = 'Challenging for your persona'
    personaFitColor = '#cc1016'
    personaFitBg = '#fdecea'
    personaFitBorder = '#cc1016'
  } else {
    personaFitLabel = 'Neutral fit'
    personaFitColor = '#00000099'
    personaFitBg = '#f3f2ef'
    personaFitBorder = '#e0e0e0'
  }

  return (
    <div style={{
      maxWidth: '560px',
      margin: '0 auto',
      padding: '24px 20px',
      overflowY: 'auto',
      height: '100%',
    }}>
      {/* Scenario header */}
      <div style={{ marginBottom: '18px' }}>
        <div style={{
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.1em',
          color: '#00000099',
          textTransform: 'uppercase',
          marginBottom: '6px',
        }}>
          Simulation Brief
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 700,
            color: '#000000e6',
            margin: 0,
          }}>
            {scenario.name}
          </h2>
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            color: diff.text,
            backgroundColor: diff.bg,
            borderRadius: '4px',
            padding: '2px 8px',
          }}>
            {diffLabel}
          </span>
        </div>
        <p style={{ fontSize: '13px', color: '#00000099', margin: '0 0 4px', fontStyle: 'italic' }}>
          {scenario.setting}
        </p>
        <p style={{ fontSize: '13px', color: '#00000099', margin: 0, lineHeight: 1.5 }}>
          {character.subtext}
        </p>
      </div>

      {/* Persona fit */}
      <div style={{
        backgroundColor: personaFitBg,
        border: `1px solid ${personaFitBorder}44`,
        borderRadius: '6px',
        padding: '8px 12px',
        marginBottom: '16px',
        fontSize: '12px',
        fontWeight: 600,
        color: personaFitColor,
      }}>
        {personaFitLabel}
      </div>

      {/* Objectives */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.08em',
          color: '#00000099',
          textTransform: 'uppercase',
          marginBottom: '8px',
        }}>
          Objectives
        </div>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {scenario.objectives.map((obj, i) => (
            <li key={i} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              fontSize: '13px',
              color: '#000000e6',
              lineHeight: 1.4,
            }}>
              <span style={{ color: '#057642', flexShrink: 0, marginTop: '1px' }}>✓</span>
              {obj}
            </li>
          ))}
        </ul>
      </div>

      {/* Risk factors */}
      <div style={{ marginBottom: '18px' }}>
        <div style={{
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.08em',
          color: '#00000099',
          textTransform: 'uppercase',
          marginBottom: '8px',
        }}>
          Risk Factors
        </div>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {scenario.riskFactors.map((risk, i) => (
            <li key={i} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              fontSize: '13px',
              color: '#000000e6',
              lineHeight: 1.4,
            }}>
              <span style={{ color: '#cc1016', flexShrink: 0, marginTop: '1px' }}>⚠</span>
              {risk}
            </li>
          ))}
        </ul>
      </div>

      {/* Character intro */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        padding: '14px',
        marginBottom: '14px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '10px',
        }}>
          <span style={{ fontSize: '28px' }}>{character.avatar}</span>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#000000e6' }}>
              {character.name}, {character.age}
            </div>
            <div style={{ fontSize: '12px', color: '#00000099' }}>
              {character.role} · {character.company}
            </div>
          </div>
        </div>
        <blockquote style={{
          margin: 0,
          borderLeft: '3px solid #0a66c2',
          paddingLeft: '10px',
          fontSize: '13px',
          fontStyle: 'italic',
          color: '#000000e6',
          lineHeight: 1.55,
        }}>
          "{openingLine}"
        </blockquote>
      </div>

      {/* LarpRating potential */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        backgroundColor: '#e8f5ef',
        border: '1px solid #057642',
        borderRadius: '6px',
        marginBottom: '18px',
      }}>
        <span style={{ fontSize: '12px', color: '#00000099' }}>Max LarpRating gain</span>
        <span style={{ fontSize: '15px', fontWeight: 700, color: '#057642' }}>
          +{scenario.maxLarpGain.toFixed(1)}
        </span>
      </div>

      {/* CTAs */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={onBack}
          className="li-btn-secondary"
          style={{ flex: '0 0 auto', padding: '9px 18px', fontSize: '13px' }}
        >
          Choose Different
        </button>
        <button
          onClick={onConfirm}
          className="li-btn-primary"
          style={{ flex: 1, padding: '9px 18px', fontSize: '13px' }}
        >
          Enter Simulation
        </button>
      </div>
    </div>
  )
}
