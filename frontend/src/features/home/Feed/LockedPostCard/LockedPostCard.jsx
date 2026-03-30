import Icon from '../../../../components/Icon/Icon'
import styles from './LockedPostCard.module.css'

export default function LockedPostCard({ post }) {
  const author = post?.author
  return (
    <div className={styles.card}>
      <div className={styles.blurLayer}>
        <div className={styles.header}>
          <div className={styles.avatarWrap}>
            {author?.avatar
              ? <img src={author.avatar} alt="" className={styles.realAvatar} />
              : <div className={styles.fakeAvatar} />
            }
          </div>
          <div className={styles.fakeLines}>
            {author?.name
              ? <div className={styles.realName}>{author.name}</div>
              : <div className={`${styles.fakeLine} ${styles.lineWide}`} />
            }
            {author?.headline
              ? <div className={styles.realHeadline}>{author.headline}</div>
              : <div className={`${styles.fakeLine} ${styles.lineMid}`} />
            }
          </div>
        </div>
        <div className={styles.fakeBody}>
          <div className={`${styles.fakePara} ${styles.paraFull}`} />
          <div className={`${styles.fakePara} ${styles.paraFull}`} />
          <div className={`${styles.fakePara} ${styles.paraNarrow}`} />
        </div>
        <div className={styles.fakeActions}>
          <div className={`${styles.fakeLine} ${styles.lineAction}`} />
          <div className={`${styles.fakeLine} ${styles.lineAction}`} />
          <div className={`${styles.fakeLine} ${styles.lineAction}`} />
        </div>
      </div>
      <div className={styles.overlay}>
        <span className={styles.lockIcon}><Icon name="lock" size={32} /></span>
        <p className={styles.lockMessage}>this post is built different. ur aura ain't there yet.</p>
        <p className={styles.lockSub}>grind ur LarpRating and maybe u'll see it fr.</p>
      </div>
    </div>
  )
}
