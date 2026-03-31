import random

from fastapi import APIRouter, Depends
from collections import Counter

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models import (
    Post,
    Profile,
    Comment,
    Glaze,
    PostReaction,
    Relarp,
    RelarpReaction,
)

router = APIRouter(tags=["feed"])

_MOCK_GLAZES = [
    "Absolute masterclass in professional storytelling.",
    "This is the kind of content that changes industries.",
    "Your thought leadership is genuinely inspiring.",
    "The courage it takes to post this... unmatched.",
    "Every recruiter just bookmarked this.",
    "This post has more value than most TED talks.",
    "LinkedIn needs more brave voices like yours.",
    "I just forwarded this to my entire C-suite.",
    "This is what peak corporate consciousness looks like.",
    "Your career trajectory just shifted the Overton window.",
]
BUZZWORD_TERMS = [
    "synergy",
    "alignment",
    "leverage",
    "disruption",
    "impact",
    "stakeholder",
    "bandwidth",
    "velocity",
    "roadmap",
    "north star",
    "ownership",
    "ecosystem",
    "scale",
]


def derive_trending_delusions(posts: list[dict]) -> list[str]:
    counts = Counter(str(post.get("post_type", "Career Lore")) for post in posts)
    return [f"{post_type} · {count} posts" for post_type, count in counts.most_common(5)]


def derive_buzzwords(posts: list[dict]) -> list[str]:
    all_content = " ".join(str(post.get("content", "")).lower() for post in posts)
    counts = Counter()
    for term in BUZZWORD_TERMS:
        occurrences = all_content.count(term)
        if occurrences:
            counts[term] = occurrences
    return [term.title() for term, _ in counts.most_common(8)]


