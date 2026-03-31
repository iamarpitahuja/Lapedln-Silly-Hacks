# LarpMaxxer Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the LarpMaxxer simulation feature from `larpmaxxer-integration` into `back+Front`, keeping the logic engine verbatim and rebuilding all UI components in JSX + CSS modules to match back+Front's LinkedIn-clone aesthetic.

**Architecture:** Cherry-pick logic files (engine, hooks, content, types, UserContext) via `git checkout`, delete all existing UI components, rebuild them from scratch in `.jsx` + `.module.css`. Wire `UserProvider` into `App.jsx` around authenticated routes and add two full-screen routes (`/larpmaxxer`, `/persona-select`).

**Tech Stack:** React 19, Vite, Vitest + @testing-library/react, Framer Motion, CSS Modules, TypeScript (logic files only — UI rebuilt as JSX)

---

## File Map

**Ported verbatim (git checkout from larpmaxxer-integration):**
- `frontend/src/features/larpmaxxer/types.ts`
- `frontend/src/features/larpmaxxer/hooks/useSimulation.ts`
- `frontend/src/features/larpmaxxer/engine/personaAlignment.ts`
- `frontend/src/features/larpmaxxer/engine/scoring.ts`
- `frontend/src/features/larpmaxxer/engine/unlockLogic.ts`
- `frontend/src/context/UserContext.tsx`
- `frontend/src/content/characters.ts`
- `frontend/src/content/personas.ts`
- `frontend/src/content/scenarios.ts`
- `frontend/src/content/scenarios/*.ts` (14 scenario files)

**Modified:**
- `frontend/src/App.jsx` — add UserProvider, add /larpmaxxer + /persona-select routes
- `frontend/src/features/me/LarpStatus/LarpStatus.jsx` — add "Start Training" button
- `frontend/src/features/me/LarpStatus/LarpStatus.module.css` — add `.trainingBtn` style

**Created (new JSX + CSS modules):**
- `frontend/src/features/larpmaxxer/index.jsx` + `LarpMaxxer.module.css`
- `frontend/src/features/larpmaxxer/components/MeterBar.jsx` + `MeterBar.module.css`
- `frontend/src/features/larpmaxxer/components/CharacterPanel.jsx` + `CharacterPanel.module.css`
- `frontend/src/features/larpmaxxer/components/ScenarioCard.jsx` + `ScenarioCard.module.css`
- `frontend/src/features/larpmaxxer/components/ScenarioPanel.jsx` + `ScenarioPanel.module.css`
- `frontend/src/features/larpmaxxer/components/EntryCard.jsx` + `EntryCard.module.css`
- `frontend/src/features/larpmaxxer/components/PreBrief.jsx` + `PreBrief.module.css`
- `frontend/src/features/larpmaxxer/components/DialogueBubble.jsx` + `DialogueBubble.module.css`
- `frontend/src/features/larpmaxxer/components/ResponseCard.jsx` + `ResponseCard.module.css`
- `frontend/src/features/larpmaxxer/components/ResponseOptions.jsx` + `ResponseOptions.module.css`
- `frontend/src/features/larpmaxxer/components/DialogueScreen.jsx` + `DialogueScreen.module.css`
- `frontend/src/features/larpmaxxer/components/EvaluationFlash.jsx` + `EvaluationFlash.module.css`
- `frontend/src/features/larpmaxxer/components/EventCard.jsx` + `EventCard.module.css`
- `frontend/src/features/larpmaxxer/components/SummaryScreen.jsx` + `SummaryScreen.module.css`
- `frontend/src/pages/PersonaSelect.jsx` + `PersonaSelect.module.css`

**Deleted:**
- All `.tsx` files under `frontend/src/features/larpmaxxer/components/`
- `frontend/src/features/larpmaxxer/index.tsx`
- `frontend/src/pages/PersonaSelect.tsx`

---

## Task 1: Port logic files from larpmaxxer-integration

**Files:**
- Create: `frontend/src/features/larpmaxxer/types.ts`
- Create: `frontend/src/features/larpmaxxer/hooks/useSimulation.ts`
- Create: `frontend/src/features/larpmaxxer/engine/personaAlignment.ts`
- Create: `frontend/src/features/larpmaxxer/engine/scoring.ts`
- Create: `frontend/src/features/larpmaxxer/engine/unlockLogic.ts`
- Create: `frontend/src/context/UserContext.tsx`
- Create: `frontend/src/content/characters.ts`, `personas.ts`, `scenarios.ts`, `scenarios/*.ts`

- [ ] **Step 1: Verify you are on back+Front**

```bash
git branch
# should show: * back+Front
```

- [ ] **Step 2: Cherry-pick logic files from larpmaxxer-integration**

```bash
git checkout larpmaxxer-integration -- \
  frontend/src/features/larpmaxxer/types.ts \
  frontend/src/features/larpmaxxer/hooks/useSimulation.ts \
  frontend/src/features/larpmaxxer/engine/personaAlignment.ts \
  frontend/src/features/larpmaxxer/engine/scoring.ts \
  frontend/src/features/larpmaxxer/engine/unlockLogic.ts \
  frontend/src/context/UserContext.tsx \
  frontend/src/content/characters.ts \
  frontend/src/content/personas.ts \
  frontend/src/content/scenarios.ts \
  frontend/src/content/scenarios/
```

- [ ] **Step 3: Verify files landed**

```bash
ls frontend/src/features/larpmaxxer/
# expected: engine/  hooks/  types.ts
ls frontend/src/content/scenarios/ | wc -l
# expected: 14
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/features/larpmaxxer/types.ts \
        frontend/src/features/larpmaxxer/hooks/ \
        frontend/src/features/larpmaxxer/engine/ \
        frontend/src/context/UserContext.tsx \
        frontend/src/content/
git commit -m "feat: port larpmaxxer logic engine + content from larpmaxxer-integration"
```

---

## Task 2: Wire App.jsx — UserProvider + routes

**Files:**
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Write the test**

Create `frontend/src/App.larpmaxxer.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthContext } from './context/AuthContext'

// Minimal session stub
const fakeSession = { user: { id: 'test-user' } }
const fakeAuth = { session: fakeSession, loading: false }

// Mock heavy features so the test stays fast
vi.mock('./features/home/Home', () => ({ default: () => <div>Home</div> }))
vi.mock('./features/larpmaxxer/index', () => ({ LarpMaxxer: () => <div>LarpMaxxer</div> }))
vi.mock('./pages/PersonaSelect', () => ({ default: () => <div>PersonaSelect</div> }))

import App from './App'

describe('App routing', () => {
  it('renders /larpmaxxer without TopNav', () => {
    render(
      <AuthContext.Provider value={fakeAuth}>
        <MemoryRouter initialEntries={['/larpmaxxer']}>
          <App />
        </MemoryRouter>
      </AuthContext.Provider>
    )
    expect(screen.getByText('LarpMaxxer')).toBeTruthy()
    expect(screen.queryByRole('navigation')).toBeNull()
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd frontend && npx vitest run src/App.larpmaxxer.test.jsx
# Expected: FAIL — LarpMaxxer import not found
```

- [ ] **Step 3: Update App.jsx**

```jsx
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { MotionConfig, AnimatePresence, motion as Motion } from 'framer-motion'
import { AuthProvider, useAuth } from './context/AuthContext'
import { UserProvider } from './context/UserContext'
import { MockDataProvider } from './context/MockDataContext'
import TopNav from './components/TopNav/TopNav'
import Home from './features/home/Home'
import Me from './features/me/Me'
import Network from './features/network/Network'
import Messaging from './features/messaging/Messaging'
import JobsPage from './pages/JobsPage'
import NotificationsPage from './pages/NotificationsPage'
import AuthPage from './features/auth/AuthPage'
import { LarpMaxxer } from './features/larpmaxxer/index'
import PersonaSelect from './pages/PersonaSelect'
import { easeOutQuint } from './lib/motion'
import styles from './App.module.css'

function LarpMaxxerPage() {
  const navigate = useNavigate()
  return <LarpMaxxer onExitTraining={() => navigate('/me')} />
}

function AppRoutes() {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className={styles.loading}>Synergizing your session...</div>
  }

  if (!session) {
    return <AuthPage />
  }

  return (
    <UserProvider>
      <MockDataProvider>
        <Routes>
          {/* Full-screen routes — no TopNav */}
          <Route path="/larpmaxxer" element={<LarpMaxxerPage />} />
          <Route path="/persona-select" element={<PersonaSelect />} />

          {/* Standard layout routes */}
          <Route path="*" element={
            <>
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
                    </Routes>
                  </Motion.div>
                </AnimatePresence>
              </main>
            </>
          } />
        </Routes>
      </MockDataProvider>
    </UserProvider>
  )
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </MotionConfig>
  )
}
```

