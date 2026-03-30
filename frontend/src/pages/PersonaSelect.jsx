import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PERSONAS } from '../content/personas'
import { useUser } from '../context/UserContext'
import styles from './PersonaSelect.module.css'

const CLUSTER_COLORS = {
  finance: { text: '#0a66c2', bg: '#eef3f8' },
  tech: { text: '#0a66c2', bg: '#eef3f8' },
  corporate: { text: '#0a66c2', bg: '#eef3f8' },
  culture: { text: '#057642', bg: '#e8f5ef' },
  wild: { text: '#cc1016', bg: '#fdecea' },
}

function PersonaCard({ persona, onSelect }) {
  const { text, bg } = CLUSTER_COLORS[persona.cluster] ?? CLUSTER_COLORS.corporate

  return (
    <button className={styles.card} onClick={() => onSelect(persona.id)}>
      <div className={styles.cardIcon}>{persona.icon}</div>
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

  useEffect(() => {
    if (personaId) navigate('/larpmaxxer', { replace: true })
  }, [personaId, navigate])

  function handleSelect(id) {
    setPersona(id)
    navigate('/larpmaxxer', { replace: true })
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.logo}>LarpedIn</span>
      </header>
      <main className={styles.main}>
        <div className={styles.heroCard}>
          <div className={styles.badge}>Profile Setup</div>
          <h1 className={styles.heading}>Choose your professional identity.</h1>
          <p className={styles.subheading}>Select the persona you'll be performing across all simulations.</p>
        </div>
        <div className={styles.grid}>
          {PERSONAS.map(persona => (
            <PersonaCard key={persona.id} persona={persona} onSelect={handleSelect} />
          ))}
        </div>
      </main>
    </div>
  )
}
