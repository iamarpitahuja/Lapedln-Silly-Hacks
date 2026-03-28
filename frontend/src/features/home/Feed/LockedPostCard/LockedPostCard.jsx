import styles from './LockedPostCard.module.css'

export default function LockedPostCard() {
  return (
    <div className={styles.card}>
      <div className={styles.blurLayer}>
        <div className={styles.header}>
          <div className={styles.fakeAvatar} />
          <div className={styles.fakeLines}>
            <div className={`${styles.fakeLine} ${styles.lineWide}`} />
            <div className={`${styles.fakeLine} ${styles.lineMid}`} />
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
        <span className={styles.lockIcon}>🔒</span>
        <p className={styles.lockMessage}>This content is above your professional aura.</p>
        <p className={styles.lockSub}>Increase your LarpRating to unlock.</p>
      </div>
    </div>
  )
}
