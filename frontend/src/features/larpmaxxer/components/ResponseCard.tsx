import { motion } from 'framer-motion'
import type { ResponseOption, FlavorBadge } from '../types'

type ResponseCardProps = {
  option: ResponseOption
  hotkey: string
  onSelect: () => void
  disabled: boolean
}

const FLAVOR_COLORS: Record<FlavorBadge, { bg: string; text: string }> = {
  prestige: { bg: '#eef3f8', text: '#0a66c2' },
  ambitious: { bg: '#f3eeff', text: '#6b39c1' },
  unhinged: { bg: '#fdecea', text: '#cc1016' },
  calculated: { bg: '#fff7e6', text: '#b45309' },
  wildcard: { bg: '#fffbe6', text: '#92610a' },
  cringe_risk: { bg: '#fdecea', text: '#cc1016' },
  alpha: { bg: '#f3eeff', text: '#6b39c1' },
  authentic: { bg: '#e8f5ef', text: '#057642' },
  glazed: { bg: '#eef3f8', text: '#0a66c2' },
}

function formatPersonaTag(tag: string): string {
  return tag.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function formatFlavorBadge(badge: FlavorBadge): string {
  return badge.replace(/_/g, ' ').toUpperCase()
}

export function ResponseCard({ option, hotkey, onSelect, disabled }: ResponseCardProps) {
  const flavorStyle = FLAVOR_COLORS[option.flavorBadge]

  return (
    <motion.button
      onClick={disabled ? undefined : onSelect}
      whileHover={disabled ? {} : { scale: 1.01 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      transition={{ duration: 0.15 }}
      style={{
        width: '100%',
        textAlign: 'left',
        backgroundColor: '#ffffff',
        border: '1px solid #e0e0e0',
        borderRadius: '6px',
        padding: '6px 8px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
        transition: 'border-color 0.15s, background-color 0.15s',
      }}
      onMouseEnter={e => {
        if (!disabled) {
          (e.currentTarget as HTMLButtonElement).style.borderColor = '#0a66c2'
          ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f3f2ef'
        }
      }}
      onMouseLeave={e => {
        if (!disabled) {
          (e.currentTarget as HTMLButtonElement).style.borderColor = '#e0e0e0'
          ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = '#ffffff'
        }
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
          color: '#00000099',
        }}>
          {formatPersonaTag(option.personaTag)}
        </span>
        <span style={{
          fontSize: '11px',
          fontWeight: 700,
          fontFamily: 'monospace',
          backgroundColor: '#eef3f8',
          color: '#0a66c2',
          border: '1px solid #0a66c244',
          borderRadius: '4px',
          padding: '1px 6px',
          letterSpacing: '0.04em',
        }}>
          {hotkey}
        </span>
      </div>

      {/* Response text */}
      <p style={{
        fontSize: '12px',
        lineHeight: 1.4,
        color: '#000000e6',
        margin: 0,
        fontStyle: 'italic',
      }}>
        "{option.text}"
      </p>

      {/* Flavor badge */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.07em',
          backgroundColor: flavorStyle.bg,
          color: flavorStyle.text,
          borderRadius: '4px',
          padding: '2px 7px',
        }}>
          {formatFlavorBadge(option.flavorBadge)}
        </span>
      </div>
    </motion.button>
  )
}
