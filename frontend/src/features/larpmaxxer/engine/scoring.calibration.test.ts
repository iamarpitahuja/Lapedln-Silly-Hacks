import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { CHARACTER_MAP } from '../../../content/characters'
import { SCENARIO_MAP } from '../../../content/scenarios'
import { getAlignmentTier } from './personaAlignment'
import { computeLarpRatingDelta } from './scoring'
import type { PersonaId, ResponseOption, ScenarioMeta, SimulationSession } from '../types'

type SearchResult = {
  delta: number
  status: SimulationSession['status']
}

const CONTENT_ROOT = path.resolve(
  process.cwd(),
  '../backend/app/data/larpmaxxer/scenario-content'
)

function loadScenarioContent(scenarioId: string): { dialogueNodes: Array<{ options: ResponseOption[] }> } {
  const raw = fs.readFileSync(path.join(CONTENT_ROOT, `${scenarioId}.json`), 'utf8')
  return JSON.parse(raw)
}

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value))
}

function isCringe(option: ResponseOption) {
  return [
    option.metricDeltas.aura,
    option.metricDeltas.socialFooting,
    option.metricDeltas.plausibility,
    option.metricDeltas.larpContinuity,
    option.metricDeltas.respect,
  ].filter(value => value < 0).length >= 3
}

function buildInitialSession(scenario: ScenarioMeta, personaId: PersonaId): SimulationSession {
  const character = CHARACTER_MAP.get(scenario.characterId)
  if (!character) {
    throw new Error(`Missing character for ${scenario.id}`)
  }

  const affinity = character.personaAffinities[personaId] ?? { impressed: 0, suspicion: 0 }
  return {
    sessionId: 'sim_calibration',
    userId: 'user_calibration',
    personaId,
    scenarioId: scenario.id,
    characterId: character.id,
    startedAt: 0,
    turnCount: 0,
    maxTurns: scenario.maxTurns,
    meters: {
      impressed: clamp(45 + affinity.impressed),
      suspicion: clamp(25 - affinity.suspicion),
      status: 65,
    },
    cumulative: {
      sessionAura: 0,
      socialFooting: 0,
      larpContinuity: 0,
      respect: 0,
      cringeCount: 0,
      perfectAlignments: 0,
      adjacentAlignments: 0,
      offPersonaCount: 0,
      missedGlazeOps: 0,
      totalTurns: 0,
    },
    history: [],
    status: 'active',
  }
}

function applyOption(
  session: SimulationSession,
  option: ResponseOption,
  scenario: ScenarioMeta
): SimulationSession {
  const alignmentTier = getAlignmentTier(option.personaTag, session.personaId, option.flavorBadge)
  const updatedTurns = session.cumulative.totalTurns + 1
  const meters = {
    impressed: clamp(session.meters.impressed + option.meterDeltas.impressed),
    suspicion: clamp(session.meters.suspicion + option.meterDeltas.suspicion),
    status: clamp(session.meters.status + Math.round(option.metricDeltas.respect * 0.6)),
  }

  let status: SimulationSession['status'] = 'active'
  if (meters.suspicion >= 90) status = 'exposure_ended'
  else if (meters.impressed >= 95) status = 'breakthrough_ended'
  else if (updatedTurns >= scenario.maxTurns) status = 'completed'

  return {
    ...session,
    turnCount: updatedTurns,
    meters,
    status,
    cumulative: {
      ...session.cumulative,
      sessionAura: session.cumulative.sessionAura + option.metricDeltas.aura,
      socialFooting: session.cumulative.socialFooting + option.metricDeltas.socialFooting,
      larpContinuity: session.cumulative.larpContinuity + option.metricDeltas.larpContinuity,
      respect: session.cumulative.respect + option.metricDeltas.respect,
      cringeCount: session.cumulative.cringeCount + (isCringe(option) ? 1 : 0),
      perfectAlignments: session.cumulative.perfectAlignments + (alignmentTier === 'perfect' ? 1 : 0),
      adjacentAlignments: session.cumulative.adjacentAlignments + (alignmentTier === 'adjacent' ? 1 : 0),
      offPersonaCount: session.cumulative.offPersonaCount + (alignmentTier === 'off_persona' ? 1 : 0),
      totalTurns: updatedTurns,
    },
  }
}

function findExtremes(scenarioId: string, personaId: PersonaId) {
  const scenario = SCENARIO_MAP.get(scenarioId)
  if (!scenario) {
    throw new Error(`Missing scenario ${scenarioId}`)
  }

  const content = loadScenarioContent(scenarioId)
  let best: SearchResult = { delta: Number.NEGATIVE_INFINITY, status: 'completed' }
  let worst: SearchResult = { delta: Number.POSITIVE_INFINITY, status: 'completed' }
  let bestWithOffPersona = Number.NEGATIVE_INFINITY

  function search(nodeIndex: number, session: SimulationSession) {
    const node = content.dialogueNodes[nodeIndex]
    if (!node) {
      const delta = computeLarpRatingDelta(session, scenario)
      if (delta > best.delta) best = { delta, status: session.status }
      if (delta < worst.delta) worst = { delta, status: session.status }
      return
    }

    for (const option of node.options) {
      const next = applyOption(session, option, scenario)
      const delta = computeLarpRatingDelta(next, scenario)

      if (next.cumulative.offPersonaCount > 0) {
        bestWithOffPersona = Math.max(bestWithOffPersona, delta)
      }

      if (next.status === 'active') {
        search(nodeIndex + 1, next)
      } else {
        if (delta > best.delta) best = { delta, status: next.status }
        if (delta < worst.delta) worst = { delta, status: next.status }
      }
    }
  }

  search(0, buildInitialSession(scenario, personaId))
  return { best, worst, bestWithOffPersona }
}

describe('larpmaxxer scoring calibration against shipped content', () => {
  it('keeps coffee chat in the intended easy-scenario band', () => {
    const { best, worst, bestWithOffPersona } = findExtremes('coffee-chat', 'consulting_clone')

    expect(best.delta).toBeGreaterThanOrEqual(8)
    expect(best.delta).toBeLessThanOrEqual(10)
    expect(worst.delta).toBeLessThanOrEqual(-2)
    expect(bestWithOffPersona).toBeLessThan(best.delta)
  })

  it('keeps vc mixer in the intended hard-scenario best-case band', () => {
    const { best, worst } = findExtremes('vc-mixer', 'ai_founder')

    expect(best.delta).toBeGreaterThanOrEqual(13)
    expect(best.delta).toBeLessThanOrEqual(16)
    expect(worst.delta).toBeLessThanOrEqual(-4)
  })

  it('keeps startup pitch in the intended very-hard best-case band', () => {
    const { best, worst } = findExtremes('startup-pitch', 'ai_founder')

    expect(best.delta).toBeGreaterThanOrEqual(16)
    expect(best.delta).toBeLessThanOrEqual(20)
    expect(worst.delta).toBeLessThanOrEqual(-4)
  })
})
