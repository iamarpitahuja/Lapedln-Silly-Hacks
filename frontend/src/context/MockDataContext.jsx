/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import {
  createPost as apiCreatePost,
  createPostComment,
  createRelarp as apiCreateRelarp,
  deletePost as apiDeletePost,
  fetchFeed,
  fetchJobOptions,
  fetchProfile,
  removeRelarp as apiRemoveRelarp,
  updateJob as apiUpdateJob,
  updateProfilePatch,
} from '../services/api'

const MockDataContext = createContext(null)
const IS_TEST_MODE = import.meta.env.MODE === 'test'
const DEV_USER_ID = '00000000-0000-0000-0000-000000000000'

const EMPTY_PROFILE = {
  id: '',
  name: '',
  job: '',
  avatar: null,
  coverPhoto: null,
  larpRating: 0,
  about: '',
  stats: {
    recruiterViews: 0,
    impressionVelocity: 'Unknown',
    weeklyAuraGrowth: 0,
    weeklyAuraGrowthPct: '+0%',
  },
  glazers: [],
  larpStatus: {
    opportunities: [],
  },
  experience: [],
  education: [],
  skills: [],
  larpHistory: [],
  glazesReceived: [],
}

const TEST_PROFILE = {
  id: DEV_USER_ID,
  name: 'Arjun Malhotra',
  job: 'Finance Bro',
  avatar: null,
  coverPhoto: null,
  larpRating: 67.2,
  about: 'Building at the intersection of ambiguity and momentum.',
  stats: {
    recruiterViews: 413,
    impressionVelocity: 'High',
    weeklyAuraGrowth: 3.8,
    weeklyAuraGrowthPct: '+9%',
  },
  glazers: [],
  larpStatus: {
    opportunities: [
      'Finance Bro',
      'Stealth Startup Girlie',
      'VC Nepo Baby',
    ],
  },
  experience: [
    {
      id: 'exp-1',
      title: 'Interim Global Strategy Vision Lead',
      company: 'Nimbus Partners',
      dates: '2024 - Present',
      description: 'Synthesizing signal into prestige.',
    },
  ],
  education: [
    {
      id: 'edu-1',
      school: 'University of Networking',
      degree: 'B.S. in Prestige Signaling',
      dates: '2017 - 2021',
      activities: 'Debate Club',
    },
  ],
  skills: [
    { id: 'skill-1', name: 'Strategic Ambiguity', endorsements: 47 },
    { id: 'skill-2', name: 'Executive Presence', endorsements: 31 },
  ],
  larpHistory: [
    {
      id: 'hist-1',
      date: 'Jan 2026',
      from: 'Regional Hustler',
      to: 'Stealth Founder / Ex-McKinsey Adjacent',
      note: 'Leveled up market narrative.',
      createdAt: '2026-01-10T00:00:00.000Z',
    },
  ],
  glazesReceived: [
    {
      id: 'gr-1',
      name: 'Arjun Arjun',
      relationship: '2nd degree',
      text: 'Generational execution energy.',
    },
  ],
}

const TEST_SOURCE_POST = {
  id: '1',
  author: {
    id: 'priya-1',
    name: 'Priya Krishnamurthy',
    headline: 'Fractional Brand Philosopher',
    avatar: null,
    larpRating: 54.1,
  },
  type: 'Career Lore',
  timestamp: '1h',
  content: 'Excited to announce that I have accepted a role at myself.',
  reactions: {
    count: 0,
    comments: 0,
    relarps: 0,
    likes: 0,
    loves: 0,
    glazes: 0,
  },
  comments: [],
  ai_glazes: [],
  glazes: [],
  buzzword_score: 0,
  has_user_relarped: false,
  has_user_liked: false,
  has_user_loved: false,
  has_user_glazed: false,
}

const TEST_TRENDING_DELUSIONS = ['Career Lore · 1 posts']
const TEST_BUZZWORDS = ['Synergy', 'Velocity', 'Alignment']

