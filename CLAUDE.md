# LARP Platform — Full-Stack Architecture Reference

A satirical, hyper-gamified professional networking platform where corporate culture is taken to its absurd logical endpoint. AI scores your "buzzword density," a caste system hides the elite from peasants, auto-generated sycophantic compliments flood every post, and you can roleplay as parody corporate archetypes.

**Stack**: Supabase (Postgres + Auth) | FastAPI (orchestration + AI) | React 19 + Vite (frontend) | Gemini 2.0 Flash (scoring + glazes + roleplay) | ElevenLabs (TTS) | Meme Lord API (roast memes)

---

## Setup

### Prerequisites
- Python 3.11+
- Node.js 18+ (for Supabase CLI and frontend)
- Supabase account (remote) or Docker (local via `supabase start`)

### Install & Run
```bash
# 1. Supabase (local)
npx supabase start          # starts local Postgres, Auth, API
npx supabase db reset        # applies all migrations + seed

# 2. Backend
cd backend
python -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate
cp .env.example .env         # fill in keys from `npx supabase status`
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 3. Frontend
cd frontend
cp .env.example .env.local   # fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm install
npm run dev                  # starts at http://localhost:5173

# 4. Verify
curl http://localhost:8000/docs   # Swagger UI
```

### Environment Variables

**backend/.env**
```
SUPABASE_URL=http://127.0.0.1:54321        # or https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key             # for user-context queries (RLS applies)
SUPABASE_SERVICE_ROLE_KEY=your-service-key  # for privileged backend operations (bypasses RLS)
GEMINI_API_KEY=your-gemini-api-key
ELEVENLABS_API_KEY=your-elevenlabs-api-key  # optional, for TTS in roleplay
MEMELORD_API_KEY=your-memelord-api-key      # optional, for roast meme generation
DEV_MODE=false                              # true skips JWT auth (uses hardcoded DEV_USER_ID)
```

**frontend/.env.local**
```
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=your-anon-key
```

For local dev, get Supabase keys from `npx supabase status` after starting.

---

## Database Schema

Migrations are in `supabase/migrations/` and applied in order.

### Tables

**profiles**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | references auth.users(id) |
| display_name | text | default 'Anonymous Larper' |
| job | text NOT NULL | current role/title (replaces old `title` column) |
| bio | text | |
| avatar_url | text | |
| cover_photo_url | text | |
| larp_rating | numeric(10,2) | **THE sacred number.** Default 0.00 |
| stats | jsonb | `{recruiter_views, impression_velocity, aura_growth}` |
| glazers | jsonb | list of users who have glazed this profile |
| larp_status | jsonb | `{opportunities: [], current_goals: []}` |
| experience | jsonb | work history array |
| education | jsonb | education history array |
| skills | jsonb | skills array |
| larp_history | jsonb | LARP event history array |
| glazes_received | jsonb | compliments received array |
| created_at | timestamptz | |
| updated_at | timestamptz | auto-updated via trigger |

**posts**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | gen_random_uuid() |
| author_id | uuid FK | -> profiles(id) |
| content | text | |
| post_type | text | Career Lore, Humblebrag, Announcement, Hot Take, etc. |
| buzzword_score | numeric(10,2) | AI-evaluated, default 0.00 |
| roast_meme_url | text | URL to generated meme image (async, nullable) |
| created_at | timestamptz | |

**glazes** (satirical compliments on posts)
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| post_id | uuid FK | -> posts(id) |
| glazer_id | uuid FK | -> profiles(id) |
| content | text | |
| glaze_type | text | organic, ai_generated, premium_glaze |
| created_at | timestamptz | |

**comments**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| post_id | uuid FK | -> posts(id) CASCADE DELETE |
| author_id | uuid FK | -> profiles(id) |
| content | text | |
| created_at | timestamptz | |

**relarps** (satirical reimaginings of posts)
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| post_id | uuid FK | -> posts(id) CASCADE DELETE |
| user_id | uuid FK | -> profiles(id) |
| commentary | text | |
| created_at | timestamptz | |
| UNIQUE | (post_id, user_id) | one relarp per user per post |

**post_reactions**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| post_id | uuid FK | -> posts(id) CASCADE DELETE |
| user_id | uuid FK | -> profiles(id) |
| reaction_type | text | like, love |
| UNIQUE | (post_id, user_id, reaction_type) | |

