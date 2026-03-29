# LarpedIn Home Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the LarpedIn Home page — a pixel-faithful LinkedIn parody with mock data, CSS Modules, and React Router stub routes.

**Architecture:** Feature-based folder structure under `frontend/src/features/home/`, global mock data via `MockDataContext`, React Router v6 with only `/` wired to a real page. LinkedIn's visual design (white cards, `#0A66C2` blue, `#f3f2ef` background) is replicated faithfully; only the copy and mechanics are satirized.

**Tech Stack:** Vite, React 18, React Router v6, CSS Modules, Vitest + React Testing Library (for context logic)

---

## File Map

```
frontend/
├── src/
│   ├── context/
│   │   └── MockDataContext.jsx           # All mock data + global state
│   ├── components/
│   │   ├── TopNav/
│   │   │   ├── TopNav.jsx                # App-wide top navigation bar
│   │   │   └── TopNav.module.css
│   │   └── LarpRatingBadge/
│   │       ├── LarpRatingBadge.jsx       # Reusable circular gauge (used in LeftRail + PostCard)
│   │       └── LarpRatingBadge.module.css
│   ├── features/
│   │   └── home/
│   │       ├── LeftRail/
│   │       │   ├── LeftRail.jsx          # Profile card + widgets
│   │       │   └── LeftRail.module.css
│   │       ├── Feed/
│   │       │   ├── Feed.jsx              # Composes StartPost + filtered PostCards
│   │       │   ├── Feed.module.css
│   │       │   ├── StartPost/
│   │       │   │   ├── StartPost.jsx     # "Start a post" card at top of feed
│   │       │   │   └── StartPost.module.css
│   │       │   ├── PostCard/
│   │       │   │   ├── PostCard.jsx      # Individual post card
│   │       │   │   └── PostCard.module.css
│   │       │   └── SuggestedGlazes/
│   │       │       ├── SuggestedGlazes.jsx  # Glaze pills + tone slider
│   │       │       └── SuggestedGlazes.module.css
│   │       ├── RightRail/
│   │       │   ├── RightRail.jsx         # Trending delusions + locked posts widgets
│   │       │   └── RightRail.module.css
│   │       └── Home.jsx                  # Three-column layout wrapper
│   │           └── Home.module.css
│   ├── pages/
│   │   └── StubPage.jsx                  # Generic stub for unimplemented routes
│   ├── App.jsx                           # Router + MockDataContext provider
│   ├── App.module.css
│   ├── index.css                         # Global reset + LinkedIn background color
│   └── main.jsx
├── index.html
├── package.json
└── vite.config.js
```

---

## Task 1: Scaffold Vite + React Project

**Files:**
- Create: `frontend/` (entire Vite scaffold)
- Modify: `frontend/package.json` (add react-router-dom)

- [ ] **Step 1: Scaffold the project**

Run from repo root:
```bash
npm create vite@latest frontend -- --template react
```

- [ ] **Step 2: Install dependencies**

```bash
cd frontend
npm install
npm install react-router-dom
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 3: Configure Vitest in vite.config.js**

Replace the contents of `frontend/vite.config.js`:
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test-setup.js',
  },
})
```

- [ ] **Step 4: Create test setup file**

Create `frontend/src/test-setup.js`:
```js
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Add test script to package.json**

In `frontend/package.json`, add to the `"scripts"` section:
```json
"test": "vitest"
```

- [ ] **Step 6: Delete Vite boilerplate**

Delete these files (they'll be replaced):
```bash
rm src/App.jsx src/App.css src/assets/react.svg public/vite.svg src/index.css
```

- [ ] **Step 7: Verify dev server starts**

```bash
npm run dev
```
Expected: server starts on `http://localhost:5173` (blank page is fine, boilerplate deleted)

- [ ] **Step 8: Commit**

```bash
git add frontend/
git commit -m "feat: scaffold Vite React project for LarpedIn frontend"
```

---

## Task 2: MockDataContext

**Files:**
- Create: `frontend/src/context/MockDataContext.jsx`
- Create: `frontend/src/context/MockDataContext.test.jsx`

- [ ] **Step 1: Write the failing test**

Create `frontend/src/context/MockDataContext.test.jsx`:
```jsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MockDataProvider, useMockData } from './MockDataContext'

function TestConsumer() {
  const { currentUser, feedPosts, isAccessible } = useMockData()
  return (
    <div>
      <span data-testid="name">{currentUser.name}</span>
      <span data-testid="rating">{currentUser.larpRating}</span>
      <span data-testid="post-count">{feedPosts.length}</span>
      <span data-testid="accessible-low">{String(isAccessible(40))}</span>
      <span data-testid="accessible-high">{String(isAccessible(90))}</span>
    </div>
  )
}

describe('MockDataContext', () => {
  it('provides currentUser with larpRating', () => {
    render(<MockDataProvider><TestConsumer /></MockDataProvider>)
    expect(screen.getByTestId('name')).toHaveTextContent('Arjun Malhotra')
    expect(screen.getByTestId('rating')).toHaveTextContent('67.2')
  })

  it('provides feedPosts filtered by larpRating', () => {
    render(<MockDataProvider><TestConsumer /></MockDataProvider>)
    // Posts with rating > 67.2 should not be in feedPosts
    const count = parseInt(screen.getByTestId('post-count').textContent)
    expect(count).toBeGreaterThan(0)
  })

  it('isAccessible returns true when target rating is below current user rating', () => {
    render(<MockDataProvider><TestConsumer /></MockDataProvider>)
    expect(screen.getByTestId('accessible-low')).toHaveTextContent('true')
  })

  it('isAccessible returns false when target rating exceeds current user rating', () => {
    render(<MockDataProvider><TestConsumer /></MockDataProvider>)
    expect(screen.getByTestId('accessible-high')).toHaveTextContent('false')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && npx vitest run src/context/MockDataContext.test.jsx
```
Expected: FAIL — `MockDataContext` module not found

