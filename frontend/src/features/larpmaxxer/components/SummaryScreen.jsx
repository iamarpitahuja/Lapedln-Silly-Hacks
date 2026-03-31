import styles from './SummaryScreen.module.css'

function StatBar({ label, value, isInteger, isInverseGood, max = 100 }) {
  const pct = isInteger
    ? Math.min(100, (value / Math.max(1, max)) * 100)
    : Math.min(100, Math.max(0, value))
  const displayVal = Math.round(value)
  let color = 'var(--neon)'
  if (!isInteger) {
    color = value >= 70 ? 'var(--accent-cyan)' : value >= 40 ? 'var(--neon)' : 'var(--accent-amber)'
  }
  if (isInverseGood) {
    color = value === 0 ? 'var(--accent-cyan)' : value <= 2 ? 'var(--accent-amber)' : 'var(--accent-danger)'
  }

  return (
    <div>
      <div className={styles.statRow}>
        <span className={styles.statLabel}>{label}</span>
        <span className={styles.statValue}>{isInteger ? displayVal : `${displayVal}%`}</span>
      </div>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

export function SummaryScreen({ summary, scenario, persona, session, onReplay, onNewScenario, onExit }) {
  const score = Math.round(summary.performanceScore)
  const scoreBg = score >= 70 ? 'var(--accent-relarp-soft)' : score >= 40 ? 'var(--neon-faint)' : 'var(--accent-danger-soft)'
  const scoreColor = score >= 70 ? 'var(--accent-cyan)' : score >= 40 ? 'var(--neon)' : 'var(--accent-danger)'
  const deltaColor = summary.larpRatingDelta >= 0 ? 'var(--accent-cyan)' : 'var(--accent-danger)'

  return (
    <div className={styles.wrap}>
      {/* Header */}
      <div className={styles.card}>
        <div className={styles.heroRow}>
          <div>
            <p className={styles.scenarioName}>{scenario.name}</p>
            <div className={styles.personaRow}>
              <span>Persona: {persona.name}</span>
            </div>
          </div>
          <span className={styles.scoreBadge} style={{ backgroundColor: scoreBg, color: scoreColor }}>
            {score}%
          </span>
        </div>

        <div
          className={styles.lrDelta}
          style={{ color: deltaColor }}
        >
          {summary.larpRatingDelta > 0 ? '+' : ''}{summary.larpRatingDelta.toFixed(1)} LR
        </div>
        <p className={styles.lrLabel}>LarpRating change</p>

        <p className={styles.verdict}>"{summary.verdict}"</p>

        <p className={styles.sectionTitle}>Performance Breakdown</p>
        <StatBar label="Persona Alignment" value={summary.personaAlignmentPct} />
        <StatBar label="Believability" value={summary.believability} />
        <StatBar label="Status Ascension" value={summary.statusAscension} />
        <StatBar label="Dialogue Efficiency" value={summary.dialogueEfficiency} />
        <StatBar label="Larp Continuity" value={summary.larpContinuityPct} />
        <StatBar label="Cringe Events" value={summary.cringeCount} isInteger isInverseGood max={session.maxTurns} />
        <StatBar label="Missed Glazes" value={summary.missedGlazeOps} isInteger isInverseGood max={session.maxTurns} />
      </div>

      {/* Notable Moments */}
      {summary.notableMoments.length > 0 && (
        <div className={styles.card}>
          <p className={styles.sectionTitle}>Notable Moments</p>
          <div className={styles.moments}>
            {summary.notableMoments.map((m, i) => (
              <div key={i} className={`${styles.moment} ${m.type === 'positive' ? styles.positive : styles.negative}`}>
                <span>{m.type === 'positive' ? 'PASS' : 'MISS'}</span>
                <span>{m.annotation}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className={styles.actions}>
        <button className={styles.btnPrimary} onClick={onReplay}>Replay Session</button>
        <button className={styles.btnSecondary} onClick={onNewScenario}>New Scenario</button>
        <button className={styles.btnGhost} onClick={onExit}>Exit</button>
      </div>
    </div>
  )
}

