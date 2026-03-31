import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PERSONAS } from '../content/personas'
import { useUser } from '../context/UserContext'
import { fetchLarpmaxxerBootstrap } from '../services/api'
import styles from './PersonaSelect.module.css'

const CLUSTER_COLORS = {
  finance: { text: 'var(--neon)', bg: 'var(--neon-faint)' },
  tech: { text: 'var(--neon)', bg: 'var(--neon-faint)' },
  corporate: { text: 'var(--neon)', bg: 'var(--neon-faint)' },
  culture: { text: 'var(--accent-cyan)', bg: 'var(--accent-relarp-soft)' },
  wild: { text: 'var(--accent-danger)', bg: 'var(--accent-danger-soft)' },
}

function PersonaCard({ persona, onSelect }) {
  const { text, bg } = CLUSTER_COLORS[persona.cluster] ?? CLUSTER_COLORS.corporate

  return (
    <button className={styles.card} onClick={() => onSelect(persona.id)}>
      <div className={styles.cardMeta}>
        <span className={styles.cardName}>{persona.name}</span>
        <span className={styles.clusterBadge} style={{ color: text, backgroundColor: bg }}>
          {persona.cluster}
        </span>
      </div>
      <p className={styles.cardDesc}>{persona.description}</p>
      <p className={styles.cardSig}>{persona.behaviorSignature}</p>
    </button>
  )
}

export default function PersonaSelect() {
  const { personaId, setPersona } = useUser()
  const navigate = useNavigate()
  const [personas, setPersonas] = useState(PERSONAS)
  const logoSrc = '/logoDarkMode.png'

  useEffect(() => {
    if (personaId) navigate('/larpmaxxer', { replace: true })
  }, [personaId, navigate])

  useEffect(() => {
    let cancelled = false
    async function hydratePersonas() {
      try {
        const bootstrap = await fetchLarpmaxxerBootstrap()
        if (!cancelled && Array.isArray(bootstrap?.personas) && bootstrap.personas.length > 0) {
          setPersonas(bootstrap.personas)
        }
      } catch {
        // Keep bundled personas as fallback.
      }
    }
    hydratePersonas()
    return () => {
      cancelled = true
    }
  }, [])

  function handleSelect(id) {
    setPersona(id)
    navigate('/larpmaxxer', { replace: true })
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/" className={styles.logoWrap}>
          <img src={logoSrc} alt="LarpedIn logo" className={styles.logoImg} />
          <span className={styles.logo}>LarpedIn</span>
        </Link>
      </header>
      <main className={styles.main}>
        <div className={styles.heroCard}>
          <div className={styles.badge}>Arc Setup</div>
          <h1 className={styles.heading}>pick ur character. this is ur whole personality now.</h1>
          <p className={styles.subheading}>choose the larp u'll be running across the whole app.</p>
        </div>
        <div className={styles.grid}>
          {personas.map(persona => (
            <PersonaCard key={persona.id} persona={persona} onSelect={handleSelect} />
          ))}
        </div>
      </main>
    </div>
  )
}

