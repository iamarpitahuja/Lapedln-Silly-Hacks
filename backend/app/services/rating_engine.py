"""Centralized larp rating engine. All point values in one place."""

import logging

from sqlalchemy import text, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Profile

logger = logging.getLogger(__name__)

# ── Point Values ─────────────────────────────────────────────────────────────

ACTIONS = {
    # Author rewards (receiving engagement)
    "post_liked":                  {"delta": 0.5,  "reason": "Someone liked your post"},
    "post_loved":                  {"delta": 1.0,  "reason": "Someone loved your post"},
    "post_glazed":                 {"delta": 1.5,  "reason": "Someone glazed your post"},
    "post_commented":              {"delta": 0.8,  "reason": "Someone commented on your post"},
    "post_relarped":               {"delta": 2.0,  "reason": "Someone relarped your post"},
    "relarp_liked":                {"delta": 0.5,  "reason": "Someone liked your relarp"},
    "relarp_loved":                {"delta": 1.0,  "reason": "Someone loved your relarp"},
    "relarp_glazed":               {"delta": 1.5,  "reason": "Someone glazed your relarp"},
    "connection_accepted_requester": {"delta": 1.0, "reason": "Your connection request was accepted"},
    "connection_accepted_acceptor":  {"delta": 1.0, "reason": "You accepted a connection"},

    # Actor rewards (doing things)
    "comment_created":             {"delta": 0.3,  "reason": "You commented on a post"},
    "like_given":                  {"delta": 0.1,  "reason": "You liked a post"},
    "love_given":                  {"delta": 0.2,  "reason": "You loved a post"},
    "glaze_given":                 {"delta": 0.5,  "reason": "You glazed someone"},
    "relarp_created":              {"delta": 0.8,  "reason": "You relarped a post"},
    "connection_requested":        {"delta": 0.2,  "reason": "You sent a connection request"},

    # Penalties
    "post_unliked":                {"delta": -0.5, "reason": "Someone unliked your post"},
    "post_unloved":                {"delta": -1.0, "reason": "Someone unloved your post"},
    "post_unglazed":               {"delta": -1.5, "reason": "Someone un-glazed your post"},
    "relarp_unliked":              {"delta": -0.5, "reason": "Someone unliked your relarp"},
    "relarp_unloved":              {"delta": -1.0, "reason": "Someone unloved your relarp"},
    "relarp_unglazed":             {"delta": -1.5, "reason": "Someone un-glazed your relarp"},
    "connection_declined":         {"delta": -0.8, "reason": "Connection request declined"},
    "post_deleted":                {"delta": -1.0, "reason": "You deleted your own post"},
    "relarp_removed":              {"delta": -0.8, "reason": "You removed your relarp"},

    # Games
    "game_bingo":                  {"delta": 0.5,  "reason": "Buzzword Bingo reward"},
    "game_grind":                  {"delta": 1.5,  "reason": "The Grind reward"},
    "game_connections":            {"delta": 1.0,  "reason": "Connections game reward"},

    # Undo actor rewards (reverse points on unreact)
    "undo_like_given":             {"delta": None, "reason": "You unliked a post"},
    "undo_love_given":             {"delta": None, "reason": "You unloved a post"},
    "undo_glaze_given":            {"delta": None, "reason": "You unglazed a post"},

    # Variable delta actions (delta comes from context)
    "prestige_evaluated":          {"delta": None, "reason": "Prestige Evaluator scored your post"},
    "larpmaxxer_scenario_complete": {"delta": None, "reason": "LarpMaxxer training complete"},
}


async def adjust_rating(
    db: AsyncSession,
    user_id: str,
    action: str,
    context: dict | None = None,
) -> dict | None:
    """
    Adjust a user's larp_rating atomically.

    Returns {"delta": float, "new_rating": float, "reason": str} or None if action unknown.
    """
    context = context or {}

    action_def = ACTIONS.get(action)
    if not action_def:
        logger.warning("Unknown rating action: %s", action)
        return None

    # Variable-delta actions get delta from context
    delta = context.get("delta") if action_def["delta"] is None else action_def["delta"]
    if delta is None:
        logger.warning("No delta provided for variable action: %s", action)
        return None

    delta = round(float(delta), 1)

    # Atomic update: SET larp_rating = MAX(0, larp_rating + delta)
    await db.execute(
        text(
            "UPDATE profiles SET larp_rating = MAX(0, ROUND(larp_rating + :delta, 1)) "
            "WHERE id = :user_id"
        ),
        {"delta": delta, "user_id": user_id},
    )
    await db.flush()

    # Read back the new rating
    result = await db.execute(
        select(Profile.larp_rating).where(Profile.id == user_id)
    )
    new_rating = result.scalar_one_or_none()
    if new_rating is None:
        return None

    reason = context.get("reason", action_def["reason"])

    logger.info("Rating %s: %s %+.1f → %.1f", user_id[:8], action, delta, new_rating)

    return {
        "delta": delta,
        "new_rating": round(new_rating, 1),
        "reason": reason,
    }
