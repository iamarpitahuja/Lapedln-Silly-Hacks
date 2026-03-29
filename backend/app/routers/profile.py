from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.dependencies import get_current_user, get_service_client

router = APIRouter(tags=["profile"])


class ProfileUpdate(BaseModel):
    display_name: str | None = None
    bio: str | None = None
    avatar_url: str | None = None
    cover_photo_url: str | None = None
    stats: dict[str, Any] | None = None
    glazers: list[dict[str, Any]] | None = None
    larp_status: dict[str, Any] | None = None
    experience: list[dict[str, Any]] | None = None
    education: list[dict[str, Any]] | None = None
    skills: list[dict[str, Any]] | None = None
    larp_history: list[dict[str, Any]] | None = None
    glazes_received: list[dict[str, Any]] | None = None


@router.get("/users/{user_id}")
async def get_user_profile(
    user_id: str,
    supabase=Depends(get_service_client),
):
    """Return any user's public profile."""
    result = (
        supabase.table("profiles")
        .select("id, display_name, title, bio, avatar_url, larp_rating")
        .eq("id", user_id)
        .single()
        .execute()
    )
    return result.data


@router.get("/me")
async def get_me(
    user_id: str = Depends(get_current_user),
    supabase=Depends(get_service_client),
):
    """Return the current user's profile."""
    result = (
        supabase.table("profiles")
        .select("*")
        .eq("id", user_id)
        .single()
        .execute()
    )
    return result.data


@router.patch("/me")
async def update_me(
    body: ProfileUpdate,
    user_id: str = Depends(get_current_user),
    supabase=Depends(get_service_client),
):
    """Patch the current user's profile fields used by the frontend."""
    updates = body.model_dump(exclude_none=True)
    if not updates:
        result = (
            supabase.table("profiles")
            .select("*")
            .eq("id", user_id)
            .single()
            .execute()
        )
        return result.data

    result = (
        supabase.table("profiles")
        .update(updates)
        .eq("id", user_id)
        .execute()
    )
    return result.data[0]