- [ ] **Step 3: Create MockDataContext**

Create `frontend/src/context/MockDataContext.jsx`:
```jsx
import { createContext, useContext } from 'react'

const CURRENT_USER = {
  name: 'Arjun Malhotra',
  headline: 'Incoming Quant VC Product Strategist',
  avatar: null,
  larpRating: 67.2,
  persona: 'Stealth Founder / Ex-McKinsey Adjacent',
  stats: {
    recruiterViews: 413,
    impressionVelocity: 'Elite',
    weeklyAuraGrowth: 87.3,
    weeklyAuraGrowthPct: '+10.91%',
  },
  glazers: [
    { name: 'Arjun Arjun', headline: 'You! glazing you.', avatar: null },
    { name: 'Arjun Malhotra', headline: 'Incoming Quant VC Product Strategist', avatar: null },
  ],
}

const ALL_POSTS = [
  {
    id: 1,
    author: {
      name: 'Priya Krishnamurthy',
      headline: 'Fractional Brand Philosopher | Narrative Leverage Practitioner',
      avatar: null,
      larpRating: 54.1,
    },
    type: 'Career Lore',
    timestamp: '1h',
    content:
      "After a lot of reflection, I'm excited to announce that I've accepted a new role as Interim Global Strategy Vision Lead at a company I deeply admire: myself.",
    reactions: { count: 247, comments: 31 },
  },
  {
    id: 2,
    author: {
      name: 'Marcus Vanderbilt III',
      headline: 'Stealth Founder | Ex-McKinsey Adjacent | Angel Investor in Myself',
      avatar: null,
      larpRating: 61.8,
    },
    type: 'Humblebrag',
    timestamp: '2h',
    content:
      "Three years ago I had nothing but a dream, a Notion doc, and a 14-tab coffee chat spreadsheet. Today I'm proud to say the grind continues.",
    reactions: { count: 892, comments: 114 },
  },
  {
    id: 3,
    author: {
      name: 'Xiao Wei Zhang',
      headline: 'AI-Native Systems Thinker | Independent Macro Observer',
      avatar: null,
      larpRating: 45.3,
    },
    type: 'Thought Leadership Incident',
    timestamp: '3h',
    content:
      "Hot take: execution is overrated. What separates elite operators from the rest is their ability to synthesize frameworks across disciplines and communicate them in a way that makes investors feel something.",
    reactions: { count: 1203, comments: 287 },
  },
  {
    id: 4,
    author: {
      name: 'Bella Hartsworth',
      headline: 'Venture Scout | VC Intern With Delusions of Permanence',
      avatar: null,
      larpRating: 58.9,
    },
    type: 'Aura Farming',
    timestamp: '4h',
    content:
      "I don't talk about it much, but I passed on a $200k offer last year to pursue something more aligned with my values. The check from my parents helped. But still.",
    reactions: { count: 445, comments: 62 },
  },
  {
    id: 5,
    author: {
      name: 'Dev Patel',
      headline: 'Incoming Summer Analyst | CS Major with Big Dreams',
      avatar: null,
      larpRating: 33.7,
    },
    type: 'Corporate Trauma Dump',
    timestamp: '6h',
    content:
      "My first internship taught me three things: 1) Jira tickets are someone's feelings. 2) The real deliverable was always the relationships we made along the way. 3) Free snacks are a form of compensation.",
    reactions: { count: 2891, comments: 401 },
  },
  {
    id: 6,
    author: {
      name: 'Thaddeus Worthington',
      headline: 'Post-Exit Founder | Limited Partner | Thought Ecosystem Builder',
      avatar: null,
      larpRating: 91.4,
    },
    type: 'Stealth Build Update',
    timestamp: '30m',
    content: 'This post is invisible to most of you. And that is by design.',
    reactions: { count: 9999, comments: 999 },
  },
]

const TRENDING_DELUSIONS = [
  'Career Loring',
  'Conivroation',
  'Prestige signaling',
  'Usw emmied',
]

const BUZZWORDS = ['Hyperscale', 'Narrative leverage', 'Operator mindset', 'Aura velocity']

const MockDataContext = createContext(null)

export function MockDataProvider({ children }) {
  function isAccessible(targetRating) {
    return targetRating <= CURRENT_USER.larpRating
  }

  const feedPosts = ALL_POSTS.filter(post => isAccessible(post.author.larpRating))

  const value = {
    currentUser: CURRENT_USER,
    feedPosts,
    allPosts: ALL_POSTS,
    trendingDelusions: TRENDING_DELUSIONS,
    buzzwords: BUZZWORDS,
    isAccessible,
  }

  return <MockDataContext.Provider value={value}>{children}</MockDataContext.Provider>
}

export function useMockData() {
  const ctx = useContext(MockDataContext)
  if (!ctx) throw new Error('useMockData must be used within MockDataProvider')
  return ctx
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/context/MockDataContext.test.jsx
```
Expected: 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/context/
git commit -m "feat: add MockDataContext with mock users, posts, and larpRating gating"
```

---

## Task 3: Global Styles + App Shell

**Files:**
- Create: `frontend/src/index.css`
- Create: `frontend/src/App.jsx`
- Create: `frontend/src/App.module.css`
- Create: `frontend/src/pages/StubPage.jsx`
- Modify: `frontend/src/main.jsx`

- [ ] **Step 1: Create global reset + LinkedIn background**

Create `frontend/src/index.css`:
```css
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif;
  background-color: #f3f2ef;
  color: rgba(0, 0, 0, 0.9);
  font-size: 14px;
  line-height: 1.4;
}

a {
  text-decoration: none;
  color: inherit;
}

button {
  cursor: pointer;
  border: none;
  background: none;
  font-family: inherit;
  font-size: inherit;
}

