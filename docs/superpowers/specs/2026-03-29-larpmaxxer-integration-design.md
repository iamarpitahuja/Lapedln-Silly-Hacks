# LarpMaxxer Integration Design

**Date:** 2026-03-29
**Branch target:** `back+Front`

---

## Overview

Integrate the LarpMaxxer training simulation from `larpmaxxer-integration` into the main `back+Front` branch. The logic engine is ported verbatim; all UI components are discarded and rebuilt in JSX with CSS modules to match back+Front's LinkedIn-clone aesthetic.

---

## What Gets Ported vs Rebuilt

### Copied verbatim (logic only, no UI changes)
- `frontend/src/features/larpmaxxer/hooks/` — `useSimulation` and all hook dependencies
- `frontend/src/features/larpmaxxer/engine/` — simulation engine, unlock logic
- `frontend/src/content/characters.ts` — character definitions
- `frontend/src/content/personas.ts` — persona definitions
- `frontend/src/content/scenarios.ts` + `scenarios/` — all scenario files
- `frontend/src/context/UserContext.tsx` — mock state: `personaId`, `larpRating`, `completedScenarios`, `updateLarpRating`, `recordScenarioCompletion`, `setLastSessionResult`

### Discarded and rebuilt as JSX + CSS modules
All UI components under `frontend/src/features/larpmaxxer/components/`, `features/larpmaxxer/index.tsx`, and `pages/PersonaSelect.tsx`.

---

## Context & State

`UserContext` is added to `App.jsx`, wrapping the authenticated routes only (inside the session check in `AppRoutes`). It sits alongside `MockDataProvider`. State is mock-only for now — `larpRating` in context is independent of Supabase `profiles.larp_rating`.

```jsx
// inside AppRoutes, when session exists:
<UserProvider>
  <MockDataProvider>
    ...
  </MockDataProvider>
</UserProvider>
```

---

## Routing

Two new full-screen routes added to `App.jsx`, inside the auth-guarded block but **outside the TopNav wrapper**:

| Route | Component | Notes |
|---|---|---|
| `/larpmaxxer` | `LarpMaxxer` | Full-screen, no TopNav, `onExitTraining` → `navigate('/me')` |
| `/persona-select` | `PersonaSelect` | Full-screen, no TopNav |

Entry point: a "Enter Training" button added to the existing `LarpStatus` section on `/me`.

---

## UI Rebuild

### Design language
Match back+Front conventions exactly:
- Background: `#f3f2ef`
- Cards: white, `border: 1px solid #e0e0e0`, `border-radius: 8px`
- Primary blue: `#0a66c2`
- Typography: same font sizes/weights as `PostCard`, `LarpStatus`
- CSS modules (`.module.css` per component), no inline styles

### Layout
3-panel structure preserved:
- **Left rail** (25%, max 280px): scenario list
- **Center** (flex 1): active screen, switches based on simulation state
- **Right rail** (25%, max 280px): character info + mood meters, only shown during active/event/summary

### Components to rebuild

| Component | Purpose |
|---|---|
| `LarpMaxxer` (index) | Root: top bar, 3-panel layout, state routing |
| `ScenarioPanel` | Left rail — scrollable list of scenario cards |
| `EntryCard` | Landing screen before entering simulation |
| `PreBrief` | Scenario briefing screen |
| `DialogueScreen` | Main dialogue view container |
| `DialogueBubble` | Individual message bubble (character vs user) |
| `ResponseOptions` | Container for response choices |
| `ResponseCard` | Single selectable response option |
| `CharacterPanel` | Right rail — character avatar, bio, meters |
| `MeterBar` | Single labeled progress bar (enthusiasm, cringe, etc.) |
| `EvaluationFlash` | Overlay feedback flash after response selection |
| `EventCard` | Mid-scenario event interrupt screen |
| `SummaryScreen` | End-of-session results and replay options |

---

## Out of Scope

- Supabase sync for `larpRating` (mock only for now)
- ElevenLabs TTS / voice features
- Backend roleplay API integration (`/roleplay/chat`)
- TypeScript migration of rebuilt components

