type EntryCardProps = {
  larpRating: number
  personaName: string
  personaIcon: string
  lastScenarioName: string | null
  onEnter: () => void
  onEnterSimulation: (() => void) | null
  onWarmUp: () => void
}

export function EntryCard({
  larpRating,
  personaName,
  personaIcon,
  lastScenarioName,
  onEnter,
  onEnterSimulation,
  onWarmUp,
}: EntryCardProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      padding: '32px 24px',
      backgroundColor: 'var(--bg-base)',
    }}>
      <div
        className="entry-card-pulse"
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--glass-border)',
          borderRadius: '12px',
          padding: '32px 28px',
          textAlign: 'center',
          boxShadow: 'var(--shadow-lg)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Icon */}
        <div style={{ fontSize: '36px', marginBottom: '14px' }}>⚔️</div>

        {/* Headline */}
        <h1 style={{
          fontSize: '24px',
          fontWeight: 700,
          fontFamily: 'var(--font-display)',
          color: 'var(--text-primary)',
          margin: '0 0 6px',
          letterSpacing: '-0.01em',
        }}>
          LarpMaxxing
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: '14px',
          fontFamily: 'var(--font-body)',
          color: 'var(--text-secondary)',
          margin: '0 0 24px',
          lineHeight: 1.5,
        }}>
          Train for the conversations your future self deserves.
        </p>

        {/* Persona + LarpRating */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          marginBottom: '22px',
          padding: '12px 16px',
          backgroundColor: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          borderRadius: '8px',
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
            <span style={{ fontSize: '18px' }}>{personaIcon}</span>
            <span style={{
              fontSize: '13px',
              fontWeight: 600,
              fontFamily: 'var(--font-body)',
              color: 'var(--text-primary)',
            }}>
              {personaName}
            </span>
          </div>
          <div style={{
            backgroundColor: 'var(--accent-muted)',
            borderRadius: '4px',
            padding: '2px 10px',
            fontSize: '13px',
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            color: 'var(--accent)',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {larpRating.toFixed(1)}
          </div>
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Primary: Begin Training */}
          <button
            onClick={onEnter}
            className="li-btn-primary"
            style={{
              width: '100%',
              padding: '11px 16px',
              fontSize: '15px',
              fontWeight: 700,
              fontFamily: 'var(--font-body)',
              borderRadius: '24px',
              backgroundColor: 'var(--accent)',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.2s var(--ease-out), box-shadow 0.2s var(--ease-out)',
              boxShadow: 'var(--shadow-sm)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--accent-emphasis)'
              ;(e.currentTarget as HTMLButtonElement).style.boxShadow = 'var(--shadow-glow)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--accent)'
              ;(e.currentTarget as HTMLButtonElement).style.boxShadow = 'var(--shadow-sm)'
            }}
          >
            Begin Training
          </button>

          {/* Secondary: Enter Simulation (last played) */}
          {onEnterSimulation && (
            <button
              onClick={onEnterSimulation}
              className="li-btn-secondary"
              style={{
                width: '100%',
                padding: '10px 15px',
                fontSize: '14px',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                borderRadius: '24px',
                backgroundColor: 'var(--accent-subtle)',
                color: 'var(--accent)',
                border: '1px solid var(--accent-muted)',
                cursor: 'pointer',
                transition: 'background-color 0.2s var(--ease-out), border-color 0.2s var(--ease-out)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--accent-muted)'
                ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--accent-subtle)'
                ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(56,139,253,0.15)'
              }}
            >
              ▶ Enter Simulation{lastScenarioName ? `: ${lastScenarioName}` : ''}
            </button>
          )}

          {/* Tertiary: Warm Up Your Aura */}
          <button
            onClick={onWarmUp}
            style={{
              width: '100%',
              backgroundColor: 'transparent',
              border: '1px solid var(--border-default)',
              borderRadius: '24px',
              padding: '10px 15px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              fontFamily: 'var(--font-body)',
              color: 'var(--text-secondary)',
              transition: 'color 0.2s var(--ease-out), border-color 0.2s var(--ease-out)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.16)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.08)'
            }}
          >
            🔥 Warm Up Your Aura
          </button>
        </div>
      </div>
    </div>
  )
}