input {
  font-family: inherit;
}
```

- [ ] **Step 2: Create stub page for unimplemented routes**

Create `frontend/src/pages/StubPage.jsx`:
```jsx
import styles from './StubPage.module.css'

export default function StubPage({ title }) {
  return (
    <div className={styles.stub}>
      <h2>{title}</h2>
      <p>This feature is still being larped.</p>
    </div>
  )
}
```

Create `frontend/src/pages/StubPage.module.css`:
```css
.stub {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 12px;
  color: rgba(0, 0, 0, 0.6);
}

.stub h2 {
  font-size: 20px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.9);
}
```

- [ ] **Step 3: Create App.jsx with routing**

Create `frontend/src/App.jsx`:
```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MockDataProvider } from './context/MockDataContext'
import TopNav from './components/TopNav/TopNav'
import Home from './features/home/Home'
import StubPage from './pages/StubPage'
import styles from './App.module.css'

export default function App() {
  return (
    <MockDataProvider>
      <BrowserRouter>
        <TopNav />
        <main className={styles.main}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/network" element={<StubPage title="My Network" />} />
            <Route path="/jobs" element={<StubPage title="J*bs" />} />
            <Route path="/messaging" element={<StubPage title="Messaging" />} />
            <Route path="/notifications" element={<StubPage title="Notifications" />} />
            <Route path="/me" element={<StubPage title="Me" />} />
          </Routes>
        </main>
      </BrowserRouter>
    </MockDataProvider>
  )
}
```

Create `frontend/src/App.module.css`:
```css
.main {
  padding-top: 52px; /* offset for fixed TopNav height */
  min-height: 100vh;
}
```

- [ ] **Step 4: Update main.jsx**

Replace `frontend/src/main.jsx`:
```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 5: Verify app renders without errors**

```bash
npm run dev
```
Expected: dev server loads, page shows blank with `#f3f2ef` background (Home and TopNav not yet created — console error expected for missing modules, that's fine until next tasks)

- [ ] **Step 6: Commit**

```bash
git add src/
git commit -m "feat: add app shell with React Router, MockDataProvider, and global styles"
```

---

## Task 4: TopNav Component

**Files:**
- Create: `frontend/src/components/TopNav/TopNav.jsx`
- Create: `frontend/src/components/TopNav/TopNav.module.css`

- [ ] **Step 1: Create TopNav.jsx**

Create `frontend/src/components/TopNav/TopNav.jsx`:
```jsx
import { NavLink, useNavigate } from 'react-router-dom'
import { useMockData } from '../../context/MockDataContext'
import styles from './TopNav.module.css'

const NAV_ITEMS = [
  {
    path: '/',
    label: 'Home',
    tooltip: 'See what everyone is pretending to accomplish',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
        <path d="M23 9v2h-2v7a3 3 0 01-3 3h-4v-6h-4v6H6a3 3 0 01-3-3v-7H1V9l11-7 11 7z" />
      </svg>
    ),
  },
  {
    path: '/network',
    label: 'My Network',
    tooltip: 'People you allegedly know',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
        <path d="M12 16v6H3v-6a3 3 0 013-3h3a3 3 0 013 3zm5.5-3A3.5 3.5 0 1014 9.5a3.5 3.5 0 003.5 3.5zm1 2h-2a2.5 2.5 0 00-2.5 2.5V22h7v-4.5a2.5 2.5 0 00-2.5-2.5zM7.5 2A4.5 4.5 0 1012 6.5 4.49 4.49 0 007.5 2z" />
      </svg>
    ),
  },
  {
    path: '/jobs',
    label: 'J*bs',
    tooltip: 'Skip the inconvenient parts',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
        <path d="M17 6V5a3 3 0 00-3-3h-4a3 3 0 00-3 3v1H2v4a3 3 0 003 3h14a3 3 0 003-3V6zM9 5a1 1 0 011-1h4a1 1 0 011 1v1H9zm10 9a4 4 0 003-1.38V17a3 3 0 01-3 3H5a3 3 0 01-3-3v-4.38A4 4 0 005 14z" />
      </svg>
    ),
  },
  {
    path: '/messaging',
    label: 'Messaging',
    tooltip: 'Cold outreach, hot delusion',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
        <path d="M16 4H8a7 7 0 000 14h4l4 4v-4a7 7 0 000-14z" />
      </svg>
    ),
  },
  {
    path: '/notifications',
    label: 'Notifications',
    tooltip: 'Validation center',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
        <path d="M22 19h-6.18C15.4 20.77 13.85 22 12 22s-3.4-1.23-3.82-3H2v-2l2-2V9a8 8 0 0116 0v6l2 2zM12 4a6 6 0 00-6 6v7h12V10a6 6 0 00-6-6z" />
      </svg>
    ),
  },
  {
    path: '/me',
    label: 'Me',
    tooltip: 'Curate your myth',
    isMe: true,
  },
]

function getInitials(name) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function TopNav() {
  const { currentUser } = useMockData()

  return (
    <header className={styles.nav}>
      <div className={styles.inner}>
        {/* Left: Logo + Search */}
        <div className={styles.left}>
          <NavLink to="/" className={styles.logo}>
            <span className={styles.logoText}>LarpedIn</span>
          </NavLink>
          <div className={styles.searchWrap}>
            <svg className={styles.searchIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              className={styles.search}
              placeholder="Search people, titles, delusions"
            />
          </div>
        </div>

        {/* Right: Nav items */}
        <nav className={styles.tabs}>
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `${styles.tab} ${isActive ? styles.tabActive : ''}`
              }
              title={item.tooltip}
            >
              <span className={styles.tabIcon}>
                {item.isMe ? (
                  <span className={styles.avatarSmall}>
                    {getInitials(currentUser.name)}
                  </span>
                ) : (
                  item.icon
                )}
              </span>
              <span className={styles.tabLabel}>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Create TopNav.module.css**

Create `frontend/src/components/TopNav/TopNav.module.css`:
```css
.nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: #ffffff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  height: 52px;
}

