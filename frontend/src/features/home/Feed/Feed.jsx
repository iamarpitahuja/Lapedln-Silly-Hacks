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
  return {
    id: post.id,
    author: {
      name: post.profiles?.display_name ?? 'Anonymous Larper',
      headline: post.profiles?.title ?? 'Aspiring Thought Leader',
      avatar: null,
      larpRating: post.profiles?.larp_rating ?? 0,
    },
    type: post.post_type ?? 'thought_leadership',
    timestamp: timeAgo(post.created_at),
    content: post.content ?? '',
    reactions: { count: 0, comments: 0 },
    comments: [],
    ai_glazes: post.ai_glazes ?? [],
    glazes: post.glazes ?? [],
    buzzword_score: post.buzzword_score ?? 0,
  }
}

export default function Feed() {
  const { currentUser, allPosts, isAccessible } = useMockData()
  const [backendPosts, setBackendPosts] = useState([])
  const [backendLoaded, setBackendLoaded] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeed()
      .then(data => {
        setBackendPosts((data.posts ?? []).map(adaptBackendPost))
        setBackendLoaded(true)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Optimistic user posts + real backend posts (seed posts dropped when backend loads)
  const displayPosts = backendLoaded
    ? [...allPosts.filter(p => p.isUserPost), ...backendPosts]
    : allPosts

  return (
    <div className={styles.feed}>
      <StartPost />
      {loading ? (
        <p className={styles.loadingText}>Recalculating prestige hierarchy…</p>
      ) : (
        <div className={styles.posts}>
          {displayPosts.map((post, index) => (
            <div
              key={post.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {isAccessible(post.author.larpRating) ? (
                <PostCard
                  post={post}
                  isOwnPost={!!post.isUserPost || post.author.name === currentUser.name}
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
