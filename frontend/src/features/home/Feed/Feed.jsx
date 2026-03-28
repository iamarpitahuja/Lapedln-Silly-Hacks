import { useState, useEffect } from 'react'
import { useMockData } from '../../../context/MockDataContext'
import StartPost from './StartPost/StartPost'
import PostCard from './PostCard/PostCard'
import LockedPostCard from './LockedPostCard/LockedPostCard'
import styles from './Feed.module.css'

export default function Feed() {
  const { currentUser, allPosts, isAccessible } = useMockData()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={styles.feed}>
      <StartPost />
      {loading ? (
        <p className={styles.loadingText}>Recalculating prestige hierarchy…</p>
      ) : (
        <div className={styles.posts}>
          {allPosts.map((post, index) => (
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
