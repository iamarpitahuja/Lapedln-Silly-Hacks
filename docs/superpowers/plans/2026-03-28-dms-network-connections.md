# DMs, Network & Connections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add LinkedIn-style connection requests, a Network page (Suggestions / Pending / My Connections), and real-time direct messaging via Supabase Realtime.

**Architecture:** Two new Supabase tables (`connections`, `messages`) with RLS. FastAPI adds `routers/connections.py` and `routers/messages.py`. React frontend adds `features/network/` and `features/messaging/` pages; Supabase JS client handles Realtime subscriptions for chat.

**Tech Stack:** FastAPI · Supabase Postgres + Realtime · `@supabase/supabase-js` (new dep) · React 19 · CSS Modules · Vitest + RTL

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `supabase/migrations/20260328000001_connections_messages.sql` | Schema, RLS, indexes, enable Realtime |
| Create | `backend/app/routers/connections.py` | 7 connection endpoints |
| Create | `backend/app/routers/messages.py` | 3 message endpoints |
| Modify | `backend/app/main.py` | Mount new routers |
| Create | `frontend/src/lib/supabase.js` | Supabase JS client singleton (for Realtime) |
| Modify | `frontend/src/services/api.js` | Add connections + messages API functions |
| Create | `frontend/src/features/network/Network.jsx` | Network page container (tabs) |
| Create | `frontend/src/features/network/Network.module.css` | Network page layout |
| Create | `frontend/src/features/network/UserCard/UserCard.jsx` | User card component |
| Create | `frontend/src/features/network/UserCard/UserCard.module.css` | User card styles |
| Create | `frontend/src/features/network/ConnectButton/ConnectButton.jsx` | Reusable connect action button |
| Create | `frontend/src/features/network/ConnectButton/ConnectButton.module.css` | Connect button styles |
| Create | `frontend/src/features/messaging/Messaging.jsx` | Two-panel messaging page |
| Create | `frontend/src/features/messaging/Messaging.module.css` | Messaging page layout |
| Create | `frontend/src/features/messaging/ConversationList/ConversationList.jsx` | Left panel conversation list |
| Create | `frontend/src/features/messaging/ConversationList/ConversationList.module.css` | Conversation list styles |
| Create | `frontend/src/features/messaging/ChatWindow/ChatWindow.jsx` | Right panel chat + Realtime sub |
| Create | `frontend/src/features/messaging/ChatWindow/ChatWindow.module.css` | Chat window styles |
| Create | `frontend/src/features/messaging/MessageBubble/MessageBubble.jsx` | Single message bubble |
| Create | `frontend/src/features/messaging/MessageBubble/MessageBubble.module.css` | Message bubble styles |
| Modify | `frontend/src/App.jsx` | Replace StubPage for /network and /messaging |
| Modify | `frontend/src/components/TopNav/TopNav.jsx` | Add unread message dot |
| Modify | `frontend/src/components/TopNav/TopNav.module.css` | Unread dot style |

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/20260328000001_connections_messages.sql`

- [ ] **Step 1: Write the migration file**

```sql
-- supabase/migrations/20260328000001_connections_messages.sql

-- ============================================================================
-- CONNECTIONS TABLE
-- LinkedIn-style connection requests (pending → accepted/declined)
-- ============================================================================
create table public.connections (
    id uuid primary key default gen_random_uuid(),
    requester_id uuid not null references public.profiles(id) on delete cascade,
    addressee_id uuid not null references public.profiles(id) on delete cascade,
    status text not null default 'pending'
        check (status in ('pending', 'accepted', 'declined')),
    created_at timestamptz not null default now(),
    unique (requester_id, addressee_id),
    check (requester_id <> addressee_id)
);

-- ============================================================================
-- MESSAGES TABLE
-- Direct messages. Conversation = normalized (min_id, max_id) pair.
-- Supabase Realtime enabled below.
-- ============================================================================
create table public.messages (
    id uuid primary key default gen_random_uuid(),
    sender_id uuid not null references public.profiles(id) on delete cascade,
    receiver_id uuid not null references public.profiles(id) on delete cascade,
    content text not null,
    read boolean not null default false,
    created_at timestamptz not null default now(),
    check (sender_id <> receiver_id)
);

-- ============================================================================
-- ROW LEVEL SECURITY — CONNECTIONS
-- ============================================================================
alter table public.connections enable row level security;

create policy "Users can see their own connections"
    on public.connections for select
    using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "Users can send connection requests"
    on public.connections for insert
    with check (auth.uid() = requester_id);

create policy "Addressee can update status (accept/decline)"
    on public.connections for update
    using (auth.uid() = addressee_id);

create policy "Requester can delete (withdraw) connections"
    on public.connections for delete
    using (auth.uid() = requester_id);

-- ============================================================================
-- ROW LEVEL SECURITY — MESSAGES
-- ============================================================================
alter table public.messages enable row level security;

create policy "Users can see their own messages"
    on public.messages for select
    using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can send messages"
    on public.messages for insert
    with check (auth.uid() = sender_id);

create policy "Receiver can mark messages as read"
    on public.messages for update
    using (auth.uid() = receiver_id);

-- ============================================================================
-- INDEXES
-- ============================================================================
create index idx_connections_requester on public.connections(requester_id);
create index idx_connections_addressee on public.connections(addressee_id);
create index idx_connections_status on public.connections(status);
create index idx_messages_sender on public.messages(sender_id);
create index idx_messages_receiver on public.messages(receiver_id);
create index idx_messages_created on public.messages(created_at desc);

-- ============================================================================
-- ENABLE SUPABASE REALTIME ON MESSAGES
-- ============================================================================
alter publication supabase_realtime add table public.messages;
```

- [ ] **Step 2: Apply the migration**

```bash
cd /path/to/project
npx supabase db reset
```

Expected: Migration applies without errors. If you don't want to reset: `npx supabase migration up` (if using Supabase CLI v2) or apply manually via Supabase dashboard SQL editor.

- [ ] **Step 3: Verify tables exist**

In Supabase dashboard (or `npx supabase db diff --local`): confirm `connections` and `messages` tables exist with the correct columns and RLS enabled.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260328000001_connections_messages.sql
git commit -m "feat: add connections and messages tables with RLS"
```

---

## Task 2: Backend — Connections Router

**Files:**
- Create: `backend/app/routers/connections.py`

- [ ] **Step 1: Create the connections router**

