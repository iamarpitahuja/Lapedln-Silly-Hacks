import { useMockData } from '../../../context/MockDataContext'
import { getInitials } from '../../../utils/strings'
import Icon from '../../../components/Icon/Icon'
import styles from './RightRail.module.css'

export default function RightRail() {
  const { trendingDelusions, buzzwords, allPosts, isAccessible } = useMockData()
  const lockedPosts = allPosts.filter(post => !isAccessible(post.author.larpRating)).slice(0, 2)

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
          {lockedPosts.map(post => (
            <div key={post.id} className={styles.lockedCard}>
              <div className={styles.lockedBlur}>
                <div className={styles.lockedFakeContent}>
                  <div className={styles.fakeAvatar}>{getInitials(post.author.name)}</div>
                  <div className={styles.fakeLines}>
                    <div className={styles.fakeLine} style={{ width: '60%' }} />
                    <div className={styles.fakeLine} style={{ width: '40%' }} />
                  </div>
                </div>
                <div className={styles.fakeParagraph} />
                <div className={styles.fakeParagraph} style={{ width: '80%' }} />
              </div>
              <div className={styles.lockedOverlay}>
                <span className={styles.lockIcon}><Icon name="lock" size={24} /></span>
                <p className={styles.lockMessage}>This content is above your professional aura.</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
