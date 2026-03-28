import ProfileHero from './ProfileHero/ProfileHero'
import styles from './Me.module.css'

export default function Me() {
  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <ProfileHero />
      </div>
    </div>
  )
}
