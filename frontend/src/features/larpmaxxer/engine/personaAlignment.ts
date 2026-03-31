import type { PersonaId, PersonaCluster, AlignmentTier, FlavorBadge } from '../types'

const PERSONA_CLUSTERS: Record<PersonaId, PersonaCluster> = {
  finance_bro: 'finance',
  vc_intern: 'finance',
  startup_billionaire: 'finance',
  ai_founder: 'tech',
  homeless_cs: 'tech',
  stanford_dropout: 'tech',
  consulting_clone: 'corporate',
  pm_newsletter: 'corporate',
  liberal_arts: 'culture',
  performative_uni: 'culture',
  crypto_philosopher: 'wild',
  student_athlete: 'wild',
}

export function getPersonaCluster(personaId: PersonaId): PersonaCluster {
  return PERSONA_CLUSTERS[personaId]
}

export function arePersonasAdjacent(a: PersonaId, b: PersonaId): boolean {
  if (a === b) return false
  return PERSONA_CLUSTERS[a] === PERSONA_CLUSTERS[b]
}

export function getAlignmentTier(
  responsePersonaTag: PersonaId,
  userPersonaId: PersonaId,
  flavorBadge: FlavorBadge
): AlignmentTier {
  if (flavorBadge === 'wildcard') return 'wildcard'
  if (responsePersonaTag === userPersonaId) return 'perfect'
  if (arePersonasAdjacent(responsePersonaTag, userPersonaId)) return 'adjacent'

  // Off-persona: culture vs finance, corporate vs tech, etc.
  const userCluster = PERSONA_CLUSTERS[userPersonaId]
  const responseCluster = PERSONA_CLUSTERS[responsePersonaTag]
  const opposingClusters: Partial<Record<PersonaCluster, PersonaCluster[]>> = {
    finance: ['culture'],
    culture: ['finance'],
    tech: ['corporate'],
    corporate: ['tech'],
  }
  const opposites = opposingClusters[userCluster] ?? []
  if (opposites.includes(responseCluster)) return 'off_persona'

  return 'neutral'
}

export function getAlignmentMultiplier(tier: AlignmentTier): number {
  switch (tier) {
    case 'perfect': return 1.0
    case 'adjacent': return 0.6
    case 'neutral': return 0.2
    case 'off_persona': return -0.2
    case 'wildcard': return Math.random() * 0.9 - 0.1 // -0.1 to 0.8
  }
}

export function getAlignmentLabel(tier: AlignmentTier): string {
  switch (tier) {
    case 'perfect': return 'Persona Alignment: Perfect ✓'
    case 'adjacent': return 'Adjacent Persona'
    case 'neutral': return 'Neutral Choice'
    case 'off_persona': return 'Persona Drift Detected'
    case 'wildcard': return 'Wildcard — Outcome Unknown'
  }
}
