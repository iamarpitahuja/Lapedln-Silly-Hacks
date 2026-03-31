from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Profile

router = APIRouter(tags=["jobs"])

JOB_OPTIONS = [
    "Finance Bro",
    "Stealth Startup Girlie",
    "VC Nepo Baby",
    "Fractional Vibe Curator",
    "AI Prompt Cowboy",
    "Crypto Comeback Intern",
    "LinkedIn Lore Dropper",
    "Slides-Only Founder",
    "Growth Hacker in Recovery",
    "Brand Brainrot Strategist",
    "Networking Maxxer",
    "Calendar Invite Merchant",
    "Ex-MBB Situationship",
    "Cold Email Demon",
    "Pre-Seed Aura Farmer",
    "Touch Grass Capital Analyst",
]


class JobUpdate(BaseModel):
    job: str


@router.get("/jobs/options")
async def list_job_options():
    return {"options": JOB_OPTIONS}


@router.patch("/jobs/current")
async def update_job(
    body: JobUpdate,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the user's current larp job. This is the single source of truth."""
    job = body.job.strip()
    if not job:
        raise HTTPException(status_code=400, detail="Job cannot be empty")

    result = await db.execute(select(Profile).where(Profile.id == user_id))
    profile = result.scalar_one_or_none()

    if profile is None:
        # Upsert: create profile with job
        profile = Profile(
            id=user_id,
            display_name="Anonymous Larper",
            job=job,
        )
        db.add(profile)
        await db.commit()
        await db.refresh(profile)
    else:
        profile.job = job
        await db.commit()
        await db.refresh(profile)

    return {
        "job": profile.job,
        "message": "Professional delusion updated.",
    }
