from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Relarp, RelarpReaction
from app.services.rating_engine import adjust_rating

router = APIRouter(tags=["relarps"])


async def _get_relarp(relarp_id: str, db: AsyncSession) -> Relarp:
    result = await db.execute(select(Relarp).where(Relarp.id == relarp_id))
    relarp = result.scalars().first()
    if not relarp:
        raise HTTPException(status_code=404, detail="Relarp not found")
    return relarp


async def add_relarp_reaction(
    relarp_id: str, reaction_type: str, user_id: str, db: AsyncSession
):
    relarp = await _get_relarp(relarp_id, db)

    existing = await db.execute(
        select(RelarpReaction).where(
            RelarpReaction.relarp_id == relarp_id,
            RelarpReaction.user_id == user_id,
            RelarpReaction.reaction_type == reaction_type,
        )
    )
    if existing.scalars().first():
        raise HTTPException(status_code=409, detail=f"Already {reaction_type}d")

    reaction = RelarpReaction(
        relarp_id=relarp_id, user_id=user_id, reaction_type=reaction_type
    )
    db.add(reaction)

    # Author reward (skip if self)
    if relarp.user_id != user_id:
        await adjust_rating(db, relarp.user_id, f"relarp_{reaction_type}d")

    await db.commit()
    await db.refresh(reaction)
    return reaction.to_dict()


async def remove_relarp_reaction(
    relarp_id: str, reaction_type: str, user_id: str, db: AsyncSession
):
    relarp = await _get_relarp(relarp_id, db)

    existing = await db.execute(
        select(RelarpReaction).where(
            RelarpReaction.relarp_id == relarp_id,
            RelarpReaction.user_id == user_id,
            RelarpReaction.reaction_type == reaction_type,
        )
    )
    if not existing.scalars().first():
        raise HTTPException(
            status_code=404, detail=f"{reaction_type.title()} reaction not found"
        )

    await db.execute(
        delete(RelarpReaction).where(
            RelarpReaction.relarp_id == relarp_id,
            RelarpReaction.user_id == user_id,
            RelarpReaction.reaction_type == reaction_type,
        )
    )

    # Penalty to author (skip if self)
    if relarp.user_id != user_id:
        await adjust_rating(db, relarp.user_id, f"relarp_un{reaction_type}d")

    await db.commit()


@router.post("/relarps/{relarp_id}/like", status_code=201)
async def create_relarp_like(
    relarp_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await add_relarp_reaction(relarp_id, "like", user_id, db)


@router.delete("/relarps/{relarp_id}/like")
async def remove_relarp_like(
    relarp_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await remove_relarp_reaction(relarp_id, "like", user_id, db)
    return {"ok": True}


@router.post("/relarps/{relarp_id}/love", status_code=201)
async def create_relarp_love(
    relarp_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await add_relarp_reaction(relarp_id, "love", user_id, db)


@router.delete("/relarps/{relarp_id}/love")
async def remove_relarp_love(
    relarp_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await remove_relarp_reaction(relarp_id, "love", user_id, db)
    return {"ok": True}


@router.post("/relarps/{relarp_id}/glaze", status_code=201)
async def create_relarp_glaze(
    relarp_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await add_relarp_reaction(relarp_id, "glaze", user_id, db)


@router.delete("/relarps/{relarp_id}/glaze")
async def remove_relarp_glaze(
    relarp_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await remove_relarp_reaction(relarp_id, "glaze", user_id, db)
    return {"ok": True}
