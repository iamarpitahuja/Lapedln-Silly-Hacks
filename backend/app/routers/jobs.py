from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.dependencies import get_current_user, get_service_client

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


def _first_row(data):
    if isinstance(data, list):
        return data[0] if data else None
    if isinstance(data, dict):
        return data
    return None


@router.get("/jobs/options")
async def list_job_options():
    return {"options": JOB_OPTIONS}


@router.patch("/jobs/current")
async def update_job(
    body: JobUpdate,
    user_id: str = Depends(get_current_user),
    supabase=Depends(get_service_client),
):
    """Update the user's current larp job. This is the single source of truth."""
    job = body.job.strip()
    if not job:
        raise HTTPException(status_code=400, detail="Job cannot be empty")

    result = (
        supabase.table("profiles")
        .update({"job": job})
        .eq("id", user_id)
        .execute()
    )
    updated = _first_row(result.data)
    if not updated:
        upsert_result = (
            supabase.table("profiles")
            .upsert(
                {
                    "id": user_id,
                    "display_name": "Anonymous Larper",
                    "job": job,
                },
                on_conflict="id",
            )
            .execute()
        )
        updated = _first_row(upsert_result.data) or {"job": job}

    return {
        "job": updated["job"],
        "message": "Professional delusion updated.",
    }
