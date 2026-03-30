# LARP Platform - Backend

A satirical, hyper-gamified professional networking platform where AI scores your corporate buzzword density, a caste system hides the elite from peasants, and every post gets flooded with auto-generated sycophantic compliments.

## Stack

- **Database**: Supabase (PostgreSQL + Auth + RLS)
- **API**: FastAPI (Python)
- **AI**: Google Gemini 2.0 Flash (scoring + glaze generation)

## Features

### Social Blindness (RLS)
When you query the feed, Postgres silently hides posts from users with a higher LarpRating than yours. You can't see what you haven't earned.

### Prestige Evaluator (Background Scoring)
Every post is sent to Gemini for scoring. It evaluates buzzword density and performative enthusiasm on a 0-10 scale, then adjusts the author's LarpRating in real-time.

### Glaze-o-matic (AI Compliments)
The feed endpoint generates 3 absurdly corporate, sycophantic compliments per post via Gemini. Think: "This. So much this. Your thought leadership is the north star this ecosystem needs."

### J*bs (Instant Prestige)
Update your professional title to literally anything. No validation. No questions asked.

## Quick Start

### 1. Supabase (local)

```bash
npm install                   # install supabase CLI
npx supabase start            # start local Postgres, Auth, API
npx supabase db reset          # apply migrations
```

Grab your local keys from `npx supabase status`.

### 2. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env           # fill in keys from supabase status
uvicorn app.main:app --reload
```

### 3. Verify

Open http://localhost:8000/docs for Swagger UI.

## Environment Variables

```
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=<from supabase status>
SUPABASE_SERVICE_ROLE_KEY=<from supabase status>
GEMINI_API_KEY=<from Google AI Studio>
ELEVENLABS_API_KEY=<optional, for TTS>
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/feed` | Feed with Social Blindness + AI glazes |
| POST | `/api/posts` | Create post (triggers background scoring) |
| PATCH | `/api/jobs/title` | Overwrite your title instantly |
| GET | `/health` | Health check |

All endpoints except `/health` require `Authorization: Bearer <supabase_jwt>`.

## Project Structure

```
backend/
├── app/
│   ├── main.py            # FastAPI app, CORS, lifespan
│   ├── config.py          # Environment config (pydantic-settings)
│   ├── dependencies.py    # Auth (JWT) + Supabase client factories
│   ├── routers/
│   │   ├── feed.py        # GET /api/feed (Glaze-o-matic)
│   │   ├── posts.py       # POST /api/posts (+ scoring trigger)
│   │   └── jobs.py        # PATCH /api/jobs/title
│   ├── services/
│   │   └── gemini.py      # Gemini API wrapper + all prompts
│   └── workers/
│       └── scoring.py     # Prestige Evaluator background task
supabase/
├── config.toml
└── migrations/
    └── 20260328000000_initial_schema.sql
```

## Database Schema

| Table | Key Columns | Notes |
|-------|------------|-------|
| `profiles` | id, display_name, title, **larp_rating** | Auto-created on signup |
| `posts` | id, author_id, content, post_type, buzzword_score | Scored async by Gemini |
| `glazes` | id, post_id, glazer_id, content, glaze_type | Satirical compliments |
| `roleplay_sessions` | id, user_id, character_id, conversation_history | For teammate's LarpMaxxing feature |

## For Teammates

- **Roleplay/LarpMaxxing**: The `routers/roleplay.py` stub and `services/voice_registry.py` + `services/elevenlabs.py` are scaffolded for you. Wire them into `main.py` when ready.
- **Frontend**: Proxy `/api` requests to `http://localhost:8000` in your Vite config.
- **Full architecture details**: See `CLAUDE.md` for prompts, data flows, and gotchas.