**relarp_reactions**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| relarp_id | uuid FK | -> relarps(id) CASCADE DELETE |
| user_id | uuid FK | -> profiles(id) |
| reaction_type | text | like, love, glaze |
| UNIQUE | (relarp_id, user_id, reaction_type) | |

**connections**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| requester_id | uuid FK | -> profiles(id) |
| addressee_id | uuid FK | -> profiles(id) |
| status | text | pending, accepted, declined |
| created_at | timestamptz | |
| UNIQUE | (requester_id, addressee_id) | |

**messages** (1:1 DMs)
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| sender_id | uuid FK | -> profiles(id) |
| receiver_id | uuid FK | -> profiles(id) |
| content | text | |
| read | bool | default false |
| created_at | timestamptz | |

**conversations** (group chats)
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text | |
| is_group | bool | |
| created_by | uuid FK | -> profiles(id) |
| created_at | timestamptz | |

**conversation_members**
| Column | Type | Notes |
|---|---|---|
| conversation_id | uuid FK | -> conversations(id) |
| user_id | uuid FK | -> profiles(id) |

**group_messages**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| conversation_id | uuid FK | -> conversations(id) |
| sender_id | uuid FK | -> profiles(id) |
| content | text | |
| created_at | timestamptz | |

**roleplay_sessions**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK | -> profiles(id) |
| character_id | text | gary_vee, corporate_buddha, hustle_sensei, disruption_diva |
| conversation_history | jsonb | array of `{role, text}` messages |
| created_at | timestamptz | |
| updated_at | timestamptz | auto-updated via trigger |

### Triggers & Functions
- `handle_new_user()` — auto-creates a profile row when a user signs up via Supabase Auth
- `set_updated_at()` — auto-updates `updated_at` on profiles and roleplay_sessions
- `update_larp_rating(target_user_id, rating_delta)` — SECURITY DEFINER function that adjusts larp_rating (clamped at 0). Called via `.rpc()` from FastAPI.

### Row Level Security — The Social Blindness Rule

The centerpiece mechanic. On the `posts` table:

```sql
create policy "Social Blindness: hide posts from higher-rated users"
    on public.posts for select
    using (
        (select p.larp_rating from public.profiles p where p.id = author_id)
        <=
        (select p.larp_rating from public.profiles p where p.id = auth.uid())
    );
```

**What this means**: When you query the feed, Postgres silently filters out any post whose author has a higher LarpRating than you. The elite are invisible to the lower tiers. You literally cannot see what you haven't earned.

**Critical implication for FastAPI**: The feed endpoint MUST query with the user's JWT (via anon key client), NOT the service role key. Service role bypasses all RLS and would show everyone's posts, destroying the caste system.

Other RLS policies:
- Profiles: anyone can SELECT, only owner can UPDATE
- Glazes: visible if the parent post is visible (cascades Social Blindness)
- Comments/relarps/reactions: visible on visible posts, users manage own
- Connections: users see/manage only their own
- Messages: users see only messages they sent or received
- Roleplay sessions: full CRUD for owner only

---

## Backend File Tree

```
backend/
├── .env.example
├── requirements.txt
└── app/
    ├── main.py                # FastAPI app, lifespan, CORS, router mounts
    ├── config.py              # pydantic-settings, loads .env
    ├── dependencies.py        # JWT auth, Supabase client factories
    ├── dev_state.py           # Dev mode helpers (DEV_USER_ID)
    ├── routers/
    │   ├── feed.py            # GET /api/feed — Glaze-o-matic + Social Blindness
    │   ├── posts.py           # CRUD posts + comments + relarps + reactions
    │   ├── jobs.py            # GET /api/jobs/options, PATCH /api/jobs/current
    │   ├── profile.py         # GET /api/me, GET /api/users/{id}, PATCH /api/me
    │   ├── connections.py     # Connection requests (send/accept/decline/list)
    │   ├── messages.py        # 1:1 DMs + group conversations
    │   ├── notifications.py   # Aggregated notifications
    │   ├── relarps.py         # Relarp reactions (like/love/glaze)
    │   └── roleplay.py        # GET characters, POST chat (LarpMaxxing)
    ├── services/
    │   ├── gemini.py          # Gemini API wrapper (scoring + glazes + roleplay)
    │   ├── voice_registry.py  # Character definitions (Gary Vee, Corporate Buddha, etc.)
    │   ├── elevenlabs.py      # TTS streaming (WebSocket)
    │   └── memelord.py        # Roast meme generation API
    └── workers/
        └── scoring.py         # Background task: Prestige Evaluator + roast meme
```

