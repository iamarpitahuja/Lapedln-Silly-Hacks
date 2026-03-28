import { useMockData } from '../../../context/MockDataContext'
import LarpRatingBadge from '../../../components/LarpRatingBadge/LarpRatingBadge'
import { getInitials } from '../../../utils/strings'
import styles from './ProfileHero.module.css'

export default function ProfileHero() {
  const { currentUser } = useMockData()
  const { name, headline, larpRating, persona, stats } = currentUser

  return (
    <div className={styles.card}>
      <div className={styles.coverPhoto} />
      <div className={styles.heroBody}>
        <div className={styles.avatarWrap}>
          <div className={styles.avatar}>{getInitials(name)}</div>
          <button className={styles.editBtn} aria-label="Edit profile">✏</button>
        </div>
        <h1 className={styles.name}>{name}</h1>
        <p className={styles.headline}>{headline}</p>
        <div className={styles.badgeRow}>
          <LarpRatingBadge rating={larpRating} size="small" />
        </div>
        <p className={styles.persona}>{persona}</p>
        <p className={styles.recruiterStat}>
          <span className={styles.statValue}>{stats.recruiterViews} recruiters</span> are monitoring your trajectory.
        </p>
      </div>
    </div>
  )
}
