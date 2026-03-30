from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.dependencies import get_current_user, get_service_client

router = APIRouter(prefix="/api/games", tags=["games"])

REWARD_DELTAS = {
    "bingo": 0.5,
    "grind": 1.5,
    "connections": 1.0,
}

class ClaimRewardRequest(BaseModel):
    game: str

@router.post("/claim-reward")
async def claim_reward(
    body: ClaimRewardRequest,
    user_id: str = Depends(get_current_user),
    supabase=Depends(get_service_client),
):
    if body.game not in REWARD_DELTAS:
        raise HTTPException(status_code=400, detail="Invalid game")

    delta = REWARD_DELTAS[body.game]
    supabase.rpc("update_larp_rating", {
        "target_user_id": user_id,
        "rating_delta": delta,
    }).execute()

    return {"ok": True, "rating_delta": delta}
