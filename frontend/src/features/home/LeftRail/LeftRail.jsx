import { useMockData } from '../../../context/MockDataContext'
import LarpRatingBadge from '../../../components/LarpRatingBadge/LarpRatingBadge'
import styles from './LeftRail.module.css'

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

export default function LeftRail() {
  const { currentUser } = useMockData()
  const { name, headline, larpRating, persona, stats, glazers } = currentUser

  return (
    <div className={styles.rail}>
      {/* Identity card */}
      <div className={styles.card}>
        <div className={styles.coverPhoto} />
        <div className={styles.avatarWrap}>
          <div className={styles.avatar}>{getInitials(name)}</div>
        </div>
        <div className={styles.identity}>
          <h2 className={styles.name}>{name}</h2>
          <p className={styles.headline}>{headline}</p>
          <div className={styles.ratingRow}>
            <span className={styles.ratingLabel}>LarpRating</span>
            <svg className={styles.ratingInfo} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm1 15h-2v-6h2zm0-8h-2V7h2z" />
            </svg>
          </div>
          <div className={styles.gaugeWrap}>
            <LarpRatingBadge rating={larpRating} size="large" />
          </div>
          <p className={styles.persona}>{persona}</p>
        </div>
        <div className={styles.divider} />
        <div className={styles.stats}>
          <p className={styles.statLine}>
            <span className={styles.statLabel}>Viewed by </span>
            <span className={styles.statValue}>{stats.recruiterViews} recruiters</span>
            <span className={styles.statLabel}> in the last 7 hours</span>
          </p>
          <p className={styles.statLine}>
            <span className={styles.statLabel}>Impression velocity: </span>
            <span className={styles.statValue}>{stats.impressionVelocity}</span>
          </p>
        </div>
      </div>

      {/* Who's glazing you */}
      <div className={styles.card}>
        <div className={styles.widgetHeader}>
          <h3 className={styles.widgetTitle}>Who&apos;s glazing you</h3>
          <button className={styles.moreBtn}>···</button>
        </div>
        <div className={styles.glazers}>
          {glazers.map((g, i) => (
            <div key={i} className={styles.glazerRow}>
              <div className={styles.glazerAvatar}>{getInitials(g.name)}</div>
              <div>
                <p className={styles.glazerName}>{g.name}</p>
                <p className={styles.glazerSub}>{g.headline}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly aura growth */}
      <div className={styles.card}>
        <div className={styles.widgetHeader}>
          <h3 className={styles.widgetTitle}>Weekly aura growth</h3>
          <button className={styles.moreBtn}>···</button>
        </div>
        <div className={styles.auraRow}>
          <div>
            <p className={styles.auraLabel}>Weekly aura growth</p>
            <p className={styles.auraLabel}>aura growth</p>
          </div>
          <div className={styles.auraValues}>
            <span className={styles.auraNumber}>{stats.weeklyAuraGrowth}</span>
            <span className={styles.auraChange}>{stats.weeklyAuraGrowthPct}</span>
          </div>
        </div>
        <button className={styles.seeMore}>See more →</button>
      </div>
    </div>
  )
}
