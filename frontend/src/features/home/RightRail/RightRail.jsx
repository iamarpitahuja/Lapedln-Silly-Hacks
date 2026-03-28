import { useMockData } from '../../../context/MockDataContext'
import styles from './RightRail.module.css'

const LOCKED_POSTS = [
  { id: 'a', authorInitials: 'TW', blur: true },
  { id: 'b', authorInitials: 'SB', blur: true },
]

export default function RightRail() {
  const { trendingDelusions, buzzwords } = useMockData()

  return (
    <div className={styles.rail}>
      {/* Trending Delusions */}
      <div className={styles.card}>
        <h3 className={styles.title}>Trending Delusions</h3>
        <ol className={styles.list}>
          {trendingDelusions.map((item, i) => (
            <li key={i} className={styles.listItem}>
              <span className={styles.listNum}>{i + 1}.</span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
        <button className={styles.seeMore}>see more</button>
      </div>

      {/* Today's Buzzwords */}
      <div className={styles.card}>
        <h3 className={styles.title}>Today&apos;s Buzzwords</h3>
        <ul className={styles.buzzList}>
          {buzzwords.slice(0, 2).map((bw, i) => (
            <li key={i} className={styles.buzzItem}>{bw}</li>
          ))}
        </ul>
        <button className={styles.seeMore}>see more</button>
      </div>

      {/* Locked posts */}
      <div className={styles.card}>
        <h3 className={styles.title}>Top posts you cannot view because of your LarpRating</h3>
        <div className={styles.lockedList}>
          {LOCKED_POSTS.map(post => (
            <div key={post.id} className={styles.lockedCard}>
              <div className={styles.lockedBlur}>
                <div className={styles.lockedFakeContent}>
                  <div className={styles.fakeAvatar}>{post.authorInitials}</div>
                  <div className={styles.fakeLines}>
                    <div className={styles.fakeLine} style={{ width: '60%' }} />
                    <div className={styles.fakeLine} style={{ width: '40%' }} />
                  </div>
                </div>
                <div className={styles.fakeParagraph} />
                <div className={styles.fakeParagraph} style={{ width: '80%' }} />
              </div>
              <div className={styles.lockedOverlay}>
                <span className={styles.lockIcon}>🔒</span>
                <p className={styles.lockMessage}>This content is above your professional aura.</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
