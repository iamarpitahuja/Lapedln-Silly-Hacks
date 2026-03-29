from fastapi import APIRouter, Depends
from collections import Counter

from app.dependencies import get_current_user, get_user_client
from app.services.gemini import generate_glazes

router = APIRouter(tags=["feed"])
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
    user_client=Depends(get_user_client),
):
    """
    Fetch the feed from Supabase. Service role client is used until auth is built
    (Social Blindness RLS will apply once we switch to user JWTs).
    Each post gets 3 AI-generated satirical compliments (glazes).
    """
    posts_result = (
        user_client.table("posts")
        .select("*, profiles(id, display_name, job, avatar_url, larp_rating)")
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    posts = posts_result.data or []

    # Fetch relarps with commentary to show as feed items
    all_relarps_result = (
        user_client.table("relarps")
        .select("*, relarper:profiles!user_id(id, display_name, title, avatar_url, larp_rating)")
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    all_relarps = all_relarps_result.data or []

    # Build a lookup of original posts by id (for embedding in relarp feed items)
    posts_by_id = {p["id"]: p for p in posts}

    # For relarps referencing posts not already fetched, fetch them
    missing_post_ids = [r["post_id"] for r in all_relarps if r["post_id"] not in posts_by_id]
    if missing_post_ids:
        extra_posts_result = (
            user_client.table("posts")
            .select("*, profiles(id, display_name, title, avatar_url, larp_rating)")
            .in_("id", list(set(missing_post_ids)))
            .execute()
        )
        for ep in (extra_posts_result.data or []):
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
    glazes_result = user_client.table("glazes").select("*").in_("post_id", post_ids).execute()

    glazes_by_post: dict[str, list] = {}
    glaze_counts: dict[str, int] = {}
    user_glazed: set[str] = set()
    for g in (glazes_result.data or []):
        glazes_by_post.setdefault(g["post_id"], []).append(g)
        glaze_counts[g["post_id"]] = glaze_counts.get(g["post_id"], 0) + 1
        if g.get("glazer_id") == user_id and g.get("glaze_type") == "organic":
            user_glazed.add(g["post_id"])

    # Fetch comments and relarps for visible posts
    comments_result = (
        user_client.table("comments")
        .select("*, author:profiles!author_id(display_name, job, avatar_url, larp_rating)")
        .in_("post_id", post_ids)
        .order("created_at", desc=True)
        .execute()
    )
    comments_by_post: dict[str, list] = {}
    for c in (comments_result.data or []):
        comments_by_post.setdefault(c["post_id"], []).append({
            "id": c["id"],
            "content": c["content"],
            "createdAt": c["created_at"],
            "timestamp": "Just now",
            "author": {
                "name": c["author"]["display_name"],
                "headline": c["author"]["job"],
                "avatar": c["author"].get("avatar_url"),
                "larpRating": c["author"].get("larp_rating", 0),
            },
            "isUserComment": c["author_id"] == user_id,
        })

    relarps_result = (
        user_client.table("relarps")
        .select("post_id, user_id")
        .in_("post_id", post_ids)
        .execute()
    )
    relarp_counts: dict[str, int] = {}
    user_relarped: set[str] = set()
    for r in (relarps_result.data or []):
        relarp_counts[r["post_id"]] = relarp_counts.get(r["post_id"], 0) + 1
        if r["user_id"] == user_id:
            user_relarped.add(r["post_id"])

    reactions_result = (
        user_client.table("post_reactions")
        .select("post_id, user_id, reaction_type")
        .in_("post_id", post_ids)
        .execute()
    )
    like_counts: dict[str, int] = {}
    love_counts: dict[str, int] = {}
    user_liked: set[str] = set()
    user_loved: set[str] = set()
    for reaction in (reactions_result.data or []):
        post_id = reaction["post_id"]
        reaction_type = reaction["reaction_type"]
        reaction_user = reaction["user_id"]
        if reaction_type == "like":
            like_counts[post_id] = like_counts.get(post_id, 0) + 1
            if reaction_user == user_id:
                user_liked.add(post_id)
        elif reaction_type == "love":
            love_counts[post_id] = love_counts.get(post_id, 0) + 1
            if reaction_user == user_id:
                user_loved.add(post_id)

    # Generate AI glazes (mock when no Gemini key)
    ai_glazes = await generate_glazes(regular_posts)

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
        relarp_reactions_result = (
            user_client.table("relarp_reactions")
            .select("relarp_id, user_id, reaction_type")
            .in_("relarp_id", relarp_ids)
            .execute()
        )
        for rr in (relarp_reactions_result.data or []):
            rid = rr["relarp_id"]
            rtype = rr["reaction_type"]
            ruser = rr["user_id"]
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
