import type {
  SimulationSession,
  SessionSummary,
  NotableMoment,
  MetricDeltas,
  AlignmentTier,
} from '../types'
import type { ScenarioMeta } from '../types'
import { getAlignmentMultiplier } from './personaAlignment'

// ─── Cringe Detection ────────────────────────────────────────────────────────

export function isCringeIncident(deltas: MetricDeltas): boolean {
  const values = [
    deltas.aura,
    deltas.socialFooting,
    deltas.plausibility,
    deltas.larpContinuity,
    deltas.respect,
  ]
  return values.filter(v => v < 0).length >= 3
}

// ─── Performance Score ────────────────────────────────────────────────────────

export function computePerformanceScore(session: SimulationSession): number {
  const { cumulative, history } = session
  const userTurns = history.filter(h => h.speaker === 'user' && h.metricDeltas)
  if (userTurns.length === 0) return 0

  // Raw weighted metric average
  const rawScore =
    cumulative.sessionAura * 0.35 +
    cumulative.larpContinuity * 0.25 +
    Math.max(0, cumulative.respect) * 0.20 +
    cumulative.socialFooting * 0.10 +
    (userTurns.reduce((acc, t) => acc + (t.metricDeltas?.plausibility ?? 0), 0)) * 0.10

  // Alignment modifier: average multiplier across all turns
  const alignmentMultipliers = userTurns.map(t => {
    const tier: AlignmentTier = t.personaAlignment ?? 'neutral'
    return getAlignmentMultiplier(tier)
  })
  const avgAlignmentMultiplier =
    alignmentMultipliers.reduce((a, b) => a + b, 0) / alignmentMultipliers.length

  const modifiedScore = rawScore * Math.max(0.1, avgAlignmentMultiplier + 1)

  // Normalize to 0–100 (raw max per turn ≈ 18+5+10+3+5 = 41, × turns)
  const maxPossible = userTurns.length * 18 * 1.0
  const normalized = Math.max(0, Math.min(100, (modifiedScore / maxPossible) * 100))
  return Math.round(normalized)
}

// ─── LarpRating Delta ─────────────────────────────────────────────────────────

export function computeLarpRatingDelta(
  performanceScore: number,
  scenarioMaxGain: number,
  cringeCount: number,
  wasExposureEvent: boolean
): number {
  const exposurePenalty = wasExposureEvent ? 0.8 : 0
  const raw =
    (performanceScore / 100) * scenarioMaxGain
    - cringeCount * 0.3
    - exposurePenalty
  return Math.round(raw * 10) / 10
}

// ─── Projected LarpRating Delta (per-turn estimate) ───────────────────────────

export function computeProjectedDelta(
  session: SimulationSession,
  scenarioMaxGain: number
): number {
  const score = computePerformanceScore(session)
  const delta = computeLarpRatingDelta(
    score,
    scenarioMaxGain,
    session.cumulative.cringeCount,
    false
  )
  return delta
}

// ─── Verdict Strings ──────────────────────────────────────────────────────────

const VERDICTS: Record<string, string[]> = {
  '90': [
    "You did not just survive this conversation. You shaped it. {name} left unsure who was more interesting.",
    "The narrative held end to end. {name} walked away thinking about what you said. That is not a common outcome.",
    "Peak larp achieved. {name} is now the one who wants a follow-up.",
  ],
  '70': [
    "The narrative held. {name} left with questions about you — the good kind.",
    "A strong performance. Some instability in the middle, but the recovery was clean.",
    "You held the room. {name} is not certain about you, which is the correct impression to leave.",
  ],
  '50': [
    "A credible effort. Some instability in the middle. The room moved on without fully writing you off.",
    "Competent but not memorable. {name} will not follow up, but also will not warn others.",
    "The persona held under light pressure. Heavier conditions remain untested.",
  ],
  '30': [
    "The cracks were visible but not catastrophic. An educational round. The persona slipped twice.",
    "{name} noticed something was off but was too polite to say it. Professional mercy.",
    "A mixed performance. The high points were real. The low points were visible. Net: inconclusive.",
  ],
  '0': [
    "The exposure was gentle. {name} was professionally kind about it. They will not be following up.",
    "The simulation acknowledges your participation.",
    "The persona did not survive contact with the scenario. This is recoverable information.",
  ],
}

export function getVerdict(score: number, characterName: string): string {
  let bucket = '0'
  if (score >= 90) bucket = '90'
  else if (score >= 70) bucket = '70'
  else if (score >= 50) bucket = '50'
  else if (score >= 30) bucket = '30'

  const options = VERDICTS[bucket]
  const template = options[Math.floor(Math.random() * options.length)]
  return template.replace(/{name}/g, characterName)
}

