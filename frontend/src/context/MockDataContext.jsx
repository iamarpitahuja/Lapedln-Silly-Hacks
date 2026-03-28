/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'
import { createPost as apiCreatePost } from '../services/api'

const PROFILE_STORAGE_KEY = 'larpedin.profile.v1'
const POSTS_STORAGE_KEY = 'larpedin.posts.v1'

const DEFAULT_OPPORTUNITY_TYPES = [
  'Fractional Visionary',
  'Keynote Speaker at Events I Have Not Been Invited To',
  "Angel Investor in Ideas I Haven't Had Yet",
  'Interim Thought Leader',
]

const DEFAULT_PROFILE = {
  name: 'Arjun Malhotra',
  headline: 'Incoming Quant VC Product Strategist',
  avatar: null,
  coverPhoto: null,
  larpRating: 67.2,
  persona: 'Stealth Founder / Ex-McKinsey Adjacent',
  about:
    "I build at the intersection of ambiguity and momentum. My superpower is turning vague intuitions into decks. I've been described as a systems thinker, a narrative architect, and someone who 'gets it.' I don't know what it is. But I get it.",
  stats: {
    recruiterViews: 413,
    impressionVelocity: 'Elite',
    weeklyAuraGrowth: 87.3,
    weeklyAuraGrowthPct: '+10.91%',
  },
  glazers: [
    { name: 'Arjun Arjun', headline: 'You! glazing you.', avatar: null },
    { name: 'Arjun Malhotra', headline: 'Incoming Quant VC Product Strategist', avatar: null },
  ],
  larpStatus: {
    opportunities: DEFAULT_OPPORTUNITY_TYPES,
  },
  experience: [
    {
      id: 'exp-1',
      title: 'Interim Global Strategy Vision Lead',
      company: 'Myself Inc.',
      dates: 'Jan 2023-Present',
      description:
        "Leading cross-functional alignment across a team of one toward a vision I'm still workshopping.",
    },
    {
      id: 'exp-2',
      title: 'Fractional Brand Philosopher',
      company: 'Narrative Leverage Co.',
      dates: 'Jun 2021-Dec 2022',
      description: 'Delivered transformational ambiguity at scale.',
    },
    {
      id: 'exp-3',
      title: 'Incoming Summer Analyst',
      company: 'PrestigeBank',
      dates: 'Jun 2020-Aug 2020',
      description: 'Attended orientation. Sent follow-up emails. Left before the trauma set in.',
    },
  ],
  education: [
    {
      id: 'edu-1',
      school: 'University of Networking',
      degree: 'B.S. in Perceived Expertise',
      dates: '2017-2021',
      activities: 'Coffee Chat Club, LinkedIn Optimization Society',
    },
    {
      id: 'edu-2',
      school: 'The School of Hard Knocks (Self-Reported)',
      degree: 'Certificate in Resilience Narrative',
      dates: 'Ongoing',
      activities: '',
    },
  ],
  skills: [
    { id: 'skill-1', name: 'Strategic Ambiguity', endorsements: 47 },
    { id: 'skill-2', name: 'Narrative Leverage', endorsements: 38 },
    { id: 'skill-3', name: 'Founder Energy', endorsements: 91 },
    { id: 'skill-4', name: 'Deck Architecture', endorsements: 22 },
    { id: 'skill-5', name: 'Vague Optimism', endorsements: 64 },
  ],
  larpHistory: [
    {
      id: 'hist-1',
      date: 'Mar 2026',
      from: 'Regional Hustler',
      to: 'Aspirational Visionary',
      note: 'Attended 3 webinars and updated LinkedIn banner.',
      createdAt: '2026-03-01T12:00:00.000Z',
    },
    {
      id: 'hist-2',
      date: 'Nov 2025',
      from: 'Incoming Analyst',
      to: 'Regional Hustler',
      note: 'Got a business card. Changed everything.',
      createdAt: '2025-11-01T12:00:00.000Z',
    },
    {
      id: 'hist-3',
      date: 'Aug 2024',
      from: 'Student',
      to: 'Incoming Analyst',
      note: 'Accepted offer. Announced on LinkedIn before telling family.',
      createdAt: '2024-08-01T12:00:00.000Z',
    },
  ],
  glazesReceived: [
    {
      id: 'glaze-1',
      name: 'Arjun Arjun',
      relationship: 'glazed you 2h ago',
      text: "Arjun doesn't just think outside the box - he has transcended the concept of boxes entirely.",
    },
    {
      id: 'glaze-2',
      name: 'Priya Krishnamurthy',
      relationship: 'glazed you 1d ago',
      text: 'Working adjacent to Arjun changed my relationship with ambiguity. I am a different person.',
    },
    {
      id: 'glaze-3',
      name: 'Marcus Vanderbilt III',
      relationship: 'glazed you 3d ago',
      text: 'Rare. Generational. Inevitable.',
    },
  ],
}

