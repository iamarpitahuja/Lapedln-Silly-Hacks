# Onboarding Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fullscreen 7-step animated onboarding wizard at `/onboarding` that collects new user profile data with cinematic slide transitions, buzzword particle effects, and a LARP rating reveal finale.

**Architecture:** Single `OnboardingPage` component at `/onboarding` route manages step state via `useOnboardingState` hook, accumulates form data across steps, fires `PATCH /api/me` + `PATCH /api/jobs/current` in parallel at completion, then shows a LARP rating counter splash. App.jsx redirects users with default display name to `/onboarding`.

**Tech Stack:** React 19, Framer Motion (already installed), Vitest + @testing-library/react, Supabase JS client (for Storage avatar upload), existing `api.js` helpers (`updateProfilePatch`, `updateJob`, `fetchProfile`, `fetchJobOptions`), `canvas-confetti` (new dep)

---

## Prerequisites

Before starting: ensure a **public** Supabase Storage bucket named `avatars` exists. Create it in the Supabase dashboard (Storage → New bucket → name: `avatars`, Public: on) or via migration. If skipped, avatar upload in StepAvatar will fail gracefully and the user can skip that step.

---

## File Map

**New files (create):**
```
frontend/src/features/onboarding/
├── OnboardingPage.jsx
├── OnboardingPage.module.css
├── OnboardingPage.test.jsx
├── hooks/
│   ├── useOnboardingState.js
│   └── useOnboardingState.test.js
├── components/
│   ├── BuzzwordParticles.jsx
│   ├── StepShell.jsx
│   ├── StepShell.module.css
│   ├── SynergizingLoader.jsx
│   ├── SynergizingLoader.module.css
│   └── LarpCounter.jsx
└── steps/
    ├── StepName.jsx
    ├── StepName.test.jsx
    ├── StepJob.jsx
    ├── StepJob.test.jsx
    ├── StepAvatar.jsx
    ├── StepAvatar.test.jsx
    ├── StepBio.jsx
    ├── StepBio.test.jsx
    ├── StepExperience.jsx
    ├── StepExperience.test.jsx
    ├── StepSkills.jsx
    ├── StepSkills.test.jsx
    ├── StepWelcome.jsx
    └── StepWelcome.test.jsx
```

**Modified files:**
- `frontend/src/App.jsx` — add `/onboarding` route + new-user redirect logic
- `frontend/src/lib/motion.js` — add `easeInOutQuint` export used for counter animation

---

## Task 1: `useOnboardingState` hook

**Files:**
- Create: `frontend/src/features/onboarding/hooks/useOnboardingState.js`
- Test: `frontend/src/features/onboarding/hooks/useOnboardingState.test.js`

- [ ] **Step 1: Write the failing tests**

```js
// frontend/src/features/onboarding/hooks/useOnboardingState.test.js
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
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd frontend && npx vitest run src/features/onboarding/hooks/useOnboardingState.test.js
```

Expected: FAIL — `Cannot find module './useOnboardingState'`

- [ ] **Step 3: Implement the hook**

```js
// frontend/src/features/onboarding/hooks/useOnboardingState.js
import { useState } from 'react'

export function useOnboardingState() {
  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState({})
  const [direction, setDirection] = useState('forward')

  function advance(partialData = {}) {
    setFormData(prev => ({ ...prev, ...partialData }))
    setDirection('forward')
    setStep(prev => prev + 1)
  }

  function back() {
    setDirection('backward')
    setStep(prev => Math.max(0, prev - 1))
  }

  function skip() {
    setDirection('forward')
    setStep(prev => prev + 1)
  }

  return { step, formData, direction, advance, back, skip }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend && npx vitest run src/features/onboarding/hooks/useOnboardingState.test.js
```

Expected: PASS — 6 tests

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/onboarding/hooks/
git commit -m "feat: add useOnboardingState hook"
```

---

## Task 2: `BuzzwordParticles` component

**Files:**
- Create: `frontend/src/features/onboarding/components/BuzzwordParticles.jsx`

No test needed — purely decorative, no interactive behavior.

- [ ] **Step 1: Create the component**

```jsx
// frontend/src/features/onboarding/components/BuzzwordParticles.jsx
import { motion } from 'framer-motion'

const WORDS = ['synergy', 'leverage', 'disrupt', 'pivot', 'scale', 'ideate', 'KPIs', 'bandwidth', 'alignment', 'velocity']

function randomBetween(min, max) {
  return Math.random() * (max - min) + min
}

export default function BuzzwordParticles({ count = 7 }) {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    word: WORDS[i % WORDS.length],
    x: randomBetween(5, 90),       // % from left
    delay: randomBetween(0, 0.6),
    rotate: randomBetween(-15, 15),
    duration: randomBetween(1.8, 2.8),
  }))

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
      {particles.map(p => (
        <motion.span
          key={p.id}
          initial={{ opacity: 0, y: 0, rotate: 0 }}
          animate={{ opacity: [0, 0.35, 0], y: -180, rotate: p.rotate }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            bottom: '10%',
            left: `${p.x}%`,
            fontSize: '0.7rem',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--color-accent, #7db5ff)',
            whiteSpace: 'nowrap',
            userSelect: 'none',
          }}
        >
          {p.word}
        </motion.span>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/features/onboarding/components/BuzzwordParticles.jsx
git commit -m "feat: add BuzzwordParticles decorative component"
```

---

## Task 3: `StepShell` wrapper component

**Files:**
- Create: `frontend/src/features/onboarding/components/StepShell.jsx`
- Create: `frontend/src/features/onboarding/components/StepShell.module.css`

- [ ] **Step 1: Write the failing test**

```jsx
// (add to frontend/src/features/onboarding/components/StepShell.test.jsx)
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StepShell from './StepShell'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }) => children,
}))

describe('StepShell', () => {
  it('renders heading and children', () => {
    render(
      <StepShell heading="What should the algorithm call you?" stepNumber={1} totalSteps={6}>
        <input />
      </StepShell>
    )
    expect(screen.getByText('What should the algorithm call you?')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('shows skip button when skippable=true', () => {
    const onSkip = vi.fn()
    render(
      <StepShell heading="heading" stepNumber={3} totalSteps={6} skippable onSkip={onSkip}>
        <input />
      </StepShell>
    )
    expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument()
  })

  it('does not show skip button when skippable=false', () => {
    render(
      <StepShell heading="heading" stepNumber={1} totalSteps={6} skippable={false}>
        <input />
      </StepShell>
    )
    expect(screen.queryByRole('button', { name: /skip/i })).not.toBeInTheDocument()
  })

  it('calls onSkip when skip button is clicked', async () => {
    const user = userEvent.setup()
    const onSkip = vi.fn()
    render(
      <StepShell heading="heading" stepNumber={3} totalSteps={6} skippable onSkip={onSkip}>
        <input />
      </StepShell>
    )
    await user.click(screen.getByRole('button', { name: /skip/i }))
    expect(onSkip).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && npx vitest run src/features/onboarding/components/StepShell.test.jsx
```

Expected: FAIL — `Cannot find module './StepShell'`

- [ ] **Step 3: Implement StepShell**

```jsx
// frontend/src/features/onboarding/components/StepShell.jsx
import { motion } from 'framer-motion'
import { springBouncy } from '../../../lib/motion'
import BuzzwordParticles from './BuzzwordParticles'
import styles from './StepShell.module.css'

export default function StepShell({
  heading,
  stepNumber,
  totalSteps,
  skippable = false,
  onSkip,
  children,
}) {
  const words = heading.split(' ')

  return (
    <div className={styles.shell}>
      <BuzzwordParticles count={7} />

      <div className={styles.progress}>
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            className={`${styles.dot} ${i < stepNumber ? styles.dotDone : ''} ${i === stepNumber - 1 ? styles.dotActive : ''}`}
          />
        ))}
      </div>

      <h1 className={styles.heading} aria-label={heading}>
        {words.map((word, i) => (
          <motion.span
            key={i}
            className={styles.word}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springBouncy, delay: i * 0.04 }}
          >
            {word}{' '}
          </motion.span>
        ))}
      </h1>

      <motion.div
        className={styles.content}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springBouncy, delay: words.length * 0.04 + 0.05 }}
      >
        {children}
      </motion.div>

      {skippable && (
        <button className={styles.skipBtn} onClick={onSkip} type="button">
          Skip for now
        </button>
      )}
    </div>
  )
}
```

```css
/* frontend/src/features/onboarding/components/StepShell.module.css */
.shell {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  gap: 1.5rem;
  overflow: hidden;
}