Note: `LarpMaxxer` and `PersonaSelect` don't exist as JSX files yet — the test will still fail until later tasks complete. That's expected.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/App.jsx frontend/src/App.larpmaxxer.test.jsx
git commit -m "feat: wire UserProvider and larpmaxxer routes into App"
```

---

## Task 3: Add "Start Training" entry point to LarpStatus

**Files:**
- Modify: `frontend/src/features/me/LarpStatus/LarpStatus.jsx`
- Modify: `frontend/src/features/me/LarpStatus/LarpStatus.module.css`

- [ ] **Step 1: Add `.trainingBtn` to LarpStatus.module.css**

Add after `.cancelBtn` block:

```css
.trainingBtn {
  background: transparent;
  border: 1px solid rgba(0, 0, 0, 0.15);
  color: rgba(0, 0, 0, 0.6);
  padding: 6px 16px;
  border-radius: 18px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}

.trainingBtn:hover {
  border-color: #0a66c2;
  color: #0a66c2;
}
```

- [ ] **Step 2: Add import and button to LarpStatus.jsx**

Add `useNavigate` import:
```jsx
import { useNavigate } from 'react-router-dom'
```

Add inside `LarpStatus` component, after `const [isEditing, setIsEditing] = useState(false)`:
```jsx
const navigate = useNavigate()
```

In the `.actions` div, add the training button after the existing two buttons:
```jsx
<button className={styles.trainingBtn} onClick={() => navigate('/persona-select')}>
  ⚔️ Start Training
</button>
```

- [ ] **Step 3: Run existing LarpStatus tests — expect PASS**

```bash
cd frontend && npx vitest run src/features/me/LarpStatus/LarpStatus.test.jsx
# Expected: PASS (existing tests unaffected)
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/features/me/LarpStatus/LarpStatus.jsx \
        frontend/src/features/me/LarpStatus/LarpStatus.module.css
git commit -m "feat: add Start Training entry point to LarpStatus"
```

---

## Task 4: PersonaSelect page

**Files:**
- Create: `frontend/src/pages/PersonaSelect.jsx`
- Create: `frontend/src/pages/PersonaSelect.module.css`

- [ ] **Step 1: Write the test**

Create `frontend/src/pages/PersonaSelect.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { UserProvider } from '../context/UserContext'
import PersonaSelect from './PersonaSelect'

const Wrapper = ({ children }) => (
  <UserProvider><MemoryRouter>{children}</MemoryRouter></UserProvider>
)

describe('PersonaSelect', () => {
  it('renders heading', () => {
    render(<PersonaSelect />, { wrapper: Wrapper })
    expect(screen.getByText('Choose your professional identity.')).toBeTruthy()
  })

  it('renders persona cards', () => {
    render(<PersonaSelect />, { wrapper: Wrapper })
    expect(screen.getByText('The Finance Bro')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd frontend && npx vitest run src/pages/PersonaSelect.test.jsx
# Expected: FAIL — PersonaSelect not found
```

- [ ] **Step 3: Create PersonaSelect.module.css**

```css
.page {
  min-height: 100vh;
  background: #f3f2ef;
}

.header {
  background: #ffffff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  height: 52px;
  display: flex;
  align-items: center;
  padding: 0 24px;
}

.logo {
  font-weight: 900;
  font-size: 22px;
  color: #0a66c2;
  letter-spacing: -0.03em;
  font-family: Georgia, serif;
}

.main {
  max-width: 900px;
  margin: 0 auto;
  padding: 32px 16px 80px;
}

.heroCard {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 12px;
  padding: 32px;
  margin-bottom: 20px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
}

.badge {
  display: inline-block;
  background: #eef3f8;
  border-radius: 999px;
  padding: 4px 14px;
  font-size: 12px;
  font-weight: 700;
  color: #0a66c2;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin-bottom: 16px;
}

.heading {
  font-size: 26px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.9);
  margin: 0 0 10px;
  line-height: 1.2;
}

.subheading {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.6);
  margin: 0;
  line-height: 1.6;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}

.card {
  background: #ffffff;
  border: 1.5px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  padding: 20px 18px;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s, box-shadow 0.15s;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.card:hover {
  border-color: #0a66c2;
  box-shadow: 0 0 0 2px rgba(10, 102, 194, 0.25);
}

.cardIcon {
  font-size: 32px;
  line-height: 1;
}

.cardMeta {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.cardName {
  font-size: 15px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.9);
  line-height: 1.3;
}

.clusterBadge {
  flex-shrink: 0;
  border-radius: 999px;
  padding: 2px 10px;
  font-size: 11px;
  font-weight: 600;
  text-transform: capitalize;
  white-space: nowrap;
}

.cardDesc {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.6);
  margin: 0;
  line-height: 1.5;
}

.cardSig {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.5);
  margin: 0;
  font-style: italic;
  line-height: 1.5;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  padding-top: 10px;
}
```

- [ ] **Step 4: Create PersonaSelect.jsx**

```jsx
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
```

- [ ] **Step 5: Run test — expect PASS**

```bash
cd frontend && npx vitest run src/pages/PersonaSelect.test.jsx
# Expected: PASS
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/PersonaSelect.jsx frontend/src/pages/PersonaSelect.module.css \
        frontend/src/pages/PersonaSelect.test.jsx
git commit -m "feat: build PersonaSelect page with CSS modules"
```

---

## Task 5: MeterBar + CharacterPanel

**Files:**
- Create: `frontend/src/features/larpmaxxer/components/MeterBar.jsx` + `.module.css`
- Create: `frontend/src/features/larpmaxxer/components/CharacterPanel.jsx` + `.module.css`

- [ ] **Step 1: Create MeterBar.module.css**

```css
.wrap {
  margin-bottom: 10px;
}

.labelRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.label {
  font-size: 11px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.value {
  font-size: 11px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.7);
}

.track {
  height: 6px;
  background: rgba(0, 0, 0, 0.07);
  border-radius: 3px;
  overflow: hidden;
}

.fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.4s ease;
}
```

- [ ] **Step 2: Create MeterBar.jsx**

```jsx
import styles from './MeterBar.module.css'

export function MeterBar({ label, value, delta }) {
  const pct = Math.max(0, Math.min(100, value))
  const color = pct >= 60 ? '#057642' : pct >= 30 ? '#0a66c2' : '#cc1016'

  return (
    <div className={styles.wrap}>
      <div className={styles.labelRow}>
        <span className={styles.label}>{label}</span>
        <span className={styles.value}>
          {Math.round(pct)}%{delta != null && delta !== 0 && (
            <span style={{ color: delta > 0 ? '#057642' : '#cc1016', marginLeft: 4 }}>
              {delta > 0 ? `+${delta}` : delta}
            </span>
          )}
        </span>
      </div>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create CharacterPanel.module.css**

```css
.panel {
  background: #ffffff;
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.header {
  padding: 20px 16px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.avatar {
  font-size: 40px;
  margin-bottom: 10px;
  text-align: center;
}

.name {
  font-size: 15px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.9);
  margin: 0 0 2px;
  text-align: center;
}

.role {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.5);
  margin: 0;
  text-align: center;
  line-height: 1.4;
}

.moodBadge {
  display: inline-block;
  margin: 10px auto 0;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  text-transform: capitalize;
  letter-spacing: 0.04em;
}

.moodRow {
  text-align: center;
}

.meters {
  padding: 16px;
  flex: 1;
}

.metersTitle {
  font-size: 11px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.4);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0 0 12px;
}

.traits {
  padding: 0 16px 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.traitsTitle {
  font-size: 11px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.4);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 16px 0 8px;
}

.trait {
  display: inline-block;
  background: #eef3f8;
  color: #0a66c2;
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 600;
  margin: 0 4px 4px 0;
}
```

- [ ] **Step 4: Create CharacterPanel.jsx**

```jsx
import { MeterBar } from './MeterBar'
import styles from './CharacterPanel.module.css'

const MOOD_STYLE = {
  neutral:   { bg: '#f3f2ef', color: 'rgba(0,0,0,0.5)' },
  curious:   { bg: '#eef3f8', color: '#0a66c2' },
  skeptical: { bg: '#fdecea', color: '#cc1016' },
  impressed: { bg: '#e8f5ef', color: '#057642' },
  done:      { bg: '#fff7e6', color: '#b45309' },
}

export function CharacterPanel({ character, meters, moodState, meterDeltas }) {
  const mood = MOOD_STYLE[moodState] ?? MOOD_STYLE.neutral

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.avatar}>{character.avatar}</div>
        <p className={styles.name}>{character.name}</p>
        <p className={styles.role}>{character.role} · {character.company}</p>
        <div className={styles.moodRow}>
          <span
            className={styles.moodBadge}
            style={{ backgroundColor: mood.bg, color: mood.color }}
          >
            {moodState}
          </span>
        </div>
      </div>

      <div className={styles.meters}>
        <p className={styles.metersTitle}>Relationship Meters</p>
        <MeterBar
          label="Impressed"
          value={meters.impressed}
          delta={meterDeltas?.impressed}
        />
        <MeterBar
          label="Suspicion"
          value={meters.suspicion}
          delta={meterDeltas?.suspicion}
        />
        <MeterBar
          label="Status"
          value={meters.status}
        />
      </div>

      <div className={styles.traits}>
        <p className={styles.traitsTitle}>Personality</p>
        {character.personalityTraits.map(t => (
          <span key={t} className={styles.trait}>{t}</span>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Write smoke test**

Create `frontend/src/features/larpmaxxer/components/CharacterPanel.test.jsx`:

```jsx
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
  avatar: '🧑‍💼',
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
    expect(screen.getByText('Director · MegaCorp')).toBeTruthy()
  })
})
```

- [ ] **Step 6: Run test — expect PASS**

```bash
cd frontend && npx vitest run src/features/larpmaxxer/components/CharacterPanel.test.jsx
# Expected: PASS
```

- [ ] **Step 7: Commit**

```bash
git add frontend/src/features/larpmaxxer/components/MeterBar.jsx \
        frontend/src/features/larpmaxxer/components/MeterBar.module.css \
        frontend/src/features/larpmaxxer/components/CharacterPanel.jsx \
        frontend/src/features/larpmaxxer/components/CharacterPanel.module.css \
        frontend/src/features/larpmaxxer/components/CharacterPanel.test.jsx
