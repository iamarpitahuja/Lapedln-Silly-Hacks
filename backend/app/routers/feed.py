from fastapi import APIRouter, Depends, Header
from supabase import Client

from app.dependencies import get_current_user, get_user_client
from app.services.gemini import generate_glazes

router = APIRouter(tags=["feed"])


@router.get("/feed")
async def get_feed(
    limit: int = 20,
    offset: int = 0,
    user_id: str = Depends(get_current_user),
    user_client: Client = Depends(get_user_client),
):
    """
    Fetch the feed with Social Blindness RLS applied.
    Users only see posts from authors with larp_rating <= their own.
    Each post gets 3 AI-generated satirical compliments (glazes).
    """
    # Query with user JWT — Postgres RLS enforces Social Blindness
    posts_result = (
        user_client.table("posts")
        .select("*, profiles(display_name, title, larp_rating)")
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    posts = posts_result.data

    if not posts:
        return {"posts": []}

    # Fetch existing glazes for visible posts
    post_ids = [p["id"] for p in posts]
    glazes_result = (
        user_client.table("glazes")
        .select("*")
        .in_("post_id", post_ids)
        .execute()
    )

    glazes_by_post: dict[str, list] = {}
    for g in glazes_result.data:
        glazes_by_post.setdefault(g["post_id"], []).append(g)

    # Generate AI glazes via Gemini Glaze-o-matic
    ai_glazes = await generate_glazes(posts)

    # Bundle response
    for post in posts:
        post["glazes"] = glazes_by_post.get(post["id"], [])
        post["ai_glazes"] = ai_glazes.get(post["id"], [])

    return {"posts": posts}
