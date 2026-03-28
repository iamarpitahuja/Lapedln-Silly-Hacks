# LarpedIn — Home Page Design Spec

## Overview

LarpedIn is a LinkedIn parody app built with Vite + React. The design is 85% real LinkedIn polish, 15% absurdist satire — serious layout, absurd content. This spec covers the Home page and app shell only. Other pages (J*bs, Me, Network, Messaging, Notifications) will be specced separately once the Home page is finalized.

## Project Setup

- **Framework:** Vite + React
- **Location:** `frontend/` directory in repo root
- **Styling:** CSS Modules (one `.module.css` per component)
- **Routing:** React Router v6 — all routes stubbed, only `/` (Home) wired up
- **State:** React Context (`MockDataContext`) providing all mock data and global state

## Architecture

```
frontend/
├── src/
│   ├── context/
│   │   └── MockDataContext.jsx       # Mock data + global state
│   ├── features/
│   │   └── home/                    # All Home page components
│   ├── components/
│   │   └── layout/                  # TopNav shell
│   ├── pages/
│   │   └── HomePage.jsx             # Composes Left Rail + Feed + Right Rail
│   └── main.jsx
```

## MockDataContext

Provides the following to all components:

- `currentUser` — object with: `name`, `headline`, `avatar`, `larpRating` (number), `persona` (string), `stats`
- `feedPosts[]` — array of post objects (see Post Card section)
- `isAccessible(targetRating)` — returns `false` if `targetRating > currentUser.larpRating`

**Current user defaults:**
```
name: "Arjun Malhotra"
headline: "Incoming Quant VC Product Strategist"
larpRating: 67.2
persona: "Stealth Founder / Ex-McKinsey Adjacent"
```

## App Shell — TopNav

Sticky top navigation bar, full width, white background, LinkedIn-blue accents.

**Left side:**
- LarpedIn logo (bold wordmark, "in" in blue box)
- Tagline: "Pretend professionally." in small gray type beneath logo
- Search bar with rotating placeholder text:
  - "Search people, titles, delusions"
  - "Find founders, thought leaders, and frauds"
  - "Search by roleplay archetype"

**Center tabs (icons + labels):**
- Home, My Network, J*bs, Messaging, Notifications, Me
- Only Home is active/wired; others render the tab but route to a stub "coming soon" state
- Hover tooltips:
  - Home → "See what everyone is pretending to accomplish"
  - My Network → "People you allegedly know"
  - J*bs → "Skip the inconvenient parts"
  - Messaging → "Cold outreach, hot delusion"
  - Notifications → "Validation center"
  - Me → "Curate your myth"

**Right side:** Avatar icon for current user

## Home Page Layout

Three-column layout (desktop), matching LinkedIn's proportions:
- Left rail: ~25% width, sticky
- Center feed: ~50% width, scrollable
- Right rail: ~25% width, sticky

---

## Left Rail

### Profile Identity Card
- Cover photo strip (gradient blue placeholder)
- Avatar (circular, overlapping cover)
- Name (bold)
- Headline
- LarpRating circular gauge badge — shows numeric value (e.g. `67.2`) with label below (e.g. "Aspirational"), colored ring reflecting tier
- Current persona in italic gray: "Stealth Founder / Ex-McKinsey Adjacent"

**LarpRating tiers:**
| Range | Label |
|---|---|
| < 50 | Regional |
| 50–69 | Aspirational |
| 70–84 | Terminally employable |
| 85–94 | Mythic |
| 95+ | Post-human |

**Stats beneath card:**
- "Viewed by 413 recruiters in the last 7 hours"
- "Impression velocity: Elite"

### "Who's glazing you" Widget
- Title: "Who's glazing you"
- 2–3 rows: avatar + name + glaze snippet (e.g. "You! glazing you.", "Incoming Quant VC Product Strategist")

### "Weekly aura growth" Widget
- Title: "Weekly aura growth"
- Value: `87.3` with green percentage change `+10.91%`
- "See more →" link

---

## Center Feed

### Start a Post Card
- Current user avatar (left)
- Clickable text area with rotating placeholder:
  - "What impossible milestone are you reflecting on today?"
  - "Share a lesson from your made-up founder arc"
  - "Announce a role you technically never interviewed for"
- Quick action buttons (icon + label):
  - Post
  - Celebrate fake promotion
  - Announce stealth startup
  - Share leadership insight
  - Reflect on your journey

### Post Cards

Each post card contains:

**Header:**
- Avatar
- Name (bold, clickable)
- Headline (gray)
- LarpRating badge (small, inline)
- Post type label/tag — one of: Career Lore, Founder Reflection, Corporate Trauma Dump, Humblebrag, Thought Leadership Incident, Stealth Build Update, Aura Farming
- Timestamp ("1h •")
- More options (•••) + dismiss (×) buttons

**Body:**
- Post text content (mock copy in exaggerated LinkedIn voice)

**Reactions bar:**
- Emoji reaction icons + count (e.g. "6 • 9 comments")

**Action buttons:**
- Glaze | Comment | Re-Larp | DM

**Suggested Glazes strip** (below action buttons):
- Label: "Suggested Glazes"
- Horizontal row of one-tap pill buttons. Examples:
  - "This is huge. So well deserved."
  - "Your trajectory needs to be studied."
  - "Absolutely generational aura."
  - "The clarity, the vision, the execution."
  - "Incredible leadership energy here."
- **Tone slider** beneath pills: left label "Professional" → center "Founder" → right "Unnaturally supportive"
  - Sliding changes the glaze pill copy to match the selected tone

**Mock feed contains at minimum 5 posts** with varied post types and content.

**LarpRating gating:** If a post's author has a higher LarpRating than the current user, the post does not appear in the feed at all.

---

## Right Rail

### Trending Delusions Widget
- Title: "Trending Delusions"
- Numbered list of 4 items (e.g. "Career Loring", "Conivroation", "Trending delusions", "Usw emmied")
- "See more" link

### Today's Buzzwords Widget
- Title: "Today's Buzzwords"
- 2 buzzword items
- "See more" link

### Locked Posts Widget
- Title: "Top posts you cannot view because of your LarpRating"
- 2 blurred post card previews with lock icon overlay
- Text on each: "This content is above your professional aura."

---

## Visual Style

- White background, LinkedIn-blue (`#0A66C2`) for accents, active states, and buttons
- Sans-serif font (system font stack or Inter)
- Cards have subtle box-shadow and rounded corners (`8px`)
- LarpRating badge: gradient ring (blue→purple for Aspirational tier), white fill, bold number
- Tone slider: custom styled range input with LinkedIn-blue thumb
- Blurred locked posts: `filter: blur(6px)` with centered lock icon

---

## Out of Scope (this phase)

- J*bs, Me, Network, Messaging, Notifications pages (stubbed only)
- Post creation modal (the "Start a post" card is present but clicking it does nothing)
- Real comment threading
- Backend integration
- Mobile layout
- LarpMaxxing simulation
- Persona switching UI
