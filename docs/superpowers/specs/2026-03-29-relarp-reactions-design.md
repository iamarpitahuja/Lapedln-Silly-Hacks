# Relarp Reactions Design

**Date:** 2026-03-29
**Status:** Approved

## Summary

Add like, love, and glaze toggle reactions to relarp (re-shared) items in the feed. Relarps currently appear in the feed as synthetic post objects but have no reaction support. This adds a dedicated `relarp_reactions` table and matching API endpoints so users can react to relarps the same way they react to regular posts.

## Decisions

- Reactions target the **relarp itself**, not the original post
- Glaze on relarps is a **simple toggle** (no text content, no AI generation)
- AI-generated glazes (Glaze-o-matic) remain **regular posts only**
- New `relarp_reactions` table — clean separation from `post_reactions`
- Self-reactions on own relarps are **allowed** (matches post reaction behavior)
- Orphaned relarps are impossible — `relarps` cascades from `posts`, `relarp_reactions` cascades from `relarps`

## Database

New table `relarp_reactions`:

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | gen_random_uuid() |
| relarp_id | uuid FK | -> relarps(id) on delete cascade |
| user_id | uuid FK | -> profiles(id) on delete cascade |
| reaction_type | text | check: 'like', 'love', 'glaze' |
| created_at | timestamptz | default now() |

Constraints:
- `unique (relarp_id, user_id, reaction_type)` — one of each type per user per relarp

Indexes:
- `idx_relarp_reactions_relarp` on `relarp_id`
- `idx_relarp_reactions_user` on `user_id`

RLS policies:
- Select: visible if parent relarp is visible (cascades Social Blindness through `relarps` → `posts`)
- Insert: `user_id = auth.uid()`
- Delete: `user_id = auth.uid()`

Note: Backend uses service role client (bypasses RLS). RLS is defined for defense in depth and direct Supabase client access.

SQL for Supabase SQL editor (not a migration file):

```sql
create table if not exists public.relarp_reactions (
    id uuid primary key default gen_random_uuid(),
    relarp_id uuid not null references public.relarps(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,
    reaction_type text not null check (reaction_type in ('like', 'love', 'glaze')),
    created_at timestamptz not null default now(),
    unique (relarp_id, user_id, reaction_type)
);

create index idx_relarp_reactions_relarp on public.relarp_reactions(relarp_id);
create index idx_relarp_reactions_user on public.relarp_reactions(user_id);

alter table public.relarp_reactions enable row level security;

create policy "Users can view relarp reactions on visible relarps"
    on public.relarp_reactions for select
    using (
        exists (
            select 1
            from public.relarps
            where relarps.id = relarp_id
        )
    );

create policy "Users can create own relarp reactions"
    on public.relarp_reactions for insert with check (user_id = auth.uid());

create policy "Users can delete own relarp reactions"
    on public.relarp_reactions for delete using (user_id = auth.uid());
```

## API Endpoints

New router: `backend/app/routers/relarps.py` mounted at `/api/relarps`.

Uses service role client (same pattern as post reactions).

| Method | Path | Behavior | Error |
|--------|------|----------|-------|
| POST | `/relarps/{relarp_id}/like` | Insert like | 409 duplicate |
| DELETE | `/relarps/{relarp_id}/like` | Delete like | 404 not found |
| POST | `/relarps/{relarp_id}/love` | Insert love | 409 duplicate |
| DELETE | `/relarps/{relarp_id}/love` | Delete love | 404 not found |
| POST | `/relarps/{relarp_id}/glaze` | Insert glaze | 409 duplicate |
| DELETE | `/relarps/{relarp_id}/glaze` | Delete glaze | 404 not found |

Helper functions (same pattern as `posts.py`):
- `ensure_relarp_exists(relarp_id, supabase)` — 404 if not found
- `add_relarp_reaction(relarp_id, reaction_type, user_id, supabase)` — insert or 409
- `remove_relarp_reaction(relarp_id, reaction_type, user_id, supabase)` — delete or 404

## Feed Endpoint Changes

In `backend/app/routers/feed.py`, after building relarp feed items:

1. Collect all relarp IDs from feed
2. Query `relarp_reactions` for those IDs
3. Tally `like_count`, `love_count`, `glaze_count` per relarp
4. Track `has_user_liked`, `has_user_loved`, `has_user_glazed` for current user
5. Annotate each relarp feed item with these fields

## Frontend Changes

### API client (`frontend/src/services/api.js`)

Six new functions:
- `createRelarpLike(relarpId)` / `removeRelarpLike(relarpId)`
- `createRelarpLove(relarpId)` / `removeRelarpLove(relarpId)`
- `createRelarpGlaze(relarpId)` / `removeRelarpGlaze(relarpId)`

### Feed adapter (`frontend/src/features/home/Feed/Feed.jsx`)

`adaptBackendPost()` currently hardcodes relarp reactions to zero/false. Must update the relarp branch to read `like_count`, `love_count`, `glaze_count`, `has_user_liked`, `has_user_loved`, `has_user_glazed` from the backend response — same as the regular post branch.

### PostCard (`frontend/src/features/home/Feed/PostCard/PostCard.jsx`)

- Detect `post.isRelarp` in reaction handlers
- If relarp: call relarp API functions using `post.id` (the relarp UUID)
- If regular post: call existing post API functions (no change)
- No visual/UI changes — same buttons, counts, and styling

## Files Changed

| File | Change |
|------|--------|
| `backend/app/routers/relarps.py` | **New** — relarp reaction endpoints |
| `backend/app/main.py` | Mount relarps router |
| `backend/app/routers/feed.py` | Annotate relarp items with reaction counts |
| `frontend/src/services/api.js` | Six new API functions |
| `frontend/src/features/home/Feed/Feed.jsx` | Read relarp reaction counts from backend instead of hardcoding zeros |
| `frontend/src/features/home/Feed/PostCard/PostCard.jsx` | Branch reaction handlers by isRelarp |
