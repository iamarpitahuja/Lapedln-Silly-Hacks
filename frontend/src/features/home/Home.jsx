import LeftRail from './LeftRail/LeftRail'
import Feed from './Feed/Feed'
import RightRail from './RightRail/RightRail'
import styles from './Home.module.css'

export default function Home() {
  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <aside className={styles.left}>
          <LeftRail />
        </aside>
        <section className={styles.center}>
          <Feed />
        </section>
        <aside className={styles.right}>
          <RightRail />
        </aside>
      </div>
    </div>
  )
}
