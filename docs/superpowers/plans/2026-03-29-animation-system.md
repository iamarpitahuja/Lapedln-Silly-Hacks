# Animation System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a cohesive, satirically-bouncy animation system across the entire LarpedIn frontend using Framer Motion at mount/unmount/FLIP boundaries and CSS for hover/stagger/shimmer.

**Architecture:** Framer Motion handles mount/unmount (modals, page transitions, list enters/exits), FLIP list reorders, and shared layout animations (TopNav indicator). CSS Modules handle everything else: hover states, accordion grid transitions, shimmer keyframes, and stagger-on-mount via `:nth-child`. A `src/lib/motion.js` constants file keeps spring configs DRY. A `MotionConfig reducedMotion="user"` wrapper in App.jsx provides a11y compliance with zero per-component code.

**Tech Stack:** React 18, Framer Motion (npm install), CSS Modules, React Router v6

---

## Task 1: Install Framer Motion + motion constants file

**Files:**
- Modify: `frontend/package.json`
- Create: `frontend/src/lib/motion.js`

- [ ] **Step 1: Install framer-motion**

Run from `frontend/`:
```bash
npm install framer-motion
```
Expected: framer-motion appears in `package.json` dependencies, no errors.

- [ ] **Step 2: Create motion constants file**

Create `frontend/src/lib/motion.js`:
```js
export const springBouncy = { type: 'spring', stiffness: 400, damping: 15 }
export const springSnap   = { type: 'spring', stiffness: 400, damping: 30 }
export const easeOutQuint = [0.23, 1, 0.32, 1]

export const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0 },
}

export const fadeUpFast = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0 },
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/src/lib/motion.js
git commit -m "feat: install framer-motion and add motion constants"
```

---

## Task 2: Motion foundation — tokens + reduced motion + MotionConfig

**Files:**
- Modify: `frontend/src/index.css`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Add `--spring-bouncy` token and reduced-motion block to `index.css`**

In `frontend/src/index.css`, add to the `:root` block (after `--hover-scale: 1.02;`):
```css
  --spring-bouncy: cubic-bezier(0.34, 1.56, 0.64, 1);
  --transition-spring: 0.4s var(--spring-bouncy);
```

At the very end of `frontend/src/index.css`, append:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 2: Wrap App in MotionConfig**

In `frontend/src/App.jsx`, add import at top:
```js
import { MotionConfig } from 'framer-motion'
```

Wrap the return of `App` component:
```jsx
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

- [ ] **Step 3: Commit**

```bash
git add frontend/src/index.css frontend/src/App.jsx
git commit -m "feat: add motion tokens, reduced-motion block, MotionConfig wrapper"
```

---

## Task 3: Route transitions

**Files:**
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/App.module.css`

- [ ] **Step 1: Add `.pageWrap` to `App.module.css`**

Append to `frontend/src/App.module.css`:
```css
.pageWrap {
  width: 100%;
}
```

- [ ] **Step 2: Add AnimatePresence route wrapper to `App.jsx`**

Update imports in `frontend/src/App.jsx`:
```js
import { AnimatePresence, motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { easeOutQuint } from './lib/motion'
```

Replace the `AppRoutes` function body so that `<Routes>` is wrapped:
```jsx
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
    <MockDataProvider>
      <TopNav />
      <main className={styles.main}>
        <AnimatePresence mode="wait">
          <motion.div
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
          </motion.div>
        </AnimatePresence>
      </main>
    </MockDataProvider>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/App.jsx frontend/src/App.module.css
git commit -m "feat: add route-to-route page transitions with AnimatePresence"
```

---

## Task 4: TopNav active indicator slide + icon bounce

**Files:**
- Modify: `frontend/src/components/TopNav/TopNav.jsx`
- Modify: `frontend/src/components/TopNav/TopNav.module.css`

- [ ] **Step 1: Remove `tabActive::after` pseudo-element from CSS**

In `frontend/src/components/TopNav/TopNav.module.css`, delete these lines:
```css
.tabActive::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2.5px;
  background: currentColor;
  border-radius: 2px 2px 0 0;
}
```

Add `.activeIndicator` class instead:
```css
.activeIndicator {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2.5px;
  background: rgba(0, 0, 0, 0.9);
  border-radius: 2px 2px 0 0;
}
```

- [ ] **Step 2: Update `TopNav.jsx` to use layoutId indicator and icon bounce**

