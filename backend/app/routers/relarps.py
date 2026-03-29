from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import get_current_user, get_service_client

router = APIRouter(tags=["relarps"])


def ensure_relarp_exists(relarp_id: str, supabase):
    result = supabase.table("relarps").select("id").eq("id", relarp_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Relarp not found")


def add_relarp_reaction(relarp_id: str, reaction_type: str, user_id: str, supabase):
    ensure_relarp_exists(relarp_id, supabase)
    existing = (
        supabase.table("relarp_reactions")
        .select("id")
        .eq("relarp_id", relarp_id)
        .eq("user_id", user_id)
        .eq("reaction_type", reaction_type)
        .execute()
    )
    if existing.data:
        raise HTTPException(status_code=409, detail=f"Already {reaction_type}d")

    result = (
        supabase.table("relarp_reactions")
        .insert({
            "relarp_id": relarp_id,
            "user_id": user_id,
            "reaction_type": reaction_type,
        })
        .execute()
    )
    return result.data[0]


def remove_relarp_reaction(relarp_id: str, reaction_type: str, user_id: str, supabase):
    existing = (
        supabase.table("relarp_reactions")
        .select("id")
        .eq("relarp_id", relarp_id)
        .eq("user_id", user_id)
        .eq("reaction_type", reaction_type)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail=f"{reaction_type.title()} reaction not found")

    (
        supabase.table("relarp_reactions")
        .delete()
        .eq("relarp_id", relarp_id)
        .eq("user_id", user_id)
        .eq("reaction_type", reaction_type)
        .execute()
    )


@router.post("/relarps/{relarp_id}/like", status_code=201)
async def create_relarp_like(
    relarp_id: str,
    user_id: str = Depends(get_current_user),
    supabase=Depends(get_service_client),
):
    return add_relarp_reaction(relarp_id, "like", user_id, supabase)


@router.delete("/relarps/{relarp_id}/like", status_code=204)
async def remove_relarp_like(
    relarp_id: str,
    user_id: str = Depends(get_current_user),
    supabase=Depends(get_service_client),
):
    remove_relarp_reaction(relarp_id, "like", user_id, supabase)
    return None


@router.post("/relarps/{relarp_id}/love", status_code=201)
async def create_relarp_love(
    relarp_id: str,
    user_id: str = Depends(get_current_user),
    supabase=Depends(get_service_client),
):
    return add_relarp_reaction(relarp_id, "love", user_id, supabase)


@router.delete("/relarps/{relarp_id}/love", status_code=204)
async def remove_relarp_love(
    relarp_id: str,
    user_id: str = Depends(get_current_user),
    supabase=Depends(get_service_client),
):
    remove_relarp_reaction(relarp_id, "love", user_id, supabase)
    return None


@router.post("/relarps/{relarp_id}/glaze", status_code=201)
async def create_relarp_glaze(
    relarp_id: str,
    user_id: str = Depends(get_current_user),
    supabase=Depends(get_service_client),
):
    return add_relarp_reaction(relarp_id, "glaze", user_id, supabase)


@router.delete("/relarps/{relarp_id}/glaze", status_code=204)
async def remove_relarp_glaze(
    relarp_id: str,
    user_id: str = Depends(get_current_user),
    supabase=Depends(get_service_client),
):
    remove_relarp_reaction(relarp_id, "glaze", user_id, supabase)
    return None
