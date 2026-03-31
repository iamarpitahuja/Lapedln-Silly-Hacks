import { useMockData } from '../../../context/MockDataContext'
import { getInitials } from '../../../utils/strings'
import styles from './GlazesSection.module.css'

export default function GlazesSection() {
  const { currentUser } = useMockData()
  const glazes = currentUser.glazesReceived ?? []

  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>Glazes Received (ur fan mail)</h2>
      </div>
      <div className={styles.glazes}>
        {glazes.length === 0 && (
          <p className={styles.emptyState}>no glazes yet. post harder. the glazing will come eventually.</p>
        )}
        {glazes.map(glaze => (
          <article key={glaze.id ?? glaze.name} className={styles.glazeCard}>
            <div className={styles.glazeAvatar}>{getInitials(glaze.name)}</div>
            <div className={styles.glazeBody}>
              <div className={styles.glazeMeta}>
                <span className={styles.glazerName}>{glaze.name}</span>
                <span className={styles.glazeRel}>{glaze.relationship}</span>
              </div>
              <p className={styles.glazeText}>"{glaze.text}"</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
