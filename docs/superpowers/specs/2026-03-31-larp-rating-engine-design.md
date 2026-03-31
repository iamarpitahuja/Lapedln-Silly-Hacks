# Larp Rating Engine Design

## Problem

Larp rating only changes when creating posts (Prestige Evaluator) or claiming mini-game rewards. Comments, reactions, relarps, glazes, connections, and LarpMaxxer performance have zero impact. The rating feels static and disconnected from platform activity.

## Solution

A centralized rating engine (`services/rating_engine.py`) that all routers call. Single source of truth for point values, clamping, and change reporting. Frontend shows toast notifications for every rating change.

## Design Decisions

- **Absurdly volatile**: ratings swing wildly to match the satirical tone
- **Full transparency**: users see every rating change with a reason (toast notification)
- **Centralized engine**: all point logic in one file for easy tuning
- **No new tables or endpoints**: engine integrates into existing router responses
- **Atomic DB updates**: use SQL-level `SET larp_rating = MAX(0, larp_rating + :delta)` to avoid read-modify-write races with SQLite
- **Canonical rating**: `Profile.larp_rating` is the single source of truth. `LarpmaxxerProgress.larp_rating` is an internal game score, not displayed or synced bidirectionally.

## Rating Engine

### API

```python
async def adjust_rating(
    db: AsyncSession,
    user_id: str,
    action: str,
    context: dict | None = None
) -> dict:
    """
    Returns: {"delta": float, "new_rating": float, "reason": str}
    Uses atomic SQL update: SET larp_rating = MAX(0, larp_rating + delta)
    Rounds to 1 decimal place.
    """
```

### Point Values

#### Author Rewards (receiving engagement)

| Action Key | Delta | Reason String |
|---|---|---|
| `post_liked` | +0.5 | "Someone liked your post" |
| `post_loved` | +1.0 | "Someone loved your post" |
| `post_glazed` | +1.5 | "Someone glazed your post" |
| `post_commented` | +0.8 | "Someone commented on your post" |
| `post_relarped` | +2.0 | "Someone relarped your post" |
| `relarp_liked` | +0.5 | "Someone liked your relarp" |
| `relarp_loved` | +1.0 | "Someone loved your relarp" |
| `relarp_glazed` | +1.5 | "Someone glazed your relarp" |
| `connection_accepted_requester` | +1.0 | "Your connection request was accepted" |
| `connection_accepted_acceptor` | +1.0 | "You accepted a connection" |
| `prestige_evaluated` | -2.0 to +5.0 (variable, from Gemini) | "Prestige Evaluator scored your post" |

#### Actor Rewards (doing things)

| Action Key | Delta | Reason String |
|---|---|---|
| `comment_created` | +0.3 | "You commented on a post" |
| `like_given` | +0.1 | "You liked a post" |
| `love_given` | +0.2 | "You loved a post" |
| `glaze_given` | +0.5 | "You glazed someone" |
| `relarp_created` | +0.8 | "You relarped a post" |
| `connection_requested` | +0.2 | "You sent a connection request" |

#### Penalties

| Action Key | Delta | Reason String |
|---|---|---|
| `post_unliked` | -0.5 | "Someone unliked your post" |
| `post_unloved` | -1.0 | "Someone unloved your post" |
| `post_unglazed` | -1.5 | "Someone un-glazed your post" |
| `relarp_unliked` | -0.5 | "Someone unliked your relarp" |
| `relarp_unloved` | -1.0 | "Someone unloved your relarp" |
| `relarp_unglazed` | -1.5 | "Someone un-glazed your relarp" |
| `connection_declined` | -0.8 | "Connection request declined" |
| `post_deleted` | -1.0 | "You deleted your own post" |
| `relarp_removed` | -0.8 | "You removed your relarp" |

#### LarpMaxxer Sync

| Action Key | Delta | Reason String |
|---|---|---|
| `larpmaxxer_scenario_complete` | +1.5 to +3.0 (scaled by scenario score) | "LarpMaxxer training complete" |

