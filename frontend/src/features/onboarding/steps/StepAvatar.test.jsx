import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StepAvatar from './StepAvatar'

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } }) },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: { path: 'user-1/img.jpg' }, error: null }),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://cdn.test/img.jpg' } })),
      })),
    },
  },
}))

vi.mock('../components/StepShell', () => ({
  default: ({ children, heading, skippable, onSkip }) => (
    <div>
      <h1>{heading}</h1>
      {children}
      {skippable && <button onClick={onSkip}>Skip for now</button>}
    </div>
  ),
}))

describe('StepAvatar', () => {
  it('renders file input and next button', () => {
    render(<StepAvatar onNext={vi.fn()} onSkip={vi.fn()} />)
    expect(screen.getByLabelText(/upload/i)).toBeInTheDocument()
  })

  it('calls onSkip when skip is clicked', async () => {
    const user = userEvent.setup()
    const onSkip = vi.fn()
    render(<StepAvatar onNext={vi.fn()} onSkip={onSkip} />)
    await user.click(screen.getByRole('button', { name: /skip/i }))
    expect(onSkip).toHaveBeenCalledOnce()
  })
})
