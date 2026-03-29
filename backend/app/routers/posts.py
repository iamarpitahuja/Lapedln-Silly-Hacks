from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel

from app.dependencies import get_current_user, get_service_client
from app.workers.scoring import score_content

router = APIRouter(tags=["posts"])


class CreatePost(BaseModel):
    content: str
    post_type: str = "Career Lore"


class CreateComment(BaseModel):
    content: str


class CreateRelarp(BaseModel):
    commentary: str = ""


class CreateGlaze(BaseModel):
    content: str = ""


def ensure_post_exists(post_id: str, supabase):
    post_result = supabase.table("posts").select("id").eq("id", post_id).execute()
    if not post_result.data:
        raise HTTPException(status_code=404, detail="Post not found")


def add_reaction(post_id: str, reaction_type: str, user_id: str, supabase):
    ensure_post_exists(post_id, supabase)
    existing = (
        supabase.table("post_reactions")
        .select("id")
        .eq("post_id", post_id)
        .eq("user_id", user_id)
        .eq("reaction_type", reaction_type)
        .execute()
    )
    if existing.data:
        raise HTTPException(status_code=409, detail=f"Already {reaction_type}d")

    result = (
        supabase.table("post_reactions")
        .insert({
            "post_id": post_id,
            "user_id": user_id,
            "reaction_type": reaction_type,
        })
        .execute()
    )
    return result.data[0]


def remove_reaction(post_id: str, reaction_type: str, user_id: str, supabase):
    existing = (
        supabase.table("post_reactions")
        .select("id")
        .eq("post_id", post_id)
        .eq("user_id", user_id)
        .eq("reaction_type", reaction_type)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail=f"{reaction_type.title()} reaction not found")

    (
        supabase.table("post_reactions")
        .delete()
        .eq("post_id", post_id)
        .eq("user_id", user_id)
        .eq("reaction_type", reaction_type)
        .execute()
    )


@router.post("/posts")
async def create_post(
    body: CreatePost,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user),
    supabase=Depends(get_service_client),
):
    """Create a post and fire off the Prestige Evaluator scoring in the background."""
    result = supabase.table("posts").insert({
        "author_id": user_id,
        "content": body.content,
        "post_type": body.post_type,
    }).execute()

    post = result.data[0]

    # Fire-and-forget: Gemini scores buzzwords and adjusts LarpRating (mock when no key)
    background_tasks.add_task(score_content, supabase, post["id"], user_id, body.content)

    return post


@router.post("/posts/{post_id}/comments", status_code=201)
async def create_comment(
    post_id: str,
    body: CreateComment,
    user_id: str = Depends(get_current_user),
    supabase=Depends(get_service_client),
):
    """Create a comment on a post."""
    content = body.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="Comment cannot be empty")

    ensure_post_exists(post_id, supabase)

    insert_result = (
        supabase.table("comments")
        .insert({"post_id": post_id, "author_id": user_id, "content": content})
        .execute()
    )
    comment = insert_result.data[0]

    author_result = (
        supabase.table("profiles")
        .select("display_name, job, avatar_url, larp_rating")
        .eq("id", user_id)
        .single()
        .execute()
    )
    author = author_result.data

    return {
        "id": comment["id"],
        "timestamp": "Just now",
        "createdAt": comment["created_at"],
        "content": comment["content"],
        "author": {
            "name": author["display_name"],
            "headline": author["job"],
            "avatar": author.get("avatar_url"),
            "larpRating": author.get("larp_rating", 0),
        },
        "isUserComment": True,
    }


@router.post("/posts/{post_id}/relarp", status_code=201)
async def create_relarp(
    post_id: str,
    body: CreateRelarp,
    user_id: str = Depends(get_current_user),
    supabase=Depends(get_service_client),
):
    """Create a relarp relationship for the current user."""
    post_result = (
        supabase.table("posts")
        .select("id, author_id")
        .eq("id", post_id)
        .single()
        .execute()
    )
    post = post_result.data
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post["author_id"] == user_id:
        raise HTTPException(status_code=400, detail="Cannot relarp your own post")

    existing = (
        supabase.table("relarps")
        .select("id")
        .eq("post_id", post_id)
        .eq("user_id", user_id)
        .execute()
    )
    if existing.data:
        raise HTTPException(status_code=409, detail="Already relarped")

    result = (
        supabase.table("relarps")
        .insert({
            "post_id": post_id,
            "user_id": user_id,
            "commentary": body.commentary.strip(),
        })
        .execute()
    )
    return result.data[0]


@router.delete("/posts/{post_id}/relarp", status_code=204)
async def remove_relarp(
    post_id: str,
    user_id: str = Depends(get_current_user),
    supabase=Depends(get_service_client),
):
    """Undo relarp for the current user."""
    existing = (
        supabase.table("relarps")
        .select("id")
        .eq("post_id", post_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Relarp not found")

    supabase.table("relarps").delete().eq("post_id", post_id).eq("user_id", user_id).execute()
    return None


@router.post("/posts/{post_id}/like", status_code=201)
async def create_like(
    post_id: str,
    user_id: str = Depends(get_current_user),
    supabase=Depends(get_service_client),
):
    return add_reaction(post_id, "like", user_id, supabase)


@router.delete("/posts/{post_id}/like", status_code=204)
async def remove_like(
    post_id: str,
    user_id: str = Depends(get_current_user),
    supabase=Depends(get_service_client),
):
    remove_reaction(post_id, "like", user_id, supabase)
    return None


@router.post("/posts/{post_id}/love", status_code=201)
async def create_love(
    post_id: str,
    user_id: str = Depends(get_current_user),
    supabase=Depends(get_service_client),
):
    return add_reaction(post_id, "love", user_id, supabase)


@router.delete("/posts/{post_id}/love", status_code=204)
async def remove_love(
    post_id: str,
    user_id: str = Depends(get_current_user),
    supabase=Depends(get_service_client),
):
    remove_reaction(post_id, "love", user_id, supabase)
    return None


@router.post("/posts/{post_id}/glaze", status_code=201)
async def create_glaze(
    post_id: str,
    body: CreateGlaze,
    user_id: str = Depends(get_current_user),
    supabase=Depends(get_service_client),
):
    ensure_post_exists(post_id, supabase)

    existing = (
        supabase.table("glazes")
        .select("id")
        .eq("post_id", post_id)
        .eq("glazer_id", user_id)
        .eq("glaze_type", "organic")
        .execute()
    )
    if existing.data:
        raise HTTPException(status_code=409, detail="Already glazed")

    content = body.content.strip() or "Great post."
    result = (
        supabase.table("glazes")
        .insert({
            "post_id": post_id,
            "glazer_id": user_id,
            "content": content,
            "glaze_type": "organic",
        })
        .execute()
    )
    return result.data[0]


@router.delete("/posts/{post_id}/glaze", status_code=204)
async def remove_glaze(
    post_id: str,
    user_id: str = Depends(get_current_user),
    supabase=Depends(get_service_client),
):
    existing = (
        supabase.table("glazes")
        .select("id")
        .eq("post_id", post_id)
        .eq("glazer_id", user_id)
        .eq("glaze_type", "organic")
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Glaze not found")

    (
        supabase.table("glazes")
        .delete()
        .eq("post_id", post_id)
        .eq("glazer_id", user_id)
        .eq("glaze_type", "organic")
        .execute()
    )
    return None
