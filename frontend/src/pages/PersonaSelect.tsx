import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PERSONAS } from '../content/personas'
import { useUser } from '../context/UserContext'
import type { PersonaCluster } from '../features/larpmaxxer/types'

const CLUSTER_COLORS: Record<PersonaCluster, string> = {
  finance: '#0a66c2',
  tech: '#0a66c2',
  corporate: '#0a66c2',
  culture: '#057642',
  wild: '#cc1016',
}

const CLUSTER_BG: Record<PersonaCluster, string> = {
  finance: '#eef3f8',
  tech: '#eef3f8',
  corporate: '#eef3f8',
  culture: '#e8f5ef',
  wild: '#fdecea',
}

export default function PersonaSelect() {
  const { personaId, setPersona } = useUser()
  const navigate = useNavigate()

  useEffect(() => {
    if (personaId) {
      navigate('/me', { replace: true })
    }
  }, [personaId, navigate])

  function handleSelect(id: string) {
    setPersona(id as Parameters<typeof setPersona>[0])
    navigate('/me', { replace: true })
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f3f2ef',
    }}>
      {/* LinkedIn-style nav */}
      <header style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e0e0e0',
        height: '52px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
      }}>
        <span style={{
          fontWeight: 900,
          fontSize: '22px',
          color: '#0a66c2',
          letterSpacing: '-0.03em',
          fontFamily: 'Georgia, serif',
        }}>
          LarpedIn
        </span>
      </header>

      <main style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '32px 16px 80px',
      }}>
        {/* Header card */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '32px 32px 28px',
          marginBottom: '20px',
          textAlign: 'center',
        }}>
          <div style={{
            display: 'inline-block',
            backgroundColor: '#eef3f8',
            borderRadius: '999px',
            padding: '4px 14px',
            fontSize: '12px',
            fontWeight: 700,
            color: '#0a66c2',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: '16px',
          }}>
            Profile Setup
          </div>
          <h1 style={{
            fontSize: '26px',
            fontWeight: 700,
            color: '#000000e6',
            margin: '0 0 10px',
            lineHeight: 1.2,
          }}>
            Choose your professional identity.
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#00000099',
            margin: 0,
            lineHeight: 1.6,
          }}>
            Select the persona you'll be performing across all simulations.
          </p>
        </div>

        {/* Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '12px',
        }}>
          {PERSONAS.map((persona) => (
            <PersonaCard key={persona.id} persona={persona} onSelect={handleSelect} />
          ))}
        </div>
      </main>
    </div>
  )
}

type PersonaCardProps = {
  persona: (typeof PERSONAS)[number]
  onSelect: (id: string) => void
}

function PersonaCard({ persona, onSelect }: PersonaCardProps) {
  const [hovered, setHovered] = React.useState(false)

  const clusterColor = CLUSTER_COLORS[persona.cluster]
  const clusterBg = CLUSTER_BG[persona.cluster]

  return (
    <button
      onClick={() => onSelect(persona.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: '#ffffff',
        border: `1.5px solid ${hovered ? '#0a66c2' : '#e0e0e0'}`,
        borderRadius: '8px',
        padding: '20px 18px',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        boxShadow: hovered ? '0 0 0 2px #0a66c240' : 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      {/* Icon */}
      <div style={{ fontSize: '32px', lineHeight: 1 }}>{persona.icon}</div>

      {/* Name + cluster badge */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '8px',
      }}>
        <span style={{
          fontSize: '15px',
          fontWeight: 700,
          color: '#000000e6',
          lineHeight: 1.3,
        }}>
          {persona.name}
        </span>
        <span style={{
          flexShrink: 0,
          backgroundColor: clusterBg,
          borderRadius: '999px',
          padding: '2px 10px',
          fontSize: '11px',
          fontWeight: 600,
          color: clusterColor,
          textTransform: 'capitalize',
          whiteSpace: 'nowrap',
        }}>
          {persona.cluster}
        </span>
      </div>

      {/* Description */}
      <p style={{
        fontSize: '13px',
        color: '#00000099',
        margin: 0,
        lineHeight: 1.5,
      }}>
        {persona.description}
      </p>

      {/* Behavior signature */}
      <p style={{
        fontSize: '12px',
        color: '#00000099',
        margin: 0,
        fontStyle: 'italic',
        lineHeight: 1.5,
        borderTop: '1px solid #e0e0e0',
        paddingTop: '10px',
      }}>
        {persona.behaviorSignature}
      </p>
    </button>
  )
}