const SEED_POSTS = [
  {
    id: 1,
    author: {
      name: 'Priya Krishnamurthy',
      headline: 'Fractional Brand Philosopher | Narrative Leverage Practitioner',
      avatar: null,
      larpRating: 54.1,
    },
    type: 'Career Lore',
    timestamp: '1h',
    content:
      "After a lot of reflection, I'm excited to announce that I've accepted a new role as Interim Global Strategy Vision Lead at a company I deeply admire: myself.",
    reactions: { count: 247, likes: 182, loves: 42, insights: 23, comments: 31 },
  },
  {
    id: 2,
    author: {
      name: 'Marcus Vanderbilt III',
      headline: 'Stealth Founder | Ex-McKinsey Adjacent | Angel Investor in Myself',
      avatar: null,
      larpRating: 61.8,
    },
    type: 'Humblebrag',
    timestamp: '2h',
    content:
      "Three years ago I had nothing but a dream, a Notion doc, and a 14-tab coffee chat spreadsheet. Today I'm proud to say the grind continues.",
    reactions: { count: 892, likes: 612, loves: 194, insights: 86, comments: 114 },
  },
  {
    id: 3,
    author: {
      name: 'Xiao Wei Zhang',
      headline: 'AI-Native Systems Thinker | Independent Macro Observer',
      avatar: null,
      larpRating: 45.3,
    },
    type: 'Thought Leadership Incident',
    timestamp: '3h',
    content:
      'Hot take: execution is overrated. What separates elite operators from the rest is their ability to synthesize frameworks across disciplines and communicate them in a way that makes investors feel something.',
    reactions: { count: 1203, likes: 845, loves: 212, insights: 146, comments: 287 },
  },
  {
    id: 6,
    author: {
      name: 'Thaddeus Worthington',
      headline: 'Post-Exit Founder | Limited Partner | Thought Ecosystem Builder',
      avatar: null,
      larpRating: 91.4,
    },
    type: 'Stealth Build Update',
    timestamp: '30m',
    content: 'This post is invisible to most of you. And that is by design.',
    reactions: { count: 9999, likes: 7241, loves: 1842, insights: 916, comments: 999 },
  },
  {
    id: 4,
    author: {
      name: 'Bella Hartsworth',
      headline: 'Venture Scout | VC Intern With Delusions of Permanence',
      avatar: null,
      larpRating: 58.9,
    },
    type: 'Aura Farming',
    timestamp: '4h',
    content:
      "I don't talk about it much, but I passed on a $200k offer last year to pursue something more aligned with my values. The check from my parents helped. But still.",
    reactions: { count: 445, likes: 312, loves: 84, insights: 49, comments: 62 },
  },
  {
    id: 5,
    author: {
      name: 'Dev Patel',
      headline: 'Incoming Summer Analyst | CS Major with Big Dreams',
      avatar: null,
      larpRating: 33.7,
    },
    type: 'Corporate Trauma Dump',
    timestamp: '6h',
    content:
      "My first internship taught me three things: 1) Jira tickets are someone's feelings. 2) The real deliverable was always the relationships we made along the way. 3) Free snacks are a form of compensation.",
    reactions: { count: 2891, likes: 2104, loves: 482, insights: 305, comments: 401 },
  },
]

const SEED_COMMENTS_BY_POST_ID = {
  1: [
    {
      id: '1-c1',
      author: {
        name: 'Daria Chen',
        headline: 'Ex-Operator Turned Narrative Architect',
        avatar: null,
        larpRating: 52.4,
      },
      timestamp: '37m',
      content: 'This is the most honest promotion post I have seen all quarter.',
      createdAt: '2026-03-28T15:02:00.000Z',
    },
    {
      id: '1-c2',
      author: {
        name: 'Imran Voss',
        headline: 'Community-Led GTM Evangelist',
        avatar: null,
        larpRating: 48.9,
      },
      timestamp: '12m',
      content: 'Massive congrats. The market needed this energy.',
      createdAt: '2026-03-28T15:27:00.000Z',
    },
  ],
  2: [
    {
      id: '2-c1',
      author: {
        name: 'Lina Torres',
        headline: 'Founder Whisperer | Pre-Seed Scout',
        avatar: null,
        larpRating: 57.2,
      },
      timestamp: '18m',
      content: 'The 14-tab coffee chat spreadsheet is painfully relatable.',
      createdAt: '2026-03-28T15:21:00.000Z',
    },
  ],
}

const TRENDING_DELUSIONS = ['Career Loring', 'Conivroation', 'Prestige signaling', 'Usw emmied']

const BUZZWORDS = ['Hyperscale', 'Narrative leverage', 'Operator mindset', 'Aura velocity']

async function downscaleImage(dataUrl, maxWidth = 800, maxHeight = 800, quality = 0.7) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl); // Fallback
    img.src = dataUrl;
  });
}

const MockDataContext = createContext(null)