Replace imports at top:
```jsx
import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useMockData } from '../../context/MockDataContext'
import { useAuth } from '../../context/AuthContext'
import { getInitials } from '../../utils/strings'
import { fetchConversations } from '../../services/api'
import { springSnap } from '../../lib/motion'
import styles from './TopNav.module.css'
```

Replace the `NAV_ITEMS.map(...)` render block inside `<nav className={styles.tabs}>`:
```jsx
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
    {({ isActive }) => (
      <>
        <motion.span
          className={styles.tabIcon}
          animate={isActive ? { scaleY: [1, 1.2, 1] } : { scaleY: 1 }}
          transition={springSnap}
        >
          {item.isMe ? (
            currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className={styles.avatarSmallImg}
              />
            ) : (
              <span className={styles.avatarSmall}>{getInitials(currentUser.name)}</span>
            )
          ) : (
            <span className={styles.iconWrap}>
              {item.icon}
              {item.isMessaging && unreadCount > 0 && (
                <span className={styles.unreadDot} />
              )}
            </span>
          )}
        </motion.span>
        <span className={styles.tabLabel}>{item.label}</span>
        {isActive && (
          <motion.div
            layoutId="activeTab"
            className={styles.activeIndicator}
            transition={springSnap}
          />
        )}
      </>
    )}
  </NavLink>
))}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/TopNav/TopNav.jsx frontend/src/components/TopNav/TopNav.module.css
git commit -m "feat: TopNav sliding active indicator with layoutId + icon bounce"
```

---

## Task 5: Home 3-column stagger

**Files:**
- Modify: `frontend/src/features/home/Home.jsx`

- [ ] **Step 1: Animate columns in `Home.jsx`**

Replace full file content:
```jsx
import { motion } from 'framer-motion'
import LeftRail from './LeftRail/LeftRail'
import Feed from './Feed/Feed'
import RightRail from './RightRail/RightRail'
import { easeOutQuint } from '../../lib/motion'
import styles from './Home.module.css'

const colVariants = {
  hidden: (custom) => ({ opacity: 0, x: custom.x ?? 0, y: custom.y ?? 0 }),
  show:   { opacity: 1, x: 0, y: 0 },
}

export default function Home() {
  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <motion.aside
          className={styles.left}
          custom={{ x: -16 }}
          variants={colVariants}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.3, ease: easeOutQuint, delay: 0 }}
        >
          <LeftRail />
        </motion.aside>
        <motion.section
          className={styles.center}
          custom={{ y: 12 }}
          variants={colVariants}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.3, ease: easeOutQuint, delay: 0.08 }}
        >
          <Feed />
        </motion.section>
        <motion.aside
          className={styles.right}
          custom={{ x: 16 }}
          variants={colVariants}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.3, ease: easeOutQuint, delay: 0.16 }}
        >
          <RightRail />
        </motion.aside>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/features/home/Home.jsx
git commit -m "feat: Home 3-column stagger-in animation"
```

---

## Task 6: LeftRail + RightRail CSS stagger and hover motion

**Files:**
- Modify: `frontend/src/features/home/LeftRail/LeftRail.module.css`
- Modify: `frontend/src/features/home/RightRail/RightRail.module.css`

- [ ] **Step 1: Add stagger keyframe + child stagger to `LeftRail.module.css`**

Append to end of `frontend/src/features/home/LeftRail/LeftRail.module.css`:
```css
@keyframes railItemIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.rail > *:nth-child(1) { animation: railItemIn 0.3s var(--ease-out-quint) both; animation-delay: 0ms; }
.rail > *:nth-child(2) { animation: railItemIn 0.3s var(--ease-out-quint) both; animation-delay: 50ms; }
.rail > *:nth-child(3) { animation: railItemIn 0.3s var(--ease-out-quint) both; animation-delay: 100ms; }
.rail > *:nth-child(4) { animation: railItemIn 0.3s var(--ease-out-quint) both; animation-delay: 150ms; }
.rail > *:nth-child(5) { animation: railItemIn 0.3s var(--ease-out-quint) both; animation-delay: 200ms; }

.glazerRow {
  transition: transform var(--transition-fast);
}
.glazerRow:hover {
  transform: translateX(3px);
}
```

- [ ] **Step 2: Add stagger keyframe + pill lift to `RightRail.module.css`**

