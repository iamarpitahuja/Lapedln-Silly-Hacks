# UI Refinements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish LarpedIn's UI across six areas so it reads as a convincing billion-dollar parody platform — fixing a missing icon, spacing/padding, SVG artifact, grammar, and buzzword pills.

**Architecture:** Surgical changes only — CSS module edits for spacing/styling, minimal JSX edits for camera icon, SVG filter, grammar pluralization, and a duplicate label. No new components. No architectural changes.

**Tech Stack:** React, Vite, CSS Modules, Vitest + Testing Library

---

## File Map

| File | What changes |
|---|---|
| `src/components/Icon/Icon.jsx` | Add `camera` entry to `ICONS` map |
| `src/features/home/Feed/StartPost/StartPost.module.css` | Action row layout + textarea hover shadow |
| `src/features/home/Feed/PostCard/PostCard.jsx` | Pluralize comment count label |
| `src/features/home/Feed/PostCard/PostCard.module.css` | Reaction summary gap |
| `src/components/LarpRatingBadge/LarpRatingBadge.jsx` | Move SVG drop-shadow to progress arc only |
| `src/components/LarpRatingBadge/LarpRatingBadge.module.css` | Small badge padding |
| `src/features/home/LeftRail/LeftRail.jsx` | Remove duplicate aura label |
| `src/features/home/LeftRail/LeftRail.module.css` | Identity/glazers/widget header padding |
| `src/features/home/RightRail/RightRail.module.css` | Trending number width + buzzword pill styles |
| `src/components/TopNav/TopNav.module.css` | Search icon centering, tab padding, unread dot |

All paths are relative to `frontend/`.

---

## Task 1: Add camera icon to Icon.jsx

**Files:**
- Modify: `frontend/src/components/Icon/Icon.jsx`

The `camera` key is missing from `ICONS`. `Icon` returns `null` for unknown names, so the Media button in StartPost and the upload overlays in ProfileHero render nothing.

- [ ] **Step 1: Write a failing test**

Add to a new `describe` block at the bottom of `frontend/src/components/Icon/Icon.jsx` — or create `frontend/src/components/Icon/Icon.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Icon from './Icon'

describe('Icon', () => {
  it('renders a camera icon without returning null', () => {
    const { container } = render(<Icon name="camera" size={20} />)
    expect(container.firstChild).not.toBeNull()
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && npx vitest run src/components/Icon/Icon.test.jsx
```

Expected: FAIL — `container.firstChild` is `null` because `camera` is not in `ICONS`.

- [ ] **Step 3: Add the camera icon to Icon.jsx**

Inside the `ICONS` object in `frontend/src/components/Icon/Icon.jsx`, add after the `pencil` entry:

```jsx
camera: (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>
  </svg>
),
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd frontend && npx vitest run src/components/Icon/Icon.test.jsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd frontend && git add src/components/Icon/Icon.jsx src/components/Icon/Icon.test.jsx
git commit -m "feat: add camera icon to Icon component"
```

---

## Task 2: StartPost action row layout + textarea hover

**Files:**
- Modify: `frontend/src/features/home/Feed/StartPost/StartPost.module.css`

No JSX changes needed — the Media button already uses `<Icon name="camera">`, which now renders correctly after Task 1.

- [ ] **Step 1: Verify existing tests still pass before touching CSS**

```bash
cd frontend && npx vitest run src/features/home/Feed/StartPost/StartPost.test.jsx
```

