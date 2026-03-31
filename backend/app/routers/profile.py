from datetime import datetime
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
    onboarding_completed_at: datetime | None = None
    stats: dict[str, Any] | None = None
    glazers: list[dict[str, Any]] | None = None
    larp_status: dict[str, Any] | None = None
    experience: list[dict[str, Any] | str] | None = None
    education: list[dict[str, Any]] | None = None
    skills: list[dict[str, Any] | str] | None = None
    larp_history: list[dict[str, Any]] | None = None
    glazes_received: list[dict[str, Any]] | None = None


def _first_row(data: Any) -> dict[str, Any] | None:
    if isinstance(data, list):
        return data[0] if data else None
    if isinstance(data, dict):
        return data
    return None


def _fetch_profile_for_user(supabase, user_id: str) -> dict[str, Any] | None:
    result = (
        supabase.table("profiles")
        .select("*")
        .eq("id", user_id)
        .limit(1)
        .execute()
    )
    return _first_row(result.data)


def _ensure_profile_for_user(supabase, user_id: str) -> dict[str, Any]:
    existing = _fetch_profile_for_user(supabase, user_id)
    if existing:
        return existing

    created = (
        supabase.table("profiles")
        .upsert(
            {
                "id": user_id,
                "display_name": "Anonymous Larper",
            },
            on_conflict="id",
        )
        .execute()
    )
    row = _first_row(created.data)
    if row:
        return row

    # Fall back to a read after write if Supabase returns no payload.
    fetched = _fetch_profile_for_user(supabase, user_id)
    return fetched or {"id": user_id, "display_name": "Anonymous Larper"}


@router.get("/users/{user_id}")
async def get_user_profile(
    user_id: str,
    supabase=Depends(get_service_client),
):
    """Return any user's full public profile."""
    return _fetch_profile_for_user(supabase, user_id)


@router.get("/me")
async def get_me(
    user_id: str = Depends(get_current_user),
    supabase=Depends(get_service_client),
):
    """Return the current user's profile."""
    return _ensure_profile_for_user(supabase, user_id)


@router.patch("/me")
async def update_me(
    body: ProfileUpdate,
    user_id: str = Depends(get_current_user),
    supabase=Depends(get_service_client),
):
    """Patch the current user's profile fields used by the frontend."""
    updates = body.model_dump(exclude_unset=True, mode='json')
    if not updates:
        return _ensure_profile_for_user(supabase, user_id)

    # Convert datetime objects to ISO strings for JSON serialization
    for key, val in updates.items():
        if isinstance(val, datetime):
            updates[key] = val.isoformat()

    result = (
        supabase.table("profiles")
        .update(updates)
        .eq("id", user_id)
        .execute()
    )
    updated = _first_row(result.data)
    if updated:
        return updated

    upsert_payload = {"id": user_id, **updates}
    upsert_payload.setdefault("display_name", "Anonymous Larper")
    upsert_result = (
        supabase.table("profiles")
        .upsert(upsert_payload, on_conflict="id")
        .execute()
    )
    upserted = _first_row(upsert_result.data)
    if upserted:
        return upserted

    return _ensure_profile_for_user(supabase, user_id)