Append to end of `frontend/src/features/home/RightRail/RightRail.module.css`:
```css
@keyframes railItemIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.rail > *:nth-child(1) { animation: railItemIn 0.3s var(--ease-out-quint) both; animation-delay: 0ms; }
.rail > *:nth-child(2) { animation: railItemIn 0.3s var(--ease-out-quint) both; animation-delay: 60ms; }
.rail > *:nth-child(3) { animation: railItemIn 0.3s var(--ease-out-quint) both; animation-delay: 120ms; }
.rail > *:nth-child(4) { animation: railItemIn 0.3s var(--ease-out-quint) both; animation-delay: 180ms; }

.buzzItem {
  transition: transform var(--transition-fast), box-shadow var(--transition-fast), background var(--transition-fast);
}
.buzzItem:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 255, 65, 0.15);
}

.listItem {
  transition: transform var(--transition-fast);
}
.listItem:hover {
  transform: translateX(3px);
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/features/home/LeftRail/LeftRail.module.css frontend/src/features/home/RightRail/RightRail.module.css
git commit -m "feat: LeftRail + RightRail CSS stagger entrances and hover motion"
```

---

## Task 7: LockedPostCard shimmer + lock pulse

**Files:**
- Modify: `frontend/src/features/home/Feed/LockedPostCard/LockedPostCard.module.css`

- [ ] **Step 1: Add shimmer keyframe to fake lines and lock pulse**

Append to end of `frontend/src/features/home/Feed/LockedPostCard/LockedPostCard.module.css`:
```css
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}

@keyframes lockPulse {
  0%, 100% { transform: scale(1); }
  50%       { transform: scale(1.1); }
}

.fakeLine,
.fakePara {
  background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
  background-size: 200% 100%;
  animation: shimmer 2s ease-in-out infinite;
}

.lockIcon {
  animation: lockPulse 3s ease-in-out infinite;
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/features/home/Feed/LockedPostCard/LockedPostCard.module.css
git commit -m "feat: LockedPostCard shimmer effect and lock icon pulse"
```

---

## Task 8: Feed FLIP list + post enter/exit animations

**Files:**
- Modify: `frontend/src/features/home/Feed/Feed.jsx`
- Modify: `frontend/src/features/home/Feed/Feed.module.css`

- [ ] **Step 1: Remove old `.posts` CSS animation from `Feed.module.css`**

In `frontend/src/features/home/Feed/Feed.module.css`, remove the `animation` line from `.posts` and delete the local `@keyframes fadeIn`:

Replace the full file with:
```css
.feed {
  display: flex;
  flex-direction: column;
}

.loadingText {
  font-size: 13px;
  font-style: italic;
  color: var(--text-muted);
  text-align: center;
  margin: 32px 0;
  letter-spacing: 0.05em;
  animation: glowPulse 2s infinite;
}

.posts {
  display: flex;
  flex-direction: column;
}
```

- [ ] **Step 2: Wrap post list in AnimatePresence + motion.li in `Feed.jsx`**

Add imports at top of `frontend/src/features/home/Feed/Feed.jsx` (after existing imports):
```js
import { AnimatePresence, motion } from 'framer-motion'
import { easeOutQuint } from '../../../lib/motion'
```

Find where posts are rendered (the `<div className={styles.posts}>` block that maps over `feed`) and replace the list wrapper and each post item.

Find the section that renders the list (it will look like a map over posts/lockedPosts). Replace the `<div className={styles.posts}>` wrapper and its children map with:
```jsx
<motion.div className={styles.posts}>
  <AnimatePresence initial={false}>
    {feed.map((post) => (
      <motion.div
        key={post.id}
        layout
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.25, ease: easeOutQuint }}
      >
        {post.locked ? (
          <LockedPostCard key={post.id} post={post} />
        ) : (
          <PostCard key={post.id} post={post} isOwnPost={post.isOwnPost} />
        )}
      </motion.div>
    ))}
  </AnimatePresence>
</motion.div>
```

