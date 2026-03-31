from datetime import datetime
from typing import Any
import os
import time

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Profile
from app.config import settings

router = APIRouter(tags=["profile"])

ALLOWED_MIME_TYPES = {"image/png", "image/jpeg", "image/webp", "image/gif"}


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


async def _fetch_profile(db: AsyncSession, user_id: str) -> Profile | None:
    result = await db.execute(select(Profile).where(Profile.id == user_id))
    return result.scalar_one_or_none()


async def _ensure_profile(db: AsyncSession, user_id: str) -> Profile:
    profile = await _fetch_profile(db, user_id)
    if profile:
        return profile

    profile = Profile(id=user_id, display_name="Anonymous Larper")
    db.add(profile)
    await db.commit()
    await db.refresh(profile)
    return profile


@router.get("/users/{user_id}")
async def get_user_profile(
    user_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Return any user's full public profile."""
    profile = await _fetch_profile(db, user_id)
    if profile is None:
        return None
    return profile.to_dict()


@router.get("/me")
async def get_me(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return the current user's profile."""
    profile = await _ensure_profile(db, user_id)
    return profile.to_dict()


@router.patch("/me")
async def update_me(
    body: ProfileUpdate,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Patch the current user's profile fields used by the frontend."""
    updates = body.model_dump(exclude_unset=True)
    if not updates:
        profile = await _ensure_profile(db, user_id)
        return profile.to_dict()

    profile = await _fetch_profile(db, user_id)
    if profile is None:
        # Upsert: create with provided fields
        defaults = {"id": user_id, "display_name": "Anonymous Larper"}
        defaults.update(updates)
        profile = Profile(**defaults)
        db.add(profile)
        await db.commit()
        await db.refresh(profile)
        return profile.to_dict()

    # Apply only the provided fields
    for key, value in updates.items():
        setattr(profile, key, value)
    await db.commit()
    await db.refresh(profile)
    return profile.to_dict()


@router.post("/me/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload an avatar image for the current user."""
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{file.content_type}'. Allowed: {', '.join(sorted(ALLOWED_MIME_TYPES))}",
        )

    import shutil

    timestamp = int(time.time())
    filename = file.filename or "avatar"
    safe_filename = f"{timestamp}-{filename}"
    relative_path = os.path.join("avatars", user_id, safe_filename)
    full_path = os.path.join(settings.upload_dir, relative_path)

    os.makedirs(os.path.dirname(full_path), exist_ok=True)

    with open(full_path, "wb") as dest:
        shutil.copyfileobj(file.file, dest)

    url = f"/uploads/{relative_path}"
    return {"url": url}
