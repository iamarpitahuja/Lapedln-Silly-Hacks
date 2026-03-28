# LARP Platform — Backend Architecture Reference

A satirical, hyper-gamified professional networking platform where corporate culture is taken to its absurd logical endpoint. AI scores your "buzzword density," a caste system hides the elite from peasants, and auto-generated sycophantic compliments flood every post.

**Stack**: Supabase (Postgres + Auth) | FastAPI (orchestration + AI) | Gemini 2.0 Flash (scoring + glazes)

---

## Setup

### Prerequisites
- Python 3.11+
- Node.js 18+ (for Supabase CLI)
- Supabase account (remote) or Docker (local via `supabase start`)

### Install & Run
```bash
# 1. Supabase (local)
npx supabase start          # starts local Postgres, Auth, API
npx supabase db reset        # applies migrations + seeds

# 2. Backend
cd backend
python -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate
cp .env.example .env         # fill in keys from `npx supabase status`
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 3. Verify
curl http://localhost:8000/docs   # Swagger UI
```

### Environment Variables (.env)
```
SUPABASE_URL=http://127.0.0.1:54321        # or https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key             # for user-context queries (RLS applies)
SUPABASE_SERVICE_ROLE_KEY=your-service-key  # for privileged backend operations (bypasses RLS)
GEMINI_API_KEY=your-gemini-api-key
ELEVENLABS_API_KEY=your-elevenlabs-api-key  # optional, for teammate's TTS feature
```

For local dev, get Supabase keys from `npx supabase status` after starting.

---

## Database Schema

Migration file: `supabase/migrations/20260328000000_initial_schema.sql`

### Tables

**profiles**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | references auth.users(id) |
| display_name | text | default 'Anonymous Larper' |
| title | text | default 'Aspiring Thought Leader' |
| bio | text | |
| avatar_url | text | |
| larp_rating | numeric(10,2) | **THE sacred number.** Default 0.00 |
| created_at | timestamptz | |
| updated_at | timestamptz | auto-updated via trigger |

**posts**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | gen_random_uuid() |
| author_id | uuid FK | -> profiles(id) |
| content | text | |
| post_type | text | thought_leadership, humble_brag, announcement, hot_take, glaze |
| buzzword_score | numeric(10,2) | AI-evaluated, default 0.00 |
| created_at | timestamptz | |

**glazes** (satirical compliments)
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| post_id | uuid FK | -> posts(id) |
| glazer_id | uuid FK | -> profiles(id) |
| content | text | |
| glaze_type | text | organic, ai_generated, premium_glaze |
| created_at | timestamptz | |

**roleplay_sessions** (teammate-owned — LarpMaxxing feature)
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK | -> profiles(id) |
| character_id | text | e.g. "gary_vee", "corporate_buddha" |
| conversation_history | jsonb | array of {role, text} messages |
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
- Roleplay sessions: full CRUD for owner only

---

## Backend File Tree

```
backend/
├── .env.example
├── requirements.txt
├── app/
│   ├── __init__.py
│   ├── main.py                # FastAPI app, lifespan, CORS, router mounts
│   ├── config.py              # pydantic-settings, loads .env
│   ├── dependencies.py        # JWT auth, Supabase client factories
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── feed.py            # GET /api/feed — Glaze-o-matic
│   │   ├── posts.py           # POST /api/posts — create + trigger scoring
│   │   ├── jobs.py            # PATCH /api/jobs/title — unvalidated prestige
│   │   └── roleplay.py        # STUB — teammate owns this (LarpMaxxing)
│   ├── services/
│   │   ├── __init__.py
│   │   ├── gemini.py          # Gemini API wrapper (scoring + glazes)
│   │   ├── elevenlabs.py      # STUB — teammate owns this (TTS streaming)
│   │   └── voice_registry.py  # STUB — teammate owns this (character definitions)
│   └── workers/
│       ├── __init__.py
│       └── scoring.py         # Prestige Evaluator background task
```

