import { useState, useEffect } from 'react'
import { useMockData } from '../../../context/MockDataContext'
import { fetchFeed } from '../../../services/api'
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
  return {
    id: post.id,
    author: {
      id: post.profiles?.id ?? post.author_id ?? null,
      name: post.profiles?.display_name ?? 'Anonymous Larper',
      headline: post.profiles?.title ?? 'Aspiring Thought Leader',
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
        <div className={styles.posts}>
          {backendPosts.map((post, index) => (
            <div
              key={`${post.id}:${post.reactions.comments}:${post.reactions.relarps}:${post.reactions.likes}:${post.reactions.loves}:${post.reactions.glazes}:${post.has_user_relarped ? 1 : 0}:${post.has_user_liked ? 1 : 0}:${post.has_user_loved ? 1 : 0}:${post.has_user_glazed ? 1 : 0}`}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {isAccessible(post.author.larpRating) ? (
                <PostCard
                  post={post}
                  isOwnPost={post.author.id === currentUser.id}
                />
              ) : (
                <LockedPostCard />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
