import styles from './SummaryScreen.module.css'

function StatBar({ label, value, isInteger, isInverseGood, max = 100 }) {
  const pct = isInteger
    ? Math.min(100, (value / Math.max(1, max)) * 100)
    : Math.min(100, Math.max(0, value))
  const displayVal = Math.round(value)
  let color = '#0a66c2'
  if (!isInteger) {
    color = value >= 70 ? '#057642' : value >= 40 ? '#0a66c2' : '#b45309'
  }
  if (isInverseGood) {
    color = value === 0 ? '#057642' : value <= 2 ? '#b45309' : '#cc1016'
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
  const scoreBg = score >= 70 ? '#e8f5ef' : score >= 40 ? '#eef3f8' : '#fdecea'
  const scoreColor = score >= 70 ? '#057642' : score >= 40 ? '#0a66c2' : '#cc1016'
  const deltaColor = summary.larpRatingDelta >= 0 ? '#057642' : '#cc1016'

  return (
    <div className={styles.wrap}>
      {/* Header */}
      <div className={styles.card}>
        <div className={styles.heroRow}>
          <div>
            <p className={styles.scenarioName}>{scenario.name}</p>
            <div className={styles.personaRow}>
              <span>{persona.icon}</span>
              <span>{persona.name}</span>
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
                <span>{m.type === 'positive' ? '✓' : '✗'}</span>
                <span>{m.annotation}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className={styles.actions}>
        <button className={styles.btnPrimary} onClick={onReplay}>↺ Replay</button>
        <button className={styles.btnSecondary} onClick={onNewScenario}>New Scenario</button>
        <button className={styles.btnGhost} onClick={onExit}>Exit</button>
      </div>
    </div>
  )
}