git commit -m "feat: build MeterBar and CharacterPanel components"
```

---

## Task 6: ScenarioCard + ScenarioPanel

**Files:**
- Create: `frontend/src/features/larpmaxxer/components/ScenarioCard.jsx` + `.module.css`
- Create: `frontend/src/features/larpmaxxer/components/ScenarioPanel.jsx` + `.module.css`

- [ ] **Step 1: Create ScenarioCard.module.css**

```css
.card {
  width: 100%;
  text-align: left;
  padding: 10px 12px;
  border-radius: 6px;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: background 0.12s;
  margin-bottom: 2px;
}

.card:hover:not(.locked) {
  background: rgba(0, 0, 0, 0.04);
}

.card.active {
  background: #eef3f8;
}

.card.locked {
  cursor: default;
  opacity: 0.5;
}

.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.name {
  font-size: 13px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.85);
  line-height: 1.3;
}

.active .name {
  color: #0a66c2;
}

.badge {
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 3px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.meta {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.45);
  margin-top: 3px;
}

.score {
  font-size: 10px;
  font-weight: 700;
  color: #057642;
  margin-top: 3px;
}

.lockHint {
  font-size: 10px;
  color: rgba(0, 0, 0, 0.4);
  margin-top: 3px;
  font-style: italic;
}
```

- [ ] **Step 2: Create ScenarioCard.jsx**

```jsx
import styles from './ScenarioCard.module.css'

const DIFFICULTY_BADGE = {
  easy:        { label: 'Easy',       bg: '#e8f5ef', color: '#057642' },
  easy_medium: { label: 'E–M',        bg: '#e8f5ef', color: '#057642' },
  medium:      { label: 'Medium',     bg: '#fff7e6', color: '#b45309' },
  hard:        { label: 'Hard',       bg: '#fdecea', color: '#cc1016' },
  very_hard:   { label: 'Very Hard',  bg: '#fdecea', color: '#cc1016' },
}

export function ScenarioCard({ scenario, isUnlocked, isActive, bestScore, unlockRequirement, onSelect }) {
  const diff = DIFFICULTY_BADGE[scenario.difficulty] ?? DIFFICULTY_BADGE.medium
  const cls = [styles.card, isActive && styles.active, !isUnlocked && styles.locked]
    .filter(Boolean).join(' ')

  return (
    <button className={cls} onClick={isUnlocked ? onSelect : undefined} disabled={!isUnlocked}>
      <div className={styles.top}>
        <span className={styles.name}>{scenario.name}</span>
        <span
          className={styles.badge}
          style={{ backgroundColor: diff.bg, color: diff.color }}
        >
          {diff.label}
        </span>
      </div>
      <div className={styles.meta}>{scenario.setting}</div>
      {bestScore != null && (
        <div className={styles.score}>Best: {Math.round(bestScore)}%</div>
      )}
      {!isUnlocked && unlockRequirement && (
        <div className={styles.lockHint}>🔒 {unlockRequirement}</div>
      )}
    </button>
  )
}
```

- [ ] **Step 3: Create ScenarioPanel.module.css**

```css
.panel {
  background: #ffffff;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  padding: 14px 12px 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
}

.title {
  font-size: 13px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.7);
  margin: 0;
}

.scrollArea {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.tierLabel {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: rgba(0, 0, 0, 0.4);
  text-transform: uppercase;
  padding: 6px 4px 4px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  margin-bottom: 4px;
  margin-top: 8px;
}

.tierLabel:first-child {
  margin-top: 0;
}
```

- [ ] **Step 4: Create ScenarioPanel.jsx**

```jsx
import { ScenarioCard } from './ScenarioCard'
import { getUnlockRequirement } from '../engine/unlockLogic'
import styles from './ScenarioPanel.module.css'

const TIER_LABELS = { 1: 'TIER 1 — STANDARD', 2: 'TIER 2 — ADVANCED', 3: 'TIER 3 — ELITE' }

export function ScenarioPanel({
  scenarios,
  unlockedIds,
  activeScenarioId,
  completedScenarios,
  larpRating,
  session,
  onSelectScenario,
}) {
  function renderTier(tier) {
    const tierScenarios = scenarios.filter(s => s.unlockTier === tier)
    return (
      <div key={tier}>
        <div className={styles.tierLabel}>{TIER_LABELS[tier]}</div>
        {tierScenarios.map(scenario => {
          const isUnlocked = unlockedIds.includes(scenario.id)
          const completed = completedScenarios.find(c => c.scenarioId === scenario.id)
          const unlockReq = isUnlocked ? null : getUnlockRequirement(scenario, completedScenarios, larpRating)
          return (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              isUnlocked={isUnlocked}
              isActive={scenario.id === activeScenarioId}
              bestScore={completed?.bestScore}
              unlockRequirement={unlockReq}
              onSelect={() => onSelectScenario(scenario.id)}
            />
          )
        })}
      </div>
    )
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <p className={styles.title}>Simulations</p>
      </div>
      <div className={styles.scrollArea}>
        {[1, 2, 3].map(renderTier)}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/larpmaxxer/components/ScenarioCard.jsx \
        frontend/src/features/larpmaxxer/components/ScenarioCard.module.css \
        frontend/src/features/larpmaxxer/components/ScenarioPanel.jsx \
        frontend/src/features/larpmaxxer/components/ScenarioPanel.module.css
git commit -m "feat: build ScenarioCard and ScenarioPanel components"
```

---

## Task 7: EntryCard + PreBrief

**Files:**
- Create: `frontend/src/features/larpmaxxer/components/EntryCard.jsx` + `.module.css`
- Create: `frontend/src/features/larpmaxxer/components/PreBrief.jsx` + `.module.css`

- [ ] **Step 1: Create EntryCard.module.css**

```css
.wrap {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 24px;
  background: #f3f2ef;
}

.card {
  width: 100%;
  max-width: 420px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 12px;
  padding: 32px 28px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}

.icon {
  font-size: 36px;
  margin-bottom: 14px;
}

.title {
  font-size: 24px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.9);
  margin: 0 0 6px;
}

.subtitle {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.55);
  margin: 0 0 24px;
  line-height: 1.5;
}

.statsRow {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 22px;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.07);
  border-radius: 8px;
}

.personaInfo {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
}

.personaIcon {
  font-size: 18px;
}

.personaName {
  font-size: 13px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.85);
}

