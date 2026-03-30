import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CharacterPanel } from './CharacterPanel'

const mockCharacter = {
  id: 'test',
  name: 'Test Character',
  age: 35,
  role: 'Director',
  company: 'MegaCorp',
  subtext: '',
  avatar: 'TC',
  personalityTraits: ['analytical', 'skeptical'],
  personaAffinities: {},
  catchphrases: [],
}

const mockMeters = { impressed: 50, suspicion: 30, status: 60 }

describe('CharacterPanel', () => {
  it('renders character name and role', () => {
    render(
      <CharacterPanel
        character={mockCharacter}
        meters={mockMeters}
        moodState="neutral"
        meterDeltas={null}
      />
    )
    expect(screen.getByText('Test Character')).toBeTruthy()
    expect(screen.getByText('Director | MegaCorp')).toBeTruthy()
  })
})
