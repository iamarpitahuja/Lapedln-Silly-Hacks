import { useEffect } from 'react'
import type { ResponseOption } from '../types'
import { ResponseCard } from './ResponseCard'

type ResponseOptionsProps = {
  options: ResponseOption[]
  onSelect: (option: ResponseOption) => void
  disabled: boolean
}

const HOTKEYS = ['A', 'B', 'C', 'D', 'E']

export function ResponseOptions({ options, onSelect, disabled }: ResponseOptionsProps) {
  useEffect(() => {
    if (disabled) return

    function handleKeyDown(e: KeyboardEvent) {
      // Don't fire if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      const key = e.key.toUpperCase()
      const idx = HOTKEYS.indexOf(key)
      if (idx >= 0 && idx < options.length) {
        e.preventDefault()
        onSelect(options[idx])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [options, onSelect, disabled])

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '5px',
      padding: '12px 0 0',
    }}>
      {options.map((option, idx) => (
        <ResponseCard
          key={option.id}
          option={option}
          hotkey={HOTKEYS[idx] ?? String(idx + 1)}
          onSelect={() => onSelect(option)}
          disabled={disabled}
        />
      ))}
    </div>
  )
}
