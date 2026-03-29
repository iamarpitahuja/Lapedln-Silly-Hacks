import { useState, useEffect } from 'react'
import { AnimatePresence, motion as Motion } from 'framer-motion'
import { useMockData } from '../../../context/MockDataContext'
import { fetchFeed } from '../../../services/api'
import { easeOutQuint } from '../../../lib/motion'
import StartPost from './StartPost/StartPost'
import PostCard from './PostCard/PostCard'
import LockedPostCard from './LockedPostCard/LockedPostCard'
import styles from './Feed.module.css'

function timeAgo(isoString) {
  if (!isoString) return 'recently'
  const diffMs = Date.now() - new Date(isoString).getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h`
  return `${Math.floor(diffHours / 24)}d`
}

function adaptBackendPost(post) {
  const comments = Array.isArray(post.comments) ? post.comments : []

  // Handle relarp feed items
  if (post.is_relarp && post.relarp_of) {
    const orig = post.relarp_of
    return {
      id: post.id,
      author: {
        id: post.profiles?.id ?? post.author_id ?? null,
        name: post.profiles?.display_name ?? 'Anonymous Larper',
        headline: post.profiles?.title ?? 'Aspiring Thought Leader',
        avatar: post.profiles?.avatar_url ?? null,
        larpRating: post.profiles?.larp_rating ?? 0,
      },
      type: 'Re-Larp',
      timestamp: timeAgo(post.created_at),
      content: post.content ?? '',
      reactions: {
        count: 0,
        comments: 0,
        relarps: 0,
        likes: Number(post.like_count ?? 0),
        loves: Number(post.love_count ?? 0),
        glazes: Number(post.glaze_count ?? 0),
      },
      comments: [],
      ai_glazes: [],
      glazes: [],
      buzzword_score: 0,
      isRelarp: true,
      relarpOf: {
        id: orig.id,
        author: {
          id: orig.profiles?.id ?? null,
          name: orig.profiles?.display_name ?? 'Anonymous Larper',
          headline: orig.profiles?.title ?? 'Aspiring Thought Leader',
          avatar: orig.profiles?.avatar_url ?? null,
          larpRating: orig.profiles?.larp_rating ?? 0,
        },
        type: orig.post_type ?? 'Career Lore',
        timestamp: timeAgo(orig.created_at),
        content: orig.content ?? '',
        buzzword_score: orig.buzzword_score ?? 0,
      },
      has_user_relarped: false,
      has_user_liked: Boolean(post.has_user_liked),
      has_user_loved: Boolean(post.has_user_loved),
      has_user_glazed: Boolean(post.has_user_glazed),
    }
  }

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
    has_user_relarped: Boolean(post.has_user_relarped),
    has_user_liked: Boolean(post.has_user_liked),
    has_user_loved: Boolean(post.has_user_loved),
    has_user_glazed: Boolean(post.has_user_glazed),
  }
}

export default function Feed() {
  const { currentUser, isAccessible } = useMockData()
  const [backendPosts, setBackendPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadFeed() {
      setLoading(true)
      try {
        const data = await fetchFeed()
        setBackendPosts((data.posts ?? []).map(adaptBackendPost))
      } catch {
        setBackendPosts([])
      } finally {
        setLoading(false)
      }
    }

    loadFeed()

    function onRefresh() {
      void loadFeed()
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('feed:refresh', onRefresh)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('feed:refresh', onRefresh)
      }
    }
  }, [])

  return (
    <div className={styles.feed}>
      <StartPost />
      {loading ? (
        <p className={styles.loadingText}>Recalculating prestige hierarchy…</p>
      ) : (
        <Motion.div className={styles.posts}>
          <AnimatePresence initial={false}>
            {backendPosts.map(post => (
              <Motion.div
                key={post.id}
                layout
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.25, ease: easeOutQuint }}
              >
                {isAccessible(post.author.larpRating) ? (
                  <PostCard
                    post={post}
                    isOwnPost={post.author.id === currentUser.id}
                  />
                ) : (
                  <LockedPostCard post={post} />
                )}
              </Motion.div>
            ))}
          </AnimatePresence>
        </Motion.div>
      )}
    </div>
  )
}

