from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from supabase import Client

from app.dependencies import get_current_user, get_service_client

router = APIRouter(tags=["jobs"])


class TitleUpdate(BaseModel):
    title: str  # No validation. No length check. No profanity filter. That's the joke.


@router.patch("/jobs/title")
async def update_title(
    body: TitleUpdate,
    user_id: str = Depends(get_current_user),
    supabase: Client = Depends(get_service_client),
):
    """Instantly overwrite your professional title. No questions asked."""
    supabase.table("profiles").update({"title": body.title}).eq("id", user_id).execute()
    return {"new_title": body.title, "message": "Prestige updated instantly. No questions asked."}
