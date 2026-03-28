# LarpedIn — Me Page Design Spec

## Overview

The Me page is LarpedIn's profile page — a full single-column, scrollable showcase of the current user's professional myth. It functions as a self-editing control panel: edit buttons are present everywhere but inert (no modals, no state changes). The tone is 85% real LinkedIn polish, 15% absurdist satire.

## Architecture

```
src/features/me/
├── Me.jsx                    # Top-level page, composes all sections
├── Me.module.css
├── ProfileHero/              # Cover + avatar + name + LarpRating + persona
├── LarpStatus/               # Active persona banner + opportunity types
├── AboutSection/             # About card with mock bio
├── ExperienceSection/        # Work history with absurdist roles
├── EducationSection/         # Education with parody institutions
├── SkillsSection/            # Skills with fake endorsement counts
├── LarpHistorySection/       # LarpedIn-exclusive persona timeline
└── GlazesSection/            # Received glazes (sycophantic testimonials)
```

**Routing:** `/me` in `App.jsx` replaces `<StubPage title="Me" />` with `<Me />`.

**Data:** All sections consume `useMockData()` (`currentUser`). No new context or mock data additions required — mock content for Experience, Education, Skills, Larp History, and Glazes is defined as static constants within their respective components.

## Layout

Single-column, centered, `max-width: 700px`, consistent with LinkedIn's profile layout. TopNav is inherited from the app shell. Sections stack vertically with `16px` gap between cards.

## Sections

### ProfileHero

- Cover photo strip: gradient blue placeholder (`#0A66C2` → `#004182`)
- Circular avatar overlapping cover: initials via `getInitials(currentUser.name)` (reuses `src/utils/strings.js`)
- Name (bold, large)
- Headline (gray)
- `LarpRatingBadge` component (reused from shared components)
- Current persona in italic gray: e.g. *"Stealth Founder / Ex-McKinsey Adjacent"*
- Sub-stat line: "413 recruiters are monitoring your trajectory."
- Fake edit pencil icon in card top-right (inert)

### LarpStatus

- Green banner styled like LinkedIn's "Open to Work"
- Title: "Open to Larping"
- Active persona label: e.g. "Stealth Founder / Ex-McKinsey Adjacent"
- Row of absurd opportunity type pills:
  - "Fractional Visionary"
  - "Keynote Speaker at Events I Have Not Been Invited To"
  - "Angel Investor in Ideas I Haven't Had Yet"
  - "Interim Thought Leader"
- Two CTA buttons (both inert):
  - "Switch Persona" (outlined)
  - "Update Larp Status" (blue filled)

### AboutSection

- Card title: "About", fake edit pencil (inert)
- Mock bio in exaggerated LinkedIn voice:
  > "I build at the intersection of ambiguity and momentum. My superpower is turning vague intuitions into decks. I've been described as a systems thinker, a narrative architect, and someone who 'gets it.' I don't know what it is. But I get it."

### ExperienceSection

- Card title: "Experience", fake add (`+`) and edit (pencil) buttons (inert)
- 3 mock roles, each with: company logo placeholder (initials), title, company, date range, description
  1. **Interim Global Strategy Vision Lead** — Myself Inc. | Jan 2023–Present | *"Leading cross-functional alignment across a team of one toward a vision I'm still workshopping."*
  2. **Fractional Brand Philosopher** — Narrative Leverage Co. | Jun 2021–Dec 2022 | *"Delivered transformational ambiguity at scale."*
  3. **Incoming Summer Analyst** — PrestigeBank | Jun 2020–Aug 2020 | *"Attended orientation. Sent follow-up emails. Left before the trauma set in."*

### EducationSection

- Card title: "Education", fake add and edit buttons (inert)
- 2 entries:
  1. **University of Networking** — B.S. in Perceived Expertise | 2017–2021 | *Activities: Coffee Chat Club, LinkedIn Optimization Society*
  2. **The School of Hard Knocks (Self-Reported)** — Ongoing | *Certificate in Resilience Narrative*

### SkillsSection

- Card title: "Skills & Endorsements", fake add button (inert)
- 5 skills, each with a fake endorsement count and an inert "Endorse" button:
  1. Strategic Ambiguity — 47 endorsements
  2. Narrative Leverage — 38 endorsements
  3. Founder Energy — 91 endorsements
  4. Deck Architecture — 22 endorsements
  5. Vague Optimism — 64 endorsements

### LarpHistorySection

- LarpedIn-exclusive section (blue "LarpedIn" label pill in card header)
- Card title: "Larp History"
- Vertical timeline of persona upgrades, each entry: date, old persona → new persona, short note
  1. **Mar 2026** — *Regional Hustler* → *Aspirational Visionary* | "Attended 3 webinars and updated LinkedIn banner."
  2. **Nov 2025** — *Incoming Analyst* → *Regional Hustler* | "Got a business card. Changed everything."
  3. **Aug 2024** — *Student* → *Incoming Analyst* | "Accepted offer. Announced on LinkedIn before telling family."

### GlazesSection

- Card title: "Glazes Received"
- 3 glaze cards, each with: avatar (initials), name, relationship + timestamp, praise text
  1. **Arjun Arjun** — *glazed you 2h ago* | *"Arjun doesn't just think outside the box — he has transcended the concept of boxes entirely."*
  2. **Priya Krishnamurthy** — *glazed you 1d ago* | *"Working adjacent to Arjun changed my relationship with ambiguity. I am a different person."*
  3. **Marcus Vanderbilt III** — *glazed you 3d ago* | *"Rare. Generational. Inevitable."*

## Visual Style

Consistent with the Home page:
- White cards, `8px` border-radius, `box-shadow: 0 1px 3px rgba(0,0,0,0.12)`
- LinkedIn-blue (`#0A66C2`) for accents, active states, filled buttons
- Sans-serif system font stack (or Inter)
- Edit/add controls: pencil and `+` icons in card top-right, gray, `onClick` is undefined (inert)
- LarpStatus banner: green background (`#057642`), white text — mirrors LinkedIn's "Open to Work" green
- LarpHistorySection pill label: blue background (`#0A66C2`), white text, `4px` border-radius, small font
- Reused components: `LarpRatingBadge` from `src/components/LarpRatingBadge/`, `getInitials` from `src/utils/strings.js`

## Out of Scope

- Edit modals or any functional form interactions
- Persona switching logic
- Backend integration
- Mobile layout
- Viewing other users' profiles
