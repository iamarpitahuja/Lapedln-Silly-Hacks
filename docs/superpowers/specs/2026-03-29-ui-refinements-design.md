# UI Refinements Design — 2026-03-29

## Goal

Polish the LarpedIn UI so it reads as a convincing billion-dollar parody platform. Fixes target spacing, alignment, missing icons, SVG artifacts, grammar, and styling across six areas. Approach: targeted CSS + minimal JSX changes. No architectural changes.

---

## Section 1 — Icon.jsx: Add camera icon

**File:** `frontend/src/components/Icon/Icon.jsx`

Add a `camera` entry to the `ICONS` map. The `camera` key is referenced in `StartPost.jsx` (Media button) and `ProfileHero.jsx` (upload overlays) but is absent from the map, causing `Icon` to return `null` and render nothing.

Use a standard camera SVG (stroke-based, consistent with all other icons in the file).

---

## Section 2 — StartPost: Action buttons & input field

**File:** `frontend/src/features/home/Feed/StartPost/StartPost.module.css`

- `.actions`: remove `flex-wrap: wrap`, set `gap: 0`. Action buttons should sit in a single non-wrapping row.
- `.action`: add `flex: 1; justify-content: center` so buttons share width equally and icon+label are centered.
- `.textareaResting:hover`: add `box-shadow: inset 0 1px 3px rgba(0,0,0,0.07)` to signal interactivity.

---

## Section 3 — PostCard: Badge spacing, reaction counts, grammar

**Files:** `PostCard.module.css`, `PostCard.jsx`, `LarpRatingBadge.module.css`

### CSS
- `PostCard.module.css` → `.reactionSummary`: `gap: 10px` → `gap: 16px`
- `LarpRatingBadge.module.css` → `.small`: `padding: 2px 6px` → `padding: 3px 8px`

### JSX
- `PostCard.jsx`: pluralize comment count label:
  ```jsx
  {totalCommentCount} comment{totalCommentCount === 1 ? '' : 's'}
  ```

---

## Section 4 — LeftRail: Gauge shadow, card padding, aura widget

**Files:** `LeftRail.jsx`, `LeftRail.module.css`, `LarpRatingBadge.jsx`

### JSX — LeftRail.jsx
- Remove the duplicate `<p className={styles.auraLabel}>aura growth</p>` line; keep only `"Weekly aura growth"`.

### JSX — LarpRatingBadge.jsx
- Remove `filter: drop-shadow(...)` from the `<svg>` element's inline style.
- Apply the same filter via `style` prop directly on the colored progress `<circle>` only.
- This eliminates the shadow artifact on the gray track circle.

### CSS — LeftRail.module.css
- `.identity`: `padding: 0 16px 16px` → `padding: 8px 16px 16px`
- `.glazers`: `padding: 0 16px 12px` → `padding: 0 16px 16px`
- `.widgetHeader`: `padding: 12px 16px 8px` → `padding: 14px 16px 8px`

---

## Section 5 — RightRail: Trending numbers & buzzword pills

**File:** `frontend/src/features/home/RightRail/RightRail.module.css`

- `.listNum`: `min-width: 16px` → `min-width: 20px`; add `flex-shrink: 0`
- `.buzzList`: `flex-direction: column` → `flex-direction: row; flex-wrap: wrap`
- `.buzzItem`: replace `padding: 2px 0` with `padding: 4px 10px`; add `background: rgba(0,0,0,0.06); border-radius: 999px; font-size: 12px`

---

## Section 6 — TopNav: Search alignment, icon spacing, notification dot

**File:** `frontend/src/components/TopNav/TopNav.module.css`

- `.searchIcon`: replace current positioning with `top: 50%; transform: translateY(-50%)` to guarantee vertical centering inside the input
- `.tab`: `padding: 0 12px` → `padding: 0 14px` for equal inter-icon gaps
- `.unreadDot`: `width/height: 8px` → `6px`; `top: -2px` → `-1px`; `right: -4px` → `-3px`; `border: 1.5px solid #fff` → `border: 1px solid #fff`

---

## Files Changed

| File | Change type |
|---|---|
| `src/components/Icon/Icon.jsx` | JSX — add camera icon |
| `src/features/home/Feed/StartPost/StartPost.module.css` | CSS — action row, textarea hover |
| `src/features/home/Feed/PostCard/PostCard.jsx` | JSX — comment count pluralization |
| `src/features/home/Feed/PostCard/PostCard.module.css` | CSS — reaction gap |
| `src/components/LarpRatingBadge/LarpRatingBadge.jsx` | JSX — move SVG drop-shadow to arc only |
| `src/components/LarpRatingBadge/LarpRatingBadge.module.css` | CSS — small badge padding |
| `src/features/home/LeftRail/LeftRail.jsx` | JSX — remove duplicate label |
| `src/features/home/LeftRail/LeftRail.module.css` | CSS — identity/glazers/header padding |
| `src/features/home/RightRail/RightRail.module.css` | CSS — listNum, buzzword pills |
| `src/components/TopNav/TopNav.module.css` | CSS — search icon, tab padding, unread dot |
