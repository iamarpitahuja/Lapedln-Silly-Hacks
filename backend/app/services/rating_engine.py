"""Centralized larp rating engine. All point values in one place."""

import logging
import re

from sqlalchemy import text, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Profile

logger = logging.getLogger(__name__)

# ── Buzzwords for initial rating scoring ────────────────────────────────────

BUZZWORDS = {
    "synergy", "leverage", "disrupt", "disruption", "disruptive", "innovate",
    "innovation", "paradigm", "ecosystem", "scalable", "scale", "blockchain",
    "ai", "machine learning", "deep learning", "agile", "lean", "pivot",
    "growth hacking", "thought leader", "thought leadership", "visionary",
    "rockstar", "ninja", "guru", "evangelist", "hustler", "grind", "grinding",
    "10x", "unicorn", "moonshot", "mission-driven", "stakeholder", "deliverable",
    "kpi", "okr", "roi", "saas", "b2b", "b2c", "pipeline", "funnel",
    "optimization", "optimize", "bandwidth", "circle back", "move the needle",
    "best-in-class", "world-class", "cutting-edge", "bleeding-edge",
    "full-stack", "cross-functional", "data-driven", "results-oriented",
    "proactive", "strategic", "holistic", "robust", "dynamic", "passionate",
    "serial entrepreneur", "self-starter", "go-getter", "value-add",
    "cloud", "devops", "crypto", "web3", "metaverse", "nft", "defi",
    "venture", "startup", "founder", "co-founder", "ceo", "cto", "cfo",
    "vp", "director", "head of", "lead", "senior", "principal", "staff",
}


def calculate_initial_rating(profile: Profile) -> float:
    """
    Calculate an initial larp_rating based on profile completeness and buzzword density.
    Called once when onboarding completes.

    Scoring breakdown:
      - Bio buzzword density: 0-10 pts
      - Skills count:         0-5 pts
      - Experience entries:   0-5 pts
      - Job title larpiness:  0-5 pts
      - Avatar uploaded:      2 pts
      - Completeness bonus:   0-3 pts
    Total range: ~0-30
    """
    score = 0.0

    # ── Bio buzzwords (0-10) ──
    bio = (profile.bio or "").lower()
    if bio:
        words = set(re.findall(r"[a-z0-9\-]+", bio))
        hits = len(words & BUZZWORDS)
        # Also check multi-word buzzwords
        for bw in BUZZWORDS:
            if " " in bw and bw in bio:
                hits += 1
        score += min(hits * 1.5, 10.0)

    # ── Skills (0-5) ──
    skills = profile.skills or []
    if skills:
        skill_count = len(skills)
        score += min(skill_count * 0.8, 5.0)
        # Bonus for buzzwordy skill names
        for s in skills:
            name = (s if isinstance(s, str) else s.get("name", "")).lower()
            if any(bw in name for bw in BUZZWORDS):
                score += 0.3

    # ── Experience (0-5) ──
    experience = profile.experience or []
    if experience:
        score += min(len(experience) * 1.5, 5.0)

    # ── Job title larpiness (0-5) ──
    job = (profile.job or "").lower()
    if job:
        job_hits = sum(1 for bw in BUZZWORDS if bw in job)
        score += min(job_hits * 1.5, 5.0)
        # Extra points for C-suite / leadership titles
        if any(t in job for t in ["chief", "ceo", "cto", "cfo", "vp", "head of", "director"]):
            score += 2.0

    # ── Avatar (2) ──
    if profile.avatar_url:
        score += 2.0

    # ── Completeness bonus (0-3) ──
    filled = sum(1 for v in [profile.bio, profile.skills, profile.experience, profile.avatar_url, profile.job] if v)
    if filled >= 5:
        score += 3.0
    elif filled >= 3:
        score += 1.5

    return round(min(score, 30.0), 1)

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