### Ownership
- **Active (your scope)**: main.py, config.py, dependencies.py, feed.py, posts.py, jobs.py, gemini.py, scoring.py
- **Stubs (teammate's scope)**: roleplay.py, elevenlabs.py, voice_registry.py

---

## API Endpoints (Active)

### GET /api/feed — Glaze-o-matic Feed
- **Auth**: Bearer JWT required
- **Query params**: `limit=20`, `offset=0`
- **Supabase client**: **Anon key + user JWT** (Social Blindness RLS MUST apply)
- **Flow**:
  1. Query posts with user JWT — Postgres filters via Social Blindness
  2. Fetch existing glazes for visible posts
  3. Batch post contents to Gemini for AI glaze generation (3 per post)
  4. Return `{posts: [{...post, glazes: [...], ai_glazes: [...]}]}`

### POST /api/posts — Create Post
- **Auth**: Bearer JWT required
- **Body**: `{"content": "...", "post_type": "thought_leadership"}`
- **Supabase client**: Service role (insert)
- **Side effect**: Fires `score_content()` as a BackgroundTask
- **Returns**: The created post (buzzword_score = 0 initially, updated async)

### PATCH /api/jobs/title — "J*bs" Unvalidated Title Update
- **Auth**: Bearer JWT required
- **Body**: `{"title": "any string at all"}`
- **Supabase client**: Service role
- **Behavior**: Overwrites `profiles.title` with zero validation. No length check. No profanity filter. That's the joke — instant unearned prestige.

### GET /health — Health Check
- **Auth**: None
- **Returns**: `{"status": "larping"}`

---

## Supabase Client Usage Matrix

| Endpoint | Client Type | Why |
|---|---|---|
| GET /api/feed | **Anon key + user JWT** | **MUST respect Social Blindness RLS** |
| POST /api/posts | **Service role** | Insert on behalf of user |
| PATCH /api/jobs/title | **Service role** | Privileged update |
| Scoring worker | **Service role** | Writes buzzword_score, calls update_larp_rating RPC |

---

## Gemini Prompts

### 1. Prestige Evaluator (used by scoring worker — `workers/scoring.py`)

```
You are the Prestige Evaluator, a merciless AI judge of corporate performativity.

You will receive a social media post from a professional networking platform.
Evaluate it on two axes:

1. BUZZWORD DENSITY (0-10): How saturated is this with corporate jargon?
   Synergy, leverage, disrupt, ecosystem, thought leadership, paradigm shift,
   move the needle, circle back, deep dive, bandwidth, scalable, actionable,
   north star, value-add, stakeholder alignment -- these are the sacred words.
   0 = refreshingly human. 10 = could be auto-generated by a LinkedIn bot.

2. PERFORMATIVE ENTHUSIASM (0-10): How aggressively does this signal fake
   passion for professional clout?
   0 = genuine and understated. 10 = "I'm THRILLED to announce that after
   an incredible journey, I've accepted a role as..." energy.

3. RATING DELTA: A number between -2.0 and +5.0 representing how much
   this post should change the author's LarpRating. High buzzwords + high
   enthusiasm = big positive delta. Authentic, low-effort posts get negative.

4. ROAST: A single savage sentence roasting the author's corporate theater.

Respond in STRICT JSON only, no markdown:
{"buzzword_score": <float>, "enthusiasm_score": <float>, "rating_delta": <float>, "roast": "<string>"}
```

### 2. Glaze-o-matic 3000 (used by feed endpoint — `routers/feed.py`)

```
You are the Glaze-o-matic 3000, the world's most aggressively sycophantic
AI compliment generator for a professional networking platform.

For each post below, generate exactly 3 satirical compliments ("glazes").
Each glaze should be absurdly corporate, performatively enthusiastic, and
dripping with hollow validation. Channel the energy of a LinkedIn commenter
who replies "This. So much this." to everything.

Style guide:
- Use phrases like "This is the content I come to this platform for"
- Reference "thought leadership" and "adding value" unironically
- Sprinkle in buzzwords: synergy, disrupt, ecosystem, bandwidth, north star
- At least one glaze per post should be comically over-the-top
- One should subtly be a backhanded compliment disguised as praise

Posts to glaze:
{posts_json}

Respond in STRICT JSON only, no markdown:
{
  "<post_id_1>": ["<glaze1>", "<glaze2>", "<glaze3>"],
  "<post_id_2>": ["<glaze1>", "<glaze2>", "<glaze3>"]
}
```

---

## Data Flows

### Post Creation + Scoring
```
Client -> POST /api/posts
  -> Insert into posts (service role, buzzword_score=0)
  -> Return post immediately
  -> BackgroundTask: score_content()
     -> Gemini "Prestige Evaluator" scores content
     -> UPDATE posts SET buzzword_score = X
     -> RPC update_larp_rating(user_id, delta)
     -> User's larp_rating adjusts in real-time
```

### Feed + Social Blindness + Glazes
```
Client -> GET /api/feed (Bearer: user JWT)
  -> Supabase query with user JWT (anon key client)
  -> Postgres RLS: only posts where author.larp_rating <= viewer.larp_rating
  -> Fetch glazes for visible posts
  -> Gemini "Glaze-o-matic" generates 3 AI compliments per post
  -> Return bundled feed to client
```

---

## Teammate Integration: Roleplay / LarpMaxxing / ElevenLabs

The following files are **stubs** ready for the teammate to build out:

- `routers/roleplay.py` — currently an empty router. Wire into `main.py` with `app.include_router(roleplay.router, prefix="/api")` when ready.
- `services/voice_registry.py` — has 4 placeholder characters with ElevenLabs voice IDs and a Gemini roleplay prompt template. Ready to use.
- `services/elevenlabs.py` — has `chunk_text()` and `stream_tts()` scaffolded for WebSocket TTS streaming.
- `services/gemini.py` — already has `roleplay_chat()` function and the roleplay prompt template.

The database table `roleplay_sessions` and its RLS policy are already in the migration.

---

## Dev Commands Cheatsheet

```bash
# Supabase
npx supabase start                    # start local Supabase
npx supabase stop                     # stop local Supabase
npx supabase db reset                 # drop + recreate + apply migrations
npx supabase db diff --local          # see uncommitted schema changes
npx supabase status                   # show local URLs and keys

# Backend
cd backend
source .venv/bin/activate             # activate virtualenv
uvicorn app.main:app --reload         # start FastAPI dev server
pip install -r requirements.txt       # install dependencies

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

8. **Frontend proxy**: Add `server: { proxy: { '/api': 'http://localhost:8000' } }` to `vite.config.ts` so fetch('/api/feed') hits FastAPI without CORS issues in dev.