Note: Read Feed.jsx fully first to find the exact render section — the map variable name may differ. The key pattern is: wrap the existing map's container div with `<motion.div>`, wrap each map item's root element with `<motion.div key={post.id} layout ...>`.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/features/home/Feed/Feed.jsx frontend/src/features/home/Feed/Feed.module.css
git commit -m "feat: Feed FLIP reorder + post enter/exit animations"
```

---

## Task 9: StartPost suggestion card AnimatePresence + photo preview spring

**Files:**
- Modify: `frontend/src/features/home/Feed/StartPost/StartPost.jsx`

- [ ] **Step 1: Animate suggestion cards and photo preview**

Add imports at top of `frontend/src/features/home/Feed/StartPost/StartPost.jsx`:
```js
import { AnimatePresence, motion } from 'framer-motion'
import { springBouncy, easeOutQuint } from '../../../../lib/motion'
```

Replace the `{activeSuggestions.length > 0 && (...)}` block:
```jsx
<AnimatePresence>
  {activeSuggestions.length > 0 && (
    <motion.div
      className={styles.suggestionCards}
      data-testid="suggestion-cards"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {activeSuggestions.map((text, index) => (
        <motion.button
          key={index}
          type="button"
          className={styles.suggestionCard}
          data-testid="suggestion-card"
          onClick={() => handleSuggestionSelect(text)}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.18, ease: easeOutQuint, delay: index * 0.05 }}
        >
          {text}
        </motion.button>
      ))}
    </motion.div>
  )}
</AnimatePresence>
```

Replace the `{photo && (...)}` block:
```jsx
<AnimatePresence>
  {photo && (
    <motion.div
      className={styles.photoPreviewWrap}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={springBouncy}
    >
      <img src={photo} alt="Post preview" className={styles.photoPreview} />
      <button className={styles.removePhotoBtn} onClick={removePhoto} aria-label="Remove photo">
        <Icon name="x" size={16} />
      </button>
    </motion.div>
  )}
</AnimatePresence>
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/features/home/Feed/StartPost/StartPost.jsx
git commit -m "feat: StartPost suggestion card stagger and photo preview spring"
```

---

## Task 10: PostCard reaction counter pop + action button whileTap

**Files:**
- Modify: `frontend/src/features/home/Feed/PostCard/PostCard.jsx`
- Modify: `frontend/src/features/home/Feed/PostCard/PostCard.module.css`

- [ ] **Step 1: Remove conflicting CSS active transform from `.action`**

In `frontend/src/features/home/Feed/PostCard/PostCard.module.css`, find:
```css
.action:active {
  transform: scale(var(--active-scale));
}
```
Delete only that rule (leave all other `.action` rules untouched).

- [ ] **Step 2: Add Framer Motion imports and animate reaction counters + action buttons**

Add at top of `frontend/src/features/home/Feed/PostCard/PostCard.jsx`:
```js
import { AnimatePresence, motion } from 'framer-motion'
import { springBouncy } from '../../../../lib/motion'
```

Wrap each `<span className={styles.individualCount}>` inside `reactionGroup` buttons with a keyed AnimatePresence for pop effect. Replace the four reaction counter spans in the `.reactionSummary` section:

For the larp count button:
```jsx
<motion.button
  className={`${styles.reactionGroup} ${isLarped ? styles.activeReaction : ''}`}
  title="Likes"
  onClick={handleLarpClick}
  disabled={isUpdatingLike}
  whileTap={{ scale: 1.3 }}
  transition={springBouncy}
>
  <Icon name="thumbsUp" size={14} className={`${styles.reactionIcon} ${styles.iconLike}`} />
  <AnimatePresence mode="popLayout" initial={false}>
    <motion.span
      key={larpCount}
      className={styles.individualCount}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
    >
      {larpCount}
    </motion.span>
  </AnimatePresence>
</motion.button>
```

Apply the same pattern to the love, glaze, and relarp counts (use `loveCount`, `glazeCount`, `relarpCount` as the `key` respectively). The relarp stat is a `<span>` not a button, so no `whileTap` on it.

For each action button in `.actions`, replace `<button className={...}>` with `<motion.button className={...} whileTap={{ scale: 0.92 }} whileHover={{ y: -1 }}>`. Apply to: Like, Love, Glaze, Comment, Re-Larp, DM action buttons.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/features/home/Feed/PostCard/PostCard.jsx frontend/src/features/home/Feed/PostCard/PostCard.module.css
git commit -m "feat: PostCard reaction counter pop, action button whileTap spring"
```

---

## Task 11: PostCard accordion content fade + comment enter animations

**Files:**
- Modify: `frontend/src/features/home/Feed/PostCard/PostCard.jsx`

- [ ] **Step 1: Add fade to accordion inner content**

Inside PostCard.jsx, find the two `<div className={styles.expandableInner}>` elements (one for Re-Larp composer, one for comments). Wrap their inner content in a motion fade:

