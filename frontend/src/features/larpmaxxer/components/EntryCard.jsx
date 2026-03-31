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
        <p className={styles.eyebrow}>Larp Dojo</p>
        <h1 className={styles.title}>LarpMaxxing</h1>
        <p className={styles.subtitle}>train for the convos ur delusional future self needs.</p>

        <div className={styles.statsRow}>
          <div className={styles.personaInfo}>
            <span className={styles.personaName}>{personaName}</span>
          </div>
          <span className={styles.lrBadge}>{larpRating.toFixed(1)} LR</span>
        </div>

        <div className={styles.actions}>
          <button className={styles.btnPrimary} onClick={onEnter}>
            Enter the Dojo
          </button>
          {onEnterSimulation && (
            <button className={styles.btnSecondary} onClick={onEnterSimulation}>
              Resume Simulation{lastScenarioName ? `: ${lastScenarioName}` : ''}
            </button>
          )}
          <button className={styles.btnGhost} onClick={onWarmUp}>
            Quick Cook
          </button>
        </div>
      </div>
    </div>
  )
}
