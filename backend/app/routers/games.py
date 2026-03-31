from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.services.rating_engine import adjust_rating

router = APIRouter(prefix="/api/games", tags=["games"])

VALID_GAMES = {"bingo", "grind", "connections"}


class ClaimRewardRequest(BaseModel):
    game: str


@router.post("/claim-reward")
async def claim_reward(
    body: ClaimRewardRequest,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if body.game not in VALID_GAMES:
        raise HTTPException(status_code=400, detail="Invalid game")

    rating_change = await adjust_rating(db, user_id, f"game_{body.game}")
    await db.commit()

    return {"ok": True, "rating_change": rating_change}