#### Games

| Action Key | Delta | Reason String |
|---|---|---|
| `game_bingo` | +0.5 | "Buzzword Bingo reward" |
| `game_grind` | +1.5 | "The Grind reward" |
| `game_connections` | +1.0 | "Connections game reward" |

### Prestige Evaluator

The scoring worker in `workers/scoring.py` calls `adjust_rating(db, user_id, "prestige_evaluated", {"delta": result["rating_delta"]})` with the variable delta from Gemini. Since this runs as a BackgroundTask after the post-creation response has already been returned, there is no `rating_change` in the `POST /api/posts` response. The user discovers their Prestige Evaluator score on their next API call that triggers a profile refresh (feed load, page navigation, etc.).

### Self-Interaction Guard

The engine skips author rewards when `actor_id == author_id`. Liking your own post gives you the +0.1 actor reward but NOT the +0.5 author reward.

## Integration Points

### Backend Router Changes

Each router adds 1-3 lines calling `adjust_rating()` at the appropriate points:

- **`posts.py`**: on like/love/glaze toggle (both add and remove), comment creation, relarp creation/removal, post deletion. Reactions require looking up the post author from the already-fetched post object.
- **`connections.py`**: on request sent (+0.2 requester), accepted (+1.0 both parties), declined (-0.8 requester)
- **`relarps.py`**: on relarp reactions (like/love/glaze add and remove). Look up relarp author via `Relarp.user_id`.
- **`larpmaxxer.py`**: on scenario completion, delta scaled by score, applied to Profile.larp_rating
- **`games.py`**: replace inline math with engine call
- **`workers/scoring.py`**: replace inline profile update with engine call

### API Response Shape

Endpoints that trigger rating changes return `rating_change` in their response:

```json
{
  "...existing response fields...",
  "rating_change": {
    "delta": 0.1,
    "new_rating": 15.2,
    "reason": "You liked a post"
  }
}
```

**204 No Content endpoints** (DELETE for reactions, posts, relarps, connections): Change to return 200 with a JSON body containing the `rating_change`. This is a minor breaking change but necessary for transparency.

**BackgroundTask endpoints** (post creation → Prestige Evaluator): No `rating_change` in response. The scoring happens asynchronously after the response is returned.

### Frontend Toast System

- New `RatingToast` component rendered at app level (inside `MockDataProvider`)
- Watches API responses for `rating_change` field
- Green toast for positive deltas, red for negative
- Format: "+1.5 -- Someone glazed your post"
- Top-right position, auto-dismiss after 3 seconds, stacks vertically
- `MockDataContext` updates `larpRating` in state immediately when a `rating_change` is received

### Implementation approach

- Create a helper in `services/api.js` that intercepts `rating_change` from any API response and dispatches a custom `rating:change` event
- `RatingToast` listens for that event
- `MockDataContext` also listens and updates `profile.larpRating` in state

## Files to Create

- `backend/app/services/rating_engine.py` — the centralized engine
- `frontend/src/components/RatingToast/RatingToast.jsx` — toast component
- `frontend/src/components/RatingToast/RatingToast.module.css` — toast styles

## Files to Modify

- `backend/app/workers/scoring.py` — use engine instead of inline update
- `backend/app/routers/posts.py` — add engine calls for reactions, comments, relarps, delete; change DELETE endpoints to return 200
- `backend/app/routers/connections.py` — add engine calls for request/accept/decline; change DELETE to return 200
- `backend/app/routers/relarps.py` — add engine calls for relarp reactions; change DELETE to return 200
- `backend/app/routers/larpmaxxer.py` — sync scenario completion to Profile.larp_rating via engine
- `backend/app/routers/games.py` — route through engine
- `frontend/src/services/api.js` — intercept `rating_change` from responses, dispatch event
- `frontend/src/context/MockDataContext.jsx` — listen for `rating:change` events, update larpRating
- `frontend/src/App.jsx` — mount RatingToast at app level
