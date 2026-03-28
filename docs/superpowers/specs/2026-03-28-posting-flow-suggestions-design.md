# Posting Flow — Suggestion Cards Redesign

**Date:** 2026-03-28
**Status:** Approved
**Scope:** `frontend/src/features/home/Feed/StartPost/StartPost.jsx` + `StartPost.module.css`

---

## Problem

The current posting flow uses a template system with fill-in-the-blank slots. After clicking an action button, the composer enters "template mode": a preview renders with `____LABEL____` placeholders, and a separate slot editor appears below for filling each blank. This two-area interaction is confusing and clunky.

---

## Solution

Replace the template/slot system with inline suggestion cards. Clicking an action reveals 2–3 fully-written post suggestions as clickable cards. Selecting one loads its text into the textarea for free editing before posting.

---

## Flow

1. User clicks an action button (e.g. "Celebrate fake promotion")
2. 2–3 suggestion cards slide in below the action bar
3. User clicks a card → text loads into the textarea, cards collapse, composer footer expands
4. User edits freely and posts
5. Clicking the same action again, or clicking Cancel, dismisses the cards
6. Clicking a different action while cards are open swaps to that action's suggestions

---

## Data Shape

Each entry in `ACTIONS` replaces its `template` array with a `suggestions` array of 2–3 complete post strings:

```js
{
  icon: 'party',
  label: 'Celebrate fake promotion',
  postType: 'Career Lore',
  suggestions: [
    'Thrilled to share that I have accepted a role as Chief Vibe Strategist at Nimbus Dynamics. Grateful for everyone who believed in my journey.',
    'Honored to announce my promotion to Senior Prompt Engineer. This one goes out to the mentors who saw my potential before I did.',
    'Big news: I am joining Quantum Synergy Group as Principal Alignment Wizard. The ecosystem is ready. I am ready. Let us build.',
  ]
}
```

All four existing actions (fake promotion, stealth startup, leadership insight, journey reflection) get updated suggestions.

---

## State Changes

**Removed:**
- `activeTemplate` — no longer needed
- `slotValues` — no longer needed
- `activeSlotKey` — no longer needed

**Added:**
- `activeSuggestions` — `string[]`, the current action's suggestions (empty array = no cards showing)

**Removed helper functions:**
- `getTemplateSlots`
- `buildTemplateDraft`
- `TEMPLATE_BLANK`

---

## Component Structure

No new files. All changes in `StartPost.jsx` and `StartPost.module.css`.

**JSX:** The `templateBuilder` block is replaced with a `suggestionCards` block that renders when `activeSuggestions.length > 0`. Positioned between the photo preview and the expandable footer. Each card is a `<button>` showing the full post text.

**CSS:** Cards get a slide-in animation, border, and hover state consistent with the existing card aesthetic. No layout changes to the action bar or composer footer.

---

## Out of Scope

- AI-generated suggestions (possible future enhancement)
- Changes to the post type selector, photo upload, or submit flow
- Any backend changes