.lrBadge {
  background: #eef3f8;
  border-radius: 4px;
  padding: 2px 10px;
  font-size: 13px;
  font-weight: 700;
  color: #0a66c2;
  font-variant-numeric: tabular-nums;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btnPrimary {
  width: 100%;
  padding: 11px 16px;
  font-size: 15px;
  font-weight: 700;
  border-radius: 24px;
  background: #0a66c2;
  color: #ffffff;
  border: none;
  cursor: pointer;
  transition: background 0.15s;
}

.btnPrimary:hover {
  background: #004182;
}

.btnSecondary {
  width: 100%;
  padding: 10px 15px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 24px;
  background: #eef3f8;
  color: #0a66c2;
  border: 1px solid rgba(10, 102, 194, 0.2);
  cursor: pointer;
  transition: background 0.15s;
}

.btnSecondary:hover {
  background: #dce8f5;
}

.btnGhost {
  width: 100%;
  background: transparent;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 24px;
  padding: 10px 15px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.55);
  transition: border-color 0.15s, color 0.15s;
}

.btnGhost:hover {
  border-color: #0a66c2;
  color: #0a66c2;
}
```

- [ ] **Step 2: Create EntryCard.jsx**

```jsx
import styles from './EntryCard.module.css'

export function EntryCard({
  larpRating,
  personaName,
  personaIcon,
  lastScenarioName,
  onEnter,
  onEnterSimulation,
  onWarmUp,
}) {
  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.icon}>⚔️</div>
        <h1 className={styles.title}>LarpMaxxing</h1>
        <p className={styles.subtitle}>Train for the conversations your future self deserves.</p>

        <div className={styles.statsRow}>
          <div className={styles.personaInfo}>
            <span className={styles.personaIcon}>{personaIcon}</span>
            <span className={styles.personaName}>{personaName}</span>
          </div>
          <span className={styles.lrBadge}>{larpRating.toFixed(1)} LR</span>
        </div>

        <div className={styles.actions}>
          <button className={styles.btnPrimary} onClick={onEnter}>
            Begin Training
          </button>
          {onEnterSimulation && (
            <button className={styles.btnSecondary} onClick={onEnterSimulation}>
              ▶ Enter Simulation{lastScenarioName ? `: ${lastScenarioName}` : ''}
            </button>
          )}
          <button className={styles.btnGhost} onClick={onWarmUp}>
            🔥 Warm Up Your Aura
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create PreBrief.module.css**

```css
.wrap {
  padding: 24px;
  max-width: 640px;
  margin: 0 auto;
}

.card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 12px;
  padding: 28px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  margin-bottom: 16px;
}

.headerRow {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
}

.scenarioName {
  font-size: 20px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.9);
  margin: 0 0 4px;
}

.setting {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.5);
  margin: 0;
}

.diffBadge {
  flex-shrink: 0;
  border-radius: 4px;
  padding: 3px 10px;
  font-size: 12px;
  font-weight: 700;
}

.characterRow {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 8px;
  margin-bottom: 16px;
}

.charAvatar {
  font-size: 32px;
}

.charName {
  font-size: 14px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.85);
  margin: 0 0 2px;
}

.charRole {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.5);
  margin: 0;
}

.openingLine {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.7);
  line-height: 1.6;
  font-style: italic;
  border-left: 3px solid #0a66c2;
  padding-left: 12px;
  margin-bottom: 16px;
}

.personaFit {
  border-radius: 6px;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 16px;
}

.objectives {
  margin-bottom: 8px;
}

.objectivesTitle {
  font-size: 11px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.4);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0 0 8px;
}

.objectiveItem {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.7);
  padding: 3px 0;
  display: flex;
  align-items: flex-start;
  gap: 6px;
}

.actions {
  display: flex;
  gap: 10px;
}

.btnConfirm {
  flex: 1;
  background: #0a66c2;
  color: #ffffff;
  border: none;
  border-radius: 24px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
}

.btnConfirm:hover {
  background: #004182;
}

.btnBack {
  background: transparent;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 24px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.55);
  cursor: pointer;
  transition: border-color 0.15s;
}

.btnBack:hover {
  border-color: rgba(0, 0, 0, 0.3);
}
```

- [ ] **Step 4: Create PreBrief.jsx**

```jsx
import styles from './PreBrief.module.css'

const DIFFICULTY_BADGE = {
  easy:        { label: 'Easy',      bg: '#e8f5ef', color: '#057642' },
  easy_medium: { label: 'Easy–Med',  bg: '#e8f5ef', color: '#057642' },
  medium:      { label: 'Medium',    bg: '#fff7e6', color: '#b45309' },
  hard:        { label: 'Hard',      bg: '#fdecea', color: '#cc1016' },
  very_hard:   { label: 'Very Hard', bg: '#fdecea', color: '#cc1016' },
}

export function PreBrief({ scenario, character, personaId, openingLine, onConfirm, onBack }) {
  const diff = DIFFICULTY_BADGE[scenario.difficulty] ?? DIFFICULTY_BADGE.medium

  const isBestFit = scenario.bestPersonas.includes(personaId)
  const isToughFit = scenario.toughPersonas.includes(personaId)
  const personaFit = isBestFit
    ? { label: '✓ Strong fit for your persona', bg: '#e8f5ef', color: '#057642' }
    : isToughFit
    ? { label: '⚠ Tough match for your persona', bg: '#fdecea', color: '#cc1016' }
    : { label: '~ Neutral fit for your persona', bg: '#f3f2ef', color: 'rgba(0,0,0,0.55)' }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.headerRow}>
          <div>
            <h2 className={styles.scenarioName}>{scenario.name}</h2>
            <p className={styles.setting}>{scenario.setting}</p>
          </div>
          <span
            className={styles.diffBadge}
            style={{ backgroundColor: diff.bg, color: diff.color }}
          >
            {diff.label}
          </span>
        </div>

        <div className={styles.characterRow}>
          <div className={styles.charAvatar}>{character.avatar}</div>
          <div>
            <p className={styles.charName}>{character.name}</p>
            <p className={styles.charRole}>{character.role} · {character.company}</p>
          </div>
        </div>

        <p className={styles.openingLine}>"{openingLine}"</p>

        <div
          className={styles.personaFit}
          style={{ backgroundColor: personaFit.bg, color: personaFit.color }}
        >
          {personaFit.label}
        </div>

        <div className={styles.objectives}>
          <p className={styles.objectivesTitle}>Objectives</p>
          {scenario.objectives.map((obj, i) => (
            <div key={i} className={styles.objectiveItem}>
              <span>›</span>
              <span>{obj}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.actions}>
        <button className={styles.btnBack} onClick={onBack}>← Back</button>
        <button className={styles.btnConfirm} onClick={onConfirm}>Enter Simulation →</button>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/larpmaxxer/components/EntryCard.jsx \
        frontend/src/features/larpmaxxer/components/EntryCard.module.css \
        frontend/src/features/larpmaxxer/components/PreBrief.jsx \
        frontend/src/features/larpmaxxer/components/PreBrief.module.css
git commit -m "feat: build EntryCard and PreBrief components"
```

---

## Task 8: Dialogue components — DialogueBubble, ResponseCard, ResponseOptions, DialogueScreen

**Files:**
- Create: `frontend/src/features/larpmaxxer/components/DialogueBubble.jsx` + `.module.css`
- Create: `frontend/src/features/larpmaxxer/components/ResponseCard.jsx` + `.module.css`
- Create: `frontend/src/features/larpmaxxer/components/ResponseOptions.jsx` + `.module.css`
- Create: `frontend/src/features/larpmaxxer/components/DialogueScreen.jsx` + `.module.css`

- [ ] **Step 1: Create DialogueBubble.module.css**

```css
.bubble {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
  max-width: 80%;
}

.bubble.user {
  flex-direction: row-reverse;
  margin-left: auto;
}

.avatarWrap {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f3f2ef;
  border: 1px solid rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.text {
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.85);
  line-height: 1.55;
}

.bubble.user .text {
  background: #eef3f8;
  border-color: rgba(10, 102, 194, 0.15);
}

.badge {
  align-self: flex-start;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 3px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.bubble.user .badge {
  align-self: flex-end;
}
```

- [ ] **Step 2: Create DialogueBubble.jsx**