.inner {
  max-width: 1128px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  gap: 16px;
}

.left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo {
  display: flex;
  flex-direction: column;
  line-height: 1;
  text-decoration: none;
  flex-shrink: 0;
}

.logoText {
  font-size: 22px;
  font-weight: 800;
  color: #0A66C2;
  letter-spacing: -0.5px;
}

.logoText span {
  background: #0A66C2;
  color: #fff;
  padding: 1px 3px;
  border-radius: 2px;
}

.searchWrap {
  position: relative;
  display: flex;
  align-items: center;
}

.searchIcon {
  position: absolute;
  left: 10px;
  color: rgba(0, 0, 0, 0.6);
  pointer-events: none;
}

.search {
  background: #eef3f8;
  border: none;
  border-radius: 4px;
  padding: 7px 12px 7px 34px;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.9);
  width: 230px;
  outline: none;
}

.search:focus {
  background: #fff;
  box-shadow: 0 0 0 2px #0A66C2;
}

.search::placeholder {
  color: rgba(0, 0, 0, 0.6);
}

.tabs {
  display: flex;
  align-items: stretch;
  height: 100%;
}

.tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 0 12px;
  color: rgba(0, 0, 0, 0.6);
  text-decoration: none;
  border-bottom: 2px solid transparent;
  transition: color 0.15s;
  min-width: 72px;
  position: relative;
}

.tab:hover {
  color: rgba(0, 0, 0, 0.9);
  border-bottom-color: rgba(0, 0, 0, 0.3);
}

.tabActive {
  color: rgba(0, 0, 0, 0.9);
  border-bottom-color: rgba(0, 0, 0, 0.9);
}

.tabIcon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.tabLabel {
  font-size: 11px;
  font-weight: 400;
  white-space: nowrap;
}