For Re-Larp composer expandableInner:
```jsx
<div className={styles.expandableInner}>
  <AnimatePresence>
    {isRelarpComposerOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, delay: 0.1 }}
      >
        <form className={styles.relarpComposer} onSubmit={handleRelarpSubmit}>
          {/* ... existing form content unchanged ... */}
        </form>
      </motion.div>
    )}
  </AnimatePresence>
</div>
```

For comments expandableInner, same pattern keyed on `isCommentsOpen`.

- [ ] **Step 2: Animate new comment items entering**

In the `comments.map(...)` section, wrap each `<li key={comment.id}>` with:
```jsx
<motion.li
  key={comment.id}
  className={styles.commentItem}
  initial={{ opacity: 0, x: -8 }}
  animate={{ opacity: 1, x: 0 }}
  exit={{ opacity: 0, x: -8 }}
  transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
>
  {/* existing li content */}
</motion.li>
```

Wrap the `<ul className={styles.commentList}>` with `<AnimatePresence>` around the map.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/features/home/Feed/PostCard/PostCard.jsx
git commit -m "feat: PostCard accordion fade + comment stagger enter"
```

---

## Task 12: ComposeModal backdrop + spring open/close

**Files:**
- Modify: `frontend/src/features/messaging/ComposeModal/ComposeModal.jsx`
- Modify: `frontend/src/features/messaging/Messaging.jsx`

- [ ] **Step 1: Animate ComposeModal backdrop and panel**

Add imports at top of `frontend/src/features/messaging/ComposeModal/ComposeModal.jsx`:
```js
import { motion, AnimatePresence } from 'framer-motion'
import { springSnap } from '../../../lib/motion'
```

The ComposeModal itself renders from the outside (it's conditionally rendered in Messaging.jsx). The component needs to animate its own internal structure. Wrap the top-level `<div className={styles.backdrop}>` with motion:

Replace the opening of the component JSX return:
```jsx
return (
  <motion.div
    className={styles.backdrop}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.15 }}
  >
    <motion.div
      className={styles.modal}
      initial={{ opacity: 0, scale: 0.95, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 8 }}
      transition={springSnap}
    >
      {/* existing modal content unchanged */}
    </motion.div>
  </motion.div>
)
```

- [ ] **Step 2: Wrap ComposeModal render in AnimatePresence in Messaging.jsx**

In `frontend/src/features/messaging/Messaging.jsx`, add imports:
```js
import { AnimatePresence } from 'framer-motion'
```

Replace:
```jsx
{showCompose && (
  <ComposeModal
    onClose={() => setShowCompose(false)}
    onStartDm={handleStartDm}
    onCreateGroup={handleCreateGroup}
  />
)}
```
With:
```jsx
<AnimatePresence>
  {showCompose && (
    <ComposeModal
      onClose={() => setShowCompose(false)}
      onStartDm={handleStartDm}
      onCreateGroup={handleCreateGroup}
    />
  )}
</AnimatePresence>
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/features/messaging/ComposeModal/ComposeModal.jsx frontend/src/features/messaging/Messaging.jsx
git commit -m "feat: ComposeModal backdrop fade + spring open/close"
```

---

## Task 13: Messaging chat pane transition + ConversationList row stagger

**Files:**
- Modify: `frontend/src/features/messaging/Messaging.jsx`
- Modify: `frontend/src/features/messaging/ConversationList/ConversationList.jsx`

- [ ] **Step 1: Animate chat window on convo switch in Messaging.jsx**

In `frontend/src/features/messaging/Messaging.jsx`, add to imports:
```js
import { AnimatePresence, motion } from 'framer-motion'
import { easeOutQuint } from '../../lib/motion'
```

Replace `<div className={styles.chat}>`:
```jsx
<div className={styles.chat}>
  <AnimatePresence mode="wait">
    <motion.div
      key={activeGroup?.id ?? activeUser?.id ?? 'empty'}
      style={{ height: '100%' }}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2, ease: easeOutQuint }}
    >
      <ChatWindow
        otherUser={activeGroup ? null : activeUser}
        group={activeGroup}
        currentUserId={currentUserId}
      />
    </motion.div>
  </AnimatePresence>
