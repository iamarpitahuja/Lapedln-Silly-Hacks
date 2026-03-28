import ProfileHero from './ProfileHero/ProfileHero'
import LarpStatus from './LarpStatus/LarpStatus'
import styles from './Me.module.css'

export default function Me() {
  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <ProfileHero />
        <LarpStatus />
      </div>
    </div>
  )
}