---

## API Endpoints

### Feed
- **GET `/api/feed`** — Glaze-o-matic feed
  - Query: `limit=20`, `offset=0`
  - Client: **Anon key + user JWT** (Social Blindness RLS MUST apply)
  - Returns posts + relarps enriched with comments, reactions, AI glazes, organic glazes
  - Also returns `trending_delusions` and extracted `buzzwords`

### Posts
- **POST `/api/posts`** — Create post; body: `{content, post_type}`
  - Fires `score_content()` BackgroundTask (Prestige Evaluator + roast meme)
- **DELETE `/api/posts/{post_id}`** — Delete own post (cascades all reactions/comments)
- **POST `/api/posts/{post_id}/comments`** — Add comment; body: `{content}`
- **PATCH `/api/posts/{post_id}/comments/{comment_id}`** — Edit own comment
- **DELETE `/api/posts/{post_id}/comments/{comment_id}`** — Delete own comment
- **POST `/api/posts/{post_id}/relarp`** — Relarp (reimagine) a post; body: `{commentary}`
- **DELETE `/api/posts/{post_id}/relarp`** — Remove relarp
- **POST/DELETE `/api/posts/{post_id}/like`** — Toggle like
- **POST/DELETE `/api/posts/{post_id}/love`** — Toggle love reaction
- **POST/DELETE `/api/posts/{post_id}/glaze`** — Toggle organic glaze; body: `{content?}`

### Relarps
- **POST/DELETE `/api/relarps/{relarp_id}/like`** — Toggle like on relarp
- **POST/DELETE `/api/relarps/{relarp_id}/love`** — Toggle love on relarp
- **POST/DELETE `/api/relarps/{relarp_id}/glaze`** — Toggle glaze on relarp

### Jobs
- **GET `/api/jobs/options`** — Returns 16 satirical job titles
- **PATCH `/api/jobs/current`** — Update own job; body: `{job}`

### Profile
- **GET `/api/me`** — Get full current user profile
- **GET `/api/users/{user_id}`** — Get any public profile
- **PATCH `/api/me`** — Update profile fields (only non-null fields updated)
  - Fields: `display_name, bio, avatar_url, cover_photo_url, stats, glazers, larp_status, experience, education, skills, larp_history, glazes_received`

### Connections
- **POST `/api/connections/request`** — Send request; body: `{addressee_id}`
- **PATCH `/api/connections/{id}/accept`** — Accept (addressee only)
- **PATCH `/api/connections/{id}/decline`** — Decline (addressee only)
- **DELETE `/api/connections/{id}`** — Remove/withdraw (either party)
- **GET `/api/connections`** — List accepted connections with profiles
- **GET `/api/connections/pending`** — Incoming pending requests
- **GET `/api/connections/outgoing`** — Outgoing pending requests
- **GET `/api/connections/suggestions`** — All non-connected users

### Messages
- **GET `/api/messages/users`** — Messageable users (connections first, then all)
- **GET `/api/messages/conversations`** — All 1:1 DMs + groups (latest msg, unread count)
- **GET `/api/messages/{other_user_id}`** — 1:1 message history (marks read)
- **POST `/api/messages`** — Send DM; body: `{receiver_id, content}`
- **POST `/api/messages/conversations`** — Create group; body: `{member_ids, name}`
- **GET `/api/messages/groups/{conversation_id}`** — Group message history
- **POST `/api/messages/groups/{conversation_id}`** — Send group message; body: `{content}`

### Notifications
- **GET `/api/notifications`** — Aggregated (limit=25): pending connections + unread messages + post comments

### Roleplay (LarpMaxxing)
- **GET `/api/roleplay/characters`** — List 4 characters with metadata
- **POST `/api/roleplay/chat`** — Chat with character; body: `{session_id?, character_id, message}`
  - Persists conversation history in `roleplay_sessions`
  - Returns: `{session_id, character_id, dialogue, emotion}`

