import { describe, expect, it } from 'vitest'

import type { ScenarioMeta, SimulationSession } from '../types'
import {
  computeLarpRatingDelta,
  computeProjectedDelta,
  computeSummaryMetrics,
} from './scoring'

function buildScenario(maxLarpGain: number): ScenarioMeta {
  return {
    id: 'test-scenario',
    name: 'Test Scenario',
    setting: 'Test',
    difficulty: 'medium',
    maxTurns: 8,
    maxLarpGain,
    objectives: [],
    riskFactors: [],
    bestPersonas: ['consulting_clone'],
    toughPersonas: ['homeless_cs'],
    characterId: 'jordan',
    unlockTier: 1,
  }
}

function buildSession(
  overrides: Partial<SimulationSession['cumulative']> = {},
  sessionOverrides: Partial<SimulationSession> = {}
): SimulationSession {
  const totalTurns = overrides.totalTurns ?? 7
  return {
    sessionId: 'sim_test',
    userId: 'user_test',
    personaId: 'consulting_clone',
    scenarioId: 'coffee-chat',
    characterId: 'jordan',
    startedAt: 0,
    turnCount: totalTurns,
    maxTurns: totalTurns,
    meters: { impressed: 70, suspicion: 40, status: 65 },
    cumulative: {
      sessionAura: 70,
      socialFooting: 28,
      larpContinuity: 28,
      respect: 42,
      cringeCount: 0,
      perfectAlignments: totalTurns,
      adjacentAlignments: 0,
      offPersonaCount: 0,
      missedGlazeOps: 0,
      totalTurns,
      ...overrides,
    },
    history: Array.from({ length: totalTurns }, (_, index) => ({
      turn: index + 1,
      speaker: 'user' as const,
      text: `Turn ${index + 1}`,
      personaAlignment: 'perfect' as const,
      metricDeltas: {
        aura: 10,
        socialFooting: 4,
        plausibility: 3,
        larpContinuity: 4,
        respect: 6,
      },
      meterDeltas: { impressed: 4, suspicion: 0 },
      characterThinks: 'Fine.',
      cringe: false,
    })),
    status: 'completed',
    ...sessionOverrides,
  }
}

describe('larpmaxxer scoring', () => {
  it('rewards alignment separately from raw execution', () => {
    const scenario = buildScenario(10)
    const perfect = buildSession()
    const offPersona = buildSession({
      perfectAlignments: 0,
      adjacentAlignments: 0,
      offPersonaCount: 7,
    })

    const perfectDelta = computeLarpRatingDelta(perfect, scenario)
    const offPersonaDelta = computeLarpRatingDelta(offPersona, scenario)

    expect(perfectDelta).toBeGreaterThan(offPersonaDelta)
    expect(perfectDelta - offPersonaDelta).toBeGreaterThanOrEqual(4)
  })

  it('applies cringe and exposure penalties and floors disasters at -5', () => {
    const scenario = buildScenario(20)
    const disaster = buildSession(
      {
        sessionAura: -35,
        socialFooting: -21,
        larpContinuity: -18,
        respect: -10,
        cringeCount: 8,
        perfectAlignments: 0,
        adjacentAlignments: 0,
        offPersonaCount: 7,
      },
      { status: 'exposure_ended' }
    )

    expect(computeLarpRatingDelta(disaster, scenario)).toBe(-5)
  })

  it('keeps projected and summary deltas in sync for the same post-turn session state', () => {
    const scenario = buildScenario(16)
    const session = buildSession(
      {
        sessionAura: 84,
        socialFooting: 35,
        larpContinuity: 30,
        respect: 52,
        cringeCount: 1,
        perfectAlignments: 5,
        adjacentAlignments: 2,
        offPersonaCount: 0,
      },
      { status: 'completed' }
    )

    const projected = computeProjectedDelta(session, scenario)
    const summary = computeSummaryMetrics(session, scenario, 'Jordan')

    expect(projected).toBe(summary.larpRatingDelta)
  })
})