</div>
```

- [ ] **Step 2: Stagger conversation rows in ConversationList.jsx**

Add imports at top of `frontend/src/features/messaging/ConversationList/ConversationList.jsx`:
```js
import { motion } from 'framer-motion'
import { easeOutQuint } from '../../../lib/motion'
```

Wrap each `<li key={user?.id}>` in the filteredConvs map:
```jsx
<motion.li
  key={user?.id}
  initial={{ opacity: 0, x: -12 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ duration: 0.2, ease: easeOutQuint, delay: index * 0.04 }}
>
  {/* existing button content */}
</motion.li>
```

Do the same for the filteredGroups map with `key={group.id}`.

Update the map signatures to include `index`: `.map((conv, index) => ...)` and `.map((group, index) => ...)`.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/features/messaging/Messaging.jsx frontend/src/features/messaging/ConversationList/ConversationList.jsx
git commit -m "feat: Messaging chat pane transition + ConversationList row stagger"
```

---

## Task 14: MessageBubble entrance animation

**Files:**
- Modify: `frontend/src/features/messaging/MessageBubble/MessageBubble.jsx`

- [ ] **Step 1: Animate bubble entrance**

Replace full file:
```jsx
import { motion } from 'framer-motion'
import { springSnap } from '../../../lib/motion'
import styles from './MessageBubble.module.css'

export default function MessageBubble({ message, isMine, showSender = false }) {
  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  const senderName = message.sender?.display_name ?? null

  return (
    <motion.div
      className={`${styles.wrap} ${isMine ? styles.mine : styles.theirs}`}
      initial={{ opacity: 0, scale: 0.85, y: 8, x: isMine ? 12 : -12 }}
      animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
      transition={springSnap}
    >
      {showSender && !isMine && senderName && (
        <span className={styles.senderName}>{senderName}</span>
      )}
      <div className={`${styles.bubble} ${isMine ? styles.bubbleMine : styles.bubbleTheirs}`}>
        {message.content}
      </div>
      <span className={styles.time}>{time}</span>
    </motion.div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/features/messaging/MessageBubble/MessageBubble.jsx
git commit -m "feat: MessageBubble spring entrance animation"
```

---

## Task 15: Network tab transition + card stagger + ConnectButton morphs

**Files:**
- Modify: `frontend/src/features/network/Network.jsx`
- Modify: `frontend/src/features/network/ConnectButton/ConnectButton.jsx`

- [ ] **Step 1: Add tab content transition + card stagger to Network.jsx**

Add imports:
```js
import { AnimatePresence, motion } from 'framer-motion'
import { easeOutQuint } from '../../lib/motion'
```

Wrap the `{!loading && !error && (...)}` block. Inside it, wrap each tab's content block with an `AnimatePresence mode="wait"` keyed by `activeTab`, and stagger the grid cards:

```jsx
{!loading && !error && (
  <AnimatePresence mode="wait">
    <motion.div
      key={activeTab}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease: easeOutQuint }}
    >
      {activeTab === 'Suggestions' && (
        <motion.div
          className={styles.grid}
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.05 } } }}
        >
          {suggestions.length === 0 && outgoing.length === 0 ? (
            <p className={styles.empty}>No suggestions right now. You know everyone!</p>
          ) : (
            <>
              {outgoing.map(conn => (
                <motion.div key={conn.id} variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
                  <UserCard user={conn.addressee} initialStatus="pending_sent" connectionId={conn.id} />
                </motion.div>
              ))}
              {suggestions.map(user => (
                <motion.div key={user.id} variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
                  <UserCard key={user.id} user={user} initialStatus="none" />
                </motion.div>
              ))}
            </>
          )}
        </motion.div>
      )}

      {activeTab === 'Pending' && (
        <div>
          {pending.length === 0 ? (
            <p className={styles.empty}>No pending requests.</p>
          ) : (
            <motion.div
              className={styles.grid}
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.05 } } }}
            >
              {pending.map(conn => (
                <motion.div key={conn.id} variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
                  <UserCard user={conn.requester} initialStatus="pending_received" connectionId={conn.id} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      )}

      {activeTab === 'My Connections' && (
        <motion.div
          className={styles.grid}
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.05 } } }}
        >
          {connections.length === 0 ? (
            <p className={styles.empty}>No connections yet. Start connecting!</p>
          ) : (
            connections.map(conn => (
              <motion.div key={conn.id} variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
                <UserCard user={conn.profile} initialStatus="accepted" connectionId={conn.id} />
              </motion.div>
            ))
          )}
        </motion.div>
      )}
    </motion.div>
  </AnimatePresence>
)}
```

