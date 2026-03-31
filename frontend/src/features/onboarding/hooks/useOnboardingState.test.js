import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useOnboardingState } from './useOnboardingState'

describe('useOnboardingState', () => {
  it('starts at step 0 with empty formData and direction "forward"', () => {
    const { result } = renderHook(() => useOnboardingState())
    expect(result.current.step).toBe(0)
    expect(result.current.formData).toEqual({})
    expect(result.current.direction).toBe('forward')
  })

  it('advance() moves to next step and merges data', () => {
    const { result } = renderHook(() => useOnboardingState())
    act(() => result.current.advance({ display_name: 'Ada' }))
    expect(result.current.step).toBe(1)
    expect(result.current.formData.display_name).toBe('Ada')
    expect(result.current.direction).toBe('forward')
  })

  it('back() moves to previous step and sets direction backward', () => {
    const { result } = renderHook(() => useOnboardingState())
    act(() => result.current.advance({ display_name: 'Ada' }))
    act(() => result.current.back())
    expect(result.current.step).toBe(0)
    expect(result.current.direction).toBe('backward')
  })

  it('back() does nothing when already on step 0', () => {
    const { result } = renderHook(() => useOnboardingState())
    act(() => result.current.back())
    expect(result.current.step).toBe(0)
  })

  it('skip() advances without merging data', () => {
    const { result } = renderHook(() => useOnboardingState())
    act(() => result.current.skip())
    expect(result.current.step).toBe(1)
    expect(result.current.formData).toEqual({})
    expect(result.current.direction).toBe('forward')
  })

  it('advance() accumulates data across multiple steps', () => {
    const { result } = renderHook(() => useOnboardingState())
    act(() => result.current.advance({ display_name: 'Ada' }))
    act(() => result.current.advance({ job: 'Chaos Pilot' }))
    expect(result.current.formData).toEqual({ display_name: 'Ada', job: 'Chaos Pilot' })
  })

  it('advance() does not exceed totalSteps - 1', () => {
    const { result } = renderHook(() => useOnboardingState(3))
    act(() => result.current.advance({}))
    act(() => result.current.advance({}))
    act(() => result.current.advance({})) // would go to 3 without guard
    expect(result.current.step).toBe(2) // capped at totalSteps - 1
  })
})
