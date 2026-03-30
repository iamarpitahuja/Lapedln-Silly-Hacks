import { SCENARIOS } from '../../../content/scenarios'
import type { ScenarioMeta } from '../types'

type CompletedScenario = { scenarioId: string; score: number }

const TIER1_IDS = SCENARIOS.filter(s => s.unlockTier === 1).map(s => s.id)
const TIER2_IDS = SCENARIOS.filter(s => s.unlockTier === 2).map(s => s.id)
const TIER3_IDS = SCENARIOS.filter(s => s.unlockTier === 3).map(s => s.id)

export function getUnlockedScenarios(
  completedScenarios: CompletedScenario[],
  larpRating: number
): string[] {
  const unlocked: string[] = [...TIER1_IDS]

  const tier1Passes = completedScenarios.filter(
    c => TIER1_IDS.includes(c.scenarioId) && c.score >= 50
  )
  if (tier1Passes.length >= 3) {
    unlocked.push(...TIER2_IDS)
  }

  const tier2Passes = completedScenarios.filter(
    c => TIER2_IDS.includes(c.scenarioId) && c.score >= 60
  )
  if (tier2Passes.length >= 2) {
    unlocked.push(...TIER3_IDS)
  }

  // LarpRating gate on very-hard scenarios
  const ratingGated = ['startup-pitch', 'startup-billionaire']
  return unlocked.filter(id => {
    if (ratingGated.includes(id) && larpRating < 60) return false
    return true
  })
}

export function getUnlockRequirement(scenario: ScenarioMeta, completedScenarios: CompletedScenario[], larpRating: number): string | null {
  if (scenario.unlockTier === 1) return null

  if (scenario.larpRatingMinimum && larpRating < scenario.larpRatingMinimum) {
    return `Requires LarpRating ${scenario.larpRatingMinimum}+`
  }

  if (scenario.unlockTier === 2) {
    const tier1Passes = completedScenarios.filter(
      c => TIER1_IDS.includes(c.scenarioId) && c.score >= 50
    )
    const remaining = 3 - tier1Passes.length
    if (remaining > 0) {
      return `Complete ${remaining} more Tier 1 scenario${remaining === 1 ? '' : 's'} with score ≥ 50`
    }
  }

  if (scenario.unlockTier === 3) {
    const tier2Passes = completedScenarios.filter(
      c => TIER2_IDS.includes(c.scenarioId) && c.score >= 60
    )
    const remaining = 2 - tier2Passes.length
    if (remaining > 0) {
      return `Complete ${remaining} more Tier 2 scenario${remaining === 1 ? '' : 's'} with score ≥ 60`
    }
  }

  return null
}
