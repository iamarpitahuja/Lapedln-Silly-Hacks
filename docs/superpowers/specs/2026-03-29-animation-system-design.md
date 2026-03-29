# Animation System Design — LarpedIn

**Date:** 2026-03-29
**Status:** Approved
**Approach:** Framer Motion at mount/unmount/FLIP boundaries; CSS for hover, stagger-on-mount, shimmer, and accordion

---

## 0. Principles

- **Satirical but simple.** Slight overshoot and bouncy springs on interactive elements (reactions, buttons) reinforce the platform's absurdity. Everything else is clean and fast.
- **Framer Motion only where CSS cannot.** Mount/unmount animations, shared layout transitions, and FLIP list reorders use Framer Motion. Hover states, CSS grid accordions, stagger-on-mount, and shimmer stay in CSS Modules.
- **Accessibility first.** A single `@media (prefers-reduced-motion: reduce)` block in `index.css` zeroes all CSS durations. A `<MotionConfig>` wrapper in `App.jsx` with `{ reducedMotion: "user" }` disables Framer Motion for the same users automatically.

---

## 1. Motion Foundation (`index.css` + `App.jsx`)

### Shared JS spring constants (define once in a new `src/lib/motion.js`)

```js
export const springBouncy = { type: 'spring', stiffness: 400, damping: 15 }
export const springSnap   = { type: 'spring', stiffness: 400, damping: 30 }
export const easeOutQuint = [0.23, 1, 0.32, 1]
```

Import from components as needed instead of inlining transition objects.

### New CSS tokens (added to `:root`)

```css
--spring-bouncy: cubic-bezier(0.34, 1.56, 0.64, 1);   /* satirical overshoot */
--transition-spring: 0.4s var(--spring-bouncy);
```

### Reduced motion block (bottom of `index.css`)

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### `App.jsx` changes

- Import `MotionConfig` from `framer-motion`
- Wrap `<AuthProvider>` tree with `<MotionConfig reducedMotion="user">`
- Install framer-motion: `npm install framer-motion`

---

## 2. Route Transitions (`App.jsx`, `App.module.css`)

- Wrap `<Routes>` with `<AnimatePresence mode="wait">`
- Pass `location` from `useLocation()` as the `key` to `AnimatePresence`
- Each route's page component root becomes `<motion.div className={styles.pageWrap} ...>`

**Variants:**
```js
{ initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0 } }
```
- Enter: `0.22s`, `ease: [0.23, 1, 0.32, 1]` (ease-out-quint)
- Exit: `0.12s`, no translate — fast disappear only
- `mode="wait"`: exit completes before enter begins

`App.module.css` adds `.pageWrap { width: 100%; }`.

---

## 3. TopNav Active Indicator (`TopNav.jsx`, `TopNav.module.css`)

- Remove `tabActive::after` pseudo-element from CSS
- Add a `<motion.div layoutId="activeTab" className={styles.activeIndicator}>` rendered inside whichever `NavLink` is currently active
- Framer Motion's shared layout animation slides the indicator between tabs on route change

**Indicator style (new `.activeIndicator` class):**
```css
.activeIndicator {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2.5px;
  background: currentColor;
  border-radius: 2px 2px 0 0;
}
```

- Tab icons: wrap in `<motion.span>` with `animate={{ scaleY: isActive ? [1, 1.2, 1] : 1 }}` triggered when active state changes. Spring: `stiffness: 400, damping: 10`. The corporate bobblehead nod.

---

## 4. Home 3-Column Stagger (`Home.jsx`)

Replace bare `<aside>` / `<section>` with `<motion.aside>` / `<motion.section>`. Each column animates once on mount:

| Column | initial | animate | delay |
|--------|---------|---------|-------|
| Left rail | `{ opacity: 0, x: -16 }` | `{ opacity: 1, x: 0 }` | `0s` |
| Center feed | `{ opacity: 0, y: 12 }` | `{ opacity: 1, y: 0 }` | `0.08s` |
| Right rail | `{ opacity: 0, x: 16 }` | `{ opacity: 1, x: 0 }` | `0.16s` |

Duration `0.3s`, ease-out-quint. `Home.module.css` unchanged.

---

## 5. Left Rail & Right Rail (CSS only)

### `LeftRail.module.css`

Add `@keyframes railItemIn`:
```css
@keyframes railItemIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
```
Apply to direct children with `:nth-child()` stagger (50ms intervals, up to 6 items).

List row hover: add `transition: transform var(--transition-fast)` + `.row:hover { transform: translateX(3px); }` — the "leaning in" effect.

### `RightRail.module.css`

Same `railItemIn` keyframe with 60ms stagger intervals.

Pill hover lift (extend existing):
```css
.pill:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
}
```

---

## 6. Feed (`Feed.jsx`, `StartPost.jsx`, `LockedPostCard.module.css`)

### StartPost composer (`StartPost.jsx`, `StartPost.module.css`)

