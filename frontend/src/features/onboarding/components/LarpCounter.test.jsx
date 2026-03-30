import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import LarpCounter from './LarpCounter'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    p: ({ children, ...props }) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }) => children,
}))

describe('LarpCounter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders target value after animation completes', () => {
    let rafCallback = null
    vi.stubGlobal('requestAnimationFrame', cb => {
      rafCallback = cb
      return 1
    })
    vi.stubGlobal('cancelAnimationFrame', vi.fn())

    render(<LarpCounter target={42.5} duration={100} onComplete={vi.fn()} />)

    act(() => {
      rafCallback?.(performance.now() + 200)
    })

    expect(screen.getByText(/42\.50/)).toBeInTheDocument()
  })

  it('calls onComplete when counter finishes', () => {
    const onComplete = vi.fn()
    let rafCallback = null
    vi.stubGlobal('requestAnimationFrame', cb => {
      rafCallback = cb
      return 1
    })
    vi.stubGlobal('cancelAnimationFrame', vi.fn())

    render(<LarpCounter target={10} duration={100} onComplete={onComplete} />)

    act(() => {
      rafCallback?.(performance.now() + 200)
    })

    expect(onComplete).toHaveBeenCalledOnce()
  })
})