```python
# backend/app/routers/connections.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.dependencies import get_current_user, get_service_client

router = APIRouter(tags=["connections"])


class ConnectionRequest(BaseModel):
    addressee_id: str


@router.post("/connections/request", status_code=201)
async def send_connection_request(
    body: ConnectionRequest,
    user_id: str = Depends(get_current_user),
    supabase=Depends(get_service_client),
):
    """Send a connection request to another user."""
    if body.addressee_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot connect with yourself")

    # Check for existing connection in either direction
    existing = (
        supabase.table("connections")
        .select("id, status")
        .or_(
            f"and(requester_id.eq.{user_id},addressee_id.eq.{body.addressee_id}),"
            f"and(requester_id.eq.{body.addressee_id},addressee_id.eq.{user_id})"
        )
        .execute()
    )
    if existing.data:
        raise HTTPException(status_code=409, detail="Connection already exists")

    result = (
        supabase.table("connections")
        .insert({"requester_id": user_id, "addressee_id": body.addressee_id})
        .execute()
    )
    return result.data[0]


@router.patch("/connections/{connection_id}/accept")
async def accept_connection(
    connection_id: str,
    user_id: str = Depends(get_current_user),
    supabase=Depends(get_service_client),
):
    """Accept a pending connection request (addressee only)."""
    conn = (
        supabase.table("connections")
        .select("*")
        .eq("id", connection_id)
        .eq("addressee_id", user_id)
        .eq("status", "pending")
        .execute()
    )
    if not conn.data:
        raise HTTPException(status_code=404, detail="Connection request not found")

    result = (
        supabase.table("connections")
        .update({"status": "accepted"})
        .eq("id", connection_id)
        .execute()
    )
    return result.data[0]


@router.patch("/connections/{connection_id}/decline")
async def decline_connection(
    connection_id: str,
    user_id: str = Depends(get_current_user),
    supabase=Depends(get_service_client),
):
    """Decline a pending connection request (addressee only)."""
    conn = (
        supabase.table("connections")
        .select("*")
        .eq("id", connection_id)
        .eq("addressee_id", user_id)
        .eq("status", "pending")
        .execute()
    )
    if not conn.data:
        raise HTTPException(status_code=404, detail="Connection request not found")

    result = (
        supabase.table("connections")
        .update({"status": "declined"})
        .eq("id", connection_id)
        .execute()
    )
    return result.data[0]


@router.delete("/connections/{connection_id}", status_code=204)
async def remove_connection(
    connection_id: str,
    user_id: str = Depends(get_current_user),
    supabase=Depends(get_service_client),
):
    """Withdraw a sent request or remove an accepted connection (requester only)."""
    conn = (
        supabase.table("connections")
        .select("*")
        .eq("id", connection_id)
        .eq("requester_id", user_id)
        .execute()
    )
    if not conn.data:
        raise HTTPException(status_code=404, detail="Connection not found")

    supabase.table("connections").delete().eq("id", connection_id).execute()
    return None


@router.get("/connections")
async def get_my_connections(
    user_id: str = Depends(get_current_user),
    supabase=Depends(get_service_client),
):
    """List all accepted connections with profile data."""
    result = (
        supabase.table("connections")
        .select(
            "*, "
            "requester:profiles!requester_id(id, display_name, title, avatar_url, larp_rating), "
            "addressee:profiles!addressee_id(id, display_name, title, avatar_url, larp_rating)"
        )
        .or_(f"requester_id.eq.{user_id},addressee_id.eq.{user_id}")
        .eq("status", "accepted")
        .execute()
    )

    # Normalize: always return the "other" user as `profile`
    connections = []
    for c in result.data:
        other = c["addressee"] if c["requester_id"] == user_id else c["requester"]
        connections.append({
            "id": c["id"],
            "status": c["status"],
            "created_at": c["created_at"],
            "profile": other,
        })
    return {"connections": connections}


@router.get("/connections/pending")
async def get_pending_connections(
    user_id: str = Depends(get_current_user),
    supabase=Depends(get_service_client),
):
    """List incoming pending connection requests with requester profile data."""
    result = (
        supabase.table("connections")
        .select(
            "*, requester:profiles!requester_id(id, display_name, title, avatar_url, larp_rating)"
        )
        .eq("addressee_id", user_id)
        .eq("status", "pending")
        .order("created_at", desc=True)
        .execute()
    )
    return {"pending": result.data}


@router.get("/connections/suggestions")
async def get_connection_suggestions(
    user_id: str = Depends(get_current_user),
    supabase=Depends(get_service_client),
):
    """All users not yet connected with (any status), excluding self."""
    # Get all user IDs I have any connection with
    existing = (
        supabase.table("connections")
        .select("requester_id, addressee_id")
        .or_(f"requester_id.eq.{user_id},addressee_id.eq.{user_id}")
        .execute()
    )
    excluded = {user_id}
    for c in existing.data:
        excluded.add(c["requester_id"])
        excluded.add(c["addressee_id"])

    # Get all profiles not in excluded set
    all_profiles = (
        supabase.table("profiles")
        .select("id, display_name, title, avatar_url, larp_rating")
        .execute()
    )
    suggestions = [p for p in all_profiles.data if p["id"] not in excluded]
    return {"suggestions": suggestions}
```

- [ ] **Step 2: Manually test the router (after wiring in Task 4)**

```bash
# Test send request (dev mode: no auth needed)
curl -s -X POST http://localhost:8000/api/connections/request \
  -H "Content-Type: application/json" \
  -d '{"addressee_id": "some-real-uuid-from-profiles"}' | python -m json.tool

# Test suggestions
curl -s http://localhost:8000/api/connections/suggestions | python -m json.tool

# Test my connections
curl -s http://localhost:8000/api/connections | python -m json.tool
```

Expected: suggestions returns array of profiles; request returns connection row with status "pending".

- [ ] **Step 3: Commit**

```bash
git add backend/app/routers/connections.py
git commit -m "feat: add connections router (request, accept, decline, remove, list, suggestions)"
```

---

## Task 3: Backend — Messages Router

**Files:**
- Create: `backend/app/routers/messages.py`

- [ ] **Step 1: Create the messages router**