- The expand/collapse accordion stays as CSS grid `0fr → 1fr` (already correct pattern)
- Suggestion cards inside: wrap list in `<AnimatePresence>`, each card is `<motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.95 }}>` with `staggerChildren: 0.05s`
- Photo preview on attach: `<motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} transition={{ type:'spring', ...springBouncy }}`

### Feed FLIP (`Feed.jsx`)

- Replace `<ul>` with `<motion.ul>`
- Each post wrapper becomes `<motion.li layout layoutId={post.id} ...>`
- Enter: `initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }}`
- Exit (via `<AnimatePresence>`): `exit={{ opacity:0, scale:0.97 }}`
- Layout transitions use Framer Motion's automatic FLIP when posts reorder on refresh

### LockedPostCard shimmer (`LockedPostCard.module.css`)

```css
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```
Apply to `.fakeLine` and `.fakePara`:
```css
background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
background-size: 200% 100%;
animation: shimmer 2s ease-in-out infinite;
```
Lock icon pulse:
```css
@keyframes lockPulse {
  0%, 100% { transform: scale(1); }
  50%       { transform: scale(1.08); }
}
.lockIcon { animation: lockPulse 3s ease-in-out infinite; }
```

---

## 7. PostCard — Reactions & Accordions (`PostCard.jsx`, `PostCard.module.css`)

### Reaction counter pop

Wrap each counter in `<motion.span key={count}>`:
- Exit: `{ opacity: 0, y: -8 }`
- Enter: `{ opacity: 0, y: 8 }` → `{ opacity: 1, y: 0 }`
- Transition: `{ type:'spring', stiffness:500, damping:25 }`
- Wrapped in `<AnimatePresence mode="popLayout">`

### Reaction icon pop on click

Replace `<button>` on reaction groups with `<motion.button whileTap={{ scale: 1.3 }} transition={{ type:'spring', stiffness:500, damping:15 }}>` — the `--spring-bouncy` overshoot.

### Action bar buttons (Like/Love/Glaze/Relarp/DM)

Replace CSS `:active` transform with `<motion.button whileTap={{ scale: 0.92 }} whileHover={{ y: -1 }}>`. Remove conflicting `transform` from CSS `:active` selectors on `.action`.

### Comment & Re-Larp accordion

- Existing CSS grid accordion stays
- Inside `.expandableInner`, add `<motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.2, delay:0.1 }}>` so content fades in after grid expands
- Comment list items: `<AnimatePresence>` wrapping `<motion.li initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}>` with `staggerChildren: 0.04s` — new comments slide in from the left

---

## 8. Messaging

### `Messaging.jsx` + `Messaging.module.css`

- Chat window pane: when `activeUser` or `activeGroup` changes, wrap `<ChatWindow>` in `<AnimatePresence mode="wait">` with a `key={activeUser?.id ?? activeGroup?.id}`
- Enter: `{ opacity:0, x:20 }` → `{ opacity:1, x:0 }`, `0.2s` ease-out-quint
- Exit: `{ opacity:0, x:-20 }`, `0.12s` — slides left as new convo slides in from right

### `ConversationList.jsx` + `ConversationList.module.css`

- Conversation rows: on initial load, `<AnimatePresence>` + staggered `<motion.div>` entrance (`opacity:0, x:-12` → `opacity:1, x:0`, 40ms stagger)
- Active row highlight: already CSS-based; add `transition: background var(--transition-fast)` if not present
- Row hover: `whileHover={{ x: 2 }}` — subtle lean

### `ComposeModal.jsx` + `ComposeModal.module.css`

- Backdrop: `<motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.15 }}`
- Modal panel: `<motion.div initial={{ opacity:0, scale:0.95, y:8 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95, y:8 }} transition={{ type:'spring', stiffness:400, damping:30 }}`
- Replace current conditional render `{showCompose && <ComposeModal>}` with `<AnimatePresence>` wrapping in `Messaging.jsx`

> Note on `.action:active` removal (Section 7): only remove the `transform: scale(var(--active-scale))` from `.action:active` in PostCard.module.css. Leave all other `.action` styles (colors, borders, `:disabled`, `:hover`) untouched.

### `MessageBubble.jsx` + `MessageBubble.module.css`

- Each bubble: `<motion.div initial={{ opacity:0, scale:0.85, y:8 }} animate={{ opacity:1, scale:1, y:0 }} transition={{ type:'spring', stiffness:400, damping:28 }}`
- Outgoing bubbles: enter from right (`x:12` in initial), incoming from left (`x:-12`)
- Stagger siblings via `staggerChildren: 0.03s` on parent `<motion.div>`

---

## 9. Network (`Network.jsx`, `Network.module.css`, `ConnectButton.jsx`, `ConnectButton.module.css`)

### Tab switch transition