function makeEntityId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.floor(Math.random() * 10000)}`
}

function normalizeText(value, fallback = '') {
  const nextValue = String(value ?? '')
  const trimmedValue = nextValue.trim()
  return trimmedValue || fallback
}

function normalizeNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function formatMonthYear(date = new Date()) {
  return date.toLocaleString('en-US', { month: 'short', year: 'numeric' })
}

function cloneDefaultProfile() {
  return {
    ...DEFAULT_PROFILE,
    stats: { ...DEFAULT_PROFILE.stats },
    glazers: DEFAULT_PROFILE.glazers.map(glazer => ({ ...glazer })),
    larpStatus: {
      ...DEFAULT_PROFILE.larpStatus,
      opportunities: [...DEFAULT_PROFILE.larpStatus.opportunities],
    },
    experience: DEFAULT_PROFILE.experience.map(entry => ({ ...entry })),
    education: DEFAULT_PROFILE.education.map(entry => ({ ...entry })),
    skills: DEFAULT_PROFILE.skills.map(skill => ({ ...skill })),
    larpHistory: DEFAULT_PROFILE.larpHistory.map(entry => ({ ...entry })),
    glazesReceived: DEFAULT_PROFILE.glazesReceived.map(glaze => ({ ...glaze })),
  }
}

function normalizeStringList(values, fallbackValues) {
  if (!Array.isArray(values)) {
    return [...fallbackValues]
  }

  const nextValues = values
    .map(value => String(value ?? '').trim())
    .filter(Boolean)

  return nextValues.length ? nextValues : [...fallbackValues]
}

function normalizeExperienceEntry(entry) {
  if (!entry || typeof entry !== 'object') return null
  const title = String(entry.title ?? '').trim()
  const company = String(entry.company ?? '').trim()

  if (!title || !company) return null

  return {
    id: entry.id ?? makeEntityId(),
    title,
    company,
    dates: normalizeText(entry.dates, 'Dates not set'),
    description: normalizeText(entry.description, 'No description yet.'),
  }
}

function normalizeEducationEntry(entry) {
  if (!entry || typeof entry !== 'object') return null
  const school = String(entry.school ?? '').trim()
  const degree = String(entry.degree ?? '').trim()
  if (!school || !degree) return null

  return {
    id: entry.id ?? makeEntityId(),
    school,
    degree,
    dates: normalizeText(entry.dates, 'Dates not set'),
    activities: String(entry.activities ?? '').trim(),
  }
}

function normalizeSkillEntry(entry) {
  if (!entry || typeof entry !== 'object') return null
  const name = String(entry.name ?? '').trim()
  if (!name) return null

  return {
    id: entry.id ?? makeEntityId(),
    name,
    endorsements: Math.max(0, Math.round(normalizeNumber(entry.endorsements, 0))),
  }
}

function normalizeHistoryEntry(entry) {
  if (!entry || typeof entry !== 'object') return null
  const from = String(entry.from ?? '').trim()
  const to = String(entry.to ?? '').trim()
  if (!from || !to) return null

  return {
    id: entry.id ?? makeEntityId(),
    date: normalizeText(entry.date, formatMonthYear()),
    from,
    to,
    note: normalizeText(entry.note, 'Persona update recorded.'),
    createdAt: entry.createdAt ?? new Date().toISOString(),
  }
}

function normalizeGlazeEntry(entry) {
  if (!entry || typeof entry !== 'object') return null
  const name = String(entry.name ?? '').trim()
  const text = String(entry.text ?? '').trim()
  if (!name || !text) return null

  return {
    id: entry.id ?? makeEntityId(),
    name,
    relationship: normalizeText(entry.relationship, 'glazed you recently'),
    text,
  }
}

function normalizeGlazerEntry(entry) {
  if (!entry || typeof entry !== 'object') return null
  const name = String(entry.name ?? '').trim()
  if (!name) return null

  return {
    name,
    headline: normalizeText(entry.headline, 'Mysterious ecosystem participant'),
    avatar: entry.avatar ?? null,
  }
}

function normalizeProfile(profile) {
  const fallbackProfile = cloneDefaultProfile()
  if (!profile || typeof profile !== 'object') {
    return fallbackProfile
  }

  const stats = profile.stats ?? {}
  const larpStatus = profile.larpStatus ?? {}

  const experience = Array.isArray(profile.experience)
    ? profile.experience.map(normalizeExperienceEntry).filter(Boolean)
    : []
  const education = Array.isArray(profile.education)
    ? profile.education.map(normalizeEducationEntry).filter(Boolean)
    : []
  const skills = Array.isArray(profile.skills)
    ? profile.skills.map(normalizeSkillEntry).filter(Boolean)
    : []
  const larpHistory = Array.isArray(profile.larpHistory)
    ? profile.larpHistory.map(normalizeHistoryEntry).filter(Boolean)
    : []
  const glazesReceived = Array.isArray(profile.glazesReceived)
    ? profile.glazesReceived.map(normalizeGlazeEntry).filter(Boolean)
    : []
  const glazers = Array.isArray(profile.glazers)
    ? profile.glazers.map(normalizeGlazerEntry).filter(Boolean)
    : []

  return {
    ...fallbackProfile,
    name: normalizeText(profile.name, fallbackProfile.name),
    headline: normalizeText(profile.headline, fallbackProfile.headline),
    avatar: profile.avatar ?? fallbackProfile.avatar,
    coverPhoto: profile.coverPhoto ?? fallbackProfile.coverPhoto,
    larpRating: normalizeNumber(profile.larpRating, fallbackProfile.larpRating),
    persona: normalizeText(profile.persona, fallbackProfile.persona),
    about: normalizeText(profile.about, fallbackProfile.about),
    stats: {
      recruiterViews: normalizeNumber(stats.recruiterViews, fallbackProfile.stats.recruiterViews),
      impressionVelocity: normalizeText(
        stats.impressionVelocity,
        fallbackProfile.stats.impressionVelocity
      ),
      weeklyAuraGrowth: normalizeNumber(
        stats.weeklyAuraGrowth,
        fallbackProfile.stats.weeklyAuraGrowth
      ),
      weeklyAuraGrowthPct: normalizeText(
        stats.weeklyAuraGrowthPct,
        fallbackProfile.stats.weeklyAuraGrowthPct
      ),
    },
    glazers: glazers.length ? glazers : fallbackProfile.glazers,
    larpStatus: {
      opportunities: normalizeStringList(
        larpStatus.opportunities,
        fallbackProfile.larpStatus.opportunities
      ),
    },
    experience: experience.length ? experience : fallbackProfile.experience,
    education: education.length ? education : fallbackProfile.education,
    skills: skills.length ? skills : fallbackProfile.skills,
    larpHistory: larpHistory.length ? larpHistory : fallbackProfile.larpHistory,
    glazesReceived: glazesReceived.length ? glazesReceived : fallbackProfile.glazesReceived,
  }
}

function makeLarpHistoryEntry({ from, to, note }) {
  return {
    id: makeEntityId(),
    date: formatMonthYear(),
    from,
    to,
    note: normalizeText(note, `Shifted narrative from ${from} to ${to}.`),
    createdAt: new Date().toISOString(),
  }
}

function applyPersonaUpdate(profile, nextPersona, note) {
  const normalizedPersona = String(nextPersona ?? '').trim()
  if (!normalizedPersona || normalizedPersona === profile.persona) {
    return profile
  }

  return {
    ...profile,
    persona: normalizedPersona,
    larpHistory: [
      makeLarpHistoryEntry({
        from: profile.persona,
        to: normalizedPersona,
        note,
      }),
      ...profile.larpHistory,
    ],
  }
}

function loadInitialProfile() {
  const fallbackProfile = cloneDefaultProfile()
  if (typeof window === 'undefined') {
    return fallbackProfile
  }

  try {
    const rawProfile = window.localStorage.getItem(PROFILE_STORAGE_KEY)
    if (!rawProfile) {
      return fallbackProfile
    }

    const parsedProfile = JSON.parse(rawProfile)
    return normalizeProfile(parsedProfile)
  } catch {
    return fallbackProfile
  }
}

function normalizeComment(comment) {
  if (!comment || typeof comment !== 'object') return null

  const author = comment.author ?? {}

  return {
    id: comment.id ?? makeEntityId(),
    author: {
      name: author.name ?? 'Unknown User',
      headline: author.headline ?? 'Mysterious ecosystem participant',
      avatar: author.avatar ?? null,
      larpRating: author.larpRating ?? 0,
    },
    timestamp: comment.timestamp ?? 'Just now',
    content: String(comment.content ?? '').trim(),
    createdAt: comment.createdAt ?? new Date().toISOString(),
    isUserComment: Boolean(comment.isUserComment),
  }
}

function normalizePost(post) {
  const normalizedComments = Array.isArray(post.comments)
    ? post.comments.map(normalizeComment).filter(comment => comment && comment.content)
    : []

  const normalizedReactions = {
    ...(post.reactions ?? {}),
  }

  const relarpOf =
    post.relarpOf && typeof post.relarpOf === 'object'
      ? {
          id: post.relarpOf.id ?? null,
          type: post.relarpOf.type ?? 'Post',
          timestamp: post.relarpOf.timestamp ?? 'Earlier',
          content: String(post.relarpOf.content ?? '').trim(),
          author: {
            name: post.relarpOf.author?.name ?? 'Unknown User',
            headline: post.relarpOf.author?.headline ?? 'Mysterious ecosystem participant',
            avatar: post.relarpOf.author?.avatar ?? null,
            larpRating: post.relarpOf.author?.larpRating ?? 0,
          },
        }
      : null

  const baselineCommentCount =
    typeof normalizedReactions.comments === 'number'
      ? normalizedReactions.comments
      : normalizedComments.length

  normalizedReactions.comments = Math.max(baselineCommentCount, normalizedComments.length)
  normalizedReactions.relarps =
    typeof normalizedReactions.relarps === 'number' ? normalizedReactions.relarps : 0

  return {
    ...post,
    reactions: normalizedReactions,
    comments: normalizedComments,
    isRelarp: Boolean(post.isRelarp && relarpOf),
    relarpOf,
  }
}

function toRelarpSnapshot(post) {
  return {
    id: post.id ?? null,
    type: post.type ?? 'Post',
    timestamp: post.timestamp ?? 'Earlier',
    content: String(post.content ?? '').trim(),
    author: {
      name: post.author?.name ?? 'Unknown User',
      headline: post.author?.headline ?? 'Mysterious ecosystem participant',
      avatar: post.author?.avatar ?? null,
      larpRating: post.author?.larpRating ?? 0,
    },
  }
}

function getSeedComments(postId) {
  const seededComments = SEED_COMMENTS_BY_POST_ID[postId]
  if (!Array.isArray(seededComments)) return []

  return seededComments.map(comment => ({
    ...comment,
    author: { ...comment.author },
  }))
}

function loadInitialPosts() {
  const fallbackPosts = SEED_POSTS.map(post =>
    normalizePost({
      ...post,
      comments: getSeedComments(post.id),
    })
  )

  if (typeof window === 'undefined') return fallbackPosts

  try {
    const rawPosts = window.localStorage.getItem(POSTS_STORAGE_KEY)
    if (!rawPosts) return fallbackPosts

    const parsedPosts = JSON.parse(rawPosts)
    if (!Array.isArray(parsedPosts)) return fallbackPosts

    return parsedPosts.map(normalizePost)
  } catch {
    return fallbackPosts
  }
}

export function MockDataProvider({ children }) {
  const { user } = useAuth()
  const [profile, setProfile] = useState(loadInitialProfile)
  const [allPosts, setAllPosts] = useState(loadInitialPosts)

  // Seed profile name & avatar from Supabase auth user
  useEffect(() => {
    if (!user) return
    const meta = user.user_metadata ?? {}
    const authName = meta.full_name || meta.name || user.email?.split('@')[0] || ''
    const authAvatar = meta.avatar_url || null
    if (authName) {
      setProfile(prev => ({
        ...prev,
        name: authName,
        ...(authAvatar ? { avatar: authAvatar } : {}),
      }))
    }
  }, [user])

  function isAccessible(targetRating) {
    return targetRating <= profile.larpRating
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(allPosts))
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        // Evict oldest user posts if quota hit
        setAllPosts(prev => {
          const userPosts = prev.filter(p => p.isUserPost)
          if (userPosts.length > 5) {
            const keepCount = Math.floor(userPosts.length / 2)
            const toKeep = userPosts.slice(0, keepCount)
            const seeds = prev.filter(p => !p.isUserPost)
            return [...toKeep, ...seeds]
          }
          return prev
        })
      }
    }
  }, [allPosts])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile))
    } catch (e) {
      console.error('Failed to save profile to localStorage:', e)
    }
  }, [profile])

  async function updateProfile({ name, headline, persona, avatar, coverPhoto, note } = {}) {
    if (name !== undefined && !String(name ?? '').trim()) {
      return { ok: false, error: 'Name cannot be empty.' }
    }

    if (headline !== undefined && !String(headline ?? '').trim()) {
      return { ok: false, error: 'Headline cannot be empty.' }
    }

    if (persona !== undefined && !String(persona ?? '').trim()) {
      return { ok: false, error: 'Persona cannot be empty.' }
    }

    let processedAvatar = avatar
    if (avatar && avatar.startsWith('data:image')) {
      processedAvatar = await downscaleImage(avatar, 400, 400, 0.6)
    }

    let processedCover = coverPhoto
    if (coverPhoto && coverPhoto.startsWith('data:image')) {
      processedCover = await downscaleImage(coverPhoto, 1200, 400, 0.6)
    }

    setProfile(existingProfile => {
      let nextProfile = { ...existingProfile }

      if (name !== undefined) {
        nextProfile.name = String(name).trim()
      }

      if (headline !== undefined) {
        nextProfile.headline = String(headline).trim()
      }

      if (avatar !== undefined) {
        nextProfile.avatar = processedAvatar ? String(processedAvatar).trim() : null
      }

      if (coverPhoto !== undefined) {
        nextProfile.coverPhoto = processedCover ? String(processedCover).trim() : null
      }

      if (persona !== undefined) {
        nextProfile = applyPersonaUpdate(
          nextProfile,
          persona,
          note ?? 'Updated persona from profile settings.'
        )
      }

      return nextProfile
    })

    return { ok: true }
  }

  function updateAbout(about) {
    const nextAbout = String(about ?? '').trim()
    if (!nextAbout) {
      return { ok: false, error: 'About section cannot be empty.' }
    }

    setProfile(existingProfile => ({
      ...existingProfile,
      about: nextAbout,
    }))

    return { ok: true }
  }

  function cyclePersona() {
    let mutationResult = { ok: false, error: 'Unable to switch persona.' }

    setProfile(existingProfile => {
      const opportunities = existingProfile.larpStatus.opportunities
      if (!opportunities.length) {
        mutationResult = { ok: false, error: 'No personas available to switch.' }
        return existingProfile
      }

      const currentIndex = opportunities.indexOf(existingProfile.persona)
      const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % opportunities.length
      const nextPersona = opportunities[nextIndex]

      if (!nextPersona || nextPersona === existingProfile.persona) {
        mutationResult = { ok: false, error: 'Add more persona options before switching.' }
        return existingProfile
      }

      mutationResult = { ok: true, persona: nextPersona }
      return applyPersonaUpdate(existingProfile, nextPersona, 'Switched persona from Open to Larping.')
    })

    return mutationResult
  }

  function updateLarpStatus({ persona, opportunities } = {}) {
    const hasPersonaUpdate = persona !== undefined
    const hasOpportunityUpdate = opportunities !== undefined

    if (hasPersonaUpdate && !String(persona ?? '').trim()) {
      return { ok: false, error: 'Persona cannot be empty.' }
    }

    const normalizedOpportunities = hasOpportunityUpdate
      ? normalizeStringList(opportunities, profile.larpStatus.opportunities)
      : null

    if (hasOpportunityUpdate && !normalizedOpportunities.length) {
      return { ok: false, error: 'At least one opportunity type is required.' }
    }

    setProfile(existingProfile => {
      let nextProfile = { ...existingProfile }

      if (hasOpportunityUpdate) {
        nextProfile = {
          ...nextProfile,
          larpStatus: {
            ...nextProfile.larpStatus,
            opportunities: normalizedOpportunities,
          },
        }
      }

      if (hasPersonaUpdate) {
        nextProfile = applyPersonaUpdate(
          nextProfile,
          persona,
          'Updated persona from Open to Larping settings.'
        )
      } else if (hasOpportunityUpdate && !normalizedOpportunities.includes(nextProfile.persona)) {
        nextProfile = applyPersonaUpdate(
          nextProfile,
          normalizedOpportunities[0],
          'Adjusted persona to match available opportunities.'
        )
      }

      return nextProfile
    })

    return { ok: true }
  }

  function addExperience(entry) {
    const title = String(entry?.title ?? '').trim()
    const company = String(entry?.company ?? '').trim()

    if (!title || !company) {
      return { ok: false, error: 'Experience needs both title and company.' }
    }

    const nextExperience = {
      id: makeEntityId(),
      title,
      company,
      dates: normalizeText(entry?.dates, 'Dates not set'),
      description: normalizeText(entry?.description, 'No description yet.'),
    }

    setProfile(existingProfile => ({
      ...existingProfile,
      experience: [nextExperience, ...existingProfile.experience],
    }))

    return { ok: true, entry: nextExperience }
  }

  function updateExperience({ id, updates } = {}) {
    if (!id) {
      return { ok: false, error: 'Experience entry not found.' }
    }

    if (updates?.title !== undefined && !String(updates.title ?? '').trim()) {
      return { ok: false, error: 'Experience title cannot be empty.' }
    }

    if (updates?.company !== undefined && !String(updates.company ?? '').trim()) {
      return { ok: false, error: 'Experience company cannot be empty.' }
    }

    let didUpdate = false

    setProfile(existingProfile => ({
      ...existingProfile,
      experience: existingProfile.experience.map(entry => {
        if (String(entry.id) !== String(id)) return entry

        didUpdate = true
        return {
          ...entry,
          ...(updates?.title !== undefined ? { title: String(updates.title).trim() } : {}),
          ...(updates?.company !== undefined ? { company: String(updates.company).trim() } : {}),
          ...(updates?.dates !== undefined ? { dates: normalizeText(updates.dates, entry.dates) } : {}),
          ...(updates?.description !== undefined
            ? { description: normalizeText(updates.description, entry.description) }
            : {}),
        }
      }),
    }))

    if (!didUpdate) {
      return { ok: false, error: 'Experience entry not found.' }
    }

    return { ok: true }
  }

  function removeExperience(id) {
    if (!id) {
      return { ok: false, error: 'Experience entry not found.' }
    }

    let didDelete = false

    setProfile(existingProfile => {
      const remainingExperience = existingProfile.experience.filter(entry => {
        const shouldDelete = String(entry.id) === String(id)
        if (shouldDelete) didDelete = true
        return !shouldDelete
      })

      return {
        ...existingProfile,
        experience: remainingExperience,
      }
    })

    if (!didDelete) {
      return { ok: false, error: 'Experience entry not found.' }
    }

    return { ok: true }
  }

  function addEducation(entry) {
    const school = String(entry?.school ?? '').trim()
    const degree = String(entry?.degree ?? '').trim()

    if (!school || !degree) {
      return { ok: false, error: 'Education needs both school and degree.' }
    }

    const nextEducation = {
      id: makeEntityId(),
      school,
      degree,
      dates: normalizeText(entry?.dates, 'Dates not set'),
      activities: String(entry?.activities ?? '').trim(),
    }

    setProfile(existingProfile => ({
      ...existingProfile,
      education: [nextEducation, ...existingProfile.education],
    }))

    return { ok: true, entry: nextEducation }
  }

  function updateEducation({ id, updates } = {}) {
    if (!id) {
      return { ok: false, error: 'Education entry not found.' }
    }

    if (updates?.school !== undefined && !String(updates.school ?? '').trim()) {
      return { ok: false, error: 'School cannot be empty.' }
    }

    if (updates?.degree !== undefined && !String(updates.degree ?? '').trim()) {
      return { ok: false, error: 'Degree cannot be empty.' }
    }

    let didUpdate = false

    setProfile(existingProfile => ({
      ...existingProfile,
      education: existingProfile.education.map(entry => {
        if (String(entry.id) !== String(id)) return entry

        didUpdate = true
        return {
          ...entry,
          ...(updates?.school !== undefined ? { school: String(updates.school).trim() } : {}),
          ...(updates?.degree !== undefined ? { degree: String(updates.degree).trim() } : {}),
          ...(updates?.dates !== undefined ? { dates: normalizeText(updates.dates, entry.dates) } : {}),
          ...(updates?.activities !== undefined
            ? { activities: String(updates.activities ?? '').trim() }
            : {}),
        }
      }),
    }))

    if (!didUpdate) {
      return { ok: false, error: 'Education entry not found.' }
    }

    return { ok: true }
  }

  function removeEducation(id) {
    if (!id) {
      return { ok: false, error: 'Education entry not found.' }
    }

    let didDelete = false

    setProfile(existingProfile => {
      const remainingEducation = existingProfile.education.filter(entry => {
        const shouldDelete = String(entry.id) === String(id)
        if (shouldDelete) didDelete = true
        return !shouldDelete
      })

      return {
        ...existingProfile,
        education: remainingEducation,
      }
    })

    if (!didDelete) {
      return { ok: false, error: 'Education entry not found.' }
    }

    return { ok: true }
  }

  function addSkill({ name } = {}) {
    const normalizedName = String(name ?? '').trim()
    if (!normalizedName) {
      return { ok: false, error: 'Skill name cannot be empty.' }
    }

    let result = { ok: true }

    setProfile(existingProfile => {
      const hasDuplicate = existingProfile.skills.some(
        skill => skill.name.toLowerCase() === normalizedName.toLowerCase()
      )

      if (hasDuplicate) {
        result = { ok: false, error: 'That skill already exists.' }
        return existingProfile
      }

      return {
        ...existingProfile,
        skills: [
          { id: makeEntityId(), name: normalizedName, endorsements: 0 },
          ...existingProfile.skills,
        ],
      }
    })

    return result
  }

  function removeSkill(skillId) {
    if (!skillId) {
      return { ok: false, error: 'Skill not found.' }
    }

    let didDelete = false

    setProfile(existingProfile => {
      const remainingSkills = existingProfile.skills.filter(skill => {
        const shouldDelete = String(skill.id) === String(skillId)
        if (shouldDelete) didDelete = true
        return !shouldDelete
      })

      return {
        ...existingProfile,
        skills: remainingSkills,
      }
    })

    if (!didDelete) {
      return { ok: false, error: 'Skill not found.' }
    }

    return { ok: true }
  }

  function endorseSkill(skillId) {
    if (!skillId) {
      return { ok: false, error: 'Skill not found.' }
    }

    const skillExists = profile.skills.some(skill => String(skill.id) === String(skillId))
    if (!skillExists) {
      return { ok: false, error: 'Skill not found.' }
    }

    setProfile(existingProfile => ({
      ...existingProfile,
      skills: existingProfile.skills.map(skill => {
        if (String(skill.id) !== String(skillId)) return skill
        return {
          ...skill,
          endorsements: skill.endorsements + 1,
        }
      }),
    }))

    return { ok: true }
  }

  async function createPost({ content, type, photo }) {
    const trimmedContent = (content ?? '').trim()

    if (!trimmedContent && !photo) {
      return { ok: false, error: 'Post must have content or a photo.' }
    }

    let processedPhoto = photo
    if (photo && photo.startsWith('data:image')) {
      processedPhoto = await downscaleImage(photo, 1000, 1000, 0.7)
    }

    const postId = makeEntityId()

    const nextPost = {
      id: postId,
      author: {
        name: profile.name,
        headline: profile.headline,
        avatar: profile.avatar,
        larpRating: profile.larpRating,
      },
      type: type?.trim() || 'Personal Update',
      timestamp: 'Just now',
      content: trimmedContent,
      photo: processedPhoto ?? null,
      reactions: { count: 0, comments: 0 },
      comments: [],
      createdAt: new Date().toISOString(),
      isUserPost: true,
    }

    setAllPosts(existingPosts => [nextPost, ...existingPosts])

    // Persist to backend (fire-and-forget — optimistic UI already updated above)
    apiCreatePost({ content: trimmedContent, postType: type?.trim() || 'Career Lore' }).catch(() => {})

    return { ok: true }
  }

  function createComment({ postId, content }) {
    const trimmedContent = (content ?? '').trim()

    if (!trimmedContent) {
      return { ok: false, error: 'Comment cannot be empty.' }
    }

    const postExists = allPosts.some(post => post.id === postId)
    if (!postExists) {
      return { ok: false, error: 'This post could not be found.' }
    }

    const nextComment = {
      id: makeEntityId(),
      author: {
        name: profile.name,
        headline: profile.headline,
        avatar: profile.avatar,
        larpRating: profile.larpRating,
      },
      timestamp: 'Just now',
      content: trimmedContent,
      createdAt: new Date().toISOString(),
      isUserComment: true,
    }

    setAllPosts(existingPosts =>
      existingPosts.map(post => {
        if (post.id !== postId) return post

        const previousComments = Array.isArray(post.comments) ? post.comments : []
        const currentCommentCount =
          typeof post.reactions?.comments === 'number'
            ? post.reactions.comments
            : previousComments.length

        return {
          ...post,
          comments: [nextComment, ...previousComments],
          reactions: {
            ...(post.reactions ?? {}),
            comments: currentCommentCount + 1,
          },
        }
      })
    )

    return { ok: true, comment: nextComment }
  }

  function hasUserRelarped(postId) {
    if (!postId) return false
    return allPosts.some(
      post => post.isRelarp && post.isUserPost && String(post.relarpOf?.id) === String(postId)
    )
  }

  function createRelarp({ postId, commentary }) {
    const sourcePost = allPosts.find(post => String(post.id) === String(postId))
    if (!sourcePost) {
      return { ok: false, error: 'This post could not be found.' }
    }

    const isOwnSourcePost =
      sourcePost.isUserPost || String(sourcePost.author?.name) === String(profile.name)

    if (isOwnSourcePost) {
      return { ok: false, error: 'You cannot Re-Larp your own post.' }
    }

    if (hasUserRelarped(postId)) {
      return { ok: false, error: 'You already Re-Larped this post.' }
    }

    const relarpSource =
      sourcePost.isRelarp && sourcePost.relarpOf
        ? sourcePost.relarpOf
        : toRelarpSnapshot(sourcePost)

    const nextRelarpPost = normalizePost({
      id: makeEntityId(),
      author: {
        name: profile.name,
        headline: profile.headline,
        avatar: profile.avatar,
        larpRating: profile.larpRating,
      },
      type: 'Re-Larp',
      timestamp: 'Just now',
      content: String(commentary ?? '').trim(),
      reactions: { count: 0, likes: 0, loves: 0, insights: 0, comments: 0, relarps: 0 },
      comments: [],
      createdAt: new Date().toISOString(),
      isUserPost: true,
      isRelarp: true,
      relarpOf: relarpSource,
    })

    setAllPosts(existingPosts => {
      const updatedPosts = existingPosts.map(post => {
        if (String(post.id) !== String(postId)) return post

        const relarpCount =
          typeof post.reactions?.relarps === 'number' ? post.reactions.relarps : 0

        return {
          ...post,
          reactions: {
            ...(post.reactions ?? {}),
            relarps: relarpCount + 1,
          },
        }
      })

      return [nextRelarpPost, ...updatedPosts]
    })

    return { ok: true, relarpPost: nextRelarpPost }
  }

  function undoRelarp({ postId }) {
    const userRelarpPost = allPosts.find(
      post => post.isRelarp && post.isUserPost && String(post.relarpOf?.id) === String(postId)
    )

    if (!userRelarpPost) {
      return { ok: false, error: 'You have not Re-Larped this post yet.' }
    }

    setAllPosts(existingPosts => {
      const remainingPosts = existingPosts.filter(
        post => String(post.id) !== String(userRelarpPost.id)
      )

      return remainingPosts.map(post => {
        if (String(post.id) !== String(postId)) return post

        const relarpCount =
          typeof post.reactions?.relarps === 'number' ? post.reactions.relarps : 0

        return {
          ...post,
          reactions: {
            ...(post.reactions ?? {}),
            relarps: Math.max(0, relarpCount - 1),
          },
        }
      })
    })

    return { ok: true }
  }

  const feedPosts = useMemo(
    () => allPosts.filter(post => post.author.larpRating <= profile.larpRating),
    [allPosts, profile.larpRating]
  )

  const value = {
    currentUser: profile,
    meProfile: profile,
    feedPosts,
    allPosts,
    trendingDelusions: TRENDING_DELUSIONS,
    buzzwords: BUZZWORDS,
    isAccessible,
    updateProfile,
    updateAbout,
    cyclePersona,
    updateLarpStatus,
    addExperience,
    updateExperience,
    removeExperience,
    addEducation,
    updateEducation,
    removeEducation,
    addSkill,
    removeSkill,
    endorseSkill,
    createPost,
    createComment,
    hasUserRelarped,
    createRelarp,
    undoRelarp,
  }

  return <MockDataContext.Provider value={value}>{children}</MockDataContext.Provider>
}

export function useMockData() {
  const ctx = useContext(MockDataContext)
  if (!ctx) throw new Error('useMockData must be used within MockDataProvider')
  return ctx
}
