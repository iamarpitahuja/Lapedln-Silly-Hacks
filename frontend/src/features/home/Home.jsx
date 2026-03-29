import { motion as Motion } from 'framer-motion'
import LeftRail from './LeftRail/LeftRail'
import Feed from './Feed/Feed'
import RightRail from './RightRail/RightRail'
import { easeOutQuint } from '../../lib/motion'
import styles from './Home.module.css'

const colVariants = {
  hidden: custom => ({ opacity: 0, x: custom.x ?? 0, y: custom.y ?? 0 }),
  show: { opacity: 1, x: 0, y: 0 },
}

export default function Home() {
  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <Motion.aside
          className={styles.left}
          custom={{ x: -16 }}
          variants={colVariants}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.3, ease: easeOutQuint, delay: 0 }}
        >
          <LeftRail />
        </Motion.aside>
        <Motion.section
          className={styles.center}
          custom={{ y: 12 }}
          variants={colVariants}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.3, ease: easeOutQuint, delay: 0.08 }}
        >
          <Feed />
        </Motion.section>
        <Motion.aside
          className={styles.right}
          custom={{ x: 16 }}
          variants={colVariants}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.3, ease: easeOutQuint, delay: 0.16 }}
        >
          <RightRail />
        </Motion.aside>
      </div>
    </div>
  )
}