- Wrap active tab content in `<AnimatePresence mode="wait">` keyed by `activeTab`
- Enter: `{ opacity:0, y:8 }` → `{ opacity:1, y:0 }`, `0.18s`
- Exit: `{ opacity:0 }`, `0.1s`

### Grid card stagger on tab change

- Wrap grid in `<motion.div>` with `variants={{ show: { transition: { staggerChildren: 0.05s } } }}`
- Each `<UserCard>` wrapper: `<motion.div variants={{ hidden:{opacity:0,y:12}, show:{opacity:1,y:0} }}>`

### ConnectButton state morphs (`ConnectButton.jsx`)

- `none → pending`: button text swap wrapped in `<AnimatePresence mode="wait">`, text exits up (`y:-8, opacity:0`), enters from below (`y:8 → 0`)
- `pending → accepted`: same swap with a `scale: 1 → 1.15 → 1` spring pop on the whole button using `whileHover` + `animate` key change
- Background/color transitions stay CSS (`transition: all var(--transition-normal)`)

---

## 10. Profile / Me (`Me.jsx`, section modules under `frontend/src/features/me/`)

### Page section reveal

- Each section component (AboutSection, ExperienceSection, EducationSection, SkillsSection, GlazesSection, LarpHistorySection) wrapped in `<motion.section initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true, margin:'-40px' }} transition={{ duration:0.3 }}`
- Stagger via `delay` based on section order (0, 0.06s, 0.12s, 0.18s, …)

### Edit / display mode transition

- When toggling edit mode, the display content exits (`opacity:0, x:-8`) and editor enters (`opacity:0, x:8` → `opacity:1, x:0`) via `<AnimatePresence mode="wait">`
- Save/cancel buttons enter with `opacity:0, y:4` → `opacity:1, y:0` when edit mode opens

---

## 11. Jobs & Notifications

### `JobsPage.jsx` + `JobsPage.module.css`

- Success state: `<motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} transition={{ type:'spring', ...springBouncy }}>` — the "Congratulations, you're now a thought leader" bounce
- Error state: `animate={{ x: [0, -6, 6, -4, 4, 0] }} transition={{ duration:0.4 }}` — horizontal shake
- Submit button: `whileTap={{ scale:0.95 }}`, disabled state fades (`opacity: 0.5`)

### `NotificationsPage.jsx` + `NotificationsPage.module.css`

- List items on load: `<AnimatePresence>` + staggered entrance (`opacity:0, x:-12` → `opacity:1, x:0`, 40ms stagger)
- Section headers: `opacity:0, y:6` → `opacity:1, y:0` on mount
- Read/dismiss: item exits with `opacity:0, height:0, marginBottom:0` using Framer Motion `layout` so remaining items close the gap smoothly

---

## Implementation Order

1. Install framer-motion, add `MotionConfig` + reduced-motion tokens (foundation)
2. Route transitions (App.jsx)
3. TopNav indicator
4. Home stagger
5. LeftRail + RightRail CSS stagger
6. Feed: FLIP + post entrances + StartPost + LockedPostCard shimmer
7. PostCard reactions + accordion fades
8. Messaging: ComposeModal, ChatWindow, ConversationList, MessageBubble
9. Network: tab switch, card stagger, ConnectButton
10. Me: section reveal + edit mode
11. Jobs + Notifications

---

## Files Modified

| File | Change type |
|------|-------------|
| `package.json` | add `framer-motion` |
| `index.css` | new tokens, reduced-motion block |
| `App.jsx` | `MotionConfig`, `AnimatePresence` route wrapper |
| `App.module.css` | `.pageWrap` |
| `TopNav.jsx` / `.module.css` | `layoutId` indicator, icon bounce |
| `Home.jsx` | column stagger |
| `LeftRail.module.css` | `railItemIn` keyframes |
| `RightRail.module.css` | `railItemIn` keyframes, pill lift |
| `Feed.jsx` | `motion.ul`, `motion.li layout`, `AnimatePresence` |
| `StartPost.jsx` / `.module.css` | suggestion card `AnimatePresence` |
| `LockedPostCard.module.css` | shimmer + lock pulse keyframes |
| `PostCard.jsx` / `.module.css` | counter pop, icon whileTap, action morphs, accordion fade, comment stagger |
| `Messaging.jsx` / `.module.css` | chat pane transition |
| `ConversationList.jsx` / `.module.css` | row stagger |
| `ComposeModal.jsx` / `.module.css` | backdrop + modal spring |
| `MessageBubble.jsx` / `.module.css` | bubble entrance |
| `Network.jsx` / `.module.css` | tab transition, card stagger |
| `ConnectButton.jsx` / `.module.css` | state morph |
| `Me.jsx` + section modules | `whileInView` reveal, edit mode swap |
| `JobsPage.jsx` / `.module.css` | success bounce, error shake |
| `NotificationsPage.jsx` / `.module.css` | list stagger, dismiss layout |
