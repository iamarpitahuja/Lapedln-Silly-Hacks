import { useMockData } from '../../../context/MockDataContext'
import styles from './LarpHistorySection.module.css'

export default function LarpHistorySection() {
  const { currentUser } = useMockData()
  const larpHistory = currentUser.larpHistory ?? []

  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>Larp History</h2>
          <span className={styles.exclusivePill}>LarpedIn</span>
        </div>
      </div>
      <div className={styles.timeline}>
        {larpHistory.map((entry, index) => (
          <article key={entry.id ?? `${entry.date}-${index}`} className={styles.entry}>
            <div className={styles.timelineDot} />
            {index < larpHistory.length - 1 && <div className={styles.timelineLine} />}
            <div className={styles.entryBody}>
              <p className={styles.date}>{entry.date}</p>
              <p className={styles.transition}>
                <span className={styles.fromPersona}>{entry.from}</span>
                <span className={styles.arrow}> {'->'} </span>
                <span className={styles.toPersona}>{entry.to}</span>
              </p>
              <p className={styles.note}>{entry.note}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
