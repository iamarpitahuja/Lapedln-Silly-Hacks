from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.dependencies import get_current_user, get_service_client
from app.services.larpmaxxer_store import (
    get_characters,
    get_personas,
    get_progress,
    get_scenario_content,
    get_scenarios,
    update_progress,
)

router = APIRouter(tags=["larpmaxxer"])


class CompletedScenario(BaseModel):
    scenarioId: str
    score: float
    bestScore: float


class ProgressPatch(BaseModel):
    personaId: str | None = None
    larpRating: float | None = None
    completedScenarios: list[CompletedScenario] | None = None


@router.get("/larpmaxxer/bootstrap")
async def get_larpmaxxer_bootstrap(
    _user_id: str = Depends(get_current_user),
):
    return {
        "personas": get_personas(),
        "characters": get_characters(),
        "scenarios": get_scenarios(),
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
    supabase=Depends(get_service_client),
):
    progress = get_progress(user_id, supabase)
    return {"userId": user_id, **progress}


@router.patch("/larpmaxxer/progress")
async def patch_larpmaxxer_progress(
    body: ProgressPatch,
    user_id: str = Depends(get_current_user),
    supabase=Depends(get_service_client),
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

    progress = update_progress(user_id, updates, supabase)
    return {"userId": user_id, **progress}
