# DMs, Network & Connections — Design Spec

**Date:** 2026-03-28
**Project:** LarpedIn (Silly Hacks 2026)
**Branch:** back+front
**Scope:** Full-stack — Supabase schema + FastAPI endpoints + React frontend

---

## Overview

Add three interconnected social features to LarpedIn:

1. **Connections** — LinkedIn-style connection requests (send → accept/decline)
2. **Network page** — tabbed view of Suggestions, Pending requests, and My Connections
3. **Direct Messaging** — anyone can message anyone, real-time via Supabase Realtime

No Larp Rating gating on any of these features — all users can connect with and message anyone.

---

## Database Schema

### `connections` table

```sql
create table public.connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending', -- 'pending' | 'accepted' | 'declined'
  created_at timestamptz not null default now(),
  unique (requester_id, addressee_id)
);
```

**RLS policies:**
- SELECT: both `requester_id` and `addressee_id` can read their own rows
- INSERT: only authenticated users inserting as `requester_id = auth.uid()`
- UPDATE: only `addressee_id = auth.uid()` can update status (accept/decline)
- DELETE: only `requester_id = auth.uid()` can delete (withdraw request or remove connection)

### `messages` table

```sql
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
```

**RLS policies:**
- SELECT: visible only to `sender_id = auth.uid()` or `receiver_id = auth.uid()`
- INSERT: only `sender_id = auth.uid()`
- UPDATE: only `receiver_id = auth.uid()` can mark as read

**Supabase Realtime:** enabled on `messages` table. Frontend subscribes to `INSERT` events filtered by `receiver_id` or `sender_id` for the active conversation.

**Conversation identity:** No `conversation_id` column. A conversation is derived from the normalized pair `(min(sender_id, receiver_id), max(sender_id, receiver_id))`. All queries use `WHERE (sender_id = A AND receiver_id = B) OR (sender_id = B AND receiver_id = A)`.

---

## Backend API Endpoints

### Connections — `routers/connections.py`

All endpoints require Bearer JWT.

| Method | Path | Client | Description |
|--------|------|--------|-------------|
| `POST` | `/api/connections/request` | Service role | Send a connection request. Body: `{addressee_id}` |
| `PATCH` | `/api/connections/{id}/accept` | Service role | Accept a pending request (addressee only) |
| `PATCH` | `/api/connections/{id}/decline` | Service role | Decline a pending request (addressee only) |
| `DELETE` | `/api/connections/{id}` | Service role | Withdraw request or remove connection (requester only) |
| `GET` | `/api/connections` | Anon + JWT | My accepted connections with full profile data |
| `GET` | `/api/connections/pending` | Anon + JWT | Incoming pending requests with requester profile data |
| `GET` | `/api/connections/suggestions` | Anon + JWT | All users not yet connected with (excludes self, pending, accepted, declined) |

### Messages — `routers/messages.py`

All endpoints require Bearer JWT.

| Method | Path | Client | Description |
|--------|------|--------|-------------|
| `GET` | `/api/messages/conversations` | Anon + JWT | All conversations: list of other users with latest message preview + unread count |
| `GET` | `/api/messages/{other_user_id}` | Anon + JWT | Full message history with one person (ordered by `created_at` asc) |
| `POST` | `/api/messages` | Service role | Send a message. Body: `{receiver_id, content}`. Supabase Realtime broadcasts the insert automatically. |

---

## Frontend Pages & Components

### `/network` — `features/network/`

```
features/network/
├── Network.jsx              # Page container, manages active tab state
├── Network.module.css
├── UserCard/
│   ├── UserCard.jsx         # Avatar, name, headline, LarpRatingBadge, action button
│   └── UserCard.module.css
└── ConnectButton/
    ├── ConnectButton.jsx    # Reusable; accepts connectionStatus prop, fires correct API call
    └── ConnectButton.module.css
```

**Tabs:**
- **Suggestions** — grid of `UserCard`s for all users not yet connected with. Connect button sends request.
- **Pending** — split into "Received" (UserCards with Accept/Decline buttons) and "Sent" (UserCards with Withdraw button)
- **My Connections** — grid of connected users with a Remove button

### `/messaging` — `features/messaging/`

```
features/messaging/
├── Messaging.jsx            # Two-panel layout (conversation list | chat window)
├── Messaging.module.css
├── ConversationList/
│   ├── ConversationList.jsx # List of conversations; avatar, name, last message, unread dot
│   └── ConversationList.module.css
├── ChatWindow/
│   ├── ChatWindow.jsx       # Message thread + input box; holds Supabase Realtime subscription
│   └── ChatWindow.module.css
└── MessageBubble/
    ├── MessageBubble.jsx    # Single message: right-aligned (mine), left-aligned (theirs)
    └── MessageBubble.module.css
```

**Realtime flow:**
1. `ChatWindow` mounts → subscribes to Supabase Realtime channel for the active conversation
2. User sends message → `POST /api/messages` → Supabase inserts row → Realtime broadcasts to subscriber
3. `ChatWindow` appends new message to local state instantly

**TopNav:** unread message count dot on the Messaging nav icon (fetched from `GET /api/messages/conversations`, summed unread counts).

### Shared Component

`ConnectButton.jsx` is used in:
- Network page `UserCard`
- Future: other users' profile pages

It accepts `connectionStatus: 'none' | 'pending_sent' | 'pending_received' | 'accepted'` and renders the appropriate label and action.

---

## Data Flow Summary

### Connection Request
```
User clicks Connect on UserCard
  → POST /api/connections/request {addressee_id}
  → Service role inserts into connections (status: pending)
  → ConnectButton updates to "Pending" state
  → Other user sees it in Pending → Received tab
  → Accept → PATCH /api/connections/{id}/accept
  → Both users now appear in each other's My Connections tab
```

### Direct Message
```
User opens /messaging, clicks a conversation (or starts new)
  → ChatWindow mounts, subscribes to Supabase Realtime channel
  → GET /api/messages/{other_user_id} loads history
  → User types + sends → POST /api/messages {receiver_id, content}
  → FastAPI writes to Supabase (service role)
  → Supabase Realtime broadcasts INSERT to both parties' subscriptions
  → ChatWindow appends message in real time
```

---

## Key Constraints

- **No Larp Rating gating** on connections or messages — all users can reach anyone
- **No connection required to DM** — open messaging to all
- All reads use **anon key + user JWT** so RLS applies; all writes use **service role**
- Supabase Realtime must be **enabled on the `messages` table** in the Supabase dashboard (or via migration)
- Conversation identity is derived, not stored — queries always use the bidirectional `WHERE` clause