```jsx
import styles from './DialogueBubble.module.css'

const BADGE_STYLE = {
  prestige:    { bg: '#eef3f8', color: '#0a66c2' },
  ambitious:   { bg: '#fff7e6', color: '#b45309' },
  unhinged:    { bg: '#fdecea', color: '#cc1016' },
  calculated:  { bg: '#e8f5ef', color: '#057642' },
  wildcard:    { bg: '#f3e8ff', color: '#7c3aed' },
  cringe_risk: { bg: '#fdecea', color: '#cc1016' },
  alpha:       { bg: '#eef3f8', color: '#0a66c2' },
  authentic:   { bg: '#e8f5ef', color: '#057642' },
  glazed:      { bg: '#fff7e6', color: '#b45309' },
}

export function DialogueBubble({ speaker, text, flavorBadge, avatar }) {
  const isUser = speaker === 'user'
  const badgeStyle = flavorBadge ? BADGE_STYLE[flavorBadge] : null

  return (
    <div className={`${styles.bubble} ${isUser ? styles.user : ''}`}>
      <div className={styles.avatarWrap}>
        {avatar ?? (isUser ? '🧑' : '🤝')}
      </div>
      <div className={styles.content}>
        <div className={styles.text}>{text}</div>
        {badgeStyle && (
          <span
            className={styles.badge}
            style={{ backgroundColor: badgeStyle.bg, color: badgeStyle.color }}
          >
            {flavorBadge.replace('_', ' ')}
          </span>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create ResponseCard.module.css**

```css
.card {
  width: 100%;
  text-align: left;
  padding: 12px 14px;
  border: 1.5px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  background: #ffffff;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.card:hover:not(:disabled) {
  border-color: #0a66c2;
  box-shadow: 0 0 0 2px rgba(10, 102, 194, 0.1);
}

.card:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.text {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.85);
  line-height: 1.5;
  flex: 1;
}

.badge {
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 3px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
```

- [ ] **Step 4: Create ResponseCard.jsx**

```jsx
import styles from './ResponseCard.module.css'

const BADGE_STYLE = {
  prestige:    { bg: '#eef3f8', color: '#0a66c2' },
  ambitious:   { bg: '#fff7e6', color: '#b45309' },
  unhinged:    { bg: '#fdecea', color: '#cc1016' },
  calculated:  { bg: '#e8f5ef', color: '#057642' },
  wildcard:    { bg: '#f3e8ff', color: '#7c3aed' },
  cringe_risk: { bg: '#fdecea', color: '#cc1016' },
  alpha:       { bg: '#eef3f8', color: '#0a66c2' },
  authentic:   { bg: '#e8f5ef', color: '#057642' },
  glazed:      { bg: '#fff7e6', color: '#b45309' },
}

export function ResponseCard({ option, onSelect, disabled }) {
  const badgeStyle = BADGE_STYLE[option.flavorBadge] ?? { bg: '#f3f2ef', color: 'rgba(0,0,0,0.5)' }

  return (
    <button className={styles.card} onClick={() => onSelect(option)} disabled={disabled}>
      <div className={styles.top}>
        <span className={styles.text}>{option.text}</span>
        <span className={styles.badge} style={{ backgroundColor: badgeStyle.bg, color: badgeStyle.color }}>
          {option.flavorBadge.replace('_', ' ')}
        </span>
      </div>
    </button>
  )
}
```

- [ ] **Step 5: Create ResponseOptions.module.css**

```css
.wrap {
  padding: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  background: #f3f2ef;
  flex-shrink: 0;
}

.title {
  font-size: 11px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.4);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0 0 10px;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.typing {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 0;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.4);
  font-style: italic;
}
```

- [ ] **Step 6: Create ResponseOptions.jsx**

```jsx
import { ResponseCard } from './ResponseCard'
import styles from './ResponseOptions.module.css'

export function ResponseOptions({ options, onSelect, isTyping }) {
  if (isTyping) {
    return (
      <div className={styles.wrap}>
        <div className={styles.typing}>
          <span>●●●</span>
          <span>Thinking...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.title}>Your Response</p>
      <div className={styles.options}>
        {options.map(option => (
          <ResponseCard key={option.id} option={option} onSelect={onSelect} disabled={false} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Create DialogueScreen.module.css**

```css
.wrap {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  overflow: hidden;
  position: relative;
}

.history {
  flex: 1;
  overflow-y: auto;
  padding: 20px 16px 8px;
}

.flashOverlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}
```

- [ ] **Step 8: Create DialogueScreen.jsx**

```jsx
import { useEffect, useRef } from 'react'
import { AnimatePresence, motion as Motion } from 'framer-motion'
import { DialogueBubble } from './DialogueBubble'
import { ResponseOptions } from './ResponseOptions'
import { EvaluationFlash } from './EvaluationFlash'
import styles from './DialogueScreen.module.css'

export function DialogueScreen({
  session,
  currentNode,
  character,
  isTyping,
  evaluationFlash,
  onSelectResponse,
  onDismissFlash,
}) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [session.history.length, isTyping])

  return (
    <div className={styles.wrap}>
      <div className={styles.history}>
        {session.history.map((entry, i) => (
          <DialogueBubble
            key={i}
            speaker={entry.speaker}
            text={entry.text}
            flavorBadge={entry.flavorBadge}
            avatar={entry.speaker === 'character' ? character.avatar : undefined}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      <ResponseOptions
        options={currentNode?.options ?? []}
        onSelect={onSelectResponse}
        isTyping={isTyping}
      />

      <AnimatePresence>
        {evaluationFlash && (
          <Motion.div
            className={styles.flashOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <EvaluationFlash data={evaluationFlash} onDismiss={onDismissFlash} />
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

- [ ] **Step 9: Commit**

```bash
git add frontend/src/features/larpmaxxer/components/DialogueBubble.jsx \
        frontend/src/features/larpmaxxer/components/DialogueBubble.module.css \
        frontend/src/features/larpmaxxer/components/ResponseCard.jsx \
        frontend/src/features/larpmaxxer/components/ResponseCard.module.css \
        frontend/src/features/larpmaxxer/components/ResponseOptions.jsx \
        frontend/src/features/larpmaxxer/components/ResponseOptions.module.css \
        frontend/src/features/larpmaxxer/components/DialogueScreen.jsx \
        frontend/src/features/larpmaxxer/components/DialogueScreen.module.css
git commit -m "feat: build dialogue components (DialogueBubble, ResponseCard, ResponseOptions, DialogueScreen)"
```

---

## Task 9: EvaluationFlash + EventCard

**Files:**
- Create: `frontend/src/features/larpmaxxer/components/EvaluationFlash.jsx` + `.module.css`
- Create: `frontend/src/features/larpmaxxer/components/EventCard.jsx` + `.module.css`

- [ ] **Step 1: Create EvaluationFlash.module.css**

```css
.card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 24px 28px;
  max-width: 380px;
  width: 90%;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  text-align: center;
}

.alignmentBadge {
  display: inline-block;
  border-radius: 999px;
  padding: 4px 16px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-bottom: 14px;
}

.thinks {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.65);
  font-style: italic;
  line-height: 1.55;
  margin-bottom: 16px;
}

.deltas {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}

.delta {
  font-size: 12px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 4px;
}

.larpDelta {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 16px;
}

.dismissBtn {
  background: #0a66c2;
  color: #ffffff;
  border: none;
  border-radius: 24px;
  padding: 8px 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.dismissBtn:hover {
  background: #004182;
}
```

- [ ] **Step 2: Create EvaluationFlash.jsx**

```jsx
import styles from './EvaluationFlash.module.css'

const ALIGNMENT_STYLE = {
  perfect:      { bg: '#e8f5ef', color: '#057642', label: 'Perfect Alignment' },
  adjacent:     { bg: '#eef3f8', color: '#0a66c2', label: 'Adjacent' },
  neutral:      { bg: '#f3f2ef', color: 'rgba(0,0,0,0.55)', label: 'Neutral' },
  off_persona:  { bg: '#fdecea', color: '#cc1016', label: 'Off-Persona' },
  wildcard:     { bg: '#f3e8ff', color: '#7c3aed', label: 'Wildcard' },
}

function DeltaChip({ label, value }) {
  const isPos = value > 0
  const isNeg = value < 0
  const bg = isPos ? '#e8f5ef' : isNeg ? '#fdecea' : '#f3f2ef'
  const color = isPos ? '#057642' : isNeg ? '#cc1016' : 'rgba(0,0,0,0.4)'
  return (
    <span className={styles.delta} style={{ backgroundColor: bg, color }}>
      {label}: {value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1)}
    </span>
  )
}

export function EvaluationFlash({ data, onDismiss }) {
  const alignment = ALIGNMENT_STYLE[data.alignmentTier] ?? ALIGNMENT_STYLE.neutral

  return (
    <div className={styles.card}>
      <span
        className={styles.alignmentBadge}
        style={{ backgroundColor: alignment.bg, color: alignment.color }}
      >
        {alignment.label}
      </span>

      <p className={styles.thinks}>"{data.characterThinks}"</p>

      <div className={styles.deltas}>
        <DeltaChip label="Impressed" value={data.meterDeltas.impressed} />
        <DeltaChip label="Suspicion" value={data.meterDeltas.suspicion} />
      </div>

      <div className={styles.larpDelta} style={{ color: data.projectedLarpDelta >= 0 ? '#057642' : '#cc1016' }}>
        Projected LR: {data.projectedLarpDelta > 0 ? '+' : ''}{data.projectedLarpDelta.toFixed(1)}
      </div>

      <button className={styles.dismissBtn} onClick={onDismiss}>Continue</button>
    </div>
  )
}
```

- [ ] **Step 3: Create EventCard.module.css**

```css
.wrap {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 24px;
  background: #f3f2ef;
}

.card {
  max-width: 480px;
  width: 100%;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 12px;
  padding: 32px 28px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  text-align: center;
}

.icon {
  font-size: 40px;
  margin-bottom: 16px;
}

.type {
  display: inline-block;
  border-radius: 999px;
  padding: 4px 16px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 16px;
}

.characterLine {
  font-size: 16px;
  color: rgba(0, 0, 0, 0.8);
  font-style: italic;
  line-height: 1.6;
  margin-bottom: 20px;
}

.larpDelta {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 8px;
}

.progress {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.5);
  margin-bottom: 24px;
}

.continueBtn {
  background: #0a66c2;
  color: #ffffff;
  border: none;
  border-radius: 24px;
  padding: 10px 28px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
}

.continueBtn:hover {
  background: #004182;
}
```

- [ ] **Step 4: Create EventCard.jsx**

```jsx
import styles from './EventCard.module.css'

export function EventCard({ data, larpRatingDelta, onContinue }) {
  const isBreakthrough = data.type === 'breakthrough'
  const typeBg = isBreakthrough ? '#e8f5ef' : '#fdecea'
  const typeColor = isBreakthrough ? '#057642' : '#cc1016'
  const typeLabel = isBreakthrough ? '🎯 Breakthrough' : '💀 Exposed'
  const icon = isBreakthrough ? '🎯' : '💀'

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.icon}>{icon}</div>
        <span className={styles.type} style={{ backgroundColor: typeBg, color: typeColor }}>
          {typeLabel}
        </span>
        <p className={styles.characterLine}>"{data.characterLine}"</p>
        <div
          className={styles.larpDelta}
          style={{ color: larpRatingDelta >= 0 ? '#057642' : '#cc1016' }}
        >
          {larpRatingDelta > 0 ? '+' : ''}{larpRatingDelta.toFixed(1)} LR
        </div>
        <p className={styles.progress}>Turn {data.endTurn} of {data.maxTurns}</p>
        <button className={styles.continueBtn} onClick={onContinue}>Continue →</button>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/larpmaxxer/components/EvaluationFlash.jsx \
        frontend/src/features/larpmaxxer/components/EvaluationFlash.module.css \
        frontend/src/features/larpmaxxer/components/EventCard.jsx \
        frontend/src/features/larpmaxxer/components/EventCard.module.css
git commit -m "feat: build EvaluationFlash and EventCard components"
```

---

## Task 10: SummaryScreen

**Files:**
- Create: `frontend/src/features/larpmaxxer/components/SummaryScreen.jsx` + `.module.css`

- [ ] **Step 1: Create SummaryScreen.module.css**

```css
.wrap {
  padding: 24px;
  max-width: 640px;
  margin: 0 auto;
}

.card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 12px;
  padding: 28px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  margin-bottom: 16px;
}

.heroRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.scenarioName {
  font-size: 18px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.9);
  margin: 0 0 4px;
}

