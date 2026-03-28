import { useMockData } from '../../../context/MockDataContext'
import styles from './LarpStatus.module.css'

const OPPORTUNITY_TYPES = [
  'Fractional Visionary',
  'Keynote Speaker at Events I Have Not Been Invited To',
  'Angel Investor in Ideas I Haven\'t Had Yet',
  'Interim Thought Leader',
]

export default function LarpStatus() {
  const { currentUser } = useMockData()
  const { persona } = currentUser

  return (
    <div className={styles.card}>
      <div className={styles.banner}>
        <div className={styles.bannerHeader}>
          <span className={styles.dot} />
          <h2 className={styles.title}>Open to Larping</h2>
        </div>
        <p className={styles.persona}>{persona}</p>
        <div className={styles.pills}>
          {OPPORTUNITY_TYPES.map(type => (
            <span key={type} className={styles.pill}>{type}</span>
          ))}
        </div>
        <div className={styles.actions}>
          <button className={styles.btnOutlined}>Switch Persona</button>
          <button className={styles.btnFilled}>Update Larp Status</button>
        </div>
      </div>
    </div>
  )
}
