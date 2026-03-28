# LARP Platform — Backend Architecture Reference

A satirical, hyper-gamified professional networking platform where corporate culture is taken to its absurd logical endpoint. AI scores your "buzzword density," a caste system hides the elite from peasants, auto-generated sycophantic compliments flood every post, and you can voice-chat with parody CEO characters.

**Stack**: Supabase (Postgres + Auth) | FastAPI (orchestration + AI) | Gemini 2.0 Flash (scoring, glazes, roleplay) | ElevenLabs (streaming TTS)

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
cp .env.example .env         # fill in keys
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
ELEVENLABS_API_KEY=your-elevenlabs-api-key
```

For local dev, get keys from `npx supabase status` after starting.

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

**roleplay_sessions**
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
│   │   └── roleplay.py        # POST /api/roleplay/chat, GET /api/roleplay/speak
│   ├── services/
│   │   ├── __init__.py
│   │   ├── gemini.py          # Gemini API wrapper (scoring, glazes, roleplay)
│   │   ├── elevenlabs.py      # ElevenLabs WebSocket TTS streaming
│   │   └── voice_registry.py  # character_id -> voice_id + character metadata
│   └── workers/
│       ├── __init__.py
│       └── scoring.py         # Prestige Evaluator background task
```

---

## API Endpoints

### PATCH /api/jobs/title — "J*bs" Unvalidated Title Update
- **Auth**: Bearer JWT required
- **Body**: `{"title": "any string at all"}`
- **Supabase client**: Service role
- **Behavior**: Overwrites `profiles.title` with zero validation. No length check. No profanity filter. That's the joke — instant unearned prestige.

### POST /api/posts — Create Post
- **Auth**: Bearer JWT required
- **Body**: `{"content": "...", "post_type": "thought_leadership"}`
- **Supabase client**: Service role (insert)
- **Side effect**: Fires `score_content()` as a BackgroundTask
- **Returns**: The created post (buzzword_score = 0 initially, updated async)

### GET /api/feed — Glaze-o-matic Feed
- **Auth**: Bearer JWT required
- **Query params**: `limit=20`, `offset=0`
- **Supabase client**: **Anon key + user JWT** (Social Blindness RLS MUST apply)
- **Flow**:
  1. Query posts with user JWT — Postgres filters via Social Blindness
  2. Fetch existing glazes for visible posts
  3. Batch post contents to Gemini for AI glaze generation (3 per post)
  4. Return `{posts: [{...post, glazes: [...], ai_glazes: [...]}]}`

### POST /api/roleplay/chat — LarpMaxxing Chat
- **Auth**: Bearer JWT required
- **Body**: `{"session_id": null|"uuid", "character_id": "gary_vee", "message": "..."}`
- **Supabase client**: Service role
- **Flow**:
  1. Load or create roleplay_sessions row
  2. Append user message to conversation_history
  3. Send full history to Gemini with character system prompt
  4. Gemini returns `{character_id, dialogue, emotion}`
  5. Append response, save to DB
  6. Return `{session_id, character_id, dialogue, emotion}`

### GET /api/roleplay/speak — Streaming TTS
- **Auth**: Bearer JWT required
- **Query params**: `text=...`, `character_id=...`
- **Returns**: `StreamingResponse(media_type="audio/mpeg")`
- **Flow**:
  1. Look up voice_id from Voice Registry
  2. Split text into sentence chunks (on `.`, `!`, `?`, `;`)
  3. Open WebSocket to ElevenLabs
  4. Stream text chunks in, yield audio bytes out
  5. Client receives continuous audio stream

---

## Supabase Client Usage Matrix

| Endpoint | Client Type | Why |
|---|---|---|
| PATCH /api/jobs/title | **Service role** | Privileged update, no RLS issues |
| POST /api/posts | **Service role** | Insert on behalf of user |
| GET /api/feed | **Anon key + user JWT** | **MUST respect Social Blindness RLS** |
| Scoring worker | **Service role** | Writes buzzword_score, calls update_larp_rating RPC |
| POST /api/roleplay/chat | **Service role** | Read/write roleplay_sessions |
| GET /api/roleplay/speak | **None** | No DB interaction, only ElevenLabs |

---

## Gemini Prompts

### 1. Prestige Evaluator (used by scoring worker)

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

### 2. Glaze-o-matic 3000 (used by feed endpoint)

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

### 3. Roleplay Character (used by roleplay chat — template, filled per character)