- [ ] **Step 2: Add AnimatePresence text swap to ConnectButton.jsx**

Add imports:
```js
import { AnimatePresence, motion } from 'framer-motion'
import { springBouncy, easeOutQuint } from '../../../lib/motion'
```

Wrap each button's label text in `<AnimatePresence mode="wait">` with a `<motion.span key={...}>`:

```jsx
// For 'none' state:
<motion.button
  className={`${styles.btn} ${styles.connect}`}
  onClick={handleConnect}
  disabled={loading}
  whileTap={{ scale: 0.95 }}
  transition={springBouncy}
>
  <AnimatePresence mode="wait" initial={false}>
    <motion.span
      key={loading ? 'loading' : 'idle'}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.15, ease: easeOutQuint }}
    >
      {loading ? 'Connecting…' : '+ Connect'}
    </motion.span>
  </AnimatePresence>
</motion.button>
```

Apply the same `whileTap` + AnimatePresence text swap to the `pending_sent`, `accept`, `decline`, and `accepted` buttons.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/features/network/Network.jsx frontend/src/features/network/ConnectButton/ConnectButton.jsx
git commit -m "feat: Network tab transition, card stagger, ConnectButton morphs"
```

---

## Task 16: Me page section reveal + edit mode transition

**Files:**
- Modify: `frontend/src/features/me/Me.jsx`
- Modify: `frontend/src/features/me/AboutSection/AboutSection.jsx`
- Modify: `frontend/src/features/me/ExperienceSection/ExperienceSection.jsx`
- Modify: `frontend/src/features/me/EducationSection/EducationSection.jsx`
- Modify: `frontend/src/features/me/SkillsSection/SkillsSection.jsx`
- Modify: `frontend/src/features/me/GlazesSection/GlazesSection.jsx`
- Modify: `frontend/src/features/me/LarpHistorySection/LarpHistorySection.jsx`

- [ ] **Step 1: Wrap each section in `Me.jsx` with whileInView motion**

Add imports to `frontend/src/features/me/Me.jsx`:
```js
import { motion, AnimatePresence } from 'framer-motion'
import { easeOutQuint } from '../../lib/motion'
```

Also wrap the `interactionNotice` conditional with AnimatePresence:
```jsx
<AnimatePresence>
  {interactionNotice && (
    <motion.p
      className={`${styles.notice} ${styles.noticeVisible}`}
      role="status"
      aria-live="polite"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: easeOutQuint }}
    >
      {interactionNotice}
    </motion.p>
  )}
</AnimatePresence>
```

Wrap each section component in `<motion.div whileInView={{ opacity:1, y:0 }} initial={{ opacity:0, y:16 }} viewport={{ once:true, margin:'-40px' }} transition={{ duration:0.3, ease:easeOutQuint, delay: N }}>` where N is `0, 0.06, 0.12, 0.18, 0.24, 0.30, 0.36, 0.42` for ProfileHero through GlazesSection.

- [ ] **Step 2: Add edit/display mode transition to AboutSection**

Add imports to `frontend/src/features/me/AboutSection/AboutSection.jsx`:
```js
import { AnimatePresence, motion } from 'framer-motion'
import { easeOutQuint } from '../../../lib/motion'
```

Replace the conditional `{!isEditing ? (...) : (...)}` display/edit toggle:
```jsx
<AnimatePresence mode="wait" initial={false}>
  {!isEditing ? (
    <motion.div
      key="display"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.18, ease: easeOutQuint }}
    >
      {currentUser.about
        ? <p className={styles.bio}>{currentUser.about}</p>
        : <p className={styles.emptyState}>No personal brand narrative yet. Click edit to share your thought leadership journey.</p>
      }
    </motion.div>
  ) : (
    <motion.div
      key="editor"
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      transition={{ duration: 0.18, ease: easeOutQuint }}
    >
      <div className={styles.editorWrapper}>
        <form className={styles.form} onSubmit={handleSave}>
          <textarea
            className={styles.textarea}
            value={bioDraft}
            onChange={event => setBioDraft(event.target.value)}
            autoFocus
            placeholder="Tell your persona's story..."
          />
          <div className={styles.actions}>
            <button type="submit" className={styles.saveBtn}>Save</button>
            <button type="button" className={styles.cancelBtn} onClick={handleCancelEditing}>Cancel</button>
          </div>
        </form>
        <div className={styles.editorHint}>
          <Icon name="sparkles" size={12} />
          <span>Drafting your legend</span>
        </div>
      </div>
    </motion.div>
  )}
