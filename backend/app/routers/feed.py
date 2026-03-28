from fastapi import APIRouter, Depends

from app.dependencies import get_current_user, get_user_client
from app.services.gemini import generate_glazes

router = APIRouter(tags=["feed"])


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

    # Generate AI glazes (mock when no Gemini key)
    ai_glazes = await generate_glazes(posts)

    for post in posts:
        post["glazes"] = glazes_by_post.get(post["id"], [])
        post["ai_glazes"] = ai_glazes.get(post["id"], [])

    return {"posts": posts}
