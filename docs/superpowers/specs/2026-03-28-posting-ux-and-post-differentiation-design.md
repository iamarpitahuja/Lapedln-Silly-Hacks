# Posting UX & Post Differentiation — Design Spec

**Date:** 2026-03-28
**Status:** Approved

---

## Problem Statement

Two UX issues on the home feed:

1. The "Start Post" input is a fake button that opens a separate composer form — the jump from a text-field-looking element to a full form is jarring and unnatural.
2. There is no visual distinction between the current user's posts and others' posts in the feed, and action buttons are the same regardless of authorship.

---

## Design

### 1. StartPost — Inline Focus Expansion

Replace the fake-input `<button>` with a real `<textarea>`. The composer footer (post type selector + Post/Cancel buttons) renders conditionally based on whether the textarea is focused or has content.

**State changes:**
- Remove `isComposerOpen` state, `openComposer()`, and `closeComposer()` functions
- Add `isFocused` state (boolean)
- Composer footer is shown when `isFocused || draft.length > 0`

**Behavior:**
- On textarea focus: footer appears, textarea expands
- On blur with empty content: footer hides, textarea collapses to resting state (1–2 rows)
- Action buttons (Celebrate fake promotion, Announce stealth startup, etc.) focus the textarea and pre-select the corresponding post type — same as before
- `Ctrl/Cmd+Enter` shortcut to publish is preserved
- Cancel button blurs the textarea and clears the draft

**Structure:**
- The `<form>` is always rendered (no conditional block)
- The textarea is always present and editable
- The footer (type selector + actions) is conditionally shown via CSS class or inline conditional

---

### 2. PostCard — Own-Post Differentiation

`Feed.jsx` computes `isOwnPost` per post and passes it as a prop to `PostCard`.

**In `Feed.jsx`:**
```jsx
isAccessible(post.author.name) ? (
  <PostCard key={post.id} post={post} isOwnPost={post.author.name === currentUser.name} />
) : (
  <LockedPostCard key={post.id} />
)
```

**Visual treatment (`isOwnPost === true`):**
- `· You` label rendered inline after the author name in the name row
- CSS modifier class `.cardOwn` on the card root: left accent border (brand color) + very subtle background tint
- X/dismiss button hidden (not rendered)
- Glaze button hidden (cannot glaze your own post)
- Remaining action buttons (Comment, Re-Larp, DM) stay and distribute evenly

**Others' posts (`isOwnPost === false`):**
- No changes — X button, Glaze button, and all actions render as before

---

## Out of Scope

- Editing or deleting own posts
- A dedicated "My Posts" view
- Any changes to LockedPostCard
