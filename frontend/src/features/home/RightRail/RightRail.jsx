import { useMockData } from '../../../context/MockDataContext'
import styles from './RightRail.module.css'

export default function RightRail() {
  const { trendingDelusions, buzzwords } = useMockData()

  return (
    <div className={styles.rail}>
      {/* Trending Delulu */}
      <div className={styles.card}>
        <h3 className={styles.title}>Trending Delulu</h3>
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

      {/* Today's Sigma Vocab */}
      <div className={styles.card}>
        <h3 className={styles.title}>Today&apos;s Buzzwords</h3>
        <ul className={styles.buzzList}>
          {buzzwords.slice(0, 2).map((bw, i) => (
            <li key={i} className={styles.buzzItem}>{bw}</li>
          ))}
        </ul>
        <button className={styles.seeMore}>see more</button>
      </div>
    </div>
  )
}
