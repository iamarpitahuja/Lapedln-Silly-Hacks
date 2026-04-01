import { AnimatePresence, motion as Motion } from 'framer-motion'
import { useMockData } from '../../../context/MockDataContext'
import { easeOutQuint } from '../../../lib/motion'
import StartPost from './StartPost/StartPost'
import PostCard from './PostCard/PostCard'
import LockedPostCard from './LockedPostCard/LockedPostCard'
import styles from './Feed.module.css'

export default function Feed() {
  const { currentUser, feedPosts, isAccessible } = useMockData()

  return (
    <div className={styles.feed}>
      <StartPost />
      {feedPosts.length === 0 ? (
        <p className={styles.loadingText}>Recalculating the prestige hierarchy... ur either eating or getting ate rn</p>
      ) : (
        <Motion.div className={styles.posts}>
          <AnimatePresence initial={false}>
            {feedPosts.map(post => (
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

