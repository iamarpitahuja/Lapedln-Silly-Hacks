// ─── Personas ────────────────────────────────────────────────────────────────

export type PersonaId =
  | 'finance_bro'
  | 'homeless_cs'
  | 'startup_billionaire'
  | 'liberal_arts'
  | 'ai_founder'
  | 'stanford_dropout'
  | 'consulting_clone'
  | 'crypto_philosopher'
  | 'pm_newsletter'
  | 'vc_intern'
  | 'student_athlete'
  | 'performative_uni'

export type PersonaCluster = 'finance' | 'tech' | 'corporate' | 'culture' | 'wild'

export type Persona = {
  id: PersonaId
  name: string
  icon: string
  description: string
  cluster: PersonaCluster
  behaviorSignature: string
}

// ─── Alignment ───────────────────────────────────────────────────────────────

export type AlignmentTier = 'perfect' | 'adjacent' | 'neutral' | 'off_persona' | 'wildcard'

// ─── Scenarios ───────────────────────────────────────────────────────────────

export type Difficulty = 'easy' | 'easy_medium' | 'medium' | 'hard' | 'very_hard'

export type ScenarioMeta = {
  id: string
  name: string
  setting: string
  difficulty: Difficulty
  maxTurns: number
  maxLarpGain: number
  objectives: string[]
  riskFactors: string[]
  bestPersonas: PersonaId[]
  toughPersonas: PersonaId[]
  characterId: string
  unlockTier: 1 | 2 | 3
  larpRatingMinimum?: number
}

// ─── Characters ──────────────────────────────────────────────────────────────

export type MoodState = 'neutral' | 'curious' | 'skeptical' | 'impressed' | 'done'

export type CharacterProfile = {
  id: string
  name: string
  age: number
  role: string
  company: string
  subtext: string
  avatar: string
  voiceId?: string
  personalityTraits: string[]
  personaAffinities: Partial<Record<PersonaId, { impressed: number; suspicion: number }>>
  catchphrases: string[]
}

// ─── Meters ──────────────────────────────────────────────────────────────────

export type Meters = {
  impressed: number
  suspicion: number
  status: number
}

// ─── Response Options ─────────────────────────────────────────────────────────

export type FlavorBadge =
  | 'prestige'
  | 'ambitious'
  | 'unhinged'
  | 'calculated'
  | 'wildcard'
  | 'cringe_risk'
  | 'alpha'
  | 'authentic'
  | 'glazed'

export type MetricDeltas = {
  aura: number
  socialFooting: number
  plausibility: number
  larpContinuity: number
  respect: number
}

export type ResponseOption = {
  id: string
  personaTag: PersonaId
  text: string
  flavorBadge: FlavorBadge
  metricDeltas: MetricDeltas
  meterDeltas: { impressed: number; suspicion: number }
  characterThinks: string
}

// ─── Dialogue Content ─────────────────────────────────────────────────────────

export type DialogueNode = {
  turn: number
  characterLine: string
  options: ResponseOption[]
}

export type ScenarioContent = {
  scenarioId: string
  briefDescription: string
  openingLine: string
  dialogueNodes: DialogueNode[]
}

// ─── Session State ───────────────────────────────────────────────────────────

export type SimulationStatus =
  | 'idle'
  | 'prebriefing'
  | 'active'
  | 'exposure_ended'
  | 'breakthrough_ended'
  | 'completed'

export type ConversationEntry = {
  turn: number
  speaker: 'character' | 'user'
  text: string
  personaTag?: PersonaId
  flavorBadge?: FlavorBadge
  personaAlignment?: AlignmentTier
  metricDeltas?: MetricDeltas
  meterDeltas?: { impressed: number; suspicion: number }
  characterThinks?: string
  cringe?: boolean
  moodState?: MoodState
}

export type CumulativeStats = {
  sessionAura: number
  socialFooting: number
  larpContinuity: number
  respect: number
  cringeCount: number
  perfectAlignments: number
  adjacentAlignments: number
  offPersonaCount: number
  missedGlazeOps: number
  totalTurns: number
}

export type SimulationSession = {
  sessionId: string
  userId: string
  personaId: PersonaId
  scenarioId: string
  characterId: string
  startedAt: number
  turnCount: number
  maxTurns: number
  meters: Meters
  cumulative: CumulativeStats
  history: ConversationEntry[]
  status: SimulationStatus
  endReason?: string
  performanceScore?: number
  larpRatingDelta?: number
}

// ─── Summary ─────────────────────────────────────────────────────────────────

export type NotableMoment = {
  turn: number
  type: 'positive' | 'negative'
  annotation: string
}

export type SessionSummary = {
  performanceScore: number
  larpRatingDelta: number
  personaAlignmentPct: number
  believability: number
  statusAscension: number
  dialogueEfficiency: number
  larpContinuityPct: number
  cringeCount: number
  missedGlazeOps: number
  verdict: string
  notableMoments: NotableMoment[]
  alternateTurnId?: number
}

// ─── UI State ────────────────────────────────────────────────────────────────

export type EvaluationFlashData = {
  alignmentTier: AlignmentTier
  metricDeltas: MetricDeltas
  meterDeltas: { impressed: number; suspicion: number }
  characterThinks: string
  projectedLarpDelta: number
  cringe: boolean
}

export type EventCardData = {
  type: 'exposure' | 'breakthrough'
  characterName: string
  characterLine: string
  endTurn: number
  maxTurns: number
}

export type ExposureRisk = 'low' | 'medium' | 'high' | 'critical'
