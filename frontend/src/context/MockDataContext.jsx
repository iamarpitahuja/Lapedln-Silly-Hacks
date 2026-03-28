import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { fetchProfile } from '../services/api'

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

const ALL_POSTS = [
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
    reactions: { count: 247, comments: 31 },
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
    reactions: { count: 892, comments: 114 },
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
    reactions: { count: 1203, comments: 287 },
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
    reactions: { count: 445, comments: 62 },
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
    reactions: { count: 2891, comments: 401 },
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
    reactions: { count: 9999, comments: 999 },
  },
]

const TRENDING_DELUSIONS = [
  'Career Loring',
  'Conivroation',
  'Prestige signaling',
  'Usw emmied',
]

const BUZZWORDS = ['Hyperscale', 'Narrative leverage', 'Operator mindset', 'Aura velocity']

const MockDataContext = createContext(null)

export function MockDataProvider({ children }) {
  const [userPosts, setUserPosts] = useState([])
  const [currentUser, setCurrentUser] = useState(CURRENT_USER)

  // Sync profile from backend on mount (picks up persisted title changes etc.)
  useEffect(() => {
    fetchProfile()
      .then(profile => {
        setCurrentUser(prev => ({
          ...prev,
          headline: profile.title || prev.headline,
          larpRating: profile.larp_rating ?? prev.larpRating,
          name: profile.display_name || prev.name,
        }))
      })
      .catch(() => {
        // Backend not running — keep mock data
      })
  }, [])

  function isAccessible(targetRating) {
    return targetRating <= currentUser.larpRating
  }

  const feedPosts = [
    ...userPosts,
    ...ALL_POSTS.filter(post => isAccessible(post.author.larpRating)),
  ]

  const addPost = useCallback((post) => {
    setUserPosts(prev => [post, ...prev])
  }, [])

  const updateCurrentUser = useCallback((updates) => {
    setCurrentUser(prev => ({ ...prev, ...updates }))
  }, [])

  const value = {
    currentUser,
    feedPosts,
    allPosts: ALL_POSTS,
    trendingDelusions: TRENDING_DELUSIONS,
    buzzwords: BUZZWORDS,
    isAccessible,
    addPost,
    updateCurrentUser,
  }

  return <MockDataContext.Provider value={value}>{children}</MockDataContext.Provider>
}

export function useMockData() {
  const ctx = useContext(MockDataContext)
  if (!ctx) throw new Error('useMockData must be used within MockDataProvider')
  return ctx
}