function timeAgo(isoString) {
  if (!isoString) return 'recently'
  // Backend stores UTC but SQLite strips timezone info — treat naive timestamps as UTC
  const utcString = isoString.endsWith('Z') || isoString.includes('+') ? isoString : isoString + 'Z'
  const diffMs = Date.now() - new Date(utcString).getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h`
  return `${Math.floor(diffHours / 24)}d`
}

function makeEntityId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.floor(Math.random() * 10000)}`
}

function toArray(value) {
  return Array.isArray(value) ? value : []
}

function normalizeExperienceEntries(value) {
  return toArray(value)
    .map(entry => {
      if (!entry || typeof entry !== 'object') return null
      const title = String(entry.title ?? '').trim()
      const company = String(entry.company ?? '').trim()
      const dates = String(entry.dates ?? '').trim()
      const description = String(entry.description ?? '').trim()
      if (!title && !company && !dates && !description) return null
      return {
        id: String(entry.id ?? makeEntityId()),
        title,
        company,
        dates,
        description,
      }
    })
    .filter(Boolean)
}

function normalizeSkillEntries(value) {
  return toArray(value)
    .map(skill => {
      if (typeof skill === 'string') {
        const name = skill.trim()
        if (!name) return null
        return { id: makeEntityId(), name, endorsements: 0 }
      }
      if (!skill || typeof skill !== 'object') return null
      const name = String(skill.name ?? '').trim()
      if (!name) return null
      return {
        id: String(skill.id ?? makeEntityId()),
        name,
        endorsements: Number(skill.endorsements ?? 0),
      }
    })
    .filter(Boolean)
}

function adaptProfile(row) {
  if (!row || typeof row !== 'object') return { ...EMPTY_PROFILE }
  const stats = row.stats ?? {}
  const larpStatus = row.larp_status ?? {}

  return {
    id: row.id ?? '',
    name: row.display_name ?? '',
    job: row.job ?? row.title ?? row.persona ?? '',
    avatar: row.avatar_url ?? null,
    coverPhoto: row.cover_photo_url ?? null,
    larpRating: Number(row.larp_rating ?? 0),
    about: row.bio ?? '',
    stats: {
      recruiterViews: Number(stats.recruiterViews ?? 0) || 0,
      impressionVelocity: String(stats.impressionVelocity ?? 'Unknown'),
      weeklyAuraGrowth: parseFloat(stats.weeklyAuraGrowth) || 0,
      weeklyAuraGrowthPct: String(stats.weeklyAuraGrowthPct ?? '+0%'),
    },
    glazers: toArray(row.glazers),
    larpStatus: {
      opportunities: toArray(larpStatus.opportunities).map(v => String(v)),
    },
    experience: normalizeExperienceEntries(row.experience),
    education: toArray(row.education),
    skills: normalizeSkillEntries(row.skills),
    larpHistory: toArray(row.larp_history),
    glazesReceived: toArray(row.glazes_received),
  }
}

function adaptBackendPost(post) {
  const comments = Array.isArray(post.comments) ? post.comments : []
  return {
    id: post.id,
    author: {
      id: post.profiles?.id ?? post.author_id ?? null,
      name: post.profiles?.display_name ?? 'Anonymous Larper',
      headline: post.profiles?.job ?? post.profiles?.title ?? 'Aspiring Thought Leader',
      avatar: post.profiles?.avatar_url ?? null,
      larpRating: post.profiles?.larp_rating ?? 0,
    },
    type: post.post_type ?? 'Career Lore',
    timestamp: timeAgo(post.created_at),
    content: post.content ?? '',
    reactions: {
      count: 0,
      comments: Number(post.comment_count ?? comments.length),
      relarps: Number(post.relarp_count ?? 0),
      likes: Number(post.like_count ?? 0),
      loves: Number(post.love_count ?? 0),
      glazes: Number(post.glaze_count ?? 0),
    },
    comments,
    ai_glazes: post.ai_glazes ?? [],
    glazes: post.glazes ?? [],
    buzzword_score: post.buzzword_score ?? 0,
    photo: post.roast_meme_url ?? null,
    has_user_relarped: Boolean(post.has_user_relarped),
    has_user_liked: Boolean(post.has_user_liked),
    has_user_loved: Boolean(post.has_user_loved),
    has_user_glazed: Boolean(post.has_user_glazed),
  }
}