// ─── Notable Moments ──────────────────────────────────────────────────────────

const FLAVOR_BADGE_ANNOTATIONS: Record<string, { positive: string; negative: string }> = {
  prestige: { positive: 'The safe play landed.', negative: 'The safe play did not feel safe.' },
  ambitious: { positive: 'The reach paid off.', negative: 'The reach exceeded the grasp.' },
  unhinged: { positive: 'The unhinged move worked. It sometimes does.', negative: 'The unhinged move did not work. It sometimes doesn\'t.' },
  calculated: { positive: 'The deflection landed as confidence.', negative: 'The deflection read as evasion.' },
  wildcard: { positive: 'The wildcard came up correctly.', negative: 'The wildcard came up incorrectly.' },
  cringe_risk: { positive: 'The cringe risk paid off against all odds.', negative: 'The cringe risk materialized as predicted.' },
  alpha: { positive: 'The dominance move landed.', negative: 'The dominance move overshot.' },
  authentic: { positive: 'Breaking from persona dropped Suspicion significantly.', negative: 'The authentic moment cost Larp Continuity.' },
  glazed: { positive: 'The glaze landed as warmth.', negative: 'The glaze landed as desperation.' },
}

export function computeNotableMoments(session: SimulationSession): NotableMoment[] {
  const userTurns = session.history
    .filter(h => h.speaker === 'user' && h.metricDeltas)
    .map((h, i) => ({ ...h, index: i }))

  if (userTurns.length === 0) return []

  // Sort by absolute aura impact
  const sorted = [...userTurns].sort(
    (a, b) => Math.abs(b.metricDeltas!.aura) - Math.abs(a.metricDeltas!.aura)
  )

  return sorted.slice(0, 3).map(turn => {
    const positive = (turn.metricDeltas!.aura ?? 0) > 0
    const badge = turn.flavorBadge ?? 'prestige'
    const annotation = FLAVOR_BADGE_ANNOTATIONS[badge]?.[positive ? 'positive' : 'negative']
      ?? (positive ? 'A strong moment.' : 'A rough moment.')

    return {
      turn: turn.turn,
      type: positive ? 'positive' : 'negative',
      annotation: `Turn ${turn.turn}: ${annotation} (Aura: ${turn.metricDeltas!.aura > 0 ? '+' : ''}${turn.metricDeltas!.aura.toFixed(1)})`,
    }
  })
}

// ─── Summary Metrics ──────────────────────────────────────────────────────────

export function computeSummaryMetrics(
  session: SimulationSession,
  scenario: ScenarioMeta,
  characterName: string
): SessionSummary {
  const performanceScore = computePerformanceScore(session)
  const wasExposure = session.status === 'exposure_ended'
  const larpRatingDelta = computeLarpRatingDelta(
    performanceScore,
    scenario.maxLarpGain,
    session.cumulative.cringeCount,
    wasExposure
  )

  const userTurns = session.history.filter(h => h.speaker === 'user' && h.metricDeltas)
  const totalTurns = userTurns.length || 1

  const perfectCount = userTurns.filter(t => t.personaAlignment === 'perfect').length
  const personaAlignmentPct = Math.round((perfectCount / totalTurns) * 100)

  const plausibilitySum = userTurns.reduce((acc, t) => acc + (t.metricDeltas?.plausibility ?? 0), 0)
  const maxPlausibility = totalTurns * 5
  const believability = Math.min(100, Math.max(0, Math.round(((plausibilitySum + maxPlausibility) / (maxPlausibility * 2)) * 100)))

  const respectSum = session.cumulative.respect
  const maxRespect = totalTurns * 10
  const statusAscension = Math.min(100, Math.max(0, Math.round(((respectSum + maxRespect) / (maxRespect * 2)) * 100)))

  const auraPerTurn = session.cumulative.sessionAura / totalTurns
  const maxAuraPerTurn = 18
  const dialogueEfficiency = Math.min(100, Math.max(0, Math.round(((auraPerTurn + maxAuraPerTurn) / (maxAuraPerTurn * 2)) * 100)))

  const larpContSum = session.cumulative.larpContinuity
  const maxLarpCont = totalTurns * 5
  const larpContinuityPct = Math.min(100, Math.max(0, Math.round(((larpContSum + maxLarpCont) / (maxLarpCont * 2)) * 100)))

  return {
    performanceScore,
    larpRatingDelta,
    personaAlignmentPct,
    believability,
    statusAscension,
    dialogueEfficiency,
    larpContinuityPct,
    cringeCount: session.cumulative.cringeCount,
    missedGlazeOps: session.cumulative.missedGlazeOps,
    verdict: getVerdict(performanceScore, characterName),
    notableMoments: computeNotableMoments(session),
  }
}
