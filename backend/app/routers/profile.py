from fastapi import APIRouter, Depends

from app.dependencies import get_current_user, get_service_client

router = APIRouter(tags=["profile"])


@router.get("/me")
async def get_me(
    user_id: str = Depends(get_current_user),
    supabase=Depends(get_service_client),
):
    """Return the current user's profile."""
    result = (
        supabase.table("profiles")
        .select("*")
        .eq("id", user_id)
        .single()
        .execute()
    )
    return result.data