```python
# backend/app/routers/messages.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.dependencies import get_current_user, get_service_client

router = APIRouter(tags=["messages"])


class SendMessage(BaseModel):
    receiver_id: str
    content: str


@router.get("/messages/conversations")
async def get_conversations(
    user_id: str = Depends(get_current_user),
    supabase=Depends(get_service_client),
):
    """
    List all conversations for the current user.
    Returns one entry per unique conversation partner with:
    - other user's profile
    - latest message preview
    - unread count
    """
    result = (
        supabase.table("messages")
        .select(
            "*, "
            "sender:profiles!sender_id(id, display_name, avatar_url), "
            "receiver:profiles!receiver_id(id, display_name, avatar_url)"
        )
        .or_(f"sender_id.eq.{user_id},receiver_id.eq.{user_id}")
        .order("created_at", desc=True)
        .execute()
    )

    # Group by conversation partner, keep only the latest message per partner
    seen: dict[str, dict] = {}
    for msg in result.data:
        other_id = msg["receiver_id"] if msg["sender_id"] == user_id else msg["sender_id"]
        other_profile = msg["receiver"] if msg["sender_id"] == user_id else msg["sender"]
        if other_id not in seen:
            seen[other_id] = {
                "other_user": other_profile,
                "latest_message": msg["content"],
                "latest_at": msg["created_at"],
                "unread_count": 0,
            }
        # Count unread: messages sent to me that are unread
        if msg["receiver_id"] == user_id and not msg["read"]:
            seen[other_id]["unread_count"] += 1

    conversations = list(seen.values())
    return {"conversations": conversations}


@router.get("/messages/{other_user_id}")
async def get_message_history(
    other_user_id: str,
    user_id: str = Depends(get_current_user),
    supabase=Depends(get_service_client),
):
    """Full message history with one person, oldest first."""
    result = (
        supabase.table("messages")
        .select("*, sender:profiles!sender_id(id, display_name, avatar_url)")
        .or_(
            f"and(sender_id.eq.{user_id},receiver_id.eq.{other_user_id}),"
            f"and(sender_id.eq.{other_user_id},receiver_id.eq.{user_id})"
        )
        .order("created_at", desc=False)
        .execute()
    )

    # Mark received messages as read
    supabase.table("messages").update({"read": True}).eq(
        "sender_id", other_user_id
    ).eq("receiver_id", user_id).eq("read", False).execute()

    return {"messages": result.data}


@router.post("/messages", status_code=201)
async def send_message(
    body: SendMessage,
    user_id: str = Depends(get_current_user),
    supabase=Depends(get_service_client),
):
    """
    Send a direct message.
    Supabase Realtime automatically broadcasts the INSERT to subscribers.
    """
    if not body.content.strip():
        raise HTTPException(status_code=400, detail="Message content cannot be empty")
    if body.receiver_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot message yourself")

    result = (
        supabase.table("messages")
        .insert({
            "sender_id": user_id,
            "receiver_id": body.receiver_id,
            "content": body.content.strip(),
        })
        .execute()
    )
    return result.data[0]
```

- [ ] **Step 2: Manually test (after wiring in Task 4)**

```bash
# Send a message
curl -s -X POST http://localhost:8000/api/messages \
  -H "Content-Type: application/json" \
  -d '{"receiver_id": "some-real-uuid", "content": "Hello fellow larper"}' | python -m json.tool

# Get conversations
curl -s http://localhost:8000/api/messages/conversations | python -m json.tool

# Get history with a user
curl -s http://localhost:8000/api/messages/some-real-uuid | python -m json.tool
```

Expected: send returns the new message row; conversations returns grouped list; history returns ordered messages.

- [ ] **Step 3: Commit**

```bash
git add backend/app/routers/messages.py
git commit -m "feat: add messages router (conversations, history, send)"
```

---

## Task 4: Wire Routers into main.py

**Files:**
- Modify: `backend/app/main.py`

- [ ] **Step 1: Update main.py to mount the new routers**

Replace the imports and router mounts section:

```python
# backend/app/main.py
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import feed, posts, jobs, profile, connections, messages

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    from supabase import create_client
    logger.info("Connecting to Supabase at %s", settings.supabase_url)
    app.state.supabase = create_client(
        settings.supabase_url, settings.supabase_service_role_key
    )
    yield


app = FastAPI(title="LARP Platform", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(feed.router, prefix="/api")
app.include_router(posts.router, prefix="/api")
app.include_router(jobs.router, prefix="/api")
app.include_router(profile.router, prefix="/api")
app.include_router(connections.router, prefix="/api")
app.include_router(messages.router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "larping", "dev_mode": settings.dev_mode}
```

- [ ] **Step 2: Restart the server and verify routes exist**

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

Then open `http://localhost:8000/docs` — confirm `/api/connections/*` and `/api/messages/*` endpoints appear in Swagger UI.

- [ ] **Step 3: Commit**

```bash
git add backend/app/main.py
git commit -m "feat: mount connections and messages routers"
```

---

## Task 5: Frontend — Install Supabase JS + Create Client