.avatarSmall {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #0A66C2;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

- [ ] **Step 3: Verify TopNav renders**

```bash
npm run dev
```
Expected: fixed top nav bar with LarpedIn logo, search box, and 6 nav tabs visible. Clicking Home stays active; other tabs navigate to stub pages.

- [ ] **Step 4: Commit**

```bash
git add src/components/TopNav/
git commit -m "feat: add TopNav with LinkedIn-faithful layout and route-aware active states"
```

---

## Task 5: LarpRatingBadge Component

**Files:**
- Create: `frontend/src/components/LarpRatingBadge/LarpRatingBadge.jsx`
- Create: `frontend/src/components/LarpRatingBadge/LarpRatingBadge.module.css`

This component is used both in the LeftRail (large) and in PostCard headers (small inline badge).

- [ ] **Step 1: Create LarpRatingBadge.jsx**

Create `frontend/src/components/LarpRatingBadge/LarpRatingBadge.jsx`:
```jsx
import styles from './LarpRatingBadge.module.css'

function getTier(rating) {
  if (rating >= 95) return 'Post-human'
  if (rating >= 85) return 'Mythic'
  if (rating >= 70) return 'Terminally employable'
  if (rating >= 50) return 'Aspirational'
  return 'Regional'
}

function getTierColor(rating) {
  if (rating >= 95) return '#ff6b00'
  if (rating >= 85) return '#7c3aed'
  if (rating >= 70) return '#0A66C2'
  if (rating >= 50) return '#057642'
  return '#666'
}

export default function LarpRatingBadge({ rating, size = 'large' }) {
  const tier = getTier(rating)
  const color = getTierColor(rating)

  if (size === 'small') {
    return (
      <span
        className={styles.small}
        style={{ color, borderColor: color }}
        title={`LarpRating: ${rating} — ${tier}`}
      >
        {rating}
      </span>
    )
  }

  // Large circular gauge
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const progress = (rating / 100) * circumference

  return (
    <div className={styles.gauge}>
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke="#e0e0e0"
          strokeWidth="8"
        />
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={`${progress} ${circumference}`}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div className={styles.gaugeInner}>
        <span className={styles.gaugeValue}>{rating}</span>
        <span className={styles.gaugeTier} style={{ color }}>({tier})</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create LarpRatingBadge.module.css**

Create `frontend/src/components/LarpRatingBadge/LarpRatingBadge.module.css`:
```css
.gauge {
  position: relative;
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gaugeInner {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0;
}

.gaugeValue {
  font-size: 18px;
  font-weight: 800;
  color: rgba(0, 0, 0, 0.9);
  line-height: 1;
}

.gaugeTier {
  font-size: 9px;
  font-weight: 600;
  line-height: 1.2;
  text-align: center;
}

.small {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  border: 1px solid;
  border-radius: 3px;
  padding: 1px 5px;
  line-height: 1.4;
  vertical-align: middle;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/LarpRatingBadge/
git commit -m "feat: add reusable LarpRatingBadge with SVG circular gauge and inline variant"
```

---

## Task 6: Home Page Layout

**Files:**
- Create: `frontend/src/features/home/Home.jsx`
- Create: `frontend/src/features/home/Home.module.css`

- [ ] **Step 1: Create Home.jsx**

Create `frontend/src/features/home/Home.jsx`:
```jsx
import LeftRail from './LeftRail/LeftRail'
import Feed from './Feed/Feed'
import RightRail from './RightRail/RightRail'
import styles from './Home.module.css'

export default function Home() {
  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <aside className={styles.left}>
          <LeftRail />
        </aside>
        <section className={styles.center}>
          <Feed />
        </section>
        <aside className={styles.right}>
          <RightRail />
        </aside>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create Home.module.css**

Create `frontend/src/features/home/Home.module.css`:
```css
.page {
  background: #f3f2ef;
  min-height: 100vh;
  padding: 24px 0;
}

.layout {
  max-width: 1128px;
  margin: 0 auto;
  padding: 0 16px;
  display: grid;
  grid-template-columns: 225px 1fr 300px;
  gap: 24px;
  align-items: start;
}

.left {
  position: sticky;
  top: 76px; /* nav height + 24px gap */
}

.right {
  position: sticky;
  top: 76px;
}

.center {
  min-width: 0;
}

@media (max-width: 992px) {
  .layout {
    grid-template-columns: 1fr;
  }
  .left,
  .right {
    display: none;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/features/home/Home.jsx src/features/home/Home.module.css
git commit -m "feat: add Home page three-column layout grid"
```

---

## Task 7: LeftRail Component

**Files:**
- Create: `frontend/src/features/home/LeftRail/LeftRail.jsx`
- Create: `frontend/src/features/home/LeftRail/LeftRail.module.css`

- [ ] **Step 1: Create LeftRail.jsx**

Create `frontend/src/features/home/LeftRail/LeftRail.jsx`:
```jsx
import { useMockData } from '../../../context/MockDataContext'
import LarpRatingBadge from '../../../components/LarpRatingBadge/LarpRatingBadge'
import styles from './LeftRail.module.css'

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

export default function LeftRail() {
  const { currentUser } = useMockData()
  const { name, headline, larpRating, persona, stats, glazers } = currentUser

  return (
    <div className={styles.rail}>
      {/* Identity card */}
      <div className={styles.card}>
        <div className={styles.coverPhoto} />
        <div className={styles.avatarWrap}>
          <div className={styles.avatar}>{getInitials(name)}</div>
        </div>
        <div className={styles.identity}>
          <h2 className={styles.name}>{name}</h2>
          <p className={styles.headline}>{headline}</p>
          <div className={styles.ratingRow}>
            <span className={styles.ratingLabel}>LarpRating</span>
            <svg className={styles.ratingInfo} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm1 15h-2v-6h2zm0-8h-2V7h2z" />
            </svg>
          </div>
          <div className={styles.gaugeWrap}>
            <LarpRatingBadge rating={larpRating} size="large" />
          </div>
          <p className={styles.persona}>{persona}</p>
        </div>
        <div className={styles.divider} />
        <div className={styles.stats}>
          <p className={styles.statLine}>
            <span className={styles.statLabel}>Viewed by </span>
            <span className={styles.statValue}>{stats.recruiterViews} recruiters</span>
            <span className={styles.statLabel}> in the last 7 hours</span>
          </p>
          <p className={styles.statLine}>
            <span className={styles.statLabel}>Impression velocity: </span>
            <span className={styles.statValue}>{stats.impressionVelocity}</span>
          </p>
        </div>
      </div>

      {/* Who's glazing you */}
      <div className={styles.card}>
        <div className={styles.widgetHeader}>
          <h3 className={styles.widgetTitle}>Who&apos;s glazing you</h3>
          <button className={styles.moreBtn}>···</button>
        </div>
        <div className={styles.glazers}>
          {glazers.map((g, i) => (
            <div key={i} className={styles.glazerRow}>
              <div className={styles.glazerAvatar}>{getInitials(g.name)}</div>
              <div>
                <p className={styles.glazerName}>{g.name}</p>
                <p className={styles.glazerSub}>{g.headline}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly aura growth */}
      <div className={styles.card}>
        <div className={styles.widgetHeader}>
          <h3 className={styles.widgetTitle}>Weekly aura growth</h3>
          <button className={styles.moreBtn}>···</button>
        </div>
        <div className={styles.auraRow}>
          <div>
            <p className={styles.auraLabel}>Weekly aura growth</p>
            <p className={styles.auraLabel}>aura growth</p>
          </div>
          <div className={styles.auraValues}>
            <span className={styles.auraNumber}>{stats.weeklyAuraGrowth}</span>
            <span className={styles.auraChange}>{stats.weeklyAuraGrowthPct}</span>
          </div>
        </div>
        <button className={styles.seeMore}>See more →</button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create LeftRail.module.css**

Create `frontend/src/features/home/LeftRail/LeftRail.module.css`:
```css
.rail {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card {
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.coverPhoto {
  height: 56px;
  background: linear-gradient(135deg, #0A66C2 0%, #004182 100%);
}

.avatarWrap {
  display: flex;
  justify-content: center;
  margin-top: -24px;
  margin-bottom: 8px;
}

.avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #0A66C2;
  color: #fff;
  font-size: 24px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid #fff;
}

.identity {
  padding: 0 16px 16px;
  text-align: center;
}

.name {
  font-size: 16px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.9);
  margin-bottom: 4px;
}

.headline {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.6);
  line-height: 1.4;
  margin-bottom: 12px;
}

.ratingRow {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-bottom: 8px;
}

.ratingLabel {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.6);
  font-weight: 500;
}

.ratingInfo {
  color: rgba(0, 0, 0, 0.4);
}

.gaugeWrap {
  display: flex;
  justify-content: center;
  margin-bottom: 8px;
}

.persona {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.6);
  font-style: italic;
}

.divider {
  height: 1px;
  background: rgba(0, 0, 0, 0.08);
  margin: 0 16px;
}

.stats {
  padding: 12px 16px;
}

.statLine {
  font-size: 12px;
  line-height: 1.8;
  color: rgba(0, 0, 0, 0.6);
}

.statLabel {
  color: rgba(0, 0, 0, 0.6);
}

.statValue {
  color: rgba(0, 0, 0, 0.9);
  font-weight: 600;
}

/* Widget shared styles */
.widgetHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px 8px;
}

.widgetTitle {
  font-size: 14px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.9);
}

.moreBtn {
  color: rgba(0, 0, 0, 0.6);
  font-size: 16px;
  letter-spacing: 1px;
  padding: 0 4px;
}

/* Glazers */
.glazers {
  padding: 0 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.glazerRow {
  display: flex;
  align-items: center;
  gap: 10px;
}

.glazerAvatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #057642;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.glazerName {
  font-size: 13px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.9);
}

.glazerSub {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.6);
}

