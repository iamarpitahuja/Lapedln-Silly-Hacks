import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMockData } from '../../../context/MockDataContext'
import LarpRatingBadge from '../../../components/LarpRatingBadge/LarpRatingBadge'
import Icon from '../../../components/Icon/Icon'
import { getInitials } from '../../../utils/strings'
import styles from './LeftRail.module.css'

export default function LeftRail() {
  const { currentUser } = useMockData()
  const { name, job, larpRating, stats, glazers, avatar, coverPhoto } = currentUser
  const resolvedCoverPhoto = useMemo(() => {
    if (typeof coverPhoto !== 'string') return ''
    return coverPhoto.trim()
  }, [coverPhoto])
  const [isCoverPhotoBroken, setIsCoverPhotoBroken] = useState(false)

  useEffect(() => {
    setIsCoverPhotoBroken(false)
  }, [resolvedCoverPhoto])

  return (
    <div className={styles.rail}>
      {/* Identity card */}
      <div className={styles.card}>
        <div className={styles.coverPhoto}>
          {resolvedCoverPhoto && !isCoverPhotoBroken ? (
            <img
              src={resolvedCoverPhoto}
              alt=""
              className={styles.coverPhotoImg}
              onError={() => setIsCoverPhotoBroken(true)}
            />
          ) : null}
        </div>
        <div className={styles.avatarWrap}>
          {avatar ? (
            <img src={avatar} alt={name} className={styles.avatarImg} />
          ) : (
            <div className={styles.avatar}>{getInitials(name)}</div>
          )}
        </div>
        <div className={styles.identity}>
          <h2 className={styles.name}>{name}</h2>
          <p className={styles.headline}>{job}</p>
          <div className={styles.ratingRow}>
            <span className={styles.ratingLabel}>LarpRating</span>
            <svg className={styles.ratingInfo} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm1 15h-2v-6h2zm0-8h-2V7h2z" />
            </svg>
          </div>
          <div className={styles.gaugeWrap}>
            <LarpRatingBadge rating={larpRating} size="large" />
          </div>
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
          <button className={styles.moreBtn} aria-label="More">
            <Icon name="more" size={16} />
          </button>
        </div>
        <div className={styles.glazers}>
          {glazers.map((g, i) => (
            <div key={i} className={styles.glazerRow}>
              {g.avatar ? (
                <img src={g.avatar} alt={g.name} className={styles.glazerAvatarImg} />
              ) : (
                <div className={styles.glazerAvatar}>{getInitials(g.name)}</div>
              )}
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
          <button className={styles.moreBtn} aria-label="More">
            <Icon name="more" size={16} />
          </button>
        </div>
        <div className={styles.auraRow}>
          <div>
            <p className={styles.auraLabel}>Weekly aura growth</p>
          </div>
          <div className={styles.auraValues}>
            <span className={styles.auraNumber}>{stats.weeklyAuraGrowth}</span>
            <span className={styles.auraChange}>{stats.weeklyAuraGrowthPct}</span>
          </div>
        </div>
        <button className={styles.seeMore}>
          See more <Icon name="arrowRight" size={14} />
        </button>
      </div>

      {/* LarpMaxxer quick access */}
      <div className={styles.card}>
        <div className={styles.larpmaxxerCard}>
          <div className={styles.larpmaxxerHeader}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" className={styles.larpmaxxerIcon}>
              <path d="M10 2l2.5 5.5L18 8.5l-4 4 1 5.5L10 15.5 4.5 18l1-5.5-4-4 5.5-1z" />
            </svg>
            <span className={styles.larpmaxxerTitle}>LarpMaxxer</span>
          </div>
          <p className={styles.larpmaxxerSub}>Train your corporate persona</p>
          <Link to="/larpmaxxer" className={styles.larpmaxxerBtn}>
            Enter Training
          </Link>
        </div>
      </div>
    </div>
  )
}