@router.get("/feed")
async def get_feed(
    limit: int = 20,
    offset: int = 0,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Fetch the feed with Social Blindness filtering.
    Each post gets 3 AI-generated satirical compliments (glazes).
    """
    # Get viewer's rating for Social Blindness
    viewer_result = await db.execute(
        select(Profile.larp_rating).where(Profile.id == user_id)
    )
    viewer_rating = viewer_result.scalar_one_or_none() or 0.0

    # Fetch ALL posts — the frontend handles Social Blindness display
    # (locked cards for authors with higher larp_rating than the viewer)
    posts_stmt = (
        select(Post, Profile)
        .join(Profile, Post.author_id == Profile.id)
        .order_by(Post.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    posts_rows = (await db.execute(posts_stmt)).all()
    posts = []
    for row in posts_rows:
        post_dict = row.Post.to_dict()
        post_dict["profiles"] = {
            "id": row.Profile.id,
            "display_name": row.Profile.display_name,
            "job": row.Profile.job,
            "avatar_url": row.Profile.avatar_url,
            "larp_rating": row.Profile.larp_rating,
        }
        posts.append(post_dict)

    # Fetch relarps with relarper profiles
    relarps_stmt = (
        select(Relarp, Profile)
        .join(Profile, Relarp.user_id == Profile.id)
        .order_by(Relarp.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    relarps_rows = (await db.execute(relarps_stmt)).all()
    all_relarps = []
    for row in relarps_rows:
        relarp_dict = row.Relarp.to_dict()
        relarp_dict["relarper"] = {
            "id": row.Profile.id,
            "display_name": row.Profile.display_name,
            "title": row.Profile.job,
            "avatar_url": row.Profile.avatar_url,
            "larp_rating": row.Profile.larp_rating,
        }
        all_relarps.append(relarp_dict)

    # Build a lookup of original posts by id (for embedding in relarp feed items)
    posts_by_id = {p["id"]: p for p in posts}

    # For relarps referencing posts not already fetched, fetch them
    missing_post_ids = list(set(
        r["post_id"] for r in all_relarps if r["post_id"] not in posts_by_id
    ))
    if missing_post_ids:
        extra_stmt = (
            select(Post, Profile)
            .join(Profile, Post.author_id == Profile.id)
            .where(Post.id.in_(missing_post_ids))
        )
        extra_rows = (await db.execute(extra_stmt)).all()
        for row in extra_rows:
            ep = row.Post.to_dict()
            ep["profiles"] = {
                "id": row.Profile.id,
                "display_name": row.Profile.display_name,
                "job": row.Profile.job,
                "avatar_url": row.Profile.avatar_url,
                "larp_rating": row.Profile.larp_rating,
            }
            posts_by_id[ep["id"]] = ep

    # Build relarp feed items
    relarp_feed_items = []
    for r in all_relarps:
        original = posts_by_id.get(r["post_id"])
        if not original:
            continue
        relarper = r.get("relarper") or {}
        relarp_feed_items.append({
            "id": r["id"],
            "author_id": r["user_id"],
            "content": r.get("commentary", ""),
            "post_type": "Re-Larp",
            "created_at": r["created_at"],
            "buzzword_score": 0,
            "profiles": relarper,
            "is_relarp": True,
            "relarp_of": {
                "id": original["id"],
                "content": original.get("content", ""),
                "post_type": original.get("post_type", "Career Lore"),
                "created_at": original.get("created_at"),
                "buzzword_score": original.get("buzzword_score", 0),
                "profiles": original.get("profiles"),
            },
        })

    # Merge regular posts and relarp feed items, sort by created_at descending
    all_feed_items = posts + relarp_feed_items
    all_feed_items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    all_feed_items = all_feed_items[:limit]

    # Separate out regular posts for reaction/glaze aggregation
    regular_posts = [p for p in all_feed_items if not p.get("is_relarp")]

    if not all_feed_items:
        return {"posts": []}

    # Fetch existing glazes for visible posts
    post_ids = [p["id"] for p in regular_posts]
    if not post_ids:
        return {
            "posts": all_feed_items,
            "trending_delusions": [],
            "buzzwords": [],
        }

    glazes_stmt = select(Glaze).where(Glaze.post_id.in_(post_ids))
    glazes_result = (await db.execute(glazes_stmt)).scalars().all()

    glazes_by_post: dict[str, list] = {}
    glaze_counts: dict[str, int] = {}
    user_glazed: set[str] = set()
    for g in glazes_result:
        g_dict = g.to_dict()
        glazes_by_post.setdefault(g.post_id, []).append(g_dict)
        glaze_counts[g.post_id] = glaze_counts.get(g.post_id, 0) + 1
        if g.glazer_id == user_id and g.glaze_type == "organic":
            user_glazed.add(g.post_id)

    # Fetch comments with author profiles for visible posts
    comments_stmt = (
        select(Comment, Profile)
        .join(Profile, Comment.author_id == Profile.id)
        .where(Comment.post_id.in_(post_ids))
        .order_by(Comment.created_at.desc())
    )
    comments_rows = (await db.execute(comments_stmt)).all()
    comments_by_post: dict[str, list] = {}
    for row in comments_rows:
        comment = row.Comment
        profile = row.Profile
        comments_by_post.setdefault(comment.post_id, []).append({
            "id": comment.id,
            "content": comment.content,
            "createdAt": comment.created_at.isoformat() if comment.created_at else None,
            "timestamp": "Just now",
            "author": {
                "name": profile.display_name,
                "headline": profile.job,
                "avatar": profile.avatar_url,
                "larpRating": profile.larp_rating,
            },
            "isUserComment": comment.author_id == user_id,
        })

    # Fetch relarp counts for visible posts
    relarps_count_stmt = (
        select(Relarp).where(Relarp.post_id.in_(post_ids))
    )
    relarps_for_posts = (await db.execute(relarps_count_stmt)).scalars().all()
    relarp_counts: dict[str, int] = {}
    user_relarped: set[str] = set()
    for r in relarps_for_posts:
        relarp_counts[r.post_id] = relarp_counts.get(r.post_id, 0) + 1
        if r.user_id == user_id:
            user_relarped.add(r.post_id)

    # Fetch post reactions
    reactions_stmt = (
        select(PostReaction).where(PostReaction.post_id.in_(post_ids))
    )
    reactions = (await db.execute(reactions_stmt)).scalars().all()
    like_counts: dict[str, int] = {}
    love_counts: dict[str, int] = {}
    user_liked: set[str] = set()
    user_loved: set[str] = set()
    for reaction in reactions:
        pid = reaction.post_id
        rtype = reaction.reaction_type
        ruser = reaction.user_id
        if rtype == "like":
            like_counts[pid] = like_counts.get(pid, 0) + 1
            if ruser == user_id:
                user_liked.add(pid)
        elif rtype == "love":
            love_counts[pid] = love_counts.get(pid, 0) + 1
            if ruser == user_id:
                user_loved.add(pid)

    # Generate mock AI glazes instantly — no Gemini call, zero latency
    ai_glazes = {}
    for p in regular_posts:
        ai_glazes[p["id"]] = random.sample(_MOCK_GLAZES, 3)

    # Fetch relarp reactions for relarp feed items
    relarp_items = [p for p in all_feed_items if p.get("is_relarp")]
    relarp_ids = [r["id"] for r in relarp_items]
    relarp_like_counts: dict[str, int] = {}
    relarp_love_counts: dict[str, int] = {}
    relarp_glaze_counts: dict[str, int] = {}
    relarp_user_liked: set[str] = set()
    relarp_user_loved: set[str] = set()
    relarp_user_glazed: set[str] = set()
    if relarp_ids:
        relarp_reactions_stmt = (
            select(RelarpReaction).where(RelarpReaction.relarp_id.in_(relarp_ids))
        )
        relarp_reactions = (await db.execute(relarp_reactions_stmt)).scalars().all()
        for rr in relarp_reactions:
            rid = rr.relarp_id
            rtype = rr.reaction_type
            ruser = rr.user_id
            if rtype == "like":
                relarp_like_counts[rid] = relarp_like_counts.get(rid, 0) + 1
                if ruser == user_id:
                    relarp_user_liked.add(rid)
            elif rtype == "love":
                relarp_love_counts[rid] = relarp_love_counts.get(rid, 0) + 1
                if ruser == user_id:
                    relarp_user_loved.add(rid)
            elif rtype == "glaze":
                relarp_glaze_counts[rid] = relarp_glaze_counts.get(rid, 0) + 1
                if ruser == user_id:
                    relarp_user_glazed.add(rid)

    for item in relarp_items:
        item["like_count"] = relarp_like_counts.get(item["id"], 0)
        item["love_count"] = relarp_love_counts.get(item["id"], 0)
        item["glaze_count"] = relarp_glaze_counts.get(item["id"], 0)
        item["has_user_liked"] = item["id"] in relarp_user_liked
        item["has_user_loved"] = item["id"] in relarp_user_loved
        item["has_user_glazed"] = item["id"] in relarp_user_glazed

    for post in regular_posts:
        post_comments = comments_by_post.get(post["id"], [])
        post["glazes"] = glazes_by_post.get(post["id"], [])
        post["ai_glazes"] = ai_glazes.get(post["id"], [])
        post["comments"] = post_comments
        post["comment_count"] = len(post_comments)
        post["relarp_count"] = relarp_counts.get(post["id"], 0)
        post["has_user_relarped"] = post["id"] in user_relarped
        post["like_count"] = like_counts.get(post["id"], 0)
        post["love_count"] = love_counts.get(post["id"], 0)
        post["glaze_count"] = glaze_counts.get(post["id"], 0)
        post["has_user_liked"] = post["id"] in user_liked
        post["has_user_loved"] = post["id"] in user_loved
        post["has_user_glazed"] = post["id"] in user_glazed

    return {
        "posts": all_feed_items,
        "trending_delusions": derive_trending_delusions(regular_posts),
        "buzzwords": derive_buzzwords(regular_posts),
    }