function toProfilePatch(profile) {
  return {
    display_name: profile.name,
    avatar_url: profile.avatar,
    cover_photo_url: profile.coverPhoto,
    bio: profile.about,
    stats: profile.stats,
    glazers: profile.glazers,
    larp_status: profile.larpStatus,
    experience: normalizeExperienceEntries(profile.experience),
    education: profile.education,
    skills: normalizeSkillEntries(profile.skills),
    larp_history: profile.larpHistory,
    glazes_received: profile.glazesReceived,
  }
}

export function MockDataProvider({ children, testMode = IS_TEST_MODE }) {
  const { user } = useAuth()
  const [profile, setProfile] = useState(testMode ? { ...TEST_PROFILE } : { ...EMPTY_PROFILE })
  const [jobOptions, setJobOptions] = useState(testMode ? [...TEST_PROFILE.larpStatus.opportunities] : [])
  const [allPosts, setAllPosts] = useState(
    testMode ? [{ ...TEST_SOURCE_POST, author: { ...TEST_SOURCE_POST.author } }] : []
  )
  const [trendingDelusions, setTrendingDelusions] = useState(
    testMode ? [...TEST_TRENDING_DELUSIONS] : []
  )
  const [buzzwords, setBuzzwords] = useState(testMode ? [...TEST_BUZZWORDS] : [])

  async function loadFeedData() {
    try {
      const data = await fetchFeed({ limit: 50, offset: 0 })
      setAllPosts((data.posts ?? []).map(adaptBackendPost))
      setTrendingDelusions(data.trending_delusions ?? [])
      setBuzzwords(data.buzzwords ?? [])
    } catch {
      setAllPosts([])
      setTrendingDelusions([])
      setBuzzwords([])
    }
  }

  const refreshProfile = useCallback(async () => {
    if (testMode) return { ok: true }
    try {
      const data = await fetchProfile()
      setProfile(adaptProfile(data))
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'Profile fetch failed.' }
    }
  }, [testMode])

  useEffect(() => {
    if (testMode) return

    fetchJobOptions()
      .then(data => setJobOptions(data.options ?? []))
      .catch(() => setJobOptions([]))
    refreshProfile()
      .then(result => {
        if (!result.ok) setProfile({ ...EMPTY_PROFILE })
      })
    loadFeedData()
  }, [testMode, refreshProfile])

  useEffect(() => {
    if (testMode || typeof window === 'undefined') return

    const handleProfileRefresh = () => {
      void refreshProfile()
      void loadFeedData()
    }

    const handleRatingChange = (e) => {
      const { new_rating } = e.detail || {}
      if (typeof new_rating === 'number') {
        setProfile(prev => {
          const prevId = prev.id
          // Also update author ratings in feed posts so they stay in sync
          setAllPosts(posts => posts.map(post =>
            post.author?.id === prevId
              ? { ...post, author: { ...post.author, larpRating: new_rating } }
              : post
          ))
          return { ...prev, larpRating: new_rating }
        })
      }
    }

    window.addEventListener('profile:refresh', handleProfileRefresh)
    window.addEventListener('rating:change', handleRatingChange)
    return () => {
      window.removeEventListener('profile:refresh', handleProfileRefresh)
      window.removeEventListener('rating:change', handleRatingChange)
    }
  }, [testMode, refreshProfile])

  async function persistProfile(nextProfile) {
    if (testMode) {
      setProfile(nextProfile)
      return { ok: true }
    }

    try {
      const saved = await updateProfilePatch(toProfilePatch(nextProfile))
      setProfile(adaptProfile(saved))
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'Profile update failed.' }
    }
  }

  // Seed profile name & avatar from Supabase auth user only if profile hasn't been loaded from backend
  useEffect(() => {
    if (!user) return
    setProfile(prev => {
      // If the profile already has a name from the backend, don't overwrite it
      if (prev.name && prev.id) return prev
      const meta = user.user_metadata ?? {}
      const authName = meta.full_name || meta.name || user.email?.split('@')[0] || ''
      const authAvatar = meta.avatar_url || null
      if (!authName) return prev
      return {
        ...prev,
        name: authName,
        ...(authAvatar ? { avatar: authAvatar } : {}),
      }
    })
  }, [user])

  function isAccessible(targetRating) {
    return Number(targetRating ?? 0) <= profile.larpRating
  }

  async function updateProfile({ name, avatar, coverPhoto } = {}) {
    if (name !== undefined && !String(name ?? '').trim()) {
      return { ok: false, error: 'Name cannot be empty.' }
    }

    const nextProfile = {
      ...profile,
      ...(name !== undefined ? { name: String(name).trim() } : {}),
      ...(avatar !== undefined ? { avatar: avatar || null } : {}),
      ...(coverPhoto !== undefined ? { coverPhoto: coverPhoto || null } : {}),
    }

    setProfile(nextProfile)
    return persistProfile(nextProfile)
  }

  function updateAbout(about) {
    const nextAbout = String(about ?? '').trim()
    if (!nextAbout) {
      return { ok: false, error: 'About section cannot be empty.' }
    }
    const nextProfile = { ...profile, about: nextAbout }
    setProfile(nextProfile)
    void persistProfile(nextProfile)
    return { ok: true }
  }

  function updateLarpStatus({ opportunities } = {}) {
    const hasOpportunities = opportunities !== undefined

    const nextOpportunities = hasOpportunities
      ? toArray(opportunities).map(v => String(v).trim()).filter(Boolean)
      : profile.larpStatus.opportunities

    if (hasOpportunities && !nextOpportunities.length) {
      return { ok: false, error: 'At least one opportunity type is required.' }
    }

    const nextProfile = {
      ...profile,
      larpStatus: { opportunities: nextOpportunities },
    }

    setProfile(nextProfile)
    void persistProfile(nextProfile)
    return { ok: true }
  }

  async function updateCurrentJob(job) {
    const nextJob = String(job ?? '').trim()
    if (!nextJob) return { ok: false, error: 'Job cannot be empty.' }

    const applyJob = (existingProfile, resolvedJob) => ({
      ...existingProfile,
      job: resolvedJob,
      larpStatus: {
        opportunities: Array.from(new Set([resolvedJob, ...toArray(existingProfile.larpStatus?.opportunities)])),
      },
      larpHistory: resolvedJob === existingProfile.job
        ? existingProfile.larpHistory
        : [
          {
            id: makeEntityId(),
            date: new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' }),
            from: existingProfile.job || 'Unknown Larp',
            to: resolvedJob,
            note: 'Updated current larp from the jobs board.',
            createdAt: new Date().toISOString(),
          },
          ...existingProfile.larpHistory,
        ],
    })

    if (testMode) {
      setProfile(prev => applyJob(prev, nextJob))
      return { ok: true, job: nextJob }
    }

    try {
      const result = await apiUpdateJob(nextJob)
      const resolvedJob = result.job ?? nextJob
      setProfile(prev => applyJob(prev, resolvedJob))
      return { ok: true, job: resolvedJob }
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'Job update failed.' }
    }
  }

  function addExperience(entry) {
    const title = String(entry?.title ?? '').trim()
    const company = String(entry?.company ?? '').trim()
    if (!title || !company) {
      return { ok: false, error: 'Experience needs both title and company.' }
    }

    const nextEntry = {
      id: makeEntityId(),
      title,
      company,
      dates: String(entry?.dates ?? '').trim() || 'Dates not set',
      description: String(entry?.description ?? '').trim() || 'No description yet.',
    }

    const nextProfile = { ...profile, experience: [nextEntry, ...profile.experience] }
    setProfile(nextProfile)
    void persistProfile(nextProfile)
    return { ok: true, entry: nextEntry }
  }

  function updateExperience({ id, updates } = {}) {
    if (!id) return { ok: false, error: 'Experience entry not found.' }

    let didUpdate = false
    const nextExperience = profile.experience.map(entry => {
      if (String(entry.id) !== String(id)) return entry
      didUpdate = true
      return {
        ...entry,
        ...(updates?.title !== undefined ? { title: String(updates.title).trim() } : {}),
        ...(updates?.company !== undefined ? { company: String(updates.company).trim() } : {}),
        ...(updates?.dates !== undefined ? { dates: String(updates.dates ?? '').trim() } : {}),
        ...(updates?.description !== undefined
          ? { description: String(updates.description ?? '').trim() }
          : {}),
      }
    })

    if (!didUpdate) return { ok: false, error: 'Experience entry not found.' }

    const nextProfile = { ...profile, experience: nextExperience }
    setProfile(nextProfile)
    void persistProfile(nextProfile)
    return { ok: true }
  }

  function removeExperience(id) {
    if (!id) return { ok: false, error: 'Experience entry not found.' }

    const nextExperience = profile.experience.filter(entry => String(entry.id) !== String(id))
    if (nextExperience.length === profile.experience.length) {
      return { ok: false, error: 'Experience entry not found.' }
    }

    const nextProfile = { ...profile, experience: nextExperience }
    setProfile(nextProfile)
    void persistProfile(nextProfile)
    return { ok: true }
  }

  function addEducation(entry) {
    const school = String(entry?.school ?? '').trim()
    const degree = String(entry?.degree ?? '').trim()
    if (!school || !degree) {
      return { ok: false, error: 'Education needs both school and degree.' }
    }

    const nextEntry = {
      id: makeEntityId(),
      school,
      degree,
      dates: String(entry?.dates ?? '').trim() || 'Dates not set',
      activities: String(entry?.activities ?? '').trim(),
    }

    const nextProfile = { ...profile, education: [nextEntry, ...profile.education] }
    setProfile(nextProfile)
    void persistProfile(nextProfile)
    return { ok: true, entry: nextEntry }
  }

  function updateEducation({ id, updates } = {}) {
    if (!id) return { ok: false, error: 'Education entry not found.' }

    let didUpdate = false
    const nextEducation = profile.education.map(entry => {
      if (String(entry.id) !== String(id)) return entry
      didUpdate = true
      return {
        ...entry,
        ...(updates?.school !== undefined ? { school: String(updates.school).trim() } : {}),
        ...(updates?.degree !== undefined ? { degree: String(updates.degree).trim() } : {}),
        ...(updates?.dates !== undefined ? { dates: String(updates.dates ?? '').trim() } : {}),
        ...(updates?.activities !== undefined
          ? { activities: String(updates.activities ?? '').trim() }
          : {}),
      }
    })

    if (!didUpdate) return { ok: false, error: 'Education entry not found.' }

    const nextProfile = { ...profile, education: nextEducation }
    setProfile(nextProfile)
    void persistProfile(nextProfile)
    return { ok: true }
  }

  function removeEducation(id) {
    if (!id) return { ok: false, error: 'Education entry not found.' }

    const nextEducation = profile.education.filter(entry => String(entry.id) !== String(id))
    if (nextEducation.length === profile.education.length) {
      return { ok: false, error: 'Education entry not found.' }
    }

    const nextProfile = { ...profile, education: nextEducation }
    setProfile(nextProfile)
    void persistProfile(nextProfile)
    return { ok: true }
  }

  function addSkill({ name } = {}) {
    const skillName = String(name ?? '').trim()
    if (!skillName) return { ok: false, error: 'Skill name cannot be empty.' }

    const exists = profile.skills.some(s => String(s.name).toLowerCase() === skillName.toLowerCase())
    if (exists) return { ok: false, error: 'That skill already exists.' }

    const nextProfile = {
      ...profile,
      skills: [{ id: makeEntityId(), name: skillName, endorsements: 0 }, ...profile.skills],
    }

    setProfile(nextProfile)
    void persistProfile(nextProfile)
    return { ok: true }
  }

  function removeSkill(skillId) {
    if (!skillId) return { ok: false, error: 'Skill not found.' }

    const nextSkills = profile.skills.filter(skill => String(skill.id) !== String(skillId))
    if (nextSkills.length === profile.skills.length) return { ok: false, error: 'Skill not found.' }

    const nextProfile = { ...profile, skills: nextSkills }
    setProfile(nextProfile)
    void persistProfile(nextProfile)
    return { ok: true }
  }

  function endorseSkill(skillId) {
    if (!skillId) return { ok: false, error: 'Skill not found.' }

    let found = false
    const nextSkills = profile.skills.map(skill => {
      if (String(skill.id) !== String(skillId)) return skill
      found = true
      return { ...skill, endorsements: Number(skill.endorsements ?? 0) + 1 }
    })

    if (!found) return { ok: false, error: 'Skill not found.' }

    const nextProfile = { ...profile, skills: nextSkills }
    setProfile(nextProfile)
    void persistProfile(nextProfile)
    return { ok: true }
  }

  async function createPost({ content, type, photo }) {
    const trimmedContent = String(content ?? '').trim()
    if (!trimmedContent && !photo) {
      return { ok: false, error: 'Post must have content or a photo.' }
    }

    if (testMode) {
      const nextPost = {
        id: makeEntityId(),
        author: {
          id: profile.id,
          name: profile.name,
          headline: profile.job,
          avatar: profile.avatar,
          larpRating: profile.larpRating,
        },
        type: String(type ?? '').trim() || 'Career Lore',
        timestamp: 'just now',
        content: trimmedContent,
        reactions: { count: 0, comments: 0, relarps: 0, likes: 0, loves: 0, glazes: 0 },
        comments: [],
        ai_glazes: [],
        glazes: [],
        buzzword_score: 0,
        has_user_relarped: false,
        has_user_liked: false,
        has_user_loved: false,
        has_user_glazed: false,
      }
      setAllPosts(prev => [nextPost, ...prev])
      return { ok: true, post: nextPost }
    }

    try {
      const created = await apiCreatePost({
        content: trimmedContent,
        postType: String(type ?? '').trim() || 'Career Lore',
      })
      await loadFeedData()
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('feed:refresh'))
      }
      // Re-fetch after a delay so the background scoring + meme generation has time to complete
      setTimeout(() => {
        loadFeedData()
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('feed:refresh'))
        }
      }, 5000)
      return { ok: true, post: created }
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'Post creation failed.' }
    }
  }

  async function deletePost(postId) {
    if (testMode) {
      setAllPosts(prev => prev.filter(p => p.id !== postId))
      return { ok: true }
    }
    try {
      await apiDeletePost(postId)
      setAllPosts(prev => prev.filter(p => p.id !== postId))
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'Delete failed.' }
    }
  }

  async function createComment({ postId, content }) {
    const text = String(content ?? '').trim()
    if (!text) return { ok: false, error: 'Comment cannot be empty.' }

    if (testMode) {
      const comment = {
        id: makeEntityId(),
        timestamp: 'just now',
        content: text,
        author: {
          name: profile.name,
          headline: profile.job,
          avatar: profile.avatar,
          larpRating: profile.larpRating,
        },
      }
      setAllPosts(prev =>
        prev.map(post =>
          String(post.id) !== String(postId)
            ? post
            : {
              ...post,
              comments: [comment, ...(post.comments ?? [])],
              reactions: {
                ...post.reactions,
                comments: Number(post.reactions?.comments ?? 0) + 1,
              },
            }
        )
      )
      return { ok: true, comment }
    }

    try {
      const comment = await createPostComment(postId, text)
      setAllPosts(prev =>
        prev.map(post =>
          String(post.id) !== String(postId)
            ? post
            : {
              ...post,
              comments: [comment, ...(post.comments ?? [])],
              reactions: {
                ...post.reactions,
                comments: Number(post.reactions?.comments ?? 0) + 1,
              },
            }
        )
      )
      return { ok: true, comment }
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'Comment failed.' }
    }
  }

  function hasUserRelarped(postId) {
    if (!postId) return false
    const source = allPosts.find(post => String(post.id) === String(postId))
    return Boolean(source?.has_user_relarped)
  }

  async function createRelarp({ postId, commentary }) {
    if (!postId) return { ok: false, error: 'Post not found.' }

    if (testMode) {
      const sourcePost = allPosts.find(post => String(post.id) === String(postId))
      if (!sourcePost) return { ok: false, error: 'Post not found.' }
      if (sourcePost.author.id === profile.id) return { ok: false, error: 'Cannot relarp your own post.' }
      if (sourcePost.has_user_relarped) return { ok: false, error: 'Already relarped.' }

      const relarpPost = {
        id: makeEntityId(),
        author: {
          id: profile.id,
          name: profile.name,
          headline: profile.job,
          avatar: profile.avatar,
          larpRating: profile.larpRating,
        },
        type: 'Re-Larp',
        timestamp: 'just now',
        content: String(commentary ?? '').trim(),
        reactions: { count: 0, comments: 0, relarps: 0, likes: 0, loves: 0, glazes: 0 },
        comments: [],
        isRelarp: true,
        relarpOf: sourcePost,
      }
      setAllPosts(prev => {
        const next = prev.map(post =>
          String(post.id) !== String(postId)
            ? post
            : {
              ...post,
              has_user_relarped: true,
              reactions: {
                ...post.reactions,
                relarps: Number(post.reactions?.relarps ?? 0) + 1,
              },
            }
        )
        return [relarpPost, ...next]
      })
      return { ok: true }
    }

    try {
      await apiCreateRelarp(postId, String(commentary ?? ''))
      await loadFeedData()
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'Relarp failed.' }
    }
  }

  async function undoRelarp({ postId }) {
    if (!postId) return { ok: false, error: 'Post not found.' }

    if (testMode) {
      setAllPosts(prev => {
        let removed = false
        const withoutRelarp = prev.filter(post => {
          const shouldRemove = post.isRelarp && String(post.relarpOf?.id) === String(postId)
          if (shouldRemove) removed = true
          return !shouldRemove
        })

        if (!removed) return prev

        return withoutRelarp.map(post =>
          String(post.id) !== String(postId)
            ? post
            : {
              ...post,
              has_user_relarped: false,
              reactions: {
                ...post.reactions,
                relarps: Math.max(0, Number(post.reactions?.relarps ?? 0) - 1),
              },
            }
        )
      })
      return { ok: true }
    }

    try {
      await apiRemoveRelarp(postId)
      await loadFeedData()
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'Undo relarp failed.' }
    }
  }

  const feedPosts = useMemo(() => allPosts, [allPosts])

  const value = {
    currentUser: profile,
    meProfile: profile,
    feedPosts,
    allPosts,
    trendingDelusions,
    buzzwords,
    jobOptions,
    isAccessible,
    updateProfile,
    updateAbout,
    updateCurrentJob,
    updateLarpStatus,
    refreshProfile,
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
    deletePost,
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
