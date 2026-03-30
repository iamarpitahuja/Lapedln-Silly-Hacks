import styles from './EntryCard.module.css'

export function EntryCard({
  larpRating,
  personaName,
  lastScenarioName,
  onEnter,
  onEnterSimulation,
  onWarmUp,
}) {
  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <p className={styles.eyebrow}>Training Suite</p>
        <h1 className={styles.title}>LarpMaxxing</h1>
        <p className={styles.subtitle}>Train for the conversations your future self deserves.</p>

        <div className={styles.statsRow}>
          <div className={styles.personaInfo}>
            <span className={styles.personaName}>{personaName}</span>
          </div>
          <span className={styles.lrBadge}>{larpRating.toFixed(1)} LR</span>
        </div>

        <div className={styles.actions}>
          <button className={styles.btnPrimary} onClick={onEnter}>
            Begin Training
          </button>
          {onEnterSimulation && (
            <button className={styles.btnSecondary} onClick={onEnterSimulation}>
              Resume Simulation{lastScenarioName ? `: ${lastScenarioName}` : ''}
            </button>
          )}
          <button className={styles.btnGhost} onClick={onWarmUp}>
            Quick Warm-up
          </button>
        </div>
      </div>
    </div>
  )
}
