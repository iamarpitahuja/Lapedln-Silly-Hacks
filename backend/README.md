# LARP Platform — Backend

FastAPI backend for the LARP Platform, a satirical professional networking app. Uses SQLite for zero-config persistence, JWT for auth, and WebSockets for real-time messaging.

## Quick Start

```bash
python -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --port 8000
```

The database (`data/larp.db`) is auto-created on first startup. Delete it to reset.

## Architecture

```
app/
├── main.py              # FastAPI app, lifespan, CORS, WebSocket, static files
├── config.py            # Settings from .env (JWT_SECRET, API keys)
├── database.py          # SQLAlchemy async engine (SQLite + aiosqlite, WAL mode)
├── models.py            # 15 ORM models (User, Profile, Post, Comment, etc.)
├── dependencies.py      # JWT auth middleware (python-jose)
├── websocket.py         # ConnectionManager for real-time messaging
├── routers/
│   ├── auth.py          # POST register/login, GET me
│   ├── feed.py          # GET /feed — Social Blindness filter + AI glazes
│   ├── posts.py         # CRUD posts + comments + relarps + reactions
│   ├── profile.py       # GET/PATCH profile + avatar upload
│   ├── jobs.py          # GET options, PATCH current job
│   ├── connections.py   # Connection requests (send/accept/decline/list)
│   ├── messages.py      # 1:1 DMs + group conversations + WebSocket push
│   ├── notifications.py # Aggregated notifications
│   ├── relarps.py       # Relarp reactions (like/love/glaze)
│   ├── roleplay.py      # AI character chat + TTS
│   ├── games.py         # Gamification rewards
│   └── larpmaxxer.py    # LarpMaxxer training game
├── services/
│   ├── gemini.py        # Gemini API (scoring + glazes + roleplay)
│   ├── voice_registry.py # Character voice definitions
│   ├── elevenlabs.py    # TTS streaming
│   ├── memelord.py      # Roast meme generation
│   └── larpmaxxer_store.py # JSON data + progress persistence
├── workers/
│   └── scoring.py       # Background post scoring (Prestige Evaluator)
└── data/
    └── larpmaxxer/      # Static JSON data (scenarios, personas, characters)
```

## Environment Variables

Create a `.env` file in the backend directory:

```env
JWT_SECRET=your-secret-key-here       # Required: secret for signing JWT tokens
GEMINI_API_KEY=                        # Optional: Gemini AI (mocked when empty)
ELEVENLABS_API_KEY=                    # Optional: TTS for roleplay
MEMELORD_API_KEY=                      # Optional: roast meme generation
DEV_MODE=false                         # true skips auth (uses hardcoded test user)
```

## Database

- **Engine**: SQLite with WAL mode via SQLAlchemy async + aiosqlite
- **Location**: `backend/data/larp.db` (auto-created)
- **Reset**: Delete `data/larp.db` — tables are recreated on next startup
- **Models**: 15 tables defined in `app/models.py`

### Tables

| Table | Purpose |
|---|---|
| users | Auth credentials (email, hashed password) |
| profiles | Public profile data (name, job, bio, larp_rating, stats) |
| posts | User posts with buzzword scores |
| comments | Comments on posts |
| glazes | Satirical compliments (organic + AI-generated) |
| post_reactions | Like/love reactions on posts |
| relarps | Re-shared posts with commentary |
| relarp_reactions | Reactions on relarps |
| connections | LinkedIn-style connections (pending/accepted/declined) |
| messages | 1:1 direct messages |
| conversations | Group chat rooms |
| conversation_members | Group membership |
| group_messages | Messages in group chats |
| roleplay_sessions | AI character chat history |
| larpmaxxer_progress | LarpMaxxer game progress |

## Authentication

- **Registration**: `POST /api/auth/register` — creates user + profile, returns JWT
- **Login**: `POST /api/auth/login` — verifies bcrypt password, returns JWT
- **JWT**: HS256, 24h expiry, payload: `{sub: user_id, email, exp}`
- **Middleware**: `Authorization: Bearer <token>` header on all protected endpoints

## Key Features

### Social Blindness
Posts are filtered so users can only see posts from authors with equal or lower `larp_rating`. Implemented as a SQLAlchemy query filter in `feed.py`.

### Real-time Messaging
WebSocket endpoint at `/api/ws/messages?token=<jwt>`. When a message is sent via HTTP, the `ConnectionManager` pushes it to connected recipients.

### Background Scoring
When a post is created, a background task sends it to Gemini's "Prestige Evaluator" which scores buzzword density and adjusts the author's larp_rating.

### File Uploads
Avatar uploads via `POST /api/me/avatar`. Files saved to `backend/uploads/avatars/` and served via FastAPI `StaticFiles` at `/uploads`.

## API Docs

Swagger UI available at `http://localhost:8000/docs` when the server is running.