**Files:**
- Modify: `frontend/package.json` (via npm install)
- Create: `frontend/src/lib/supabase.js`
- Create: `frontend/.env` (if it doesn't exist)

- [ ] **Step 1: Install @supabase/supabase-js**

```bash
cd frontend
npm install @supabase/supabase-js
```

Expected: `package.json` now lists `@supabase/supabase-js` in dependencies.

- [ ] **Step 2: Add Supabase env vars to frontend/.env**

Create or update `frontend/.env` (this file should be git-ignored):

```
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=your-anon-key-from-npx-supabase-status
```

Get the values by running `npx supabase status` in the project root. For the anon key, copy the `anon key` value.

- [ ] **Step 3: Create the Supabase client singleton**

```javascript
// frontend/src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

- [ ] **Step 4: Verify .env is git-ignored**

```bash
cat frontend/.gitignore | grep .env
```

If `.env` is not listed, add it:

```bash
echo ".env" >> frontend/.gitignore
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/supabase.js frontend/.gitignore
git commit -m "feat: add Supabase JS client for Realtime"
```

---

## Task 6: Frontend — API Functions

**Files:**
- Modify: `frontend/src/services/api.js`

- [ ] **Step 1: Add connections and messages API functions to the existing api.js**

Append to the bottom of `frontend/src/services/api.js`:

```javascript
// ── Connections ──────────────────────────────────────────────────────────────

export async function fetchConnections() {
  const res = await fetch(`${API_BASE}/connections`)
  if (!res.ok) throw new Error(`Connections fetch failed: ${res.status}`)
  return res.json()
}

export async function fetchPendingConnections() {
  const res = await fetch(`${API_BASE}/connections/pending`)
  if (!res.ok) throw new Error(`Pending connections fetch failed: ${res.status}`)
  return res.json()
}

export async function fetchConnectionSuggestions() {
  const res = await fetch(`${API_BASE}/connections/suggestions`)
  if (!res.ok) throw new Error(`Suggestions fetch failed: ${res.status}`)
  return res.json()
}

export async function sendConnectionRequest(addresseeId) {
  const res = await fetch(`${API_BASE}/connections/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ addressee_id: addresseeId }),
  })
  if (!res.ok) throw new Error(`Connection request failed: ${res.status}`)
  return res.json()
}

export async function acceptConnection(connectionId) {
  const res = await fetch(`${API_BASE}/connections/${connectionId}/accept`, {
    method: 'PATCH',
  })
  if (!res.ok) throw new Error(`Accept failed: ${res.status}`)
  return res.json()
}

export async function declineConnection(connectionId) {
  const res = await fetch(`${API_BASE}/connections/${connectionId}/decline`, {
    method: 'PATCH',
  })
  if (!res.ok) throw new Error(`Decline failed: ${res.status}`)
  return res.json()
}

export async function removeConnection(connectionId) {
  const res = await fetch(`${API_BASE}/connections/${connectionId}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error(`Remove connection failed: ${res.status}`)
}

// ── Messages ─────────────────────────────────────────────────────────────────

export async function fetchConversations() {
  const res = await fetch(`${API_BASE}/messages/conversations`)
  if (!res.ok) throw new Error(`Conversations fetch failed: ${res.status}`)
  return res.json()
}

export async function fetchMessageHistory(otherUserId) {
  const res = await fetch(`${API_BASE}/messages/${otherUserId}`)
  if (!res.ok) throw new Error(`Message history fetch failed: ${res.status}`)
  return res.json()
}

export async function sendMessage(receiverId, content) {
  const res = await fetch(`${API_BASE}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ receiver_id: receiverId, content }),
  })
  if (!res.ok) throw new Error(`Send message failed: ${res.status}`)
  return res.json()
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/services/api.js
git commit -m "feat: add connections and messages API functions"
```

---

## Task 7: Frontend — Network Page

**Files:**
- Create: `frontend/src/features/network/ConnectButton/ConnectButton.jsx`
- Create: `frontend/src/features/network/ConnectButton/ConnectButton.module.css`
- Create: `frontend/src/features/network/UserCard/UserCard.jsx`
- Create: `frontend/src/features/network/UserCard/UserCard.module.css`
- Create: `frontend/src/features/network/Network.jsx`
- Create: `frontend/src/features/network/Network.module.css`

- [ ] **Step 1: Write ConnectButton component**

```jsx
// frontend/src/features/network/ConnectButton/ConnectButton.jsx
import { useState } from 'react'
import {
  sendConnectionRequest,
  acceptConnection,
  declineConnection,
  removeConnection,
} from '../../../services/api'
import styles from './ConnectButton.module.css'

// connectionStatus: 'none' | 'pending_sent' | 'pending_received' | 'accepted'
// connectionId: uuid string (needed for accept/decline/remove)
export default function ConnectButton({ userId, connectionStatus, connectionId, onStatusChange }) {
  const [loading, setLoading] = useState(false)

  async function handleConnect() {
    setLoading(true)
    try {
      const data = await sendConnectionRequest(userId)
      onStatusChange('pending_sent', data.id)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleAccept() {
    setLoading(true)
    try {
      await acceptConnection(connectionId)
      onStatusChange('accepted', connectionId)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleDecline() {
    setLoading(true)
    try {
      await declineConnection(connectionId)
      onStatusChange('declined', connectionId)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleRemove() {
    setLoading(true)
    try {
      await removeConnection(connectionId)
      onStatusChange('none', null)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (connectionStatus === 'none') {
    return (
      <button className={`${styles.btn} ${styles.connect}`} onClick={handleConnect} disabled={loading}>
        {loading ? 'Connecting…' : '+ Connect'}
      </button>
    )
  }

  if (connectionStatus === 'pending_sent') {
    return (
      <button className={`${styles.btn} ${styles.pending}`} onClick={handleRemove} disabled={loading}>
        {loading ? '…' : 'Pending'}
      </button>
    )
  }

  if (connectionStatus === 'pending_received') {
    return (
      <div className={styles.row}>
        <button className={`${styles.btn} ${styles.accept}`} onClick={handleAccept} disabled={loading}>
          {loading ? '…' : 'Accept'}
        </button>
        <button className={`${styles.btn} ${styles.decline}`} onClick={handleDecline} disabled={loading}>
          Ignore
        </button>
      </div>
    )
  }

  if (connectionStatus === 'accepted') {
    return (
      <button className={`${styles.btn} ${styles.connected}`} onClick={handleRemove} disabled={loading}>
        {loading ? '…' : 'Connected ✓'}
      </button>
    )
  }

  return null
}
```

- [ ] **Step 2: Write ConnectButton styles**

```css
/* frontend/src/features/network/ConnectButton/ConnectButton.module.css */
.btn {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  border: 1.5px solid transparent;
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.connect {
  background: transparent;
  border-color: #0A66C2;
  color: #0A66C2;
}

.connect:hover:not(:disabled) {
  background: rgba(10, 102, 194, 0.08);
}

.pending {
  background: transparent;
  border-color: rgba(0, 0, 0, 0.4);
  color: rgba(0, 0, 0, 0.6);
}

.pending:hover:not(:disabled) {
  border-color: #c0392b;
  color: #c0392b;
}

.accept {
  background: #0A66C2;
  color: #fff;
}

.accept:hover:not(:disabled) {
  background: #0858a8;
}

.decline {
  background: transparent;
  border-color: rgba(0, 0, 0, 0.4);
  color: rgba(0, 0, 0, 0.6);
}

.decline:hover:not(:disabled) {
  border-color: rgba(0, 0, 0, 0.7);
  color: rgba(0, 0, 0, 0.9);
}

.connected {
  background: transparent;
  border-color: #057642;
  color: #057642;
  font-size: 13px;
}

.connected:hover:not(:disabled) {
  background: rgba(5, 118, 66, 0.06);
  border-color: #c0392b;
  color: #c0392b;
}

.row {
  display: flex;
  gap: 8px;
}
```

- [ ] **Step 3: Write UserCard component**

```jsx
// frontend/src/features/network/UserCard/UserCard.jsx
import { useState } from 'react'
import LarpRatingBadge from '../../../components/LarpRatingBadge/LarpRatingBadge'
import ConnectButton from '../ConnectButton/ConnectButton'
import { getInitials } from '../../../utils/strings'
import styles from './UserCard.module.css'

const AVATAR_COLORS = ['#0A66C2', '#057642', '#7c3aed', '#b45309', '#be123c', '#0891b2']

function getAvatarColor(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export default function UserCard({ user, initialStatus = 'none', connectionId: initialConnectionId = null }) {
  const [status, setStatus] = useState(initialStatus)
  const [connectionId, setConnectionId] = useState(initialConnectionId)

  function handleStatusChange(newStatus, newId) {
    setStatus(newStatus)
    setConnectionId(newId)
  }

  const name = user.display_name || 'Anonymous Larper'
  const title = user.title || 'Aspiring Thought Leader'

  return (
    <div className={styles.card}>
      <div className={styles.avatarWrap}>
        {user.avatar_url ? (
          <img src={user.avatar_url} alt={name} className={styles.avatarImg} />
        ) : (
          <div
            className={styles.avatar}
            style={{ background: getAvatarColor(name) }}
          >
            {getInitials(name)}
          </div>
        )}
      </div>
      <div className={styles.info}>
        <span className={styles.name}>{name}</span>
        <span className={styles.title}>{title}</span>
        <div className={styles.badge}>
          <LarpRatingBadge rating={user.larp_rating ?? 0} size="small" />
        </div>
      </div>
      <div className={styles.actions}>
        <ConnectButton
          userId={user.id}
          connectionStatus={status}
          connectionId={connectionId}
          onStatusChange={handleStatusChange}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Write UserCard styles**

```css
/* frontend/src/features/network/UserCard/UserCard.module.css */
.card {
  background: #fff;
  border-radius: 12px;
  padding: 20px 16px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: box-shadow var(--transition-fast), transform var(--transition-fast);
}

.card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.avatarWrap {
  flex-shrink: 0;
}

.avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  color: #fff;
  font-size: 22px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatarImg {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
}

.info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  text-align: center;
}

.name {
  font-size: 15px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.9);
}

.title {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.5);
  line-height: 1.4;
  max-width: 160px;
}

.badge {
  margin-top: 2px;
}

.actions {
  margin-top: 4px;
}
```

- [ ] **Step 5: Write Network page**

```jsx
// frontend/src/features/network/Network.jsx
import { useState, useEffect } from 'react'
import {
  fetchConnectionSuggestions,
  fetchPendingConnections,
  fetchConnections,
} from '../../services/api'
import UserCard from './UserCard/UserCard'
import styles from './Network.module.css'

const TABS = ['Suggestions', 'Pending', 'My Connections']

export default function Network() {
  const [activeTab, setActiveTab] = useState('Suggestions')
  const [suggestions, setSuggestions] = useState([])
  const [pending, setPending] = useState([])
  const [connections, setConnections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [s, p, c] = await Promise.all([
          fetchConnectionSuggestions(),
          fetchPendingConnections(),
          fetchConnections(),
        ])
        setSuggestions(s.suggestions ?? [])
        setPending(p.pending ?? [])
        setConnections(c.connections ?? [])
      } catch (e) {
        setError('Failed to load network data. Is the backend running?')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.heading}>My Network</h1>

        <div className={styles.tabs}>
          {TABS.map(tab => (
            <button
              key={tab}
              className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
              {tab === 'Pending' && pending.length > 0 && (
                <span className={styles.badge}>{pending.length}</span>
              )}
            </button>
          ))}
        </div>

        {loading && <p className={styles.state}>Loading your network…</p>}
        {error && <p className={styles.stateError}>{error}</p>}

        {!loading && !error && (
          <>
            {activeTab === 'Suggestions' && (
              <div className={styles.grid}>
                {suggestions.length === 0 ? (
                  <p className={styles.empty}>No suggestions right now. You know everyone!</p>
                ) : (
                  suggestions.map(user => (
                    <UserCard key={user.id} user={user} initialStatus="none" />
                  ))
                )}
              </div>
            )}

            {activeTab === 'Pending' && (
              <div>
                {pending.length === 0 ? (
                  <p className={styles.empty}>No pending requests.</p>
                ) : (
                  <div className={styles.grid}>
                    {pending.map(conn => (
                      <UserCard
                        key={conn.id}
                        user={conn.requester}
                        initialStatus="pending_received"
                        connectionId={conn.id}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'My Connections' && (
              <div className={styles.grid}>
                {connections.length === 0 ? (
                  <p className={styles.empty}>No connections yet. Start connecting!</p>
                ) : (
                  connections.map(conn => (
                    <UserCard
                      key={conn.id}
                      user={conn.profile}
                      initialStatus="accepted"
                      connectionId={conn.id}
                    />
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Write Network page styles**

```css
/* frontend/src/features/network/Network.module.css */
.page {
  min-height: calc(100vh - 52px);
  background: #f3f2ef;
  padding: 24px 16px;
}

.container {
  max-width: 960px;
  margin: 0 auto;
}

.heading {
  font-size: 24px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.9);
  margin: 0 0 20px;
}

.tabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  margin-bottom: 24px;
}

.tab {
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.6);
  background: none;
  border: none;
  border-bottom: 2.5px solid transparent;
  cursor: pointer;
  transition: all var(--transition-fast);
  margin-bottom: -1px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.tab:hover {
  color: rgba(0, 0, 0, 0.9);
  background: rgba(0, 0, 0, 0.03);
  border-radius: 6px 6px 0 0;
}

.tabActive {
  color: rgba(0, 0, 0, 0.9);
  border-bottom-color: rgba(0, 0, 0, 0.9);
  font-weight: 600;
}

.badge {
  background: #0A66C2;
  color: #fff;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 700;
  padding: 1px 6px;
  min-width: 18px;
  text-align: center;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.state {
  color: rgba(0, 0, 0, 0.5);
  text-align: center;
  padding: 40px;
}

.stateError {
  color: #c0392b;
  text-align: center;
  padding: 40px;
}

.empty {
  color: rgba(0, 0, 0, 0.5);
  font-size: 14px;
  padding: 24px 0;
}
```

- [ ] **Step 7: Commit**

```bash
git add frontend/src/features/network/
git commit -m "feat: add Network page with Suggestions, Pending, and My Connections tabs"
```

---

## Task 8: Frontend — Messaging Page

**Files:**
- Create: `frontend/src/features/messaging/MessageBubble/MessageBubble.jsx`
- Create: `frontend/src/features/messaging/MessageBubble/MessageBubble.module.css`
- Create: `frontend/src/features/messaging/ChatWindow/ChatWindow.jsx`
- Create: `frontend/src/features/messaging/ChatWindow/ChatWindow.module.css`
- Create: `frontend/src/features/messaging/ConversationList/ConversationList.jsx`
- Create: `frontend/src/features/messaging/ConversationList/ConversationList.module.css`
- Create: `frontend/src/features/messaging/Messaging.jsx`
- Create: `frontend/src/features/messaging/Messaging.module.css`

- [ ] **Step 1: Write MessageBubble component**

```jsx
// frontend/src/features/messaging/MessageBubble/MessageBubble.jsx
import styles from './MessageBubble.module.css'

export default function MessageBubble({ message, isMine }) {
  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className={`${styles.wrap} ${isMine ? styles.mine : styles.theirs}`}>
      <div className={`${styles.bubble} ${isMine ? styles.bubbleMine : styles.bubbleTheirs}`}>
        {message.content}
      </div>
      <span className={styles.time}>{time}</span>
    </div>
  )
}
```

- [ ] **Step 2: Write MessageBubble styles**

```css
/* frontend/src/features/messaging/MessageBubble/MessageBubble.module.css */
.wrap {
  display: flex;
  flex-direction: column;
  max-width: 70%;
  gap: 3px;
}

.mine {
  align-self: flex-end;
  align-items: flex-end;
}

.theirs {
  align-self: flex-start;
  align-items: flex-start;
}

.bubble {
  padding: 10px 14px;
  border-radius: 18px;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
}

.bubbleMine {
  background: #0A66C2;
  color: #fff;
  border-bottom-right-radius: 4px;
}

.bubbleTheirs {
  background: #fff;
  color: rgba(0, 0, 0, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-bottom-left-radius: 4px;
}

.time {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.4);
  padding: 0 4px;
}
```

- [ ] **Step 3: Write ChatWindow component**

Note: `currentUserId` is the DEV_USER_ID (`"00000000-0000-0000-0000-000000000000"`) in dev mode. Pass it as a prop from Messaging.

```jsx
// frontend/src/features/messaging/ChatWindow/ChatWindow.jsx
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../../lib/supabase'
import { fetchMessageHistory, sendMessage } from '../../../services/api'
import MessageBubble from '../MessageBubble/MessageBubble'
import { getInitials } from '../../../utils/strings'
import styles from './ChatWindow.module.css'

const AVATAR_COLORS = ['#0A66C2', '#057642', '#7c3aed', '#b45309', '#be123c', '#0891b2']

function getAvatarColor(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export default function ChatWindow({ otherUser, currentUserId }) {
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef(null)

  // Load history on conversation change
  useEffect(() => {
    if (!otherUser) return
    setLoading(true)
    setMessages([])
    fetchMessageHistory(otherUser.id)
      .then(data => setMessages(data.messages ?? []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [otherUser?.id])

  // Supabase Realtime: subscribe to incoming messages
  useEffect(() => {
    if (!otherUser || !currentUserId) return

    const channel = supabase
      .channel(`messages-${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${currentUserId}`,
        },
        (payload) => {
          const msg = payload.new
          // Only append if it's from the active conversation partner
          if (msg.sender_id === otherUser.id) {
            setMessages(prev => [...prev, msg])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [otherUser?.id, currentUserId])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    const content = draft.trim()
    if (!content || sending) return
    setSending(true)
    setDraft('')
    // Optimistic update
    const optimistic = {
      id: `opt-${Date.now()}`,
      sender_id: currentUserId,
      receiver_id: otherUser.id,
      content,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])
    try {
      const saved = await sendMessage(otherUser.id, content)
      // Replace optimistic message with real one
      setMessages(prev => prev.map(m => m.id === optimistic.id ? saved : m))
    } catch (e) {
      console.error(e)
      // Remove optimistic on error
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
      setDraft(content)
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!otherUser) {
    return (
      <div className={styles.empty}>
        <p>Select a conversation to start messaging</p>
      </div>
    )
  }

  const name = otherUser.display_name || 'Anonymous Larper'

  return (
    <div className={styles.window}>
      <div className={styles.header}>
        <div
          className={styles.avatar}
          style={{ background: getAvatarColor(name) }}
        >
          {otherUser.avatar_url
            ? <img src={otherUser.avatar_url} alt={name} className={styles.avatarImg} />
            : getInitials(name)
          }
        </div>
        <div>
          <div className={styles.headerName}>{name}</div>
          <div className={styles.headerTitle}>{otherUser.title ?? 'Aspiring Thought Leader'}</div>
        </div>
      </div>

      <div className={styles.messages}>
        {loading && <p className={styles.state}>Loading messages…</p>}
        {!loading && messages.length === 0 && (
          <p className={styles.state}>No messages yet. Break the ice with some synergy.</p>
        )}
        {messages.map(msg => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isMine={msg.sender_id === currentUserId}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className={styles.inputBar}>
        <textarea
          className={styles.input}
          placeholder="Write a message… (Enter to send)"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={sending}
        />
        <button
          className={styles.sendBtn}
          onClick={handleSend}
          disabled={!draft.trim() || sending}
        >
          Send
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Write ChatWindow styles**

```css
/* frontend/src/features/messaging/ChatWindow/ChatWindow.module.css */
.window {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
}

.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: rgba(0, 0, 0, 0.4);
  font-size: 14px;
}

.header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.avatarImg {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.headerName {
  font-size: 15px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.9);
}

.headerTitle {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.5);
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.state {
  color: rgba(0, 0, 0, 0.4);
  font-size: 13px;
  text-align: center;
  margin: auto;
}

.inputBar {
  display: flex;
  gap: 10px;
  padding: 12px 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  align-items: flex-end;
  flex-shrink: 0;
}

.input {
  flex: 1;
  padding: 10px 14px;
  border: 1.5px solid rgba(0, 0, 0, 0.15);
  border-radius: 20px;
  font-size: 14px;
  resize: none;
  outline: none;
  font-family: inherit;
  line-height: 1.5;
  max-height: 120px;
  overflow-y: auto;
  transition: border-color var(--transition-fast);
}

.input:focus {
  border-color: #0A66C2;
}

.sendBtn {
  padding: 10px 20px;
  background: #0A66C2;
  color: #fff;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background var(--transition-fast);
  flex-shrink: 0;
}

.sendBtn:hover:not(:disabled) {
  background: #0858a8;
}

.sendBtn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

- [ ] **Step 5: Write ConversationList component**

```jsx
// frontend/src/features/messaging/ConversationList/ConversationList.jsx
import { getInitials } from '../../../utils/strings'
import styles from './ConversationList.module.css'

const AVATAR_COLORS = ['#0A66C2', '#057642', '#7c3aed', '#b45309', '#be123c', '#0891b2']

function getAvatarColor(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export default function ConversationList({ conversations, activeUserId, onSelect, onNewMessage }) {
  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.heading}>Messaging</h2>
        <button className={styles.newBtn} onClick={onNewMessage} title="New message">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75z"/>
          </svg>
        </button>
      </div>

      {conversations.length === 0 && (
        <p className={styles.empty}>No conversations yet. DM someone from the Network page.</p>
      )}

      <ul className={styles.list}>
        {conversations.map(conv => {
          const user = conv.other_user
          const name = user?.display_name || 'Anonymous Larper'
          const isActive = activeUserId === user?.id
          return (
            <li key={user?.id}>
              <button
                className={`${styles.item} ${isActive ? styles.itemActive : ''}`}
                onClick={() => onSelect(user)}
              >
                <div
                  className={styles.avatar}
                  style={{ background: getAvatarColor(name) }}
                >
                  {user?.avatar_url
                    ? <img src={user.avatar_url} alt={name} className={styles.avatarImg} />
                    : getInitials(name)
                  }
                </div>
                <div className={styles.info}>
                  <div className={styles.nameRow}>
                    <span className={styles.name}>{name}</span>
                    {conv.unread_count > 0 && (
                      <span className={styles.unreadBadge}>{conv.unread_count}</span>
                    )}
                  </div>
                  <span className={styles.preview}>{conv.latest_message}</span>
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
```

- [ ] **Step 6: Write ConversationList styles**

```css
/* frontend/src/features/messaging/ConversationList/ConversationList.module.css */
.panel {
  width: 320px;
  flex-shrink: 0;
  border-right: 1px solid rgba(0, 0, 0, 0.1);
  background: #fff;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.heading {
  font-size: 18px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.9);
  margin: 0;
}

.newBtn {
  background: none;
  border: none;
  cursor: pointer;
  color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  padding: 6px;
  border-radius: 50%;
  transition: all var(--transition-fast);
}

.newBtn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: rgba(0, 0, 0, 0.9);
}

.empty {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.4);
  padding: 20px;
  line-height: 1.5;
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  flex: 1;
}

.item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  width: 100%;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background var(--transition-fast);
}

.item:hover {
  background: rgba(0, 0, 0, 0.04);
}

.itemActive {
  background: rgba(10, 102, 194, 0.07);
}

.avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.avatarImg {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.info {
  flex: 1;
  min-width: 0;
}

.nameRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.name {
  font-size: 14px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.unreadBadge {
  background: #0A66C2;
  color: #fff;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 700;
  padding: 1px 6px;
  flex-shrink: 0;
}

.preview {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  margin-top: 2px;
}
```

- [ ] **Step 7: Write Messaging page**

Note: `DEV_USER_ID` matches the value in `backend/app/dependencies.py` when `skip_auth = True`.

```jsx
// frontend/src/features/messaging/Messaging.jsx
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fetchConversations } from '../../services/api'
import ConversationList from './ConversationList/ConversationList'
import ChatWindow from './ChatWindow/ChatWindow'
import styles from './Messaging.module.css'

// In dev mode (skip_auth=True), backend uses this as the current user
const DEV_USER_ID = '00000000-0000-0000-0000-000000000000'

export default function Messaging() {
  const [searchParams] = useSearchParams()
  const [conversations, setConversations] = useState([])
  const [activeUser, setActiveUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Support navigating to /messaging?userId=xxx (from DM button on PostCard / Network)
  const initialUserId = searchParams.get('userId')

  useEffect(() => {
    fetchConversations()
      .then(data => {
        const convs = data.conversations ?? []
        setConversations(convs)
        // If a userId was passed in the URL, open that conversation
        if (initialUserId) {
          const existing = convs.find(c => c.other_user?.id === initialUserId)
          if (existing) {
            setActiveUser(existing.other_user)
          } else {
            // New conversation — we don't have their profile yet, fetch it
            // For now set a placeholder; ChatWindow will load history
            setActiveUser({ id: initialUserId, display_name: 'Loading…' })
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [initialUserId])

  function handleSelectConversation(user) {
    setActiveUser(user)
  }

  // "New message" button — in a full implementation this would open a people search
  // For now, just clear active user so user can pick from list
  function handleNewMessage() {
    setActiveUser(null)
  }

  return (
    <div className={styles.page}>
      {loading ? (
        <p className={styles.loading}>Loading conversations…</p>
      ) : (
        <div className={styles.layout}>
          <ConversationList
            conversations={conversations}
            activeUserId={activeUser?.id}
            onSelect={handleSelectConversation}
            onNewMessage={handleNewMessage}
          />
          <div className={styles.chat}>
            <ChatWindow
              otherUser={activeUser}
              currentUserId={DEV_USER_ID}
            />
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 8: Write Messaging page styles**

```css
/* frontend/src/features/messaging/Messaging.module.css */
.page {
  height: calc(100vh - 52px);
  background: #f3f2ef;
  display: flex;
  align-items: stretch;
}

.loading {
  margin: auto;
  color: rgba(0, 0, 0, 0.4);
  font-size: 14px;
}

.layout {
  display: flex;
  width: 100%;
  max-width: 1128px;
  margin: 0 auto;
  background: #fff;
  border-left: 1px solid rgba(0, 0, 0, 0.1);
  border-right: 1px solid rgba(0, 0, 0, 0.1);
  height: 100%;
  overflow: hidden;
}

.chat {
  flex: 1;
  overflow: hidden;
}
```

- [ ] **Step 9: Commit**

```bash
git add frontend/src/features/messaging/
git commit -m "feat: add Messaging page with ConversationList, ChatWindow, and Supabase Realtime"
```

---

## Task 9: Wire Routes + TopNav Unread Dot

**Files:**
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/components/TopNav/TopNav.jsx`
- Modify: `frontend/src/components/TopNav/TopNav.module.css`

- [ ] **Step 1: Update App.jsx to use the new pages**

```jsx
// frontend/src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MockDataProvider } from './context/MockDataContext'
import TopNav from './components/TopNav/TopNav'
import Home from './features/home/Home'
import Me from './features/me/Me'
import Network from './features/network/Network'
import Messaging from './features/messaging/Messaging'
import JobsPage from './pages/JobsPage'
import StubPage from './pages/StubPage'
import styles from './App.module.css'

export default function App() {
  return (
    <MockDataProvider>
      <BrowserRouter>
        <TopNav />
        <main className={styles.main}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/network" element={<Network />} />
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/messaging" element={<Messaging />} />
            <Route path="/notifications" element={<StubPage title="Notifications" />} />
            <Route path="/me" element={<Me />} />
          </Routes>
        </main>
      </BrowserRouter>
    </MockDataProvider>
  )
}
```

- [ ] **Step 2: Add unread dot to TopNav messaging icon**

Replace the messaging entry in `NAV_ITEMS` and add `useUnreadCount` logic. The full updated `TopNav.jsx`:

```jsx
// frontend/src/components/TopNav/TopNav.jsx
import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useMockData } from '../../context/MockDataContext'
import { getInitials } from '../../utils/strings'
import { fetchConversations } from '../../services/api'
import styles from './TopNav.module.css'

const NAV_ITEMS = [
  {
    path: '/',
    label: 'Home',
    tooltip: 'See what everyone is pretending to accomplish',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
        <path d="M23 9v2h-2v7a3 3 0 01-3 3h-4v-6h-4v6H6a3 3 0 01-3-3v-7H1V9l11-7 11 7z" />
      </svg>
    ),
  },
  {
    path: '/network',
    label: 'My Network',
    tooltip: 'People you allegedly know',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
        <path d="M12 16v6H3v-6a3 3 0 013-3h3a3 3 0 013 3zm5.5-3A3.5 3.5 0 1014 9.5a3.5 3.5 0 003.5 3.5zm1 2h-2a2.5 2.5 0 00-2.5 2.5V22h7v-4.5a2.5 2.5 0 00-2.5-2.5zM7.5 2A4.5 4.5 0 1012 6.5 4.49 4.49 0 007.5 2z" />
      </svg>
    ),
  },
  {
    path: '/jobs',
    label: 'J*bs',
    tooltip: 'Skip the inconvenient parts',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
        <path d="M17 6V5a3 3 0 00-3-3h-4a3 3 0 00-3 3v1H2v4a3 3 0 003 3h14a3 3 0 003-3V6zM9 5a1 1 0 011-1h4a1 1 0 011 1v1H9zm10 9a4 4 0 003-1.38V17a3 3 0 01-3 3H5a3 3 0 01-3-3v-4.38A4 4 0 005 14z" />
      </svg>
    ),
  },
  {
    path: '/messaging',
    label: 'Messaging',
    tooltip: 'Cold outreach, hot delusion',
    isMessaging: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
        <path d="M16 4H8a7 7 0 000 14h4l4 4v-4a7 7 0 000-14z" />
      </svg>
    ),
  },
  {
    path: '/notifications',
    label: 'Notifications',
    tooltip: 'Validation center',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
        <path d="M22 19h-6.18C15.4 20.77 13.85 22 12 22s-3.4-1.23-3.82-3H2v-2l2-2V9a8 8 0 0116 0v6l2 2zM12 4a6 6 0 00-6 6v7h12V10a6 6 0 00-6-6z" />
      </svg>
    ),
  },
  {
    path: '/me',
    label: 'Me',
    tooltip: 'Curate your myth',
    isMe: true,
  },
]

export default function TopNav() {
  const { currentUser } = useMockData()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetchConversations()
      .then(data => {
        const total = (data.conversations ?? []).reduce((sum, c) => sum + (c.unread_count ?? 0), 0)
        setUnreadCount(total)
      })
      .catch(() => {}) // Silently fail if backend is down
  }, [])

  return (
    <header className={styles.nav}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <NavLink to="/" className={styles.logo}>
            <span className={styles.logoText}>LarpedIn</span>
          </NavLink>
          <div className={styles.searchWrap}>
            <svg
              className={styles.searchIcon}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className={styles.search}
              placeholder="Search people, titles, delusions"
            />
          </div>
        </div>

        <nav className={styles.tabs}>
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `${styles.tab} ${isActive ? styles.tabActive : ''}`
              }
              title={item.tooltip}
            >
              <span className={styles.tabIcon}>
                {item.isMe ? (
                  currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className={styles.avatarSmallImg}
                    />
                  ) : (
                    <span className={styles.avatarSmall}>{getInitials(currentUser.name)}</span>
                  )
                ) : (
                  <span className={styles.iconWrap}>
                    {item.icon}
                    {item.isMessaging && unreadCount > 0 && (
                      <span className={styles.unreadDot} />
                    )}
                  </span>
                )}
              </span>
              <span className={styles.tabLabel}>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
```

- [ ] **Step 3: Add unread dot style to TopNav.module.css**

Append to the bottom of `frontend/src/components/TopNav/TopNav.module.css`:

```css
.iconWrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.unreadDot {
  position: absolute;
  top: -2px;
  right: -4px;
  width: 8px;
  height: 8px;
  background: #e53935;
  border-radius: 50%;
  border: 1.5px solid #fff;
}
```

- [ ] **Step 4: Verify end-to-end**

1. Start Supabase: `npx supabase start`
2. Start backend: `cd backend && uvicorn app.main:app --reload --port 8000`
3. Start frontend: `cd frontend && npm run dev`
4. Open `http://localhost:5173`
5. Navigate to `/network` — Suggestions tab should show users from the DB
6. Click Connect on a user — button should change to "Pending"
7. Navigate to `/messaging` — should show empty conversation list
8. Send a message via curl to create one:
   ```bash
   curl -s -X POST http://localhost:8000/api/messages \
     -H "Content-Type: application/json" \
     -d '{"receiver_id": "00000000-0000-0000-0000-000000000000", "content": "Hello from the test"}'
   ```
9. Refresh `/messaging` — conversation should appear
10. Click conversation — messages load; type and send a new message

- [ ] **Step 5: Commit**

```bash
git add frontend/src/App.jsx frontend/src/components/TopNav/
git commit -m "feat: wire Network and Messaging pages, add unread dot to TopNav"
```
