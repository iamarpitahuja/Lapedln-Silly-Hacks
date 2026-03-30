import styles from './EntryCard.module.css'

export function EntryCard({
  larpRating,
  personaName,
  personaIcon,
  lastScenarioName,
  onEnter,
  onEnterSimulation,
  onWarmUp,
}) {
  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.icon}>⚔️</div>
        <h1 className={styles.title}>LarpMaxxing</h1>
        <p className={styles.subtitle}>Train for the conversations your future self deserves.</p>

        <div className={styles.statsRow}>
          <div className={styles.personaInfo}>
            <span className={styles.personaIcon}>{personaIcon}</span>
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
              ▶ Enter Simulation{lastScenarioName ? `: ${lastScenarioName}` : ''}
            </button>
          )}
          <button className={styles.btnGhost} onClick={onWarmUp}>
            🔥 Warm Up Your Aura
          </button>
        </div>
      </div>
    </div>
  )
}