</AnimatePresence>
```

Apply the same `AnimatePresence mode="wait"` display/edit swap to ExperienceSection, EducationSection, and SkillsSection (they all follow the same `isEditing` pattern). The exact inner JSX for each section stays the same — only wrap the two branches.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/features/me/Me.jsx frontend/src/features/me/AboutSection/AboutSection.jsx frontend/src/features/me/ExperienceSection/ExperienceSection.jsx frontend/src/features/me/EducationSection/EducationSection.jsx frontend/src/features/me/SkillsSection/SkillsSection.jsx frontend/src/features/me/GlazesSection/GlazesSection.jsx frontend/src/features/me/LarpHistorySection/LarpHistorySection.jsx
git commit -m "feat: Me page section whileInView reveal + edit mode transition"
```

---

## Task 17: JobsPage feedback animations

**Files:**
- Modify: `frontend/src/pages/JobsPage.jsx`

- [ ] **Step 1: Animate success/error state and submit button**

Add imports:
```js
import { AnimatePresence, motion } from 'framer-motion'
import { springBouncy, easeOutQuint } from '../context/../lib/motion'
```

Note: path from `frontend/src/pages/` to `lib/motion.js` is `'../lib/motion'`.

Replace the success/error conditionals:
```jsx
<AnimatePresence mode="wait">
  {status === 'success' && (
    <motion.p
      key="success"
      className={styles.success}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={springBouncy}
    >
      Job updated. You are now larping as &ldquo;{lastJob}&rdquo;.
    </motion.p>
  )}
  {status === 'error' && (
    <motion.p
      key="error"
      className={styles.error}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, x: [0, -6, 6, -4, 4, 0] }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      Job update failed. Your delusion did not persist.
    </motion.p>
  )}
</AnimatePresence>
```

Wrap the submit button with whileTap:
```jsx
<motion.button
  type="submit"
  className={styles.submitBtn}
  disabled={!job.trim() || status === 'updating'}
  whileTap={{ scale: 0.95 }}
  transition={springBouncy}
>
  {status === 'updating' ? 'Rebranding...' : 'Claim Job'}
</motion.button>
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/JobsPage.jsx
git commit -m "feat: JobsPage success bounce + error shake animations"
```

---

## Task 18: NotificationsPage list stagger + section reveal

**Files:**
- Modify: `frontend/src/pages/NotificationsPage.jsx`

- [ ] **Step 1: Animate notification sections and items**

Add imports:
```js
import { AnimatePresence, motion } from 'framer-motion'
import { easeOutQuint } from '../lib/motion'
```

Wrap each `<section className={styles.section}>` with a motion entrance. Replace the two section renders (today + older) — wrap each `<li key={notification.id}>` with:
```jsx
<motion.li
  key={notification.id}
  className={styles.item}
  initial={{ opacity: 0, x: -12 }}
  animate={{ opacity: 1, x: 0 }}
  exit={{ opacity: 0, x: -12 }}
  transition={{ duration: 0.2, ease: easeOutQuint, delay: index * 0.04 }}
>
  {/* existing li content unchanged */}
</motion.li>
```

Update the map signatures to `today.map((notification, index) => ...)` and `older.map((notification, index) => ...)`.

Wrap `<ul className={styles.list}>` with `<AnimatePresence>` in each section.

Wrap each `<section className={styles.section}>` with:
```jsx
<motion.section
  className={styles.section}
  initial={{ opacity: 0, y: 6 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.22, ease: easeOutQuint }}
>
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/NotificationsPage.jsx
git commit -m "feat: NotificationsPage section reveal + list item stagger"
```

---

## Self-Review Notes

- All Framer Motion `AnimatePresence` usages have a unique `key` on the animated child ✓
- `mode="wait"` used where simultaneous enter/exit would overlap ✓
- `mode="popLayout"` used for reaction counter pop (ensures layout recalculates) ✓
- `springBouncy` used for "satirical" interactions (reactions, success, connect); `springSnap` for UI chrome (modal, nav indicator) ✓
- All CSS `:active` transform conflicts removed from PostCard actions ✓
- `reducedMotion="user"` in MotionConfig covers all Framer Motion animations ✓
- CSS `prefers-reduced-motion` covers all CSS keyframe animations ✓
- `viewport={{ once: true }}` on Me sections prevents re-triggering on scroll-up ✓