/* Aura growth */
.auraRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px 12px;
}

.auraLabel {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.6);
  line-height: 1.6;
}

.auraValues {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.auraNumber {
  font-size: 16px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.9);
}

.auraChange {
  font-size: 12px;
  font-weight: 600;
  color: #057642;
}

.seeMore {
  display: block;
  width: 100%;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.6);
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  text-align: center;
}

.seeMore:hover {
  background: rgba(0, 0, 0, 0.05);
}
```

- [ ] **Step 3: Verify LeftRail renders**

```bash
npm run dev
```
Expected: left column shows profile card with avatar, LarpRating gauge, persona, stats, glazer list, and aura growth widget.

- [ ] **Step 4: Commit**

```bash
git add src/features/home/LeftRail/
git commit -m "feat: add LeftRail with profile card, LarpRating gauge, glazers, and aura widgets"
```

---

## Task 8: RightRail Component

**Files:**
- Create: `frontend/src/features/home/RightRail/RightRail.jsx`
- Create: `frontend/src/features/home/RightRail/RightRail.module.css`

- [ ] **Step 1: Create RightRail.jsx**

Create `frontend/src/features/home/RightRail/RightRail.jsx`:
```jsx
import { useMockData } from '../../../context/MockDataContext'
import styles from './RightRail.module.css'

const LOCKED_POSTS = [
  { id: 'a', authorInitials: 'TW', blur: true },
  { id: 'b', authorInitials: 'SB', blur: true },
]

