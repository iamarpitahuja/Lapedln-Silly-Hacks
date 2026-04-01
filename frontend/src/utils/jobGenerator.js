// Simple seeded PRNG (mulberry32) — same seed always produces same board
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const COMPANY_PREFIXES = [
  'Nimbus', 'Quantum', 'Apex', 'Strata', 'Vertex', 'Pulse', 'Nexus',
  'Vantage', 'Cipher', 'Lumen', 'Prism', 'Helix', 'Axon', 'Flux', 'Zenith',
  'Aura', 'Synapse', 'Drift', 'Fractal', 'Momentum',
]

const COMPANY_SUFFIXES = [
  'Dynamics', 'Ventures', 'Capital', 'Group', 'Labs', 'Partners', 'Co',
  'Collective', 'Global', 'Holdings', 'Network', 'Systems', 'Works',
  'Futures', 'Forge', 'Studio', 'Associates',
]

const ROLE_LEVELS = [
  'Head of', 'VP of', 'Chief', 'Senior Director of',
  'Principal', 'Director of', 'Global Lead of', 'EVP of', 'Interim VP of',
]

const ROLE_FUNCTIONS = [
  'Vibe Strategy', 'Stakeholder Alignment', 'Disruptive Narratives',
  'Synergy Optimization', 'Thought Leadership', 'Prestige Operations',
  'Aura Growth', 'Strategic Ambiguity', 'Bandwidth Allocation',
  'Ecosystem Orchestration', 'Narrative Architecture', 'Momentum Engineering',
  'Alignment Excellence', 'Velocity Culture', 'Impact Amplification',
]

const SALARIES = [
  '$400k–$1.2M + unlimited prestige',
  '$0 base + massive upside (eventual)',
  '$800k + 0.0001% diluted equity',
  'Competitive (we will not say more)',
  '$180k–$650k, depending on your aura',
  'TBD — but truly transformational',
  '$350k + stock that vests after Series Z',
  'Market rate (market currently undefined)',
  '$500k + equity dreams + good vibes',
  'Exposure + LinkedIn shoutout (this IS the comp)',
  'Paid in learnings and network effects',
  '$0 but the CEO follows you back on Twitter',
]

const REQUIREMENTS = [
  '15+ years experience in an industry invented 3 years ago',
  'Proven ability to schedule meetings about scheduling meetings',
  'Must thrive in a "fast-paced, high-ambiguity" environment (we have no plan)',
  'Strong opinions, loosely held, abandoned entirely under pressure',
  'FAANG alumni, or knows someone who is',
  'Comfortable with async-first culture (we ghost Slack for days)',
  'Exceptional LinkedIn presence — 200k+ impressions minimum',
  'Ability to synthesize signal from noise (noise is our core offering)',
  'Track record of moving the needle (needle never specified)',
  'Mandatory growth mindset affirmation sessions on Fridays',
  '7+ years experience with tools that are 2 years old',
  'Fluent in "let\'s take this offline" deployed in real-time situations',
  'Passion for disruption (industry entirely negotiable)',
  'Comfortable saying "we\'re all founders here" without laughing',
  'Proven experience closing Series Z rounds (we have lost count)',
  'Able to condense 40-slide decks into 3 bullet points under 10 minutes',
  'Bias for action, bias for alignment, bias for ambiguity — simultaneously',
  'Experience thriving in a post-pivot environment (fourth pivot this year)',
  'Must be chronically online (it\'s a job requirement not a personality flaw)',
  'Willing to describe layoffs as "right-sizing our talent ecosystem"',
  'Can survive a 45-minute standup that should have been a Slack message',
]

const PERKS = [
  'Unlimited PTO (culturally unavailable)',
  'Equity that vests post-Mars colonisation',
  'Remote-first culture (please be in office Tue–Thu)',
  '"Flat" org with 14 layers of approval',
  'Free kombucha (SF office only, fridge often empty)',
  'Annual offsite to a city nobody asked for',
  'Unlimited aura days',
  'Daily alignment stand-up at 6am PST',
  'Ergonomic stipend (pending budget review since 2023)',
  '"No-meeting Fridays" (exceptions apply to all meetings)',
  'Equity refreshes every 4 years (cliff starts on day 5)',
  'Company-wide Slack emoji for your first shipped feature',
  'Mental health days (must submit a 3-page justification)',
  '"We\'re a family" (toxic one, but still)',
  'Free merch that says DISRUPT on it',
]

const TAGS = [
  'Remote-First', 'Stealth Mode', 'Pre-IPO', 'Series B', 'Series Z',
  'Post-Pivot', 'Mission-Driven', 'Impact-Adjacent', 'Pre-Seed', 'Series A',
  'Hypergrowth', 'Profitable (Allegedly)', 'Ramen-Profitable', 'Unicorn-Adjacent',
]

function pick(arr, rand) {
  return arr[Math.floor(rand() * arr.length)]
}

function pickN(arr, n, rand) {
  const copy = [...arr]
  const result = []
  for (let i = 0; i < n && copy.length; i++) {
    const idx = Math.floor(rand() * copy.length)
    result.push(copy.splice(idx, 1)[0])
  }
  return result
}

export function generateListings(count = 6, seed = Date.now()) {
  const rand = mulberry32(seed)
  return Array.from({ length: count }, (_, i) => ({
    id: `${seed}-${i}`,
    company: `${pick(COMPANY_PREFIXES, rand)} ${pick(COMPANY_SUFFIXES, rand)}`,
    role: `${pick(ROLE_LEVELS, rand)} ${pick(ROLE_FUNCTIONS, rand)}`,
    salary: pick(SALARIES, rand),
    requirements: pickN(REQUIREMENTS, 3, rand),
    perks: pickN(PERKS, 2, rand),
    tag: pick(TAGS, rand),
  }))
}