Expected: all 8 tests PASS (CSS changes don't affect behavior tests, but confirm baseline).

- [ ] **Step 2: Update `.actions` in StartPost.module.css**

Replace:
```css
.actions {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  padding-top: 10px;
  margin-top: 10px;
}
```

With:
```css
.actions {
  display: flex;
  gap: 0;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  padding-top: 10px;
  margin-top: 10px;
}
```

- [ ] **Step 3: Update `.action` to share width equally and center content**

Replace:
```css
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
```

With:
```css
.action {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 4px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.6);
  transition: background 0.15s;
}
```

- [ ] **Step 4: Add inset shadow to `.textareaResting:hover`**

Replace:
```css
.textareaResting:hover {
  background: rgba(0, 0, 0, 0.04);
  border-color: rgba(0, 0, 0, 0.1);
}
```

With:
```css
.textareaResting:hover {
  background: rgba(0, 0, 0, 0.04);
  border-color: rgba(0, 0, 0, 0.1);
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.07);
}
```

- [ ] **Step 5: Run tests to confirm no regressions**

```bash
cd frontend && npx vitest run src/features/home/Feed/StartPost/StartPost.test.jsx
```

Expected: all 8 tests PASS

- [ ] **Step 6: Commit**

```bash
cd frontend && git add src/features/home/Feed/StartPost/StartPost.module.css
git commit -m "style: fix StartPost action row layout and textarea hover"
```

---

## Task 3: PostCard — reaction gap + comment count grammar

**Files:**
- Modify: `frontend/src/features/home/Feed/PostCard/PostCard.jsx`
- Modify: `frontend/src/features/home/Feed/PostCard/PostCard.module.css`

- [ ] **Step 1: Write a failing test for comment pluralization**

Add to `frontend/src/features/home/Feed/PostCard/PostCard.test.jsx` inside the existing `describe('PostCard', ...)` block:

```jsx
it('shows "1 comment" (singular) when there is exactly one comment', () => {
  const singleCommentPost = {
    ...basePost,
    reactions: { count: 1, comments: 1, relarps: 0 },
  }
  renderCard(singleCommentPost)
  expect(screen.getByText('1 comment')).toBeInTheDocument()
  expect(screen.queryByText('1 comments')).not.toBeInTheDocument()
})

it('shows "2 comments" (plural) when there are multiple comments', () => {
  const multiCommentPost = {
    ...basePost,
    reactions: { count: 3, comments: 3, relarps: 0 },
  }
  renderCard(multiCommentPost)
  expect(screen.getByText('3 comments')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd frontend && npx vitest run src/features/home/Feed/PostCard/PostCard.test.jsx
```

Expected: the two new tests FAIL — currently renders `"1 comments"`.

- [ ] **Step 3: Fix the grammar in PostCard.jsx**

Find this line in `frontend/src/features/home/Feed/PostCard/PostCard.jsx` (inside `.commentSummary`):

```jsx
<span className={styles.commentCount} aria-hidden="true">{totalCommentCount} comments</span>
```

Replace with:

```jsx
<span className={styles.commentCount} aria-hidden="true">{totalCommentCount} comment{totalCommentCount === 1 ? '' : 's'}</span>
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend && npx vitest run src/features/home/Feed/PostCard/PostCard.test.jsx
```

Expected: all tests PASS

- [ ] **Step 5: Increase reaction summary gap in PostCard.module.css**

Replace:
```css
.reactionSummary {
  display: flex;
  align-items: center;
  gap: 10px;
}
```

With:
```css
.reactionSummary {
  display: flex;
  align-items: center;
  gap: 16px;
}
```

- [ ] **Step 6: Commit**

```bash
cd frontend && git add src/features/home/Feed/PostCard/PostCard.jsx src/features/home/Feed/PostCard/PostCard.module.css src/features/home/Feed/PostCard/PostCard.test.jsx
git commit -m "fix: pluralize comment count, increase reaction icon spacing"
```

---

## Task 4: LarpRatingBadge — fix SVG drop-shadow + small badge padding

**Files:**
- Modify: `frontend/src/components/LarpRatingBadge/LarpRatingBadge.jsx`
- Modify: `frontend/src/components/LarpRatingBadge/LarpRatingBadge.module.css`

The `filter: drop-shadow(...)` is currently applied to the entire `<svg>`, which causes the gray track circle to also cast a shadow, producing a dark artifact at the top of the gauge. Moving the filter to only the colored progress arc fixes this.

- [ ] **Step 1: Move the drop-shadow filter in LarpRatingBadge.jsx**

Find the large gauge `return` block. Replace:

```jsx
<svg width="100" height="100" viewBox="0 0 100 100" style={{ filter: `drop-shadow(0 0 5px ${color}66)` }}>
  <circle
    cx="50" cy="50" r={radius}
    fill="none"
    stroke="#e8e8e8"
    strokeWidth="10"
  />
  <circle
    className={styles.gaugeCircle}
    cx="50" cy="50" r={radius}
    fill="none"
    stroke={color}
    strokeWidth="10"
    strokeDasharray={`${progress} ${circumference}`}
    strokeLinecap="round"
    transform="rotate(-90 50 50)"
  />
</svg>
```

With:

```jsx
<svg width="100" height="100" viewBox="0 0 100 100">
  <circle
    cx="50" cy="50" r={radius}
    fill="none"
    stroke="#e8e8e8"
    strokeWidth="10"
  />
  <circle
    className={styles.gaugeCircle}
    cx="50" cy="50" r={radius}
    fill="none"
    stroke={color}
    strokeWidth="10"
    strokeDasharray={`${progress} ${circumference}`}
    strokeLinecap="round"
    transform="rotate(-90 50 50)"
    style={{ filter: `drop-shadow(0 0 5px ${color}66)` }}
  />
</svg>
```

- [ ] **Step 2: Increase small badge padding in LarpRatingBadge.module.css**

Replace:
```css
.small {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  border: 1.5px solid;
  border-radius: 5px;
  padding: 2px 6px;
  vertical-align: middle;
  line-height: 1;
  transition: all var(--transition-fast);
  cursor: help;
}
```

With:
```css
.small {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  border: 1.5px solid;
  border-radius: 5px;
  padding: 3px 8px;
  vertical-align: middle;
  line-height: 1;
  transition: all var(--transition-fast);
  cursor: help;
}
```

- [ ] **Step 3: Run full test suite to confirm no regressions**

```bash
cd frontend && npx vitest run
```

Expected: all tests PASS

- [ ] **Step 4: Commit**

```bash
cd frontend && git add src/components/LarpRatingBadge/LarpRatingBadge.jsx src/components/LarpRatingBadge/LarpRatingBadge.module.css
git commit -m "fix: move gauge drop-shadow to arc only, increase small badge padding"
```

---

## Task 5: LeftRail — duplicate label + card padding

**Files:**
- Modify: `frontend/src/features/home/LeftRail/LeftRail.jsx`
- Modify: `frontend/src/features/home/LeftRail/LeftRail.module.css`

- [ ] **Step 1: Remove duplicate aura label in LeftRail.jsx**

Find this block in `frontend/src/features/home/LeftRail/LeftRail.jsx`:

```jsx
<div>
  <p className={styles.auraLabel}>Weekly aura growth</p>
  <p className={styles.auraLabel}>aura growth</p>
</div>
```

Replace with:

```jsx
<div>
  <p className={styles.auraLabel}>Weekly aura growth</p>
</div>
```

- [ ] **Step 2: Increase identity top padding in LeftRail.module.css**

Replace:
```css
.identity {
  padding: 0 16px 16px;
  text-align: center;
}
```

With:
```css
.identity {
  padding: 8px 16px 16px;
  text-align: center;
}
```

- [ ] **Step 3: Increase glazers bottom padding**

Replace:
```css
.glazers {
  padding: 0 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
```

With:
```css
.glazers {
  padding: 0 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
```

- [ ] **Step 4: Increase widget header top padding**

Replace:
```css
.widgetHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px 8px;
}
```

With:
```css
.widgetHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px 8px;
}
```

- [ ] **Step 5: Run full test suite**

```bash
cd frontend && npx vitest run
```

Expected: all tests PASS

- [ ] **Step 6: Commit**

```bash
cd frontend && git add src/features/home/LeftRail/LeftRail.jsx src/features/home/LeftRail/LeftRail.module.css
git commit -m "fix: remove duplicate aura label, increase LeftRail card padding"
```

---

## Task 6: RightRail — trending number width + buzzword pills

**Files:**
- Modify: `frontend/src/features/home/RightRail/RightRail.module.css`

- [ ] **Step 1: Tighten trending list number column**

Replace:
```css
.listNum {
  color: rgba(0, 0, 0, 0.5);
  font-size: 12px;
  min-width: 16px;
}
```

With:
```css
.listNum {
  color: rgba(0, 0, 0, 0.5);
  font-size: 12px;
  min-width: 20px;
  flex-shrink: 0;
}
```

- [ ] **Step 2: Make buzzword list flow as wrapping row**

Replace:
```css
.buzzList {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
}
```

With:
```css
.buzzList {
  list-style: none;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}
```

- [ ] **Step 3: Style buzzword items as pills**

Replace:
```css
.buzzItem {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.9);
  padding: 2px 0;
}
```

With:
```css
.buzzItem {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.9);
  padding: 4px 10px;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 999px;
}
```

- [ ] **Step 4: Run full test suite**

```bash
cd frontend && npx vitest run
```

Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
cd frontend && git add src/features/home/RightRail/RightRail.module.css
git commit -m "style: add pill styling to buzzwords, fix trending number spacing"
```

---

## Task 7: TopNav — search icon centering, tab padding, unread dot

**Files:**
- Modify: `frontend/src/components/TopNav/TopNav.module.css`

- [ ] **Step 1: Fix search icon vertical centering**

Replace:
```css
.searchIcon {
  position: absolute;
  left: 12px;
  width: 16px;
  height: 16px;
  color: rgba(0, 0, 0, 0.5);
  pointer-events: none;
  transition: all var(--transition-fast);
}
```

With:
```css
.searchIcon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: rgba(0, 0, 0, 0.5);
  pointer-events: none;
  transition: color var(--transition-fast);
}
```

- [ ] **Step 2: Increase tab padding for equal icon spacing**

Replace:
```css
.tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 0 12px;
  color: rgba(0, 0, 0, 0.6);
  text-decoration: none;
  border-bottom: 2.5px solid transparent;
  transition: all var(--transition-fast);
  min-width: 80px;
  position: relative;
}
```

With:
```css
.tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 0 14px;
  color: rgba(0, 0, 0, 0.6);
  text-decoration: none;
  border-bottom: 2.5px solid transparent;
  transition: all var(--transition-fast);
  min-width: 80px;
  position: relative;
}
```

- [ ] **Step 3: Reduce and reposition the unread dot**

Replace:
```css
.unreadDot {
  position: absolute;
  top: -2px;
  right: -4px;
  width: 8px;
  height: 8px;
  background: #e53935;
  border-radius: 50%;
  border: 1.5px solid #fff;
}
```

With:
```css
.unreadDot {
  position: absolute;
  top: -1px;
  right: -3px;
  width: 6px;
  height: 6px;
  background: #e53935;
  border-radius: 50%;
  border: 1px solid #fff;
}
```

- [ ] **Step 4: Run full test suite**

```bash
cd frontend && npx vitest run
```

Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
cd frontend && git add src/components/TopNav/TopNav.module.css
git commit -m "style: fix search icon centering, equal tab spacing, tighten unread dot"
```
