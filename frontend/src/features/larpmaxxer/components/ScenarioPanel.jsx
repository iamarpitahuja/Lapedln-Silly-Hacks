import { ScenarioCard } from './ScenarioCard'
import { getUnlockRequirement } from '../engine/unlockLogic'
import styles from './ScenarioPanel.module.css'

const TIER_LABELS = { 1: 'TIER 1 — STANDARD', 2: 'TIER 2 — ADVANCED', 3: 'TIER 3 — ELITE' }

export function ScenarioPanel({
  scenarios,
  unlockedIds,
  activeScenarioId,
  completedScenarios,
  larpRating,
  session,
  onSelectScenario,
}) {
  function renderTier(tier) {
    const tierScenarios = scenarios.filter(s => s.unlockTier === tier)
    return (
      <div key={tier}>
        <div className={styles.tierLabel}>{TIER_LABELS[tier]}</div>
        {tierScenarios.map(scenario => {
          const isUnlocked = unlockedIds.includes(scenario.id)
          const completed = completedScenarios.find(c => c.scenarioId === scenario.id)
          const unlockReq = isUnlocked ? null : getUnlockRequirement(scenario, completedScenarios, larpRating)
          return (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              isUnlocked={isUnlocked}
              isActive={scenario.id === activeScenarioId}
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
    <div className={styles.panel}>
      <div className={styles.header}>
        <p className={styles.title}>Simulations</p>
      </div>
      <div className={styles.scrollArea}>
        {[1, 2, 3].map(renderTier)}
      </div>
    </div>
  )
}