.personaRow {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.5);
}

.scoreBadge {
  font-size: 28px;
  font-weight: 900;
  border-radius: 8px;
  padding: 8px 16px;
  font-variant-numeric: tabular-nums;
}

.verdict {
  font-size: 15px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.7);
  font-style: italic;
  line-height: 1.5;
  margin-bottom: 20px;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 8px;
  border-left: 3px solid #0a66c2;
}

.sectionTitle {
  font-size: 11px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.4);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0 0 12px;
}

.statRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.statLabel {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.6);
}

.statValue {
  font-size: 12px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.8);
}

.track {
  height: 5px;
  background: rgba(0, 0, 0, 0.07);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 10px;
}

.fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}

.moments {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.moment {
  display: flex;
  gap: 8px;
  font-size: 13px;
  line-height: 1.4;
  padding: 8px 12px;
  border-radius: 6px;
}

.moment.positive {
  background: #e8f5ef;
  color: #057642;
}

.moment.negative {
  background: #fdecea;
  color: #cc1016;
}

.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btnPrimary {
  flex: 1;
  min-width: 120px;
  background: #0a66c2;
  color: #ffffff;
  border: none;
  border-radius: 24px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
}

.btnPrimary:hover { background: #004182; }

.btnSecondary {
  flex: 1;
  min-width: 120px;
  background: #eef3f8;
  color: #0a66c2;
  border: 1px solid rgba(10, 102, 194, 0.2);
  border-radius: 24px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.btnSecondary:hover { background: #dce8f5; }

.btnGhost {
  background: transparent;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 24px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.55);
  cursor: pointer;
  transition: border-color 0.15s;
}

.btnGhost:hover { border-color: rgba(0, 0, 0, 0.3); }

.lrDelta {
  font-size: 24px;
  font-weight: 900;
  text-align: center;
  margin-bottom: 4px;
}

.lrLabel {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.5);
  text-align: center;
  margin-bottom: 20px;
}
```

- [ ] **Step 2: Create SummaryScreen.jsx**

```jsx
import styles from './SummaryScreen.module.css'

function StatBar({ label, value, isInteger, isInverseGood, max = 100 }) {
  const pct = isInteger
    ? Math.min(100, (value / Math.max(1, max)) * 100)
    : Math.min(100, Math.max(0, value))
  const displayVal = Math.round(value)
  let color = '#0a66c2'
  if (!isInteger) {
    color = value >= 70 ? '#057642' : value >= 40 ? '#0a66c2' : '#b45309'
  }
  if (isInverseGood) {
    color = value === 0 ? '#057642' : value <= 2 ? '#b45309' : '#cc1016'
  }

  return (
    <div>
      <div className={styles.statRow}>
        <span className={styles.statLabel}>{label}</span>
        <span className={styles.statValue}>{isInteger ? displayVal : `${displayVal}%`}</span>
      </div>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

export function SummaryScreen({ summary, scenario, persona, session, onReplay, onNewScenario, onExit }) {
  const score = Math.round(summary.performanceScore)
  const scoreBg = score >= 70 ? '#e8f5ef' : score >= 40 ? '#eef3f8' : '#fdecea'
  const scoreColor = score >= 70 ? '#057642' : score >= 40 ? '#0a66c2' : '#cc1016'
  const deltaColor = summary.larpRatingDelta >= 0 ? '#057642' : '#cc1016'

  return (
    <div className={styles.wrap}>
      {/* Header */}
      <div className={styles.card}>
        <div className={styles.heroRow}>
          <div>
            <p className={styles.scenarioName}>{scenario.name}</p>
            <div className={styles.personaRow}>
              <span>{persona.icon}</span>
              <span>{persona.name}</span>
            </div>
          </div>
          <span className={styles.scoreBadge} style={{ backgroundColor: scoreBg, color: scoreColor }}>
            {score}%
          </span>
        </div>

        <div
          className={styles.lrDelta}
          style={{ color: deltaColor }}
        >
          {summary.larpRatingDelta > 0 ? '+' : ''}{summary.larpRatingDelta.toFixed(1)} LR
        </div>
        <p className={styles.lrLabel}>LarpRating change</p>

        <p className={styles.verdict}>"{summary.verdict}"</p>

        <p className={styles.sectionTitle}>Performance Breakdown</p>
        <StatBar label="Persona Alignment" value={summary.personaAlignmentPct} />
        <StatBar label="Believability" value={summary.believability} />
        <StatBar label="Status Ascension" value={summary.statusAscension} />
        <StatBar label="Dialogue Efficiency" value={summary.dialogueEfficiency} />
        <StatBar label="Larp Continuity" value={summary.larpContinuityPct} />
        <StatBar label="Cringe Events" value={summary.cringeCount} isInteger isInverseGood max={session.maxTurns} />
        <StatBar label="Missed Glazes" value={summary.missedGlazeOps} isInteger isInverseGood max={session.maxTurns} />
      </div>

      {/* Notable Moments */}
      {summary.notableMoments.length > 0 && (
        <div className={styles.card}>
          <p className={styles.sectionTitle}>Notable Moments</p>
          <div className={styles.moments}>
            {summary.notableMoments.map((m, i) => (
              <div key={i} className={`${styles.moment} ${m.type === 'positive' ? styles.positive : styles.negative}`}>
                <span>{m.type === 'positive' ? '✓' : '✗'}</span>
                <span>{m.annotation}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className={styles.actions}>
        <button className={styles.btnPrimary} onClick={onReplay}>↺ Replay</button>
        <button className={styles.btnSecondary} onClick={onNewScenario}>New Scenario</button>
        <button className={styles.btnGhost} onClick={onExit}>Exit</button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/features/larpmaxxer/components/SummaryScreen.jsx \
        frontend/src/features/larpmaxxer/components/SummaryScreen.module.css
git commit -m "feat: build SummaryScreen component"
```

---

## Task 11: LarpMaxxer root + delete old TSX files

**Files:**
- Create: `frontend/src/features/larpmaxxer/index.jsx` + `LarpMaxxer.module.css`
- Delete: all `.tsx` files under `frontend/src/features/larpmaxxer/components/` and `index.tsx`

- [ ] **Step 1: Create LarpMaxxer.module.css**

```css
.root {
  height: 100vh;
  background: #f3f2ef;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.topBar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 52px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  background: #ffffff;
  flex-shrink: 0;
  z-index: 100;
}

.topLeft {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  font-weight: 900;
  font-size: 20px;
  color: #0a66c2;
  letter-spacing: -0.03em;
  font-family: Georgia, serif;
}

.mode {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.4);
  border-left: 1px solid rgba(0, 0, 0, 0.08);
  padding-left: 12px;
}

.topRight {
  display: flex;
  align-items: center;
  gap: 12px;
}

.personaTag {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.5);
}

.lrBadge {
  font-size: 12px;
  font-weight: 700;
  color: #0a66c2;
  background: #eef3f8;
  border: 1px solid rgba(10, 102, 194, 0.2);
  border-radius: 4px;
  padding: 2px 8px;
  font-variant-numeric: tabular-nums;
}

.exitBtn {
  background: transparent;
  border: 1.5px solid #0a66c2;
  border-radius: 24px;
  padding: 5px 14px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: #0a66c2;
  transition: background 0.15s;
}

.exitBtn:hover {
  background: rgba(10, 102, 194, 0.05);
}

.panels {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.leftPanel {
  width: 25%;
  min-width: 200px;
  max-width: 280px;
  flex-shrink: 0;
  overflow: hidden;
  border-right: 1px solid rgba(0, 0, 0, 0.08);
}

.centerPanel {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.rightPanel {
  width: 25%;
  min-width: 200px;
  max-width: 280px;
  flex-shrink: 0;
  overflow: hidden;
  border-left: 1px solid rgba(0, 0, 0, 0.08);
}

.idleState {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 32px;
  background: #f3f2ef;
  gap: 8px;
}

.idleIcon {
  font-size: 32px;
  margin-bottom: 4px;
}

.idleText {
  font-size: 15px;
  color: rgba(0, 0, 0, 0.4);
  font-style: italic;
}

.errorCard {
  max-width: 360px;
  background: #ffffff;
  border: 1px solid rgba(204, 16, 22, 0.3);
  border-radius: 8px;
  padding: 24px;
  text-align: center;
}

.errorMsg {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.7);
  margin-bottom: 16px;
  line-height: 1.5;
}

.errorActions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.btnSmPrimary {
  background: #0a66c2;
  color: #ffffff;
  border: none;
  border-radius: 18px;
  padding: 7px 16px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.btnSmSecondary {
  background: transparent;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 18px;
  padding: 7px 16px;
  font-size: 13px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.6);
  cursor: pointer;
}
```

- [ ] **Step 2: Create index.jsx**

```jsx
import { useState, useEffect, useRef } from 'react'
import { motion as Motion, AnimatePresence } from 'framer-motion'
import { useSimulation } from './hooks/useSimulation'
import { useUser } from '../../context/UserContext'
import { getUnlockedScenarios } from './engine/unlockLogic'
import { CHARACTER_MAP } from '../../content/characters'
import { SCENARIOS } from '../../content/scenarios'
import { PERSONAS } from '../../content/personas'

import { ScenarioPanel } from './components/ScenarioPanel'
import { PreBrief } from './components/PreBrief'
import { DialogueScreen } from './components/DialogueScreen'
import { EventCard } from './components/EventCard'
import { SummaryScreen } from './components/SummaryScreen'
import { CharacterPanel } from './components/CharacterPanel'
import { EntryCard } from './components/EntryCard'
import styles from './LarpMaxxer.module.css'

export function LarpMaxxer({ onExitTraining }) {
  const {
    userId,
    personaId,
    larpRating,
    completedScenarios,
    updateLarpRating,
    recordScenarioCompletion,
    setLastSessionResult,
  } = useUser()

  const [hasEntered, setHasEntered] = useState(false)
  const [selectedScenarioId, setSelectedScenarioId] = useState(null)
  const prevCringeCount = useRef(0)
  const [cringeShake, setCringeShake] = useState(false)

  function handleSessionEnd(delta, scenarioId, score) {
    updateLarpRating(delta)
    recordScenarioCompletion(scenarioId, score)
    const scenarioName = SCENARIOS.find(s => s.id === scenarioId)?.name ?? scenarioId
    setLastSessionResult({ scenarioName, delta, score })
  }

  const {
    session,
    currentNode,
    scenarioContent,
    evaluationFlash,
    eventCard,
    summary,
    moodState,
    isTyping,
    loadError,
    startSession,
    confirmStart,
    selectResponse,
    endSession,
    resetSession,
    dismissFlash,
  } = useSimulation(userId, personaId, handleSessionEnd)

  useEffect(() => {
    const currentCringe = session?.cumulative.cringeCount ?? 0
    if (currentCringe > prevCringeCount.current) {
      prevCringeCount.current = currentCringe
      const t = setTimeout(() => {
        setCringeShake(true)
        setTimeout(() => setCringeShake(false), 600)
      }, 0)
      return () => clearTimeout(t)
    }
  }, [session?.cumulative.cringeCount])

  const activeCharacterId = session?.characterId
    ?? SCENARIOS.find(s => s.id === selectedScenarioId)?.characterId
  const character = activeCharacterId ? CHARACTER_MAP.get(activeCharacterId) ?? null : null
  const persona = personaId ? PERSONAS.find(p => p.id === personaId) ?? null : null
  const unlockedIds = getUnlockedScenarios(completedScenarios, larpRating)
  const activeScenarioId = session?.scenarioId ?? selectedScenarioId
  const activeScenario = SCENARIOS.find(s => s.id === activeScenarioId) ?? null

  const lastPlayed = completedScenarios.length > 0
    ? completedScenarios[completedScenarios.length - 1] : null
  const lastPlayedScenario = lastPlayed
    ? SCENARIOS.find(s => s.id === lastPlayed.scenarioId) ?? null : null
  const tier1Unlocked = SCENARIOS.filter(s => s.unlockTier === 1 && unlockedIds.includes(s.id))

  function handleWarmUp() {
    const pick = tier1Unlocked[Math.floor(Math.random() * tier1Unlocked.length)]
    if (pick) {
      setHasEntered(true)
      setSelectedScenarioId(pick.id)
      startSession(pick.id)
    }
  }

  const handleEnterSimulation = lastPlayedScenario ? () => {
    setHasEntered(true)
    setSelectedScenarioId(lastPlayedScenario.id)
    startSession(lastPlayedScenario.id)
  } : null

  function handleSelectScenario(id) {
    if (session && session.status === 'active') {
      if (!window.confirm('Abandon active simulation?')) return
      resetSession()
    }
    setSelectedScenarioId(id)
    startSession(id)
  }

  function handleExitTraining() {
    if (session && (session.status === 'active' || session.status === 'prebriefing')) {
      if (!window.confirm('Abandon active simulation and exit?')) return
    }
    resetSession()
    onExitTraining()
  }

  function handleReplay() {
    if (selectedScenarioId) { resetSession(); startSession(selectedScenarioId) }
  }

  // Determine center screen
  let centerScreen = 'idle'
  if (!hasEntered) centerScreen = 'entry'
  else if (summary) centerScreen = 'summary'
  else if (eventCard) centerScreen = 'event'
  else if (session?.status === 'active') centerScreen = 'active'
  else if (session?.status === 'prebriefing') centerScreen = 'prebriefing'

  const showCharacterPanel = character !== null &&
    (centerScreen === 'active' || centerScreen === 'event' || centerScreen === 'summary')

  const meterDeltas = session?.history.length
    ? (() => {
        const last = [...session.history].reverse().find(e => e.speaker === 'user')
        return last?.meterDeltas ?? null
      })()
    : null

  if (!hasEntered) {
    return (
      <div className={styles.root} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <EntryCard
          larpRating={larpRating}
          personaName={persona?.name ?? 'No Persona'}
          personaIcon={persona?.icon ?? '❓'}
          lastScenarioName={lastPlayedScenario?.name ?? null}
          onEnter={() => setHasEntered(true)}
          onEnterSimulation={handleEnterSimulation}
          onWarmUp={handleWarmUp}
        />
      </div>
    )
  }

  return (
    <Motion.div
      className={styles.root}
      animate={cringeShake ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Top bar */}
      <div className={styles.topBar}>
        <div className={styles.topLeft}>
          <span className={styles.logo}>LarpedIn</span>
          <span className={styles.mode}>Training Mode</span>
        </div>
        <div className={styles.topRight}>
          {persona && (
            <span className={styles.personaTag}>{persona.icon} {persona.name}</span>
          )}
          <span className={styles.lrBadge}>{larpRating.toFixed(1)} LR</span>
          <button className={styles.exitBtn} onClick={handleExitTraining}>← Exit Training</button>
        </div>
      </div>

      {/* Panels */}
      <div className={styles.panels}>
        <div className={styles.leftPanel}>
          <ScenarioPanel
            scenarios={SCENARIOS}
            unlockedIds={unlockedIds}
            activeScenarioId={activeScenarioId ?? null}
            completedScenarios={completedScenarios}
            larpRating={larpRating}
            session={session}
            onSelectScenario={handleSelectScenario}
          />
        </div>

        <div className={styles.centerPanel}>
          <AnimatePresence mode="wait">
            {centerScreen === 'idle' && (
              <Motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className={styles.idleState}>
                {loadError ? (
                  <div className={styles.errorCard}>
                    <p className={styles.errorMsg}>{loadError}</p>
                    <div className={styles.errorActions}>
                      <button className={styles.btnSmPrimary}
                        onClick={() => selectedScenarioId && startSession(selectedScenarioId)}>
                        Retry
                      </button>
                      <button className={styles.btnSmSecondary}
                        onClick={() => { resetSession(); setSelectedScenarioId(null) }}>
                        Choose Different
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={styles.idleIcon}>⚔️</div>
                    <p className={styles.idleText}>Select a scenario to begin.</p>
                  </>
                )}
              </Motion.div>
            )}

            {centerScreen === 'prebriefing' && session && activeScenario && character && (
              <Motion.div key="prebriefing" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }} style={{ height: '100%', overflowY: 'auto', background: '#f3f2ef' }}>
                <PreBrief
                  scenario={activeScenario}
                  character={character}
                  personaId={personaId}
                  openingLine={scenarioContent?.openingLine ?? '...'}
                  onConfirm={confirmStart}
                  onBack={() => { resetSession(); setSelectedScenarioId(null) }}
                />
              </Motion.div>
            )}

            {centerScreen === 'active' && session && character && currentNode && (
              <Motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                exit={{ opacity: 0 }} style={{ height: '100%', overflow: 'hidden' }}>
                <DialogueScreen
                  session={session}
                  currentNode={currentNode}
                  character={character}
                  isTyping={isTyping}
                  evaluationFlash={evaluationFlash}
                  onSelectResponse={selectResponse}
                  onDismissFlash={dismissFlash}
                />
              </Motion.div>
            )}

            {centerScreen === 'event' && eventCard && (
              <Motion.div key="event" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                exit={{ opacity: 0 }} style={{ height: '100%' }}>
                <EventCard
                  data={eventCard}
                  larpRatingDelta={session?.larpRatingDelta ?? 0}
                  onContinue={endSession}
                />
              </Motion.div>
            )}

            {centerScreen === 'summary' && summary && activeScenario && persona && session && (
              <Motion.div key="summary" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }} style={{ height: '100%', overflowY: 'auto', background: '#f3f2ef' }}>
                <SummaryScreen
                  summary={summary}
                  scenario={activeScenario}
                  persona={persona}
                  session={session}
                  onReplay={handleReplay}
                  onNewScenario={() => { resetSession(); setSelectedScenarioId(null) }}
                  onExit={() => { resetSession(); setSelectedScenarioId(null) }}
                />
              </Motion.div>
            )}
          </AnimatePresence>
        </div>

        {showCharacterPanel && character && session && (
          <div className={styles.rightPanel}>
            <CharacterPanel
              character={character}
              meters={session.meters}
              moodState={moodState}
              meterDeltas={meterDeltas}
            />
          </div>
        )}
      </div>
    </Motion.div>
  )
}
```

- [ ] **Step 3: Delete the old TSX UI files**

```bash
rm frontend/src/features/larpmaxxer/index.tsx
rm frontend/src/features/larpmaxxer/components/CharacterPanel.tsx
rm frontend/src/features/larpmaxxer/components/DialogueBubble.tsx
rm frontend/src/features/larpmaxxer/components/DialogueScreen.tsx
rm frontend/src/features/larpmaxxer/components/EntryCard.tsx
rm frontend/src/features/larpmaxxer/components/EvaluationFlash.tsx
rm frontend/src/features/larpmaxxer/components/EventCard.tsx
rm frontend/src/features/larpmaxxer/components/MeterBar.tsx
rm frontend/src/features/larpmaxxer/components/PreBrief.tsx
rm frontend/src/features/larpmaxxer/components/ResponseCard.tsx
rm frontend/src/features/larpmaxxer/components/ResponseOptions.tsx
rm frontend/src/features/larpmaxxer/components/ScenarioCard.tsx
rm frontend/src/features/larpmaxxer/components/ScenarioPanel.tsx
rm frontend/src/features/larpmaxxer/components/SummaryScreen.tsx
rm frontend/src/pages/PersonaSelect.tsx
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/features/larpmaxxer/index.jsx \
        frontend/src/features/larpmaxxer/LarpMaxxer.module.css
git add -u  # stage all deletions
git commit -m "feat: build LarpMaxxer root component, delete old TSX UI files"
```

---

## Task 12: Smoke test + dev server verify

**Files:**
- Create: `frontend/src/features/larpmaxxer/LarpMaxxer.test.jsx`

- [ ] **Step 1: Write smoke test**

```jsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { UserProvider } from '../../context/UserContext'
import { LarpMaxxer } from './index'

const Wrapper = ({ children }) => (
  <UserProvider><MemoryRouter>{children}</MemoryRouter></UserProvider>
)

describe('LarpMaxxer', () => {
  it('renders EntryCard with LarpMaxxing heading on first load', () => {
    render(<LarpMaxxer onExitTraining={() => {}} />, { wrapper: Wrapper })
    expect(screen.getByText('LarpMaxxing')).toBeTruthy()
  })

  it('renders Begin Training button', () => {
    render(<LarpMaxxer onExitTraining={() => {}} />, { wrapper: Wrapper })
    expect(screen.getByText('Begin Training')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run all larpmaxxer tests**

```bash
cd frontend && npx vitest run src/features/larpmaxxer/ src/pages/PersonaSelect.test.jsx
# Expected: all PASS
```

- [ ] **Step 3: Run dev server and manually verify**

```bash
cd frontend && npm run dev
```

Navigate to:
- `http://localhost:5173/persona-select` — should show persona grid with LinkedIn-style header
- `http://localhost:5173/larpmaxxer` — should show EntryCard
- Click "Begin Training" → should show 3-panel layout
- `/me` → LarpStatus should have "⚔️ Start Training" button
- Clicking it should navigate to `/persona-select`

- [ ] **Step 4: Run the App routing test**

```bash
cd frontend && npx vitest run src/App.larpmaxxer.test.jsx
# Expected: PASS
```

- [ ] **Step 5: Final commit**

```bash
git add frontend/src/features/larpmaxxer/LarpMaxxer.test.jsx
git commit -m "feat: add LarpMaxxer smoke test — integration complete"
```
