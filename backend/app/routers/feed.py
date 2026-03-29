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
    posts = posts_result.data

    if not posts:
        return {"posts": []}

    # Fetch existing glazes for visible posts
    post_ids = [p["id"] for p in posts]
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
    ai_glazes = await generate_glazes(posts)

    for post in posts:
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
        "posts": posts,
        "trending_delusions": derive_trending_delusions(posts),
        "buzzwords": derive_buzzwords(posts),
    }
