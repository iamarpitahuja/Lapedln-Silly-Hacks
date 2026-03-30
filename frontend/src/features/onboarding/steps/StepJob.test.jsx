import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StepJob from './StepJob'
import * as api from '../../../services/api'

vi.mock('../../../services/api', () => ({
  fetchJobOptions: vi.fn(),
}))

vi.mock('../components/StepShell', () => ({
  default: ({ children, heading }) => <div><h1>{heading}</h1>{children}</div>,
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => children,
}))

describe('StepJob', () => {
  beforeEach(() => {
    api.fetchJobOptions.mockResolvedValue(['Chaos Pilot', 'Synergy Architect', 'Disruption Diva'])
    vi.clearAllMocks()
  })

  it('renders job options fetched from API', async () => {
    render(<StepJob onNext={vi.fn()} />)
    await waitFor(() => {
      expect(screen.getByText('Chaos Pilot')).toBeInTheDocument()
    })
  })

  it('renders job options when API returns object shape', async () => {
    api.fetchJobOptions.mockResolvedValue({ options: ['Chaos Pilot', 'Synergy Architect'] })
    render(<StepJob onNext={vi.fn()} />)
    await waitFor(() => {
      expect(screen.getByText('Chaos Pilot')).toBeInTheDocument()
    })
  })

  it('next button is disabled until a job is selected', async () => {
    render(<StepJob onNext={vi.fn()} />)
    await waitFor(() => screen.getByText('Chaos Pilot'))
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled()
  })

  it('calls onNext with selected job', async () => {
    const user = userEvent.setup()
    const onNext = vi.fn()
    render(<StepJob onNext={onNext} />)
    await waitFor(() => screen.getByText('Chaos Pilot'))
    await user.click(screen.getByText('Chaos Pilot'))
    await user.click(screen.getByRole('button', { name: /next/i }))
    expect(onNext).toHaveBeenCalledWith({ job: 'Chaos Pilot' })
  })

  it('shows retry button on API failure', async () => {
    api.fetchJobOptions.mockRejectedValue(new Error('Network error'))
    render(<StepJob onNext={vi.fn()} />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })
  })
})
