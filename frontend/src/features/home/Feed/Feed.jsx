import { useMockData } from '../../../context/MockDataContext'
import StartPost from './StartPost/StartPost'
import PostCard from './PostCard/PostCard'
import styles from './Feed.module.css'

export default function Feed() {
  const { feedPosts } = useMockData()

  return (
    <div className={styles.feed}>
      <StartPost />
      {feedPosts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}
