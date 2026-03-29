import type { SessionSummary, ScenarioMeta, Persona, SimulationSession } from '../types'

type SummaryScreenProps = {
  summary: SessionSummary
  scenario: ScenarioMeta
  persona: Persona
  session: SimulationSession
  onReplay: () => void
  onNewScenario: () => void
  onExit: () => void
}

type StatBarProps = {
  label: string
  value: number
  isInteger?: boolean
  isInverseGood?: boolean
  max?: number
}

function StatBar({ label, value, isInteger = false, isInverseGood = false, max = 100 }: StatBarProps) {
  const displayValue = Math.round(value)
  const pct = isInteger ? Math.min(100, (value / Math.max(1, max)) * 100) : Math.min(100, value)

  let barColor = '#0a66c2'
  if (isInteger) {
    barColor = isInverseGood
      ? value === 0 ? '#057642' : value <= 2 ? '#b45309' : '#cc1016'
      : '#0a66c2'
  } else {
    barColor = value >= 70 ? '#057642' : value >= 40 ? '#0a66c2' : '#b45309'
  }
  if (isInverseGood && value > 0) {
    barColor = value <= 2 ? '#b45309' : '#cc1016'
  }

  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '12px', color: '#00000099', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#000000e6' }}>
          {isInteger ? displayValue : `${displayValue}%`}
        </span>
      </div>
      <div style={{
        height: '5px',
        backgroundColor: '#e0e0e0',
        borderRadius: '3px',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          backgroundColor: barColor,
          borderRadius: '3px',
          transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  )
}

export function SummaryScreen({
  summary,
  scenario,
  persona,
  session,
  onReplay,
  onNewScenario,
  onExit,
}: SummaryScreenProps) {
  const isPositiveDelta = summary.larpRatingDelta > 0
  const isNegativeDelta = summary.larpRatingDelta < 0

  const scoreColor = summary.performanceScore >= 70
    ? '#057642'
    : summary.performanceScore >= 40
    ? '#0a66c2'
    : '#cc1016'

  return (
    <div style={{
      maxWidth: '560px',
      margin: '0 auto',
      padding: '24px 20px',
      overflowY: 'auto',
      height: '100%',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.12em',
          color: '#00000099',
          textTransform: 'uppercase',
          marginBottom: '6px',
        }}>
          Simulation Complete
        </div>
        <div style={{ fontSize: '13px', color: '#00000099', marginBottom: '4px' }}>
          {scenario.name} · {persona.icon} {persona.name} · {session.turnCount} turns
        </div>
      </div>

      {/* Performance score */}
      <div style={{
        textAlign: 'center',
        marginBottom: '20px',
        padding: '20px',
        backgroundColor: '#f3f2ef',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
      }}>
        <div style={{
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.1em',
          color: '#00000099',
          textTransform: 'uppercase',
          marginBottom: '8px',
        }}>
          Performance Score
        </div>
        <div style={{
          fontSize: '64px',
          fontWeight: 900,
          color: scoreColor,
          lineHeight: 1,
          marginBottom: '10px',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {Math.round(summary.performanceScore)}
        </div>
        <div style={{
          fontSize: '18px',
          fontWeight: 700,
          color: isPositiveDelta ? '#057642' : isNegativeDelta ? '#cc1016' : '#00000099',
        }}>
          LarpRating {isPositiveDelta ? '+' : ''}{summary.larpRatingDelta.toFixed(1)}
        </div>
      </div>

      {/* Stat bars */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '12px',
        border: '1px solid #e0e0e0',
      }}>
        <div style={{
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.08em',
          color: '#00000099',
          textTransform: 'uppercase',
          marginBottom: '12px',
        }}>
          Breakdown
        </div>
        <StatBar label="Persona Alignment" value={summary.personaAlignmentPct} />
        <StatBar label="Believability" value={summary.believability} />
        <StatBar label="Status Ascension" value={summary.statusAscension} />
        <StatBar label="Dialogue Efficiency" value={summary.dialogueEfficiency} />
        <StatBar label="Larp Continuity" value={summary.larpContinuityPct} />
        <StatBar label="Cringe Incidents" value={summary.cringeCount} isInteger isInverseGood max={session.maxTurns} />
        <StatBar label="Missed Glaze Ops" value={summary.missedGlazeOps} isInteger isInverseGood max={session.maxTurns} />
      </div>

      {/* Verdict */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '12px',
        border: '1px solid #e0e0e0',
      }}>
        <div style={{
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.08em',
          color: '#00000099',
          textTransform: 'uppercase',
          marginBottom: '10px',
        }}>
          Verdict
        </div>
        <blockquote style={{
          margin: 0,
          borderLeft: '3px solid #0a66c2',
          paddingLeft: '12px',
          fontSize: '13px',
          fontStyle: 'italic',
          color: '#000000e6',
          lineHeight: 1.6,
        }}>
          {summary.verdict}
        </blockquote>
      </div>

      {/* Notable moments */}
      {summary.notableMoments.length > 0 && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px',
          border: '1px solid #e0e0e0',
        }}>
          <div style={{
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: '#00000099',
            textTransform: 'uppercase',
            marginBottom: '10px',
          }}>
            Notable Moments
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {summary.notableMoments.map((moment, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                fontSize: '13px',
                color: '#000000e6',
                lineHeight: 1.4,
              }}>
                <span style={{
                  color: moment.type === 'positive' ? '#057642' : '#cc1016',
                  flexShrink: 0,
                  marginTop: '1px',
                  fontWeight: 700,
                }}>
                  {moment.type === 'positive' ? '▲' : '▼'}
                </span>
                <span>
                  <span style={{ color: '#00000099', fontSize: '11px', marginRight: '4px' }}>Turn {moment.turn}:</span>
                  {moment.annotation}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTAs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onReplay}
            className="li-btn-primary"
            style={{ flex: 1, padding: '10px', fontSize: '13px' }}
          >
            Replay
          </button>
          <button
            onClick={onNewScenario}
            className="li-btn-secondary"
            style={{ flex: 1, padding: '9px', fontSize: '13px' }}
          >
            Try Different Scenario
          </button>
        </div>
        <button
          onClick={onExit}
          style={{
            width: '100%',
            backgroundColor: 'transparent',
            border: '1px solid #e0e0e0',
            borderRadius: '24px',
            padding: '9px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500,
            color: '#00000099',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.color = '#000000e6'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.color = '#00000099'
          }}
        >
          Return to Selection
        </button>

        {/* Generate Alternate Timeline — disabled */}
        <div style={{ position: 'relative', marginTop: '4px' }}>
          <button
            disabled
            title="Coming soon"
            style={{
              width: '100%',
              backgroundColor: 'transparent',
              border: '1px dashed #e0e0e0',
              borderRadius: '24px',
              padding: '9px',
              cursor: 'not-allowed',
              fontSize: '13px',
              fontWeight: 500,
              color: '#00000033',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            Generate Alternate Timeline
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              color: '#6b39c1',
              backgroundColor: '#f3eeff',
              border: '1px solid #6b39c130',
              borderRadius: '3px',
              padding: '1px 5px',
              letterSpacing: '0.06em',
            }}>
              SOON
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