```
You are {character_name}, a legendary figure in the corporate LARP universe.
You are being consulted by an aspiring professional who seeks your wisdom.

Character bio: {character_bio}

Personality traits: {personality_traits}

Rules:
- Stay in character at all times. Never break the fourth wall.
- Your responses should be satirical exaggerations of {character_archetype} advice.
- Be absurdly confident. Every piece of advice should sound profound but be
  hilariously impractical or tautological.
- Pepper your speech with the character's signature catchphrases.
- Keep responses to 2-4 sentences for natural conversation flow.

Respond in STRICT JSON only:
{"character_id": "{character_id}", "dialogue": "<your response>", "emotion": "<one of: inspired, intense, zen, manic, condescending, enlightened>"}
```

---

## Voice Registry — Character Definitions

Four placeholder characters. Voice IDs are ElevenLabs pre-made voices — swap with your own later.

```python
CHARACTER_REGISTRY = {
    "gary_vee": {
        "name": "Gary Vee (Parody)",
        "voice_id": "pNInz6obpgDQGcFmaJgB",       # "Adam" — energetic male
        "bio": "A serial entrepreneur who believes every moment not spent hustling is wasted.",
        "personality_traits": "Manic energy, interrupts self, uses 'crush it' as punctuation",
        "archetype": "hustle culture guru",
    },
    "corporate_buddha": {
        "name": "The Corporate Buddha",
        "voice_id": "EXAVITQu4vr4xnSDxMaL",       # "Bella" — calm female
        "bio": "Former McKinsey partner who achieved enlightenment during a quarterly review.",
        "personality_traits": "Serene, speaks in koans that are actually business jargon",
        "archetype": "mindfulness-meets-management consultant",
    },
    "hustle_sensei": {
        "name": "The Hustle Sensei",
        "voice_id": "VR6AewLTigWG4xSOukaG",       # "Arnold" — authoritative
        "bio": "A LinkedIn thought leader who wakes up at 3AM to post about waking up at 3AM.",
        "personality_traits": "Relentlessly optimistic, humble-brags constantly",
        "archetype": "LinkedIn motivational poster come to life",
    },
    "disruption_diva": {
        "name": "The Disruption Diva",
        "voice_id": "21m00Tcm4TlvDq8ikWAM",       # "Rachel" — confident female
        "bio": "Startup founder who has pivoted 47 times and calls each one 'a strategic evolution'.",
        "personality_traits": "Uses 'disrupt' as every part of speech, pitches constantly",
        "archetype": "startup founder on permanent pitch mode",
    },
}
```

---

## ElevenLabs WebSocket TTS Protocol

The streaming audio flow for `/api/roleplay/speak`:

1. **Connect**: `wss://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream-input?model_id=eleven_turbo_v2_5`
2. **Send initial config** (JSON):
   ```json
   {"text": " ", "voice_settings": {"stability": 0.5, "similarity_boost": 0.75}, "xi_api_key": "YOUR_KEY"}
   ```
3. **Send text chunks** (JSON, one per sentence):
   ```json
   {"text": "First sentence. ", "try_trigger_generation": true}
   ```
4. **Send end signal**: `{"text": ""}`
5. **Receive audio** (JSON with base64 mp3):
   ```json
   {"audio": "<base64>", "isFinal": false}
   ```
6. **Decode and yield** each audio chunk to the StreamingResponse

**Text chunking**: Split on `(?<=[.!?;])\s+` — natural sentence boundaries for smooth TTS.

**Critical**: The API key goes in the first WebSocket message payload (`xi_api_key`), NOT as a header or query param.

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

### Roleplay Chat + Voice
```
Client -> POST /api/roleplay/chat
  -> Load/create session from roleplay_sessions
  -> Append user message to conversation_history
  -> Gemini returns {character_id, dialogue, emotion}
  -> Save updated history to DB
  -> Return response

Client -> GET /api/roleplay/speak?text=<dialogue>&character_id=<id>
  -> Voice Registry lookup -> voice_id
  -> chunk_text(dialogue) -> sentence chunks
  -> ElevenLabs WebSocket: stream text in, audio out
  -> StreamingResponse yields audio bytes to client
```

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

4. **ElevenLabs auth** goes in the WebSocket first-message payload as `xi_api_key`, not as a header.

5. **`update_larp_rating`** is `SECURITY DEFINER` — runs with function owner's privileges regardless of caller. Safe to call from any client type via `.rpc()`.

6. **Scoring is fire-and-forget.** Uses FastAPI `BackgroundTasks`, not Celery. If the server restarts mid-scoring, that score is lost. Acceptable for a hackathon.

7. **CORS**: Frontend expected at `localhost:3000`. Configured in `main.py`.

8. **Supabase Python client for user-context**: Use `create_client(url, anon_key)` then `client.postgrest.auth(user_jwt)` to set the Bearer token so PostgREST enforces RLS as that user.