.progress {
  position: absolute;
  top: 2rem;
  display: flex;
  gap: 0.5rem;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-surface-2, #2a2a3a);
  transition: background 0.3s;
}

.dotActive {
  background: var(--color-accent, #7db5ff);
  transform: scale(1.2);
}

.dotDone {
  background: var(--color-accent-muted, #4a7abf);
}

.heading {
  font-size: clamp(1.8rem, 4vw, 3rem);
  font-weight: 800;
  text-align: center;
  max-width: 700px;
  line-height: 1.15;
  position: relative;
  z-index: 1;
}

.word {
  display: inline-block;
}

.content {
  width: 100%;
  max-width: 560px;
  position: relative;
  z-index: 1;
}

.skipBtn {
  background: none;
  border: none;
  color: var(--color-text-muted, #888);
  font-size: 0.85rem;
  cursor: pointer;
  padding: 0.5rem 1rem;
  text-decoration: underline;
  text-underline-offset: 3px;
  position: absolute;
  bottom: 2rem;
  right: 2rem;
}

.skipBtn:hover {
  color: var(--color-text, #eee);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend && npx vitest run src/features/onboarding/components/StepShell.test.jsx
```

Expected: PASS — 4 tests

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/onboarding/components/
git commit -m "feat: add StepShell wrapper with buzzword particles"
```

---

## Task 4: `SynergizingLoader` component

**Files:**
- Create: `frontend/src/features/onboarding/components/SynergizingLoader.jsx`
- Create: `frontend/src/features/onboarding/components/SynergizingLoader.module.css`

- [ ] **Step 1: Write the failing test**

```jsx
// frontend/src/features/onboarding/components/SynergizingLoader.test.jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SynergizingLoader from './SynergizingLoader'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => children,
}))

describe('SynergizingLoader', () => {
  it('renders the loading message', () => {
    render(<SynergizingLoader message="Synergizing your professional essence..." />)
    expect(screen.getByText('Synergizing your professional essence...')).toBeInTheDocument()
  })

  it('renders the progress bar element', () => {
    const { container } = render(<SynergizingLoader message="Loading..." />)
    expect(container.querySelector('[role="progressbar"]')).toBeInTheDocument()
  })

  it('shows error state and retry button when error prop is set', async () => {
    const onRetry = vi.fn()
    const user = userEvent.setup()
    render(<SynergizingLoader message="Loading..." error="Save failed" onRetry={onRetry} />)
    expect(screen.getByText('Save failed')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(onRetry).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && npx vitest run src/features/onboarding/components/SynergizingLoader.test.jsx
```

Expected: FAIL — `Cannot find module './SynergizingLoader'`

- [ ] **Step 3: Implement SynergizingLoader**

```jsx
// frontend/src/features/onboarding/components/SynergizingLoader.jsx
import { motion } from 'framer-motion'
import { easeOutQuint } from '../../../lib/motion'
import styles from './SynergizingLoader.module.css'

export default function SynergizingLoader({ message, error, onRetry }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        {!error ? (
          <>
            <p className={styles.message}>{message}</p>
            <div role="progressbar" aria-label="Loading" className={styles.track}>
              <motion.div
                className={styles.bar}
                initial={{ width: '0%' }}
                animate={{ width: ['0%', '85%', '85%', '100%'] }}
                transition={{
                  duration: 1.8,
                  times: [0, 0.6, 0.9, 1],
                  ease: easeOutQuint,
                }}
              />
            </div>
          </>
        ) : (
          <>
            <p className={styles.error}>{error}</p>
            <button className={styles.retryBtn} onClick={onRetry} type="button">
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  )
}
```

```css
/* frontend/src/features/onboarding/components/SynergizingLoader.module.css */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(4px);
}

.card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem;
  max-width: 400px;
  width: 100%;
}

.message {
  font-size: 1.1rem;
  font-weight: 600;
  text-align: center;
  color: var(--color-text, #eee);
}

.track {
  width: 100%;
  height: 6px;
  background: var(--color-surface-2, #2a2a3a);
  border-radius: 3px;
  overflow: hidden;
}

.bar {
  height: 100%;
  background: var(--color-accent, #7db5ff);
  border-radius: 3px;
}

.error {
  color: var(--color-error, #f28b82);
  text-align: center;
  font-size: 1rem;
}

.retryBtn {
  padding: 0.6rem 1.5rem;
  background: var(--color-accent, #7db5ff);
  color: #000;
  border: none;
  border-radius: 6px;
  font-weight: 700;
  cursor: pointer;
  font-size: 0.95rem;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend && npx vitest run src/features/onboarding/components/SynergizingLoader.test.jsx
```

Expected: PASS — 3 tests

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/onboarding/components/SynergizingLoader.jsx frontend/src/features/onboarding/components/SynergizingLoader.module.css frontend/src/features/onboarding/components/SynergizingLoader.test.jsx
git commit -m "feat: add SynergizingLoader fake progress bar"
```

---

## Task 5: `LarpCounter` component

**Files:**
- Create: `frontend/src/features/onboarding/components/LarpCounter.jsx`
- Modify: `frontend/src/lib/motion.js` — add `easeInOutQuint`

- [ ] **Step 1: Add easeInOutQuint to motion tokens**

Open `frontend/src/lib/motion.js` and add one line at the end:

```js
// frontend/src/lib/motion.js  (add to existing file)
export const easeInOutQuint = [0.83, 0, 0.17, 1]
```

- [ ] **Step 2: Write the failing test**

```jsx
// frontend/src/features/onboarding/components/LarpCounter.test.jsx
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
    vi.stubGlobal('requestAnimationFrame', (cb) => { rafCallback = cb; return 1 })
    vi.stubGlobal('cancelAnimationFrame', vi.fn())

    render(<LarpCounter target={42.5} duration={100} onComplete={vi.fn()} />)

    // Fire the rAF loop enough to finish the animation
    act(() => {
      rafCallback?.(performance.now() + 200)
    })

    expect(screen.getByText(/42\.50/)).toBeInTheDocument()
  })

  it('calls onComplete when counter finishes', () => {
    const onComplete = vi.fn()
    let rafCallback = null
    vi.stubGlobal('requestAnimationFrame', (cb) => { rafCallback = cb; return 1 })
    vi.stubGlobal('cancelAnimationFrame', vi.fn())

    render(<LarpCounter target={10} duration={100} onComplete={onComplete} />)

    act(() => {
      rafCallback?.(performance.now() + 200)
    })

    expect(onComplete).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

```bash
cd frontend && npx vitest run src/features/onboarding/components/LarpCounter.test.jsx
```

Expected: FAIL — `Cannot find module './LarpCounter'`

- [ ] **Step 4: Implement LarpCounter**

```jsx
// frontend/src/features/onboarding/components/LarpCounter.jsx
import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { easeInOutQuint } from '../../../lib/motion'
import { springBouncy } from '../../../lib/motion'

function cubicBezierEase(t) {
  // Approximation of easeInOutQuint via simple cubic
  return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2
}

export default function LarpCounter({ target = 0, duration = 2500, onComplete }) {
  const [displayed, setDisplayed] = useState(0)
  const startTimeRef = useRef(null)
  const rafRef = useRef(null)
  const completedRef = useRef(false)

  useEffect(() => {
    completedRef.current = false
    startTimeRef.current = null

    function tick(now) {
      if (!startTimeRef.current) startTimeRef.current = now
      const elapsed = now - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      const eased = cubicBezierEase(progress)
      setDisplayed(eased * target)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        setDisplayed(target)
        if (!completedRef.current) {
          completedRef.current = true
          onComplete?.()
        }
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration, onComplete])

  return (
    <motion.p
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={springBouncy}
      style={{ fontSize: 'clamp(3rem, 10vw, 6rem)', fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}
    >
      {displayed.toFixed(2)}
    </motion.p>
  )
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd frontend && npx vitest run src/features/onboarding/components/LarpCounter.test.jsx
```

Expected: PASS — 2 tests

- [ ] **Step 6: Commit**

```bash
git add frontend/src/lib/motion.js frontend/src/features/onboarding/components/LarpCounter.jsx frontend/src/features/onboarding/components/LarpCounter.test.jsx
git commit -m "feat: add LarpCounter animated number component"
```

---

## Task 6: `StepName`

**Files:**
- Create: `frontend/src/features/onboarding/steps/StepName.jsx`
- Create: `frontend/src/features/onboarding/steps/StepName.test.jsx`

- [ ] **Step 1: Write the failing test**

```jsx
// frontend/src/features/onboarding/steps/StepName.test.jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StepName from './StepName'

vi.mock('../components/StepShell', () => ({
  default: ({ children, heading, skippable }) => (
    <div>
      <h1>{heading}</h1>
      {children}
      {skippable && <button>Skip for now</button>}
    </div>
  ),
}))

describe('StepName', () => {
  it('renders the name input', () => {
    render(<StepName onNext={vi.fn()} />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('submit button is disabled when name is empty', () => {
    render(<StepName onNext={vi.fn()} />)
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled()
  })

  it('calls onNext with display_name when submitted', async () => {
    const user = userEvent.setup()
    const onNext = vi.fn()
    render(<StepName onNext={onNext} />)
    await user.type(screen.getByRole('textbox'), 'Ada Lovelace')
    await user.click(screen.getByRole('button', { name: /next/i }))
    expect(onNext).toHaveBeenCalledWith({ display_name: 'Ada Lovelace' })
  })

  it('does not render a skip button', () => {
    render(<StepName onNext={vi.fn()} />)
    expect(screen.queryByRole('button', { name: /skip/i })).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && npx vitest run src/features/onboarding/steps/StepName.test.jsx
```

Expected: FAIL — `Cannot find module './StepName'`

- [ ] **Step 3: Implement StepName**

```jsx
// frontend/src/features/onboarding/steps/StepName.jsx
import { useState } from 'react'
import StepShell from '../components/StepShell'
import styles from './steps.module.css'

export default function StepName({ onNext }) {
  const [name, setName] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    onNext({ display_name: name.trim() })
  }

  return (
    <StepShell heading="What should the algorithm call you?" stepNumber={1} totalSteps={6} skippable={false}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          className={styles.input}
          type="text"
          placeholder="Your name, thought leader"
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
        />
        <button
          type="submit"
          className={styles.nextBtn}
          disabled={!name.trim()}
        >
          Next →
        </button>
      </form>
    </StepShell>
  )
}
```

> Note: `steps.module.css` is a shared stylesheet for all step forms. Create it now:

```css
/* frontend/src/features/onboarding/steps/steps.module.css */
.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.input {
  width: 100%;
  padding: 0.85rem 1rem;
  border-radius: 8px;
  border: 2px solid var(--color-surface-2, #2a2a3a);
  background: var(--color-surface, #1a1a2e);
  color: var(--color-text, #eee);
  font-size: 1.1rem;
  outline: none;
  transition: border-color 0.2s;
}

.input:focus {
  border-color: var(--color-accent, #7db5ff);
}

.textarea {
  composes: input;
  resize: vertical;
  min-height: 120px;
  font-family: inherit;
}

.nextBtn {
  align-self: flex-end;
  padding: 0.75rem 2rem;
  background: var(--color-accent, #7db5ff);
  color: #000;
  border: none;
  border-radius: 8px;
  font-weight: 800;
  font-size: 1rem;
  cursor: pointer;
  transition: opacity 0.15s;
}

.nextBtn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.nextBtn:not(:disabled):hover {
  opacity: 0.85;
}

.addBtn {
  background: none;
  border: 2px dashed var(--color-surface-2, #2a2a3a);
  color: var(--color-text-muted, #888);
  padding: 0.6rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  width: 100%;
  transition: border-color 0.2s, color 0.2s;
}

.addBtn:hover {
  border-color: var(--color-accent, #7db5ff);
  color: var(--color-accent, #7db5ff);
}

.removeBtn {
  background: none;
  border: none;
  color: var(--color-error, #f28b82);
  cursor: pointer;
  padding: 0.2rem 0.4rem;
  font-size: 0.85rem;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.75rem;
  background: var(--color-surface-2, #2a2a3a);
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
}

.tagList {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend && npx vitest run src/features/onboarding/steps/StepName.test.jsx
```

Expected: PASS — 4 tests

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/onboarding/steps/
git commit -m "feat: add StepName with form validation"
```

---

## Task 7: `StepJob`

**Files:**
- Create: `frontend/src/features/onboarding/steps/StepJob.jsx`
- Create: `frontend/src/features/onboarding/steps/StepJob.test.jsx`

- [ ] **Step 1: Write the failing test**

```jsx
// frontend/src/features/onboarding/steps/StepJob.test.jsx
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && npx vitest run src/features/onboarding/steps/StepJob.test.jsx
```

Expected: FAIL — `Cannot find module './StepJob'`

- [ ] **Step 3: Implement StepJob**

```jsx
// frontend/src/features/onboarding/steps/StepJob.jsx
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { springBouncy } from '../../../lib/motion'
import { fetchJobOptions } from '../../../services/api'
import StepShell from '../components/StepShell'
import styles from './steps.module.css'
import jobStyles from './StepJob.module.css'

export default function StepJob({ onNext }) {
  const [jobs, setJobs] = useState([])
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const options = await fetchJobOptions()
      setJobs(options)
    } catch {
      setError('Failed to load job titles.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function handleSubmit(e) {
    e.preventDefault()
    if (!selected) return
    onNext({ job: selected })
  }

  return (
    <StepShell heading="Choose your corporate identity." stepNumber={2} totalSteps={6} skippable={false}>
      {loading && <p className={jobStyles.loading}>Generating your destiny...</p>}
      {error && (
        <div className={jobStyles.errorBox}>
          <p>{error}</p>
          <button className={styles.nextBtn} onClick={load} type="button">Retry</button>
        </div>
      )}
      {!loading && !error && (
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={jobStyles.grid}>
            {jobs.map((job, i) => (
              <motion.button
                key={job}
                type="button"
                className={`${jobStyles.card} ${selected === job ? jobStyles.cardSelected : ''}`}
                onClick={() => setSelected(job)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springBouncy, delay: i * 0.03 }}
                whileTap={{ scale: selected === job ? 1 : 1.04 }}
              >
                {job}
              </motion.button>
            ))}
          </div>
          <button type="submit" className={styles.nextBtn} disabled={!selected}>
            Next →
          </button>
        </form>
      )}
    </StepShell>
  )
}
```

```css
/* frontend/src/features/onboarding/steps/StepJob.module.css */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.card {
  padding: 0.85rem 1rem;
  border-radius: 10px;
  border: 2px solid var(--color-surface-2, #2a2a3a);
  background: var(--color-surface, #1a1a2e);
  color: var(--color-text, #eee);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  text-align: center;
  transition: border-color 0.15s, background 0.15s;
}

.card:hover {
  border-color: var(--color-accent, #7db5ff);
}

.cardSelected {
  border-color: var(--color-accent, #7db5ff);
  background: color-mix(in srgb, var(--color-accent, #7db5ff) 15%, transparent);
  color: var(--color-accent, #7db5ff);
}

.loading {
  text-align: center;
  color: var(--color-text-muted, #888);
  font-style: italic;
}

.errorBox {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: var(--color-error, #f28b82);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend && npx vitest run src/features/onboarding/steps/StepJob.test.jsx
```

Expected: PASS — 4 tests

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/onboarding/steps/StepJob.jsx frontend/src/features/onboarding/steps/StepJob.module.css frontend/src/features/onboarding/steps/StepJob.test.jsx
git commit -m "feat: add StepJob with animated job card grid"
```

---

## Task 8: `StepAvatar`

**Files:**
- Create: `frontend/src/features/onboarding/steps/StepAvatar.jsx`
- Create: `frontend/src/features/onboarding/steps/StepAvatar.test.jsx`

- [ ] **Step 1: Write the failing test**

```jsx
// frontend/src/features/onboarding/steps/StepAvatar.test.jsx
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && npx vitest run src/features/onboarding/steps/StepAvatar.test.jsx
```

Expected: FAIL — `Cannot find module './StepAvatar'`

- [ ] **Step 3: Implement StepAvatar**

```jsx
// frontend/src/features/onboarding/steps/StepAvatar.jsx
import { useRef, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import StepShell from '../components/StepShell'
import { getInitials } from '../../../utils/strings'
import styles from './steps.module.css'
import avatarStyles from './StepAvatar.module.css'

export default function StepAvatar({ onNext, onSkip, displayName = '' }) {
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const fileRef = useRef(null)

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file.')
      return
    }

    // Show local preview immediately
    const reader = new FileReader()
    reader.onload = ev => setPreview(ev.target.result)
    reader.readAsDataURL(file)

    // Upload to Supabase Storage
    setUploading(true)
    setUploadError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session?.user?.id ?? 'anon'
      const path = `${userId}/${Date.now()}-${file.name}`

      const { data, error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
      if (error) throw error

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(data.path)
      setPreview(publicUrl)
    } catch (err) {
      setUploadError(`Upload failed: ${err.message}. You can skip and set your avatar later.`)
    } finally {
      setUploading(false)
    }
  }

  function handleNext() {
    onNext(preview ? { avatar_url: preview } : {})
  }

  return (
    <StepShell heading="Upload your professional headshot." stepNumber={3} totalSteps={6} skippable onSkip={onSkip}>
      <div className={avatarStyles.avatarArea}>
        {preview ? (
          <img src={preview} alt="Avatar preview" className={avatarStyles.preview} />
        ) : (
          <div className={avatarStyles.placeholder}>
            {getInitials(displayName) || '?'}
          </div>
        )}
        <label className={avatarStyles.uploadLabel} aria-label="Upload profile photo">
          {uploading ? 'Uploading...' : 'Choose photo'}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className={avatarStyles.hiddenInput}
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
        {uploadError && <p className={avatarStyles.error}>{uploadError}</p>}
      </div>
      <div className={styles.form}>
        <button
          type="button"
          className={styles.nextBtn}
          onClick={handleNext}
          disabled={uploading}
        >
          Next →
        </button>
      </div>
    </StepShell>
  )
}
```

```css
/* frontend/src/features/onboarding/steps/StepAvatar.module.css */
.avatarArea {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.preview {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--color-accent, #7db5ff);
}

.placeholder {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: var(--color-surface-2, #2a2a3a);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--color-text-muted, #888);
  border: 3px dashed var(--color-surface-2, #2a2a3a);
}

.uploadLabel {
  padding: 0.6rem 1.5rem;
  border: 2px solid var(--color-accent, #7db5ff);
  border-radius: 8px;
  color: var(--color-accent, #7db5ff);
  font-weight: 700;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.15s;
}

.uploadLabel:hover {
  background: color-mix(in srgb, var(--color-accent, #7db5ff) 10%, transparent);
}

.hiddenInput {
  display: none;
}

.error {
  color: var(--color-error, #f28b82);
  font-size: 0.85rem;
  text-align: center;
  max-width: 300px;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend && npx vitest run src/features/onboarding/steps/StepAvatar.test.jsx
```

Expected: PASS — 2 tests

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/onboarding/steps/StepAvatar.jsx frontend/src/features/onboarding/steps/StepAvatar.module.css frontend/src/features/onboarding/steps/StepAvatar.test.jsx
git commit -m "feat: add StepAvatar with Supabase Storage upload"
```

---

## Task 9: `StepBio`

**Files:**
- Create: `frontend/src/features/onboarding/steps/StepBio.jsx`
- Create: `frontend/src/features/onboarding/steps/StepBio.test.jsx`

- [ ] **Step 1: Write the failing test**

```jsx
// frontend/src/features/onboarding/steps/StepBio.test.jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StepBio from './StepBio'

vi.mock('../components/StepShell', () => ({
  default: ({ children, heading, skippable, onSkip }) => (
    <div>
      <h1>{heading}</h1>
      {children}
      {skippable && <button onClick={onSkip}>Skip for now</button>}
    </div>
  ),
}))

describe('StepBio', () => {
  it('renders a textarea', () => {
    render(<StepBio onNext={vi.fn()} onSkip={vi.fn()} />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('calls onNext with bio content', async () => {
    const user = userEvent.setup()
    const onNext = vi.fn()
    render(<StepBio onNext={onNext} onSkip={vi.fn()} />)
    await user.type(screen.getByRole('textbox'), 'Building at the intersection of ambiguity.')
    await user.click(screen.getByRole('button', { name: /next/i }))
    expect(onNext).toHaveBeenCalledWith({ bio: 'Building at the intersection of ambiguity.' })
  })

  it('calls onSkip when skip is clicked', async () => {
    const user = userEvent.setup()
    const onSkip = vi.fn()
    render(<StepBio onNext={vi.fn()} onSkip={onSkip} />)
    await user.click(screen.getByRole('button', { name: /skip/i }))
    expect(onSkip).toHaveBeenCalledOnce()
  })

  it('allows submitting with empty bio', async () => {
    const user = userEvent.setup()
    const onNext = vi.fn()
    render(<StepBio onNext={onNext} onSkip={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: /next/i }))
    expect(onNext).toHaveBeenCalledWith({ bio: '' })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && npx vitest run src/features/onboarding/steps/StepBio.test.jsx
```

Expected: FAIL — `Cannot find module './StepBio'`

- [ ] **Step 3: Implement StepBio**

```jsx
// frontend/src/features/onboarding/steps/StepBio.jsx
import { useState } from 'react'
import StepShell from '../components/StepShell'
import styles from './steps.module.css'

export default function StepBio({ onNext, onSkip }) {
  const [bio, setBio] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    onNext({ bio })
  }

  return (
    <StepShell heading="Describe your personal brand in buzzwords." stepNumber={4} totalSteps={6} skippable onSkip={onSkip}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <textarea
          className={styles.textarea}
          placeholder="e.g. Serial disruptor. Building at the intersection of ambiguity and momentum."
          value={bio}
          onChange={e => setBio(e.target.value)}
          rows={5}
        />
        <button type="submit" className={styles.nextBtn}>
          Next →
        </button>
      </form>
    </StepShell>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend && npx vitest run src/features/onboarding/steps/StepBio.test.jsx
```

Expected: PASS — 4 tests

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/onboarding/steps/StepBio.jsx frontend/src/features/onboarding/steps/StepBio.test.jsx
git commit -m "feat: add StepBio textarea"
```

---

## Task 10: `StepExperience`

**Files:**
- Create: `frontend/src/features/onboarding/steps/StepExperience.jsx`
- Create: `frontend/src/features/onboarding/steps/StepExperience.test.jsx`

Experience entry shape: `{ company: string, title: string, start: string, end: string }`

- [ ] **Step 1: Write the failing test**

```jsx
// frontend/src/features/onboarding/steps/StepExperience.test.jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StepExperience from './StepExperience'

vi.mock('framer-motion', () => ({
  motion: { div: ({ children, ...p }) => <div {...p}>{children}</div> },
  AnimatePresence: ({ children }) => children,
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

describe('StepExperience', () => {
  it('renders Add Experience button', () => {
    render(<StepExperience onNext={vi.fn()} onSkip={vi.fn()} />)
    expect(screen.getByRole('button', { name: /add experience/i })).toBeInTheDocument()
  })

  it('shows entry form when Add Experience is clicked', async () => {
    const user = userEvent.setup()
    render(<StepExperience onNext={vi.fn()} onSkip={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: /add experience/i }))
    expect(screen.getByPlaceholderText(/company/i)).toBeInTheDocument()
  })

  it('calls onNext with experience array when submitted', async () => {
    const user = userEvent.setup()
    const onNext = vi.fn()
    render(<StepExperience onNext={onNext} onSkip={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: /add experience/i }))
    await user.type(screen.getByPlaceholderText(/company/i), 'Synergy Corp')
    await user.type(screen.getByPlaceholderText(/title/i), 'Chief Disruption Officer')
    await user.type(screen.getByPlaceholderText(/start/i), '2022')
    await user.click(screen.getByRole('button', { name: /save entry/i }))
    await user.click(screen.getByRole('button', { name: /next/i }))
    expect(onNext).toHaveBeenCalledWith({
      experience: [{ company: 'Synergy Corp', title: 'Chief Disruption Officer', start: '2022', end: '' }],
    })
  })

  it('calls onSkip when skip is clicked', async () => {
    const user = userEvent.setup()
    const onSkip = vi.fn()
    render(<StepExperience onNext={vi.fn()} onSkip={onSkip} />)
    await user.click(screen.getByRole('button', { name: /skip/i }))
    expect(onSkip).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && npx vitest run src/features/onboarding/steps/StepExperience.test.jsx
```

Expected: FAIL — `Cannot find module './StepExperience'`

- [ ] **Step 3: Implement StepExperience**

```jsx
// frontend/src/features/onboarding/steps/StepExperience.jsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { springBouncy } from '../../../lib/motion'
import StepShell from '../components/StepShell'
import styles from './steps.module.css'
import expStyles from './StepExperience.module.css'

const EMPTY_ENTRY = { company: '', title: '', start: '', end: '' }

export default function StepExperience({ onNext, onSkip }) {
  const [entries, setEntries] = useState([])
  const [draft, setDraft] = useState(null)

  function startAdding() {
    setDraft({ ...EMPTY_ENTRY })
  }

  function saveDraft() {
    if (!draft.company.trim()) return
    setEntries(prev => [...prev, draft])
    setDraft(null)
  }

  function removeEntry(i) {
    setEntries(prev => prev.filter((_, idx) => idx !== i))
  }

  function handleSubmit(e) {
    e.preventDefault()
    onNext({ experience: entries })
  }

  return (
    <StepShell heading="Document your corporate journey." stepNumber={5} totalSteps={6} skippable onSkip={onSkip}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <AnimatePresence>
          {entries.map((entry, i) => (
            <motion.div
              key={i}
              className={expStyles.entryCard}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={springBouncy}
            >
              <div className={expStyles.entryInfo}>
                <strong>{entry.title}</strong>
                <span>{entry.company}</span>
                <span className={expStyles.dates}>{entry.start}{entry.end ? ` – ${entry.end}` : ' – Present'}</span>
              </div>
              <button type="button" className={styles.removeBtn} onClick={() => removeEntry(i)} aria-label="Remove entry">
                ✕
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {draft !== null ? (
          <div className={expStyles.draftForm}>
            <input className={styles.input} placeholder="Company" value={draft.company} onChange={e => setDraft(d => ({ ...d, company: e.target.value }))} />
            <input className={styles.input} placeholder="Title / Role" value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} />
            <div className={expStyles.dateRow}>
              <input className={styles.input} placeholder="Start (e.g. 2022)" value={draft.start} onChange={e => setDraft(d => ({ ...d, start: e.target.value }))} />
              <input className={styles.input} placeholder="End (blank = Present)" value={draft.end} onChange={e => setDraft(d => ({ ...d, end: e.target.value }))} />
            </div>
            <button type="button" className={styles.nextBtn} onClick={saveDraft}>Save Entry</button>
          </div>
        ) : (
          <button type="button" className={styles.addBtn} onClick={startAdding}>+ Add Experience</button>
        )}

        <button type="submit" className={styles.nextBtn}>
          Next →
        </button>
      </form>
    </StepShell>
  )
}
```

```css
/* frontend/src/features/onboarding/steps/StepExperience.module.css */
.entryCard {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px solid var(--color-surface-2, #2a2a3a);
  background: var(--color-surface, #1a1a2e);
  margin-bottom: 0.5rem;
}

.entryInfo {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  font-size: 0.9rem;
}

.dates {
  font-size: 0.8rem;
  color: var(--color-text-muted, #888);
}

.draftForm {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  border: 1px dashed var(--color-accent, #7db5ff);
  border-radius: 8px;
  margin-bottom: 1rem;
}

.dateRow {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend && npx vitest run src/features/onboarding/steps/StepExperience.test.jsx
```

Expected: PASS — 4 tests

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/onboarding/steps/StepExperience.jsx frontend/src/features/onboarding/steps/StepExperience.module.css frontend/src/features/onboarding/steps/StepExperience.test.jsx
git commit -m "feat: add StepExperience with add/remove entries"
```

---

## Task 11: `StepSkills`

**Files:**
- Create: `frontend/src/features/onboarding/steps/StepSkills.jsx`
- Create: `frontend/src/features/onboarding/steps/StepSkills.test.jsx`

Skills shape: `string[]`

- [ ] **Step 1: Write the failing test**

```jsx
// frontend/src/features/onboarding/steps/StepSkills.test.jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StepSkills from './StepSkills'

vi.mock('framer-motion', () => ({
  motion: { span: ({ children, ...p }) => <span {...p}>{children}</span> },
  AnimatePresence: ({ children }) => children,
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

describe('StepSkills', () => {
  it('renders skill input field', () => {
    render(<StepSkills onNext={vi.fn()} onSkip={vi.fn()} />)
    expect(screen.getByPlaceholderText(/add a skill/i)).toBeInTheDocument()
  })

  it('adds a skill tag when Enter is pressed', async () => {
    const user = userEvent.setup()
    render(<StepSkills onNext={vi.fn()} onSkip={vi.fn()} />)
    await user.type(screen.getByPlaceholderText(/add a skill/i), 'Synergy{Enter}')
    expect(screen.getByText('Synergy')).toBeInTheDocument()
  })

  it('removes a skill tag when remove button is clicked', async () => {
    const user = userEvent.setup()
    render(<StepSkills onNext={vi.fn()} onSkip={vi.fn()} />)
    await user.type(screen.getByPlaceholderText(/add a skill/i), 'Synergy{Enter}')
    await user.click(screen.getByRole('button', { name: /remove synergy/i }))
    expect(screen.queryByText('Synergy')).not.toBeInTheDocument()
  })

  it('calls onNext with skills array when submitted', async () => {
    const user = userEvent.setup()
    const onNext = vi.fn()
    render(<StepSkills onNext={onNext} onSkip={vi.fn()} />)
    await user.type(screen.getByPlaceholderText(/add a skill/i), 'Pivot{Enter}')
    await user.type(screen.getByPlaceholderText(/add a skill/i), 'Scale{Enter}')
    await user.click(screen.getByRole('button', { name: /complete profile/i }))
    expect(onNext).toHaveBeenCalledWith({ skills: ['Pivot', 'Scale'] })
  })

  it('does not add duplicate skills', async () => {
    const user = userEvent.setup()
    render(<StepSkills onNext={vi.fn()} onSkip={vi.fn()} />)
    await user.type(screen.getByPlaceholderText(/add a skill/i), 'Synergy{Enter}')
    await user.type(screen.getByPlaceholderText(/add a skill/i), 'Synergy{Enter}')
    expect(screen.getAllByText('Synergy')).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && npx vitest run src/features/onboarding/steps/StepSkills.test.jsx
```

Expected: FAIL — `Cannot find module './StepSkills'`

- [ ] **Step 3: Implement StepSkills**

```jsx
// frontend/src/features/onboarding/steps/StepSkills.jsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { springSnap } from '../../../lib/motion'
import StepShell from '../components/StepShell'
import styles from './steps.module.css'

export default function StepSkills({ onNext, onSkip }) {
  const [skills, setSkills] = useState([])
  const [input, setInput] = useState('')

  function addSkill() {
    const trimmed = input.trim()
    if (!trimmed || skills.includes(trimmed)) { setInput(''); return }
    setSkills(prev => [...prev, trimmed])
    setInput('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); addSkill() }
  }

  function removeSkill(skill) {
    setSkills(prev => prev.filter(s => s !== skill))
  }

  function handleSubmit(e) {
    e.preventDefault()
    onNext({ skills })
  }

  return (
    <StepShell heading="Tag your superpowers." stepNumber={6} totalSteps={6} skippable onSkip={onSkip}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.tagList}>
          <AnimatePresence>
            {skills.map(skill => (
              <motion.span
                key={skill}
                className={styles.tag}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={springSnap}
              >
                {skill}
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => removeSkill(skill)}
                  aria-label={`Remove ${skill}`}
                  style={{ fontSize: '0.7rem', padding: '0 0.2rem' }}
                >
                  ✕
                </button>
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
        <input
          className={styles.input}
          placeholder="Add a skill and press Enter"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button type="submit" className={styles.nextBtn}>
          Complete Profile →
        </button>
      </form>
    </StepShell>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend && npx vitest run src/features/onboarding/steps/StepSkills.test.jsx
```

Expected: PASS — 5 tests

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/onboarding/steps/StepSkills.jsx frontend/src/features/onboarding/steps/StepSkills.test.jsx
git commit -m "feat: add StepSkills with tag input and spring animations"
```

---

## Task 12: `StepWelcome`

**Files:**
- Create: `frontend/src/features/onboarding/steps/StepWelcome.jsx`
- Create: `frontend/src/features/onboarding/steps/StepWelcome.test.jsx`

- [ ] **Step 1: Install canvas-confetti**

```bash
cd frontend && npm install canvas-confetti
```

- [ ] **Step 2: Write the failing test**

```jsx
// frontend/src/features/onboarding/steps/StepWelcome.test.jsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StepWelcome from './StepWelcome'

vi.mock('canvas-confetti', () => ({ default: vi.fn() }))
vi.mock('../components/LarpCounter', () => ({
  default: ({ target, onComplete }) => {
    onComplete?.()
    return <p>{target.toFixed(2)}</p>
  },
}))
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...p }) => <div {...p}>{children}</div>,
    img: ({ ...p }) => <img {...p} />,
    p: ({ children, ...p }) => <p {...p}>{children}</p>,
    button: ({ children, ...p }) => <button {...p}>{children}</button>,
  },
  AnimatePresence: ({ children }) => children,
}))

describe('StepWelcome', () => {
  it('renders YOUR LARP RATING heading', () => {
    render(<StepWelcome larpRating={42.5} onEnter={vi.fn()} />)
    expect(screen.getByText(/your larp rating/i)).toBeInTheDocument()
  })

  it('displays the larp rating value', () => {
    render(<StepWelcome larpRating={42.5} onEnter={vi.fn()} />)
    expect(screen.getByText('42.50')).toBeInTheDocument()
  })

  it('shows Enter the Platform button after counter completes', () => {
    render(<StepWelcome larpRating={42.5} onEnter={vi.fn()} />)
    expect(screen.getByRole('button', { name: /enter the platform/i })).toBeInTheDocument()
  })

  it('calls onEnter when button is clicked', async () => {
    const user = userEvent.setup()
    const onEnter = vi.fn()
    render(<StepWelcome larpRating={42.5} onEnter={onEnter} />)
    await user.click(screen.getByRole('button', { name: /enter the platform/i }))
    expect(onEnter).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

```bash
cd frontend && npx vitest run src/features/onboarding/steps/StepWelcome.test.jsx
```

Expected: FAIL — `Cannot find module './StepWelcome'`

- [ ] **Step 4: Implement StepWelcome**

```jsx
// frontend/src/features/onboarding/steps/StepWelcome.jsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { springBouncy } from '../../../lib/motion'
import LarpCounter from '../components/LarpCounter'
import styles from './StepWelcome.module.css'

export default function StepWelcome({ larpRating = 0, onEnter }) {
  const [showCta, setShowCta] = useState(false)

  function handleCounterComplete() {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#7db5ff', '#a78bfa', '#f1c75b', '#f289a8'],
    })
    setShowCta(true)
  }

  return (
    <div className={styles.page}>
      <motion.img
        src="/logo.png"
        alt="LarpedIn"
        className={styles.logo}
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={springBouncy}
      />

      <motion.p
        className={styles.label}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        YOUR LARP RATING
      </motion.p>

      <LarpCounter target={larpRating} duration={2500} onComplete={handleCounterComplete} />

      <AnimatePresence>
        {showCta && (
          <motion.button
            className={styles.enterBtn}
            onClick={onEnter}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springBouncy}
          >
            Enter the Platform →
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
```

```css
/* frontend/src/features/onboarding/steps/StepWelcome.module.css */
.page {
  min-height: 100vh;
  background: var(--color-bg, #0f0f1a);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding: 2rem;
}

.logo {
  width: 80px;
  height: 80px;
  object-fit: contain;
}

.label {
  font-size: 0.85rem;
  font-weight: 800;
  letter-spacing: 0.25em;
  color: var(--color-text-muted, #888);
  text-transform: uppercase;
}

.enterBtn {
  margin-top: 1.5rem;
  padding: 0.9rem 2.5rem;
  background: var(--color-accent, #7db5ff);
  color: #000;
  border: none;
  border-radius: 10px;
  font-weight: 900;
  font-size: 1.1rem;
  cursor: pointer;
  transition: opacity 0.15s;
}

.enterBtn:hover {
  opacity: 0.85;
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd frontend && npx vitest run src/features/onboarding/steps/StepWelcome.test.jsx
```

Expected: PASS — 4 tests

- [ ] **Step 6: Commit**

```bash
git add frontend/src/features/onboarding/steps/StepWelcome.jsx frontend/src/features/onboarding/steps/StepWelcome.module.css frontend/src/features/onboarding/steps/StepWelcome.test.jsx frontend/package.json frontend/package-lock.json
git commit -m "feat: add StepWelcome with LARP rating reveal and confetti"
```

---

## Task 13: `OnboardingPage` root

**Files:**
- Create: `frontend/src/features/onboarding/OnboardingPage.jsx`
- Create: `frontend/src/features/onboarding/OnboardingPage.module.css`
- Create: `frontend/src/features/onboarding/OnboardingPage.test.jsx`

- [ ] **Step 1: Write the failing test**

```jsx
// frontend/src/features/onboarding/OnboardingPage.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import OnboardingPage from './OnboardingPage'
import * as api from '../../services/api'

vi.mock('../../services/api', () => ({
  updateProfilePatch: vi.fn().mockResolvedValue({}),
  updateJob: vi.fn().mockResolvedValue({}),
  fetchProfile: vi.fn().mockResolvedValue({ larp_rating: 5.0, display_name: 'Ada' }),
  fetchJobOptions: vi.fn().mockResolvedValue(['Chaos Pilot']),
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...p }) => <div {...p}>{children}</div>,
    span: ({ children, ...p }) => <span {...p}>{children}</span>,
    p: ({ children, ...p }) => <p {...p}>{children}</p>,
    img: ({ ...p }) => <img {...p} />,
    button: ({ children, ...p }) => <button {...p}>{children}</button>,
  },
  AnimatePresence: ({ children }) => children,
  MotionConfig: ({ children }) => children,
}))

vi.mock('./components/BuzzwordParticles', () => ({ default: () => null }))
vi.mock('./components/SynergizingLoader', () => ({ default: () => <div>Synergizing...</div> }))
vi.mock('./components/LarpCounter', () => ({
  default: ({ target, onComplete }) => { onComplete?.(); return <p>{target.toFixed(2)}</p> },
}))
vi.mock('canvas-confetti', () => ({ default: vi.fn() }))

function renderPage(onComplete = vi.fn()) {
  return render(
    <MemoryRouter>
      <OnboardingPage onComplete={onComplete} />
    </MemoryRouter>
  )
}

describe('OnboardingPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders StepName first', () => {
    renderPage()
    expect(screen.getByText(/what should the algorithm call you/i)).toBeInTheDocument()
  })

  it('advances to StepJob after entering a name', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByRole('textbox'), 'Ada')
    await user.click(screen.getByRole('button', { name: /next/i }))
    await waitFor(() => {
      expect(screen.getByText(/choose your corporate identity/i)).toBeInTheDocument()
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && npx vitest run src/features/onboarding/OnboardingPage.test.jsx
```

Expected: FAIL — `Cannot find module './OnboardingPage'`

- [ ] **Step 3: Implement OnboardingPage**

```jsx
// frontend/src/features/onboarding/OnboardingPage.jsx
import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { easeOutQuint } from '../../lib/motion'
import { updateProfilePatch, updateJob, fetchProfile } from '../../services/api'
import { useOnboardingState } from './hooks/useOnboardingState'
import SynergizingLoader from './components/SynergizingLoader'
import StepName from './steps/StepName'
import StepJob from './steps/StepJob'
import StepAvatar from './steps/StepAvatar'
import StepBio from './steps/StepBio'
import StepExperience from './steps/StepExperience'
import StepSkills from './steps/StepSkills'
import StepWelcome from './steps/StepWelcome'
import styles from './OnboardingPage.module.css'

const SLIDE_VARIANTS = {
  enter: direction => ({
    x: direction === 'forward' ? '100%' : '-100%',
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: direction => ({
    x: direction === 'forward' ? '-100%' : '100%',
    opacity: 0,
  }),
}

export default function OnboardingPage({ onComplete }) {
  const navigate = useNavigate()
  const { step, formData, direction, advance, back, skip } = useOnboardingState()
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [larpRating, setLarpRating] = useState(0)

  async function saveAndAdvance(partialData) {
    const merged = { ...formData, ...partialData }
    setSaving(true)
    setSaveError(null)
    try {
      const { job, ...profileFields } = merged
      await Promise.all([
        updateProfilePatch(profileFields),
        job ? updateJob(job) : Promise.resolve(),
      ])
      const profile = await fetchProfile()
      setLarpRating(profile.larp_rating ?? 0)
      advance(partialData)
    } catch (err) {
      setSaveError(err.message || 'Save failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleEnter = useCallback(() => {
    onComplete?.()
    navigate('/')
  }, [onComplete, navigate])

  const steps = [
    <StepName key="name" onNext={data => advance(data)} />,
    <StepJob key="job" onNext={data => advance(data)} />,
    <StepAvatar key="avatar" onNext={data => advance(data)} onSkip={skip} displayName={formData.display_name} />,
    <StepBio key="bio" onNext={data => advance(data)} onSkip={skip} />,
    <StepExperience key="experience" onNext={data => advance(data)} onSkip={skip} />,
    <StepSkills key="skills" onNext={data => saveAndAdvance(data)} onSkip={() => saveAndAdvance({})} />,
    <StepWelcome key="welcome" larpRating={larpRating} onEnter={handleEnter} />,
  ]

  return (
    <div className={styles.page}>
      {saving && (
        <SynergizingLoader
          message="Synergizing your professional essence..."
          error={saveError}
          onRetry={() => setSaveError(null)}
        />
      )}
      <div className={styles.stepArea}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={SLIDE_VARIANTS}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.45, ease: easeOutQuint }}
            className={styles.stepFrame}
          >
            {steps[step]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
```

```css
/* frontend/src/features/onboarding/OnboardingPage.module.css */
.page {
  position: fixed;
  inset: 0;
  background: var(--color-bg, #0f0f1a);
  overflow: hidden;
  z-index: 50;
}

.stepArea {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.stepFrame {
  position: absolute;
  inset: 0;
  overflow-y: auto;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend && npx vitest run src/features/onboarding/OnboardingPage.test.jsx
```

Expected: PASS — 2 tests

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/onboarding/OnboardingPage.jsx frontend/src/features/onboarding/OnboardingPage.module.css frontend/src/features/onboarding/OnboardingPage.test.jsx
git commit -m "feat: add OnboardingPage step machine with slide transitions"
```

---

## Task 14: App.jsx wiring — route + new-user redirect

**Files:**
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Write the failing test**

```jsx
// frontend/src/App.test.jsx  (new file)
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import App from './App'
import * as authCtx from './context/AuthContext'
import * as api from './services/api'

vi.mock('./services/api', () => ({
  fetchProfile: vi.fn(),
  fetchFeed: vi.fn().mockResolvedValue({ posts: [], trending_delusions: [], buzzwords: [] }),
  fetchJobOptions: vi.fn().mockResolvedValue([]),
  fetchConnections: vi.fn().mockResolvedValue([]),
  fetchConnectionSuggestions: vi.fn().mockResolvedValue([]),
}))

vi.mock('./context/AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: vi.fn(),
}))

vi.mock('framer-motion', () => ({
  motion: { div: ({ children, ...p }) => <div {...p}>{children}</div> },
  AnimatePresence: ({ children }) => children,
  MotionConfig: ({ children }) => children,
}))

describe('App new-user redirect', () => {
  it('renders OnboardingPage when user has default display_name', async () => {
    authCtx.useAuth.mockReturnValue({
      session: { access_token: 'tok', user: { id: 'u1' } },
      loading: false,
    })
    api.fetchProfile.mockResolvedValue({ display_name: 'Anonymous Larper', larp_rating: 0 })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText(/what should the algorithm call you/i)).toBeInTheDocument()
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && npx vitest run src/App.test.jsx
```

Expected: FAIL — redirect logic not yet implemented

- [ ] **Step 3: Update App.jsx**

Read `frontend/src/App.jsx` first, then apply this diff. Replace `AppRoutes` function with:

```jsx
// Replace the entire AppRoutes function in frontend/src/App.jsx
function AppRoutes() {
  const { session, loading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [isNewUser, setIsNewUser] = useState(null) // null = unchecked

  useEffect(() => {
    if (!session) { setIsNewUser(false); return }
    fetchProfile()
      .then(profile => {
        setIsNewUser(profile.display_name === 'Anonymous Larper')
      })
      .catch(() => setIsNewUser(false))
  }, [session])

  if (loading || isNewUser === null) {
    return <div className={styles.loading}>Synergizing your session...</div>
  }

  if (!session) {
    return <AuthPage />
  }

  if (isNewUser && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  if (location.pathname === '/onboarding') {
    return <OnboardingPage onComplete={() => setIsNewUser(false)} />
  }

  return (
    <MockDataProvider>
      <TopNav />
      <main className={styles.main}>
        <AnimatePresence mode="wait">
          <Motion.div
            key={location.pathname}
            className={styles.pageWrap}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: easeOutQuint }}
          >
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/network" element={<Network />} />
              <Route path="/jobs" element={<JobsPage />} />
              <Route path="/messaging" element={<Messaging />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/me" element={<Me />} />
              <Route path="/profile/:userId" element={<PublicProfile />} />
            </Routes>
          </Motion.div>
        </AnimatePresence>
      </main>
    </MockDataProvider>
  )
}
```

Also add these imports to `App.jsx`:

```jsx
import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { fetchProfile } from './services/api'
import OnboardingPage from './features/onboarding/OnboardingPage'
```

> Note: `useNavigate` import is not needed since we use `<Navigate>` component instead. Remove it from the import if added by mistake.

- [ ] **Step 4: Run test to verify it passes**

```bash
cd frontend && npx vitest run src/App.test.jsx
```

Expected: PASS — 1 test

- [ ] **Step 5: Run the full test suite**

```bash
cd frontend && npx vitest run
```

Expected: All tests pass. Fix any regressions before committing.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/App.jsx frontend/src/App.test.jsx
git commit -m "feat: wire onboarding route and new-user redirect in App"
```

---

## Task 15: Manual smoke test

- [ ] **Step 1: Start services**

```bash
# Terminal 1 — backend
cd backend && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000

# Terminal 2 — frontend
cd frontend && npm run dev
```

- [ ] **Step 2: Create a new test user via Supabase dashboard or signup form**

Open `http://localhost:5173`. Sign up with a new email. After email confirmation, sign in.

Expected: App redirects to `/onboarding` and shows Step 1 (Name input).

- [ ] **Step 3: Walk through all steps**

1. Enter a name → click Next
2. Pick a job title → click Next
3. Upload a photo (or skip)
4. Enter a bio (or skip)
5. Add an experience entry (or skip)
6. Add some skills → click "Complete Profile →"
7. Watch the LARP rating counter reveal + confetti
8. Click "Enter the Platform →"

Expected: Redirect to `/` (home feed). Profile should have your name, job, and any other data entered.

- [ ] **Step 4: Verify subsequent logins skip onboarding**

Sign out, sign back in. Expected: Goes straight to home feed (no onboarding).

- [ ] **Step 5: Final commit if any tweaks were needed**

```bash
git add -p
git commit -m "fix: onboarding smoke test tweaks"
```
