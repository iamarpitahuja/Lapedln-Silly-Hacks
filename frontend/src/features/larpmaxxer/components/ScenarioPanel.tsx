import type { ScenarioMeta, SimulationSession } from '../types'
import { ScenarioCard } from './ScenarioCard'
import { getUnlockRequirement } from '../engine/unlockLogic'

type CompletedEntry = { scenarioId: string; score: number; bestScore: number }

type ScenarioPanelProps = {
  scenarios: ScenarioMeta[]
  unlockedIds: string[]
  activeScenarioId: string | null
  completedScenarios: CompletedEntry[]
  larpRating: number
  session: SimulationSession | null
  onSelectScenario: (id: string) => void
}

const TIER_LABELS: Record<1 | 2 | 3, string> = {
  1: 'TIER 1 — STANDARD',
  2: 'TIER 2 — ADVANCED',
  3: 'TIER 3 — ELITE',
}

export function ScenarioPanel({
  scenarios,
  unlockedIds,
  activeScenarioId,
  completedScenarios,
  larpRating,
  session,
  onSelectScenario,
}: ScenarioPanelProps) {
  const hasSession = session !== null

  const tier1 = scenarios.filter(s => s.unlockTier === 1)
  const tier2 = scenarios.filter(s => s.unlockTier === 2)
  const tier3 = scenarios.filter(s => s.unlockTier === 3)

  function renderTier(tierScenarios: ScenarioMeta[], tier: 1 | 2 | 3) {
    return (
      <div key={tier} style={{ marginBottom: '8px' }}>
        <div style={{
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.08em',
          color: '#00000099',
          textTransform: 'uppercase',
          padding: '6px 0',
          borderBottom: '1px solid #e0e0e0',
          marginBottom: '6px',
        }}>
          {TIER_LABELS[tier]}
        </div>
        {tierScenarios.map(scenario => {
          const isUnlocked = unlockedIds.includes(scenario.id)
          const isActive = scenario.id === activeScenarioId
          const completed = completedScenarios.find(c => c.scenarioId === scenario.id)
          const unlockReq = isUnlocked ? null : getUnlockRequirement(scenario, completedScenarios, larpRating)
          return (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              isUnlocked={isUnlocked}
              isActive={isActive}
              bestScore={completed?.bestScore}
              unlockRequirement={unlockReq}
              onSelect={() => onSelectScenario(scenario.id)}
            />
          )
        })}
      </div>
    )
  }

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRight: '1px solid #e0e0e0',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 14px 10px',
        borderBottom: '1px solid #e0e0e0',
        flexShrink: 0,
      }}>
        <div style={{
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.08em',
          color: '#00000099',
          textTransform: 'uppercase',
          marginBottom: '2px',
        }}>
          {hasSession ? 'Active Simulation' : 'Select Scenario'}
        </div>
        <div style={{ fontSize: '11px', color: '#00000099' }}>
          LarpRating:{' '}
          <span style={{ color: '#0a66c2', fontWeight: 700 }}>{larpRating.toFixed(1)}</span>
        </div>
      </div>

      {/* Scrollable list */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '10px 12px',
      }}>
        {renderTier(tier1, 1)}
        {tier2.length > 0 && renderTier(tier2, 2)}
        {tier3.length > 0 && renderTier(tier3, 3)}
      </div>

      {/* Session stats strip */}
      {hasSession && session && (
        <div style={{
          borderTop: '1px solid #e0e0e0',
          padding: '10px 14px',
          backgroundColor: '#f3f2ef',
          flexShrink: 0,
        }}>
          <div style={{
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: '#00000099',
            textTransform: 'uppercase',
            marginBottom: '6px',
          }}>
            Session Stats
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', color: '#00000099' }}>Session Aura</span>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: session.cumulative.sessionAura >= 0 ? '#057642' : '#cc1016',
              }}>
                {session.cumulative.sessionAura >= 0 ? '+' : ''}{session.cumulative.sessionAura}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', color: '#00000099' }}>Cringe Count</span>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: session.cumulative.cringeCount > 0 ? '#cc1016' : '#057642',
              }}>
                {session.cumulative.cringeCount}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', color: '#00000099' }}>Turns Remaining</span>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: (session.maxTurns - session.turnCount) <= 2 ? '#cc1016' : '#000000e6',
              }}>
                {session.maxTurns - session.turnCount}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
