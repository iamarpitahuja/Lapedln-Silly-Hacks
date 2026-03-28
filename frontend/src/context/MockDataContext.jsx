/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const CURRENT_USER = {
  name: 'Arjun Malhotra',
  headline: 'Incoming Quant VC Product Strategist',
  avatar: null,
  larpRating: 67.2,
  persona: 'Stealth Founder / Ex-McKinsey Adjacent',
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
}

const POSTS_STORAGE_KEY = 'larpedin.posts.v1'

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
      "Hot take: execution is overrated. What separates elite operators from the rest is their ability to synthesize frameworks across disciplines and communicate them in a way that makes investors feel something.",
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

const TRENDING_DELUSIONS = [
  'Career Loring',
  'Conivroation',
  'Prestige signaling',
  'Usw emmied',
]

const BUZZWORDS = ['Hyperscale', 'Narrative leverage', 'Operator mindset', 'Aura velocity']

const MockDataContext = createContext(null)

function makeEntityId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.floor(Math.random() * 10000)}`
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
  const [allPosts, setAllPosts] = useState(loadInitialPosts)

  function isAccessible(targetRating) {
    return targetRating <= CURRENT_USER.larpRating
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(allPosts))
  }, [allPosts])

  function createPost({ content, type }) {
    const trimmedContent = (content ?? '').trim()

    if (!trimmedContent) {
      return { ok: false, error: 'Post content cannot be empty.' }
    }

    const postId = makeEntityId()

    const nextPost = {
      id: postId,
      author: {
        name: CURRENT_USER.name,
        headline: CURRENT_USER.headline,
        avatar: CURRENT_USER.avatar,
        larpRating: CURRENT_USER.larpRating,
      },
      type: type?.trim() || 'Personal Update',
      timestamp: 'Just now',
      content: trimmedContent,
      reactions: { count: 0, comments: 0 },
      comments: [],
      createdAt: new Date().toISOString(),
      isUserPost: true,
    }

    setAllPosts(existingPosts => [nextPost, ...existingPosts])
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
        name: CURRENT_USER.name,
        headline: CURRENT_USER.headline,
        avatar: CURRENT_USER.avatar,
        larpRating: CURRENT_USER.larpRating,
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
      sourcePost.isUserPost || String(sourcePost.author?.name) === String(CURRENT_USER.name)

    if (isOwnSourcePost) {
      return { ok: false, error: 'You cannot Re-Larp your own post.' }
    }

    if (hasUserRelarped(postId)) {
      return { ok: false, error: 'You already Re-Larped this post.' }
    }

    const relarpSource = sourcePost.isRelarp && sourcePost.relarpOf
      ? sourcePost.relarpOf
      : toRelarpSnapshot(sourcePost)

    const nextRelarpPost = normalizePost({
      id: makeEntityId(),
      author: {
        name: CURRENT_USER.name,
        headline: CURRENT_USER.headline,
        avatar: CURRENT_USER.avatar,
        larpRating: CURRENT_USER.larpRating,
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

        const relarpCount = typeof post.reactions?.relarps === 'number' ? post.reactions.relarps : 0

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

  const feedPosts = useMemo(
    () => allPosts.filter(post => isAccessible(post.author.larpRating)),
    [allPosts]
  )

  const value = {
    currentUser: CURRENT_USER,
    feedPosts,
    allPosts,
    trendingDelusions: TRENDING_DELUSIONS,
    buzzwords: BUZZWORDS,
    isAccessible,
    createPost,
    createComment,
    hasUserRelarped,
    createRelarp,
  }

  return <MockDataContext.Provider value={value}>{children}</MockDataContext.Provider>
}

export function useMockData() {
  const ctx = useContext(MockDataContext)
  if (!ctx) throw new Error('useMockData must be used within MockDataProvider')
  return ctx
}
