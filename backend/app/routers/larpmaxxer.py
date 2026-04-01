from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user
from app.models import Profile
from app.services.elevenlabs import stream_tts
from app.services.larpmaxxer_store import (
    get_characters,
    get_character_voice_id,
    get_personas,
    get_progress,
    get_scenario_content,
    get_scenarios,
    update_progress,
)
from app.services.rating_engine import adjust_rating

router = APIRouter(tags=["larpmaxxer"])


class CompletedScenario(BaseModel):
    scenarioId: str
    score: float
    bestScore: float


class ProgressPatch(BaseModel):
    personaId: str | None = None
    larpRating: float | None = None
    completedScenarios: list[CompletedScenario] | None = None
    larpRatingDelta: float | None = None


class LarpmaxxerTTSRequest(BaseModel):
    text: str
    characterId: str


@router.get("/larpmaxxer/bootstrap")
async def get_larpmaxxer_bootstrap(
    _user_id: str = Depends(get_current_user),
):
    return {
        "personas": get_personas(),
        "characters": get_characters(),
        "scenarios": get_scenarios(),
        "ttsAvailable": bool(settings.elevenlabs_api_key),
    }


@router.get("/larpmaxxer/scenarios/{scenario_id}/content")
async def get_larpmaxxer_scenario_content(
    scenario_id: str,
    _user_id: str = Depends(get_current_user),
):
    content = get_scenario_content(scenario_id)
    if content is None:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return content


@router.get("/larpmaxxer/progress")
async def get_larpmaxxer_progress(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    progress = await get_progress(user_id, db)
    # Pull larpRating and personaId from Profile (source of truth)
    profile = (await db.execute(select(Profile).where(Profile.id == user_id))).scalar_one_or_none()
    if profile:
        progress["larpRating"] = profile.larp_rating
        if profile.persona:
            progress["personaId"] = profile.persona
    return {"userId": user_id, **progress}


@router.post("/larpmaxxer/tts")
async def synthesize_larpmaxxer_tts(
    body: LarpmaxxerTTSRequest,
    _user_id: str = Depends(get_current_user),
):
    text = body.text.strip()
    character_id = body.characterId.strip()

    if not settings.elevenlabs_api_key:
        raise HTTPException(status_code=503, detail="TTS not configured")

    if not text:
        raise HTTPException(status_code=400, detail="text is required")

    if not character_id:
        raise HTTPException(status_code=400, detail="characterId is required")

    voice_id = get_character_voice_id(character_id)
    if not voice_id:
        raise HTTPException(status_code=404, detail=f"No voice configured for character '{character_id}'")

    try:
        chunks = []
        async for chunk in stream_tts(text=text, voice_id=voice_id):
            chunks.append(chunk)
        audio_bytes = b"".join(chunks)
    except RuntimeError as exc:
        msg = str(exc)
        if "401" in msg or "unusual_activity" in msg:
            raise HTTPException(status_code=503, detail="Voice service temporarily unavailable")
        raise HTTPException(status_code=502, detail="Voice synthesis failed")

    return Response(
        content=audio_bytes,
        media_type="audio/mpeg",
        headers={"Content-Length": str(len(audio_bytes))},
    )


@router.patch("/larpmaxxer/progress")
async def patch_larpmaxxer_progress(
    body: ProgressPatch,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    updates: dict = {}
    if "personaId" in body.model_fields_set:
        updates["personaId"] = body.personaId
    if "larpRating" in body.model_fields_set:
        updates["larpRating"] = body.larpRating
    if "completedScenarios" in body.model_fields_set:
        updates["completedScenarios"] = [
            {
                "scenarioId": entry.scenarioId,
                "score": entry.score,
                "bestScore": entry.bestScore,
            }
            for entry in (body.completedScenarios or [])
        ]

    progress = await update_progress(user_id, updates, db)

    # Sync personaId to Profile.persona
    if body.personaId is not None:
        profile = (await db.execute(select(Profile).where(Profile.id == user_id))).scalar_one_or_none()
        if profile:
            profile.persona = body.personaId
            await db.commit()

    # Sync scenario completions to Profile.larp_rating
    rating_change = None
    if body.completedScenarios:
        if body.larpRatingDelta is not None:
            trusted_delta = max(-10.0, min(25.0, float(body.larpRatingDelta)))
        else:
            last = body.completedScenarios[-1]
            trusted_delta = round(1.5 + (last.score / 100.0) * 1.5, 1)

        rating_change = await adjust_rating(
            db, user_id, "larpmaxxer_scenario_complete",
            {"delta": round(trusted_delta, 1)},
        )
        await db.commit()

    result = {"userId": user_id, **progress}
    if rating_change:
        result["rating_change"] = rating_change
    return result