export default function RightRail() {
  const { trendingDelusions, buzzwords } = useMockData()

  return (
    <div className={styles.rail}>
      {/* Trending Delusions */}
      <div className={styles.card}>
        <h3 className={styles.title}>Trending Delusions</h3>
        <ol className={styles.list}>
          {trendingDelusions.map((item, i) => (
            <li key={i} className={styles.listItem}>
              <span className={styles.listNum}>{i + 1}.</span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
        <button className={styles.seeMore}>see more</button>
      </div>

      {/* Today's Buzzwords */}
      <div className={styles.card}>
        <h3 className={styles.title}>Today&apos;s Buzzwords</h3>
        <ul className={styles.buzzList}>
          {buzzwords.slice(0, 2).map((bw, i) => (
            <li key={i} className={styles.buzzItem}>{bw}</li>
          ))}
        </ul>
        <button className={styles.seeMore}>see more</button>
      </div>

      {/* Locked posts */}
      <div className={styles.card}>
        <h3 className={styles.title}>Top posts you cannot view because of your LarpRating</h3>
        <div className={styles.lockedList}>
          {LOCKED_POSTS.map(post => (
            <div key={post.id} className={styles.lockedCard}>
              <div className={styles.lockedBlur}>
                <div className={styles.lockedFakeContent}>
                  <div className={styles.fakeAvatar}>{post.authorInitials}</div>
                  <div className={styles.fakeLines}>
                    <div className={styles.fakeLine} style={{ width: '60%' }} />
                    <div className={styles.fakeLine} style={{ width: '40%' }} />
                  </div>
                </div>
                <div className={styles.fakeParagraph} />
                <div className={styles.fakeParagraph} style={{ width: '80%' }} />
              </div>
              <div className={styles.lockedOverlay}>
                <span className={styles.lockIcon}>🔒</span>
                <p className={styles.lockMessage}>This content is above your professional aura.</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create RightRail.module.css**

Create `frontend/src/features/home/RightRail/RightRail.module.css`:
```css
.rail {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card {
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  padding: 12px 16px;
  overflow: hidden;
}

.title {
  font-size: 14px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.9);
  margin-bottom: 10px;
}

/* Trending list */
.list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
}

.listItem {
  display: flex;
  gap: 6px;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.9);
}

.listNum {
  color: rgba(0, 0, 0, 0.5);
  font-size: 12px;
  min-width: 16px;
}

/* Buzzwords */
.buzzList {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
}

.buzzItem {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.9);
  padding: 2px 0;
}

.seeMore {
  font-size: 13px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.6);
  padding: 4px 0;
  display: block;
}

.seeMore:hover {
  color: rgba(0, 0, 0, 0.9);
  text-decoration: underline;
}

/* Locked posts */
.lockedList {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.lockedCard {
  position: relative;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.lockedBlur {
  padding: 12px;
  filter: blur(5px);
  user-select: none;
  pointer-events: none;
}

.lockedFakeContent {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  align-items: center;
}

.fakeAvatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #ccc;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
}

.fakeLines {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.fakeLine {
  height: 10px;
  background: #e0e0e0;
  border-radius: 4px;
}

.fakeParagraph {
  height: 10px;
  background: #e0e0e0;
  border-radius: 4px;
  margin-bottom: 6px;
  width: 100%;
}

.lockedOverlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.55);
  gap: 4px;
  padding: 8px;
}

.lockIcon {
  font-size: 20px;
}

.lockMessage {
  font-size: 11px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.7);
  text-align: center;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/features/home/RightRail/
git commit -m "feat: add RightRail with trending delusions, buzzwords, and locked post previews"
```

---

## Task 9: StartPost Component

**Files:**
- Create: `frontend/src/features/home/Feed/StartPost/StartPost.jsx`
- Create: `frontend/src/features/home/Feed/StartPost/StartPost.module.css`

- [ ] **Step 1: Create StartPost.jsx**

Create `frontend/src/features/home/Feed/StartPost/StartPost.jsx`:
```jsx
import { useState, useEffect } from 'react'
import { useMockData } from '../../../../context/MockDataContext'
import styles from './StartPost.module.css'

const PLACEHOLDERS = [
  'What impossible milestone are you reflecting on today?',
  'Share a lesson from your made-up founder arc.',
  'Announce a role you technically never interviewed for.',
  'What thought leadership can you offer the ecosystem today?',
]

const ACTIONS = [
  { icon: '🎉', label: 'Celebrate fake promotion' },
  { icon: '🚀', label: 'Announce stealth startup' },
  { icon: '💡', label: 'Share leadership insight' },
  { icon: '🪞', label: 'Reflect on your journey' },
]

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

export default function StartPost() {
  const { currentUser } = useMockData()
  const [placeholderIndex, setPlaceholderIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex(i => (i + 1) % PLACEHOLDERS.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className={styles.card}>
      <div className={styles.row}>
        <div className={styles.avatar}>{getInitials(currentUser.name)}</div>
        <button className={styles.input}>
          {PLACEHOLDERS[placeholderIndex]}
        </button>
      </div>
      <div className={styles.actions}>
        {ACTIONS.map(action => (
          <button key={action.label} className={styles.action}>
            <span className={styles.actionIcon}>{action.icon}</span>
            <span className={styles.actionLabel}>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create StartPost.module.css**

Create `frontend/src/features/home/Feed/StartPost/StartPost.module.css`:
```css
.card {
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  padding: 12px 16px;
  margin-bottom: 8px;
}

.row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #0A66C2;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid rgba(0, 0, 0, 0.3);
  border-radius: 35px;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.6);
  text-align: left;
  background: transparent;
  transition: border-color 0.15s, background 0.15s;
  cursor: pointer;
}

.input:hover {
  background: rgba(0, 0, 0, 0.04);
  border-color: rgba(0, 0, 0, 0.6);
}

.actions {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  padding-top: 8px;
}

.action {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.6);
  transition: background 0.15s;
}

.action:hover {
  background: rgba(0, 0, 0, 0.06);
  color: rgba(0, 0, 0, 0.9);
}

.actionIcon {
  font-size: 16px;
}

.actionLabel {
  white-space: nowrap;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/features/home/Feed/StartPost/
git commit -m "feat: add StartPost card with rotating placeholder prompts and action buttons"
```

---

## Task 10: SuggestedGlazes Component

**Files:**
- Create: `frontend/src/features/home/Feed/SuggestedGlazes/SuggestedGlazes.jsx`
- Create: `frontend/src/features/home/Feed/SuggestedGlazes/SuggestedGlazes.module.css`

- [ ] **Step 1: Create SuggestedGlazes.jsx**

Create `frontend/src/features/home/Feed/SuggestedGlazes/SuggestedGlazes.jsx`:
```jsx
import { useState } from 'react'
import styles from './SuggestedGlazes.module.css'

const TONE_GLAZES = {
  professional: [
    'Congratulations on this milestone.',
    'Well deserved recognition.',
    'Impressive work as always.',
    'Continued excellence.',
  ],
  founder: [
    'Insane execution. Big things ahead.',
    'This kind of velocity is rare.',
    'Your trajectory needs to be studied.',
    'The operator mindset is showing.',
  ],
  unnatural: [
    'This is huge. So well deserved.',
    'Absolutely generational aura.',
    'The clarity, the vision, the execution.',
    'I am in awe of your continued excellence.',
    'Yet another masterclass.',
    'Massive inspiration for the ecosystem.',
  ],
  investor: [
    'This kind of velocity is impossible to ignore.',
    'Strong signal. Watching closely.',
    'Rare founder energy on display.',
    'The market will notice.',
  ],
}

export default function SuggestedGlazes() {
  const [tone, setTone] = useState(0) // 0 = professional, 50 = founder, 100 = unnatural
  const [submitted, setSubmitted] = useState(null)

  function getToneKey(value) {
    if (value < 34) return 'professional'
    if (value < 67) return 'founder'
    return 'unnatural'
  }

  const glazes = TONE_GLAZES[getToneKey(tone)]

  function handleGlaze(text) {
    setSubmitted(text)
    setTimeout(() => setSubmitted(null), 2000)
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.label}>Suggested Glazes</p>
      {submitted ? (
        <p className={styles.confirmation}>Glaze sent: &ldquo;{submitted}&rdquo;</p>
      ) : (
        <div className={styles.pills}>
          {glazes.slice(0, 3).map(g => (
            <button key={g} className={styles.pill} onClick={() => handleGlaze(g)}>
              {g}
            </button>
          ))}
        </div>
      )}
      <div className={styles.sliderRow}>
        <span className={styles.sliderLabel}>Professional</span>
        <input
          type="range"
          min="0"
          max="100"
          value={tone}
          onChange={e => setTone(Number(e.target.value))}
          className={styles.slider}
        />
        <span className={styles.sliderLabel}>Unnaturally supportive</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create SuggestedGlazes.module.css**

Create `frontend/src/features/home/Feed/SuggestedGlazes/SuggestedGlazes.module.css`:
```css
.wrap {
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  padding: 10px 16px 12px;
  background: #fafafa;
}

.label {
  font-size: 12px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.6);
  margin-bottom: 8px;
}

.pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.pill {
  padding: 5px 12px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 20px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.8);
  background: #fff;
  transition: background 0.15s, border-color 0.15s;
  cursor: pointer;
}

.pill:hover {
  background: #eef3f8;
  border-color: #0A66C2;
  color: #0A66C2;
}

.confirmation {
  font-size: 12px;
  color: #057642;
  font-weight: 600;
  padding: 6px 0;
  margin-bottom: 10px;
}

.sliderRow {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sliderLabel {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.5);
  white-space: nowrap;
  flex-shrink: 0;
}

.slider {
  flex: 1;
  -webkit-appearance: none;
  height: 4px;
  border-radius: 2px;
  background: #dde0e4;
  outline: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #0A66C2;
  cursor: pointer;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px #0A66C2;
}

.slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #0A66C2;
  cursor: pointer;
  border: 2px solid #fff;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/features/home/Feed/SuggestedGlazes/
git commit -m "feat: add SuggestedGlazes with tone-adaptive one-tap glaze pills and slider"
```

---

## Task 11: PostCard Component

**Files:**
- Create: `frontend/src/features/home/Feed/PostCard/PostCard.jsx`
- Create: `frontend/src/features/home/Feed/PostCard/PostCard.module.css`

- [ ] **Step 1: Create PostCard.jsx**

Create `frontend/src/features/home/Feed/PostCard/PostCard.jsx`:
```jsx
import LarpRatingBadge from '../../../../components/LarpRatingBadge/LarpRatingBadge'
import SuggestedGlazes from '../SuggestedGlazes/SuggestedGlazes'
import styles from './PostCard.module.css'

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

const AVATAR_COLORS = ['#0A66C2', '#057642', '#7c3aed', '#b45309', '#be123c', '#0891b2']

function getAvatarColor(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export default function PostCard({ post }) {
  const { author, type, timestamp, content, reactions } = post

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.header}>
        <div
          className={styles.avatar}
          style={{ background: getAvatarColor(author.name) }}
        >
          {getInitials(author.name)}
        </div>
        <div className={styles.meta}>
          <div className={styles.nameRow}>
            <span className={styles.name}>{author.name}</span>
            <LarpRatingBadge rating={author.larpRating} size="small" />
          </div>
          <p className={styles.headline}>{author.headline}</p>
          <p className={styles.timestamp}>
            {timestamp} •{' '}
            <span className={styles.postType}>{type}</span>
          </p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.iconBtn}>···</button>
          <button className={styles.iconBtn}>✕</button>
        </div>
      </div>

      {/* Body */}
      <div className={styles.body}>
        <p className={styles.content}>{content}</p>
      </div>

      {/* Reactions */}
      <div className={styles.reactions}>
        <span className={styles.reactionEmojis}>👍❤️🔥</span>
        <span className={styles.reactionCount}>
          {reactions.count} • {reactions.comments} comments
        </span>
      </div>

      {/* Action bar */}
      <div className={styles.actions}>
        <button className={styles.action}>
          <span>👍</span> Glaze
        </button>
        <button className={styles.action}>
          <span>💬</span> Comment
        </button>
        <button className={styles.action}>
          <span>🔁</span> Re-Larp
        </button>
        <button className={styles.action}>
          <span>✉️</span> DM
        </button>
      </div>

      {/* Suggested glazes */}
      <SuggestedGlazes />
    </div>
  )
}
```

- [ ] **Step 2: Create PostCard.module.css**

Create `frontend/src/features/home/Feed/PostCard/PostCard.module.css`:
```css
.card {
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  overflow: hidden;
  margin-bottom: 8px;
}

.header {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px 8px;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.meta {
  flex: 1;
  min-width: 0;
}

.nameRow {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 2px;
}

.name {
  font-size: 14px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.9);
}

.headline {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.6);
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.timestamp {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.5);
}

.postType {
  font-style: italic;
  color: #0A66C2;
}

.headerActions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.iconBtn {
  color: rgba(0, 0, 0, 0.5);
  font-size: 18px;
  padding: 4px 6px;
  border-radius: 50%;
  line-height: 1;
}

.iconBtn:hover {
  background: rgba(0, 0, 0, 0.06);
}

.body {
  padding: 0 16px 12px;
}

.content {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.9);
  line-height: 1.6;
}

.reactions {
  padding: 6px 16px 6px;
  display: flex;
  align-items: center;
  gap: 6px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.reactionEmojis {
  font-size: 14px;
}

.reactionCount {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.5);
}

.actions {
  display: flex;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.action {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 4px;
  font-size: 13px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.6);
  transition: background 0.15s;
}

.action:hover {
  background: rgba(0, 0, 0, 0.05);
  color: rgba(0, 0, 0, 0.9);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/features/home/Feed/PostCard/
git commit -m "feat: add PostCard with author info, LarpRating badge, reactions, and action bar"
```

---

## Task 12: Feed Component + Final Assembly

**Files:**
- Create: `frontend/src/features/home/Feed/Feed.jsx`
- Create: `frontend/src/features/home/Feed/Feed.module.css`

- [ ] **Step 1: Create Feed.jsx**

Create `frontend/src/features/home/Feed/Feed.jsx`:
```jsx
import { useMockData } from '../../../context/MockDataContext'
import StartPost from './StartPost/StartPost'
import PostCard from './PostCard/PostCard'
import styles from './Feed.module.css'

export default function Feed() {
  const { feedPosts } = useMockData()

  return (
    <div className={styles.feed}>
      <StartPost />
      {feedPosts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Create Feed.module.css**

Create `frontend/src/features/home/Feed/Feed.module.css`:
```css
.feed {
  display: flex;
  flex-direction: column;
}
```

- [ ] **Step 3: Verify full Home page renders**

```bash
npm run dev
```
Expected: Full three-column layout — LeftRail with profile/widgets, center feed with StartPost + 5 post cards each with glaze strips, RightRail with trending/locked posts. Post #6 (LarpRating 91.4) is not visible. TopNav is fixed at top.

- [ ] **Step 4: Run all tests**

```bash
npx vitest run
```
Expected: all tests PASS

- [ ] **Step 5: Final commit**

```bash
git add src/features/home/Feed/
git commit -m "feat: add Feed component — LarpedIn Home page fully assembled"
```

---

## Self-Review Notes

- **Spec coverage:** All spec sections covered — TopNav with hover tooltips, LeftRail with gauge/glazers/aura, StartPost with rotating placeholders, PostCards with all action buttons, SuggestedGlazes with tone slider, RightRail with locked post previews. LarpRating gating implemented in context (`feedPosts` pre-filtered). Stub routes for all 5 other pages.
- **Placeholders:** None — all code is complete and executable.
- **Type consistency:** `useMockData()` → `{ currentUser, feedPosts, trendingDelusions, buzzwords, isAccessible }` — used consistently across all components. `post.author.larpRating`, `post.type`, `post.reactions.count` — all defined in MockDataContext and consumed correctly in PostCard.
