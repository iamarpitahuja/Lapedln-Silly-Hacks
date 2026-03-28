from fastapi import APIRouter, BackgroundTasks, Depends
from pydantic import BaseModel

from app.dependencies import get_current_user, get_service_client
from app.workers.scoring import score_content

router = APIRouter(tags=["posts"])


class CreatePost(BaseModel):
    content: str
    post_type: str = "thought_leadership"


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
