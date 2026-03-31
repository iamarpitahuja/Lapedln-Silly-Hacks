from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Post, Profile, Comment, Glaze, PostReaction, Relarp
from app.workers.scoring import score_content
from app.services.rating_engine import adjust_rating

router = APIRouter(tags=["posts"])


class CreatePost(BaseModel):
    content: str
    post_type: str = "Career Lore"


class CreateComment(BaseModel):
    content: str


class EditComment(BaseModel):
    content: str


class CreateRelarp(BaseModel):
    commentary: str = ""


class CreateGlaze(BaseModel):
    content: str = ""


async def ensure_post_exists(post_id: str, db: AsyncSession):
    post = await db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


async def add_reaction(
    post_id: str, reaction_type: str, user_id: str, db: AsyncSession
):
    post = await ensure_post_exists(post_id, db)
    existing = await db.execute(
        select(PostReaction).where(
            PostReaction.post_id == post_id,
            PostReaction.user_id == user_id,
            PostReaction.reaction_type == reaction_type,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail=f"Already {reaction_type}d")

    reaction = PostReaction(
        post_id=post_id, user_id=user_id, reaction_type=reaction_type
    )
    db.add(reaction)

    # Actor reward
    actor_action = f"{reaction_type}_given"
    actor_change = await adjust_rating(db, user_id, actor_action)

    # Author reward (skip if self-interaction)
    if post.author_id != user_id:
        await adjust_rating(db, post.author_id, f"post_{reaction_type}d")

    await db.commit()
    await db.refresh(reaction)
    result = reaction.to_dict()
    if actor_change:
        result["rating_change"] = actor_change
    return result


async def remove_reaction(
    post_id: str, reaction_type: str, user_id: str, db: AsyncSession
):
    post = await ensure_post_exists(post_id, db)
    existing_result = await db.execute(
        select(PostReaction).where(
            PostReaction.post_id == post_id,
            PostReaction.user_id == user_id,
            PostReaction.reaction_type == reaction_type,
        )
    )
    reaction = existing_result.scalar_one_or_none()
    if not reaction:
        raise HTTPException(
            status_code=404, detail=f"{reaction_type.title()} reaction not found"
        )

    await db.delete(reaction)

    # Reverse the actor reward
    from app.services.rating_engine import ACTIONS
    actor_delta = ACTIONS.get(f"{reaction_type}_given", {}).get("delta", 0)
    if actor_delta:
        await adjust_rating(db, user_id, f"undo_{reaction_type}_given",
                            {"delta": -actor_delta})

    # Penalty to author (skip if self)
    if post.author_id != user_id:
        await adjust_rating(db, post.author_id, f"post_un{reaction_type}d")

    await db.commit()


@router.post("/posts")
async def create_post(
    body: CreatePost,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a post and fire off the Prestige Evaluator scoring in the background."""
    post = Post(
        author_id=user_id,
        content=body.content,
        post_type=body.post_type,
    )
    db.add(post)
    await db.commit()
    await db.refresh(post)

    # Fire-and-forget: Gemini scores buzzwords and adjusts LarpRating (mock when no key)
    background_tasks.add_task(score_content, post.id, user_id, body.content)

    return post.to_dict()


@router.delete("/posts/{post_id}")
async def delete_post(
    post_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a post the current user owns. Cascades to comments, reactions, glazes, relarps."""
    post = await db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.author_id != user_id:
        raise HTTPException(status_code=403, detail="Not your post")

    await db.delete(post)
    rating_change = await adjust_rating(db, user_id, "post_deleted")
    await db.commit()
    return {"ok": True, "rating_change": rating_change}


@router.post("/posts/{post_id}/comments", status_code=201)
async def create_comment(
    post_id: str,
    body: CreateComment,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a comment on a post."""
    content = body.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="Comment cannot be empty")

    post = await ensure_post_exists(post_id, db)

    comment = Comment(post_id=post_id, author_id=user_id, content=content)
    db.add(comment)

    # Actor reward
    actor_change = await adjust_rating(db, user_id, "comment_created")
    # Author reward (skip if commenting on own post)
    if post.author_id != user_id:
        await adjust_rating(db, post.author_id, "post_commented")

    await db.commit()
    await db.refresh(comment)

    # Fetch author profile
    author = await db.get(Profile, user_id)

    result = {
        "id": comment.id,
        "timestamp": "Just now",
        "createdAt": comment.created_at.isoformat() if comment.created_at else None,
        "content": comment.content,
        "author": {
            "name": author.display_name if author else "Anonymous Larper",
            "headline": author.job if author else "",
            "avatar": author.avatar_url if author else None,
            "larpRating": author.larp_rating if author else 0,
        },
        "isUserComment": True,
    }
    if actor_change:
        result["rating_change"] = actor_change
    return result


@router.patch("/posts/{post_id}/comments/{comment_id}")
async def edit_comment(
    post_id: str,
    comment_id: str,
    body: EditComment,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Edit a comment the current user owns."""
    content = body.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="Comment cannot be empty")

    result = await db.execute(
        select(Comment).where(Comment.id == comment_id, Comment.post_id == post_id)
    )
    comment = result.scalar_one_or_none()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.author_id != user_id:
        raise HTTPException(status_code=403, detail="Not your comment")

    comment.content = content
    await db.commit()
    await db.refresh(comment)

    author = await db.get(Profile, user_id)

    return {
        "id": comment.id,
        "timestamp": "Just now",
        "createdAt": comment.created_at.isoformat() if comment.created_at else None,
        "content": comment.content,
        "author": {
            "name": author.display_name if author else "Anonymous Larper",
            "headline": author.job if author else "",
            "avatar": author.avatar_url if author else None,
            "larpRating": author.larp_rating if author else 0,
        },
        "isUserComment": True,
    }


@router.delete("/posts/{post_id}/comments/{comment_id}", status_code=204)
async def delete_comment(
    post_id: str,
    comment_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a comment the current user owns."""
    result = await db.execute(
        select(Comment).where(Comment.id == comment_id, Comment.post_id == post_id)
    )
    comment = result.scalar_one_or_none()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.author_id != user_id:
        raise HTTPException(status_code=403, detail="Not your comment")

    await db.delete(comment)
    await db.commit()
    return None


@router.post("/posts/{post_id}/relarp", status_code=201)
async def create_relarp(
    post_id: str,
    body: CreateRelarp,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a relarp relationship for the current user."""
    post = await db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.author_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot relarp your own post")

    existing_result = await db.execute(
        select(Relarp).where(Relarp.post_id == post_id, Relarp.user_id == user_id)
    )
    if existing_result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Already relarped")

    relarp = Relarp(
        post_id=post_id,
        user_id=user_id,
        commentary=body.commentary.strip(),
    )
    db.add(relarp)

    # Actor reward + author reward
    actor_change = await adjust_rating(db, user_id, "relarp_created")
    await adjust_rating(db, post.author_id, "post_relarped")

    await db.commit()
    await db.refresh(relarp)
    result = relarp.to_dict()
    if actor_change:
        result["rating_change"] = actor_change
    return result


@router.delete("/posts/{post_id}/relarp")
async def remove_relarp(
    post_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Undo relarp for the current user."""
    result = await db.execute(
        select(Relarp).where(Relarp.post_id == post_id, Relarp.user_id == user_id)
    )
    relarp = result.scalar_one_or_none()
    if not relarp:
        raise HTTPException(status_code=404, detail="Relarp not found")

    await db.delete(relarp)
    rating_change = await adjust_rating(db, user_id, "relarp_removed")
    await db.commit()
    return {"ok": True, "rating_change": rating_change}


@router.post("/posts/{post_id}/like", status_code=201)
async def create_like(
    post_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await add_reaction(post_id, "like", user_id, db)


@router.delete("/posts/{post_id}/like")
async def remove_like(
    post_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await remove_reaction(post_id, "like", user_id, db)
    return {"ok": True}


@router.post("/posts/{post_id}/love", status_code=201)
async def create_love(
    post_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await add_reaction(post_id, "love", user_id, db)


@router.delete("/posts/{post_id}/love")
async def remove_love(
    post_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await remove_reaction(post_id, "love", user_id, db)
    return {"ok": True}


@router.post("/posts/{post_id}/glaze", status_code=201)
async def create_glaze(
    post_id: str,
    body: CreateGlaze,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    post = await ensure_post_exists(post_id, db)

    existing_result = await db.execute(
        select(Glaze).where(
            Glaze.post_id == post_id,
            Glaze.glazer_id == user_id,
            Glaze.glaze_type == "organic",
        )
    )
    if existing_result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Already glazed")

    content = body.content.strip() or "Great post."
    glaze = Glaze(
        post_id=post_id,
        glazer_id=user_id,
        content=content,
        glaze_type="organic",
    )
    db.add(glaze)

    # Actor reward
    actor_change = await adjust_rating(db, user_id, "glaze_given")
    # Author reward (skip if self)
    if post.author_id != user_id:
        await adjust_rating(db, post.author_id, "post_glazed")

    await db.commit()
    await db.refresh(glaze)
    result = glaze.to_dict()
    if actor_change:
        result["rating_change"] = actor_change
    return result


@router.delete("/posts/{post_id}/glaze")
async def remove_glaze(
    post_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    post = await ensure_post_exists(post_id, db)

    existing_result = await db.execute(
        select(Glaze).where(
            Glaze.post_id == post_id,
            Glaze.glazer_id == user_id,
            Glaze.glaze_type == "organic",
        )
    )
    glaze = existing_result.scalar_one_or_none()
    if not glaze:
        raise HTTPException(status_code=404, detail="Glaze not found")

    await db.delete(glaze)

    # Reverse the actor reward
    from app.services.rating_engine import ACTIONS
    actor_delta = ACTIONS.get("glaze_given", {}).get("delta", 0)
    if actor_delta:
        await adjust_rating(db, user_id, "undo_glaze_given", {"delta": -actor_delta})

    # Penalty to author (skip if self)
    if post.author_id != user_id:
        await adjust_rating(db, post.author_id, "post_unglazed")

    await db.commit()
    return {"ok": True}