### Health
- **GET `/health`** — Returns `{status: "larping", dev_mode: bool}`

---

## Supabase Client Usage Matrix

| Endpoint | Client Type | Why |
|---|---|---|
| GET /api/feed | **Anon key + user JWT** | **MUST respect Social Blindness RLS** |
| POST /api/posts | **Service role** | Insert on behalf of user |
| PATCH /api/jobs/current | **Service role** | Privileged update |
| PATCH /api/me | **Service role** | Profile update |
| Connections/messages | **Service role** | Social graph writes |
| Scoring worker | **Service role** | Writes buzzword_score, calls update_larp_rating RPC |
| Roleplay | **Service role** | Session persistence |

---

## Gemini Prompts

### 1. Prestige Evaluator (scoring worker — `workers/scoring.py`)

```
You are the Prestige Evaluator, a merciless AI judge of corporate performativity.
...
Respond in STRICT JSON: {"buzzword_score": <float>, "enthusiasm_score": <float>, "rating_delta": <float>, "roast": "<string>"}
```
- `rating_delta` range: -2.0 to +5.0

### 2. Glaze-o-matic 3000 (feed endpoint — `routers/feed.py`)

```
You are the Glaze-o-matic 3000 ... generate exactly 3 satirical compliments per post
...
Respond in STRICT JSON: {"<post_id>": ["<glaze1>", "<glaze2>", "<glaze3>"]}
```

### 3. Roleplay Character Chat (`services/gemini.py`)
- Character system prompts injected from `voice_registry.py`
- Characters: Gary Vee (Parody), The Corporate Buddha, The Hustle Sensei, The Disruption Diva
- Returns: `{character_id, dialogue, emotion}`

All Gemini calls use `response_mime_type="application/json"` — mandatory.

---

## Data Flows

### Post Creation + Scoring
```
Client -> POST /api/posts
  -> Insert into posts (service role, buzzword_score=0)
  -> Return post immediately
  -> BackgroundTask: score_content()
     -> Gemini "Prestige Evaluator" scores content
     -> Meme Lord API generates roast meme
     -> UPDATE posts SET buzzword_score = X, roast_meme_url = Y
     -> RPC update_larp_rating(user_id, delta)
```

### Feed + Social Blindness + Glazes
```
Client -> GET /api/feed (Bearer: user JWT)
  -> Supabase query with user JWT (anon key client)
  -> Postgres RLS: only posts where author.larp_rating <= viewer.larp_rating
  -> Enrich: comments, reactions, relarp counts per post
  -> Gemini "Glaze-o-matic" generates 3 AI glazes per post
  -> Return bundled feed {posts, trending_delusions, buzzwords}
```

### Roleplay Chat
```
Client -> POST /api/roleplay/chat {session_id?, character_id, message}
  -> Load or create roleplay_session (with conversation_history)
  -> Build system prompt from voice_registry character definition
  -> Gemini roleplay_chat(system_prompt, history + new message)
  -> Append exchange to conversation_history
  -> Upsert roleplay_session in DB
  -> Return {session_id, character_id, dialogue, emotion}
```

---

## Frontend File Tree

```
frontend/src/
├── main.jsx               # React entry
├── App.jsx                # BrowserRouter + AuthProvider + routes
├── index.css              # Global styles
├── lib/
│   └── supabase.js        # Supabase client init
├── context/
│   ├── AuthContext.jsx    # Supabase auth state (login/logout/token)
│   └── MockDataContext.jsx # Frontend mock data (for tests)
├── services/
│   └── api.js             # authFetch wrapper + all API call functions
├── components/
│   ├── TopNav/            # Navigation header
│   ├── Icon/              # Reusable icon
│   ├── LarpRatingBadge/   # Displays larp_rating
│   └── ProfilePopup/      # Hover/modal profile preview
├── features/
│   ├── auth/
│   │   └── AuthPage.jsx   # Login/signup + Google OAuth
│   ├── home/
│   │   ├── Home.jsx       # 3-column layout (LeftRail | Feed | RightRail)
│   │   └── Feed/
│   │       ├── Feed.jsx           # Main feed (posts + relarps)
│   │       ├── StartPost/         # Compose post form
│   │       ├── PostCard/          # Post with reactions, comments, roast meme
│   │       ├── LockedPostCard/    # Blurred overlay for Social Blindness
│   │       └── SuggestedGlazes/   # AI glaze display
│   ├── me/
│   │   ├── Me.jsx                 # Own profile page (editable)
│   │   ├── ProfileHero/           # Avatar, name, LARP rating, cover photo
│   │   ├── AboutSection/
│   │   ├── ExperienceSection/
│   │   ├── EducationSection/
│   │   ├── SkillsSection/
│   │   ├── GlazesSection/
│   │   ├── LarpHistorySection/
│   │   └── LarpStatus/            # Current opportunities/goals
│   ├── network/
│   │   ├── Network.jsx            # Connection suggestions + pending requests
│   │   ├── UserCard/              # Profile snippet card
│   │   └── ConnectButton/         # Send/manage connection requests
│   ├── messaging/
│   │   ├── Messaging.jsx          # Main messaging page
│   │   ├── ConversationList/      # 1:1 DMs + groups with unread counts
│   │   ├── ChatWindow/            # Message history
│   │   ├── ComposeModal/          # Start new conversation
│   │   └── MessageBubble/         # Individual message
│   └── profile/
│       └── PublicProfile.jsx      # View any user's profile (read-only)
└── pages/
    ├── JobsPage.jsx               # Pick satirical job title
    └── NotificationsPage.jsx      # Aggregated notifications
```

---

## Dev Commands Cheatsheet

```bash
# Supabase
npx supabase start                    # start local Supabase
npx supabase stop                     # stop local Supabase
npx supabase db reset                 # drop + recreate + apply all migrations
npx supabase db diff --local          # see uncommitted schema changes
npx supabase status                   # show local URLs and keys

# Backend
cd backend
source .venv/bin/activate             # activate virtualenv
uvicorn app.main:app --reload         # start FastAPI dev server (port 8000)
pip install -r requirements.txt       # install dependencies

# Frontend
cd frontend
npm install                           # install dependencies
npm run dev                           # start Vite dev server (port 5173)
npm test                              # run vitest tests
npm run build                         # production build

# Testing
curl http://localhost:8000/docs       # Swagger UI
curl http://localhost:8000/api/feed -H "Authorization: Bearer <jwt>"
```

---

## Key Gotchas

1. **Social Blindness depends on client type.** Feed endpoint = anon key + user JWT. Everything else = service role. Get this wrong and the caste system breaks.

2. **Gemini `response_mime_type="application/json"`** is mandatory. Without it, Gemini wraps JSON in markdown code fences and `json.loads()` fails.

3. **`google-genai`** (package name) is the modern SDK. NOT `google-generativeai` (legacy). Use `client.aio.models.generate_content()` for async calls in FastAPI.

4. **`update_larp_rating`** is `SECURITY DEFINER` — runs with function owner's privileges regardless of caller. Safe to call from any client type via `.rpc()`.

5. **Scoring is fire-and-forget.** Uses FastAPI `BackgroundTasks`, not Celery. If the server restarts mid-scoring, that score is lost. Acceptable for a hackathon.

6. **CORS**: Frontend expected at `localhost:3000` or `localhost:5173` (Vite default). Configured in `main.py`.

7. **Supabase Python client for user-context**: Use `create_client(url, anon_key)` then `client.postgrest.auth(user_jwt)` to set the Bearer token so PostgREST enforces RLS as that user.

8. **Frontend API proxy**: `vite.config.js` proxies `/api` → `http://localhost:8000`. All frontend API calls use relative paths (e.g., `fetch('/api/feed')`).

9. **`profiles.job` replaced `profiles.title`**: Migration `20260329000004_unify_profile_job.sql` renamed the column. Use `job` everywhere; `title` no longer exists.

10. **DEV_MODE=true** skips JWT verification and uses a hardcoded `DEV_USER_ID` from `dev_state.py`. Never enable in production.

11. **Roast meme URL is async/nullable.** `posts.roast_meme_url` is null until the background task completes. Frontend should handle null gracefully.

12. **Group messaging vs 1:1**: Group chats use `conversations` + `conversation_members` + `group_messages` tables. 1:1 DMs use the `messages` table directly. These are separate systems.
