from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.dependencies import get_current_user, get_service_client

router = APIRouter(tags=["connections"])


class ConnectionRequest(BaseModel):
    addressee_id: str


@router.post("/connections/request", status_code=201)
async def send_connection_request(
    body: ConnectionRequest,
    user_id: str = Depends(get_current_user),
    supabase=Depends(get_service_client),
):
    """Send a connection request to another user."""
    if body.addressee_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot connect with yourself")

    existing = (
        supabase.table("connections")
        .select("id, status")
        .or_(
            f"and(requester_id.eq.{user_id},addressee_id.eq.{body.addressee_id}),"
            f"and(requester_id.eq.{body.addressee_id},addressee_id.eq.{user_id})"
        )
        .execute()
    )
    if existing.data:
        raise HTTPException(status_code=409, detail="Connection already exists")

    result = (
        supabase.table("connections")
        .insert({"requester_id": user_id, "addressee_id": body.addressee_id})
        .execute()
    )
    return result.data[0]


@router.patch("/connections/{connection_id}/accept")
async def accept_connection(
    connection_id: str,
    user_id: str = Depends(get_current_user),
    supabase=Depends(get_service_client),
):
    """Accept a pending connection request (addressee only)."""
    conn = (
        supabase.table("connections")
        .select("*")
        .eq("id", connection_id)
        .eq("addressee_id", user_id)
        .eq("status", "pending")
        .execute()
    )
    if not conn.data:
        raise HTTPException(status_code=404, detail="Connection request not found")

    result = (
        supabase.table("connections")
        .update({"status": "accepted"})
        .eq("id", connection_id)
        .execute()
    )
    return result.data[0]


@router.patch("/connections/{connection_id}/decline")
async def decline_connection(
    connection_id: str,
    user_id: str = Depends(get_current_user),
    supabase=Depends(get_service_client),
):
    """Decline a pending connection request (addressee only)."""
    conn = (
        supabase.table("connections")
        .select("*")
        .eq("id", connection_id)
        .eq("addressee_id", user_id)
        .eq("status", "pending")
        .execute()
    )
    if not conn.data:
        raise HTTPException(status_code=404, detail="Connection request not found")

    result = (
        supabase.table("connections")
        .update({"status": "declined"})
        .eq("id", connection_id)
        .execute()
    )
    return result.data[0]


@router.delete("/connections/{connection_id}", status_code=204)
async def remove_connection(
    connection_id: str,
    user_id: str = Depends(get_current_user),
    supabase=Depends(get_service_client),
):
    """Withdraw a sent request or remove an accepted connection (requester only)."""
    conn = (
        supabase.table("connections")
        .select("*")
        .eq("id", connection_id)
        .eq("requester_id", user_id)
        .execute()
    )
    if not conn.data:
        raise HTTPException(status_code=404, detail="Connection not found")

    supabase.table("connections").delete().eq("id", connection_id).execute()
    return None


@router.get("/connections")
async def get_my_connections(
    user_id: str = Depends(get_current_user),
    supabase=Depends(get_service_client),
):
    """List all accepted connections with profile data."""
    result = (
        supabase.table("connections")
        .select(
            "*, "
            "requester:profiles!requester_id(id, display_name, job, avatar_url, larp_rating), "
            "addressee:profiles!addressee_id(id, display_name, job, avatar_url, larp_rating)"
        )
        .or_(f"requester_id.eq.{user_id},addressee_id.eq.{user_id}")
        .eq("status", "accepted")
        .execute()
    )

    connections = []
    for c in result.data:
        other = c["addressee"] if c["requester_id"] == user_id else c["requester"]
        connections.append({
            "id": c["id"],
            "status": c["status"],
            "created_at": c["created_at"],
            "profile": other,
        })
    return {"connections": connections}


@router.get("/connections/pending")
async def get_pending_connections(
    user_id: str = Depends(get_current_user),
    supabase=Depends(get_service_client),
):
    """List incoming pending connection requests with requester profile data."""
    result = (
        supabase.table("connections")
        .select(
            "*, requester:profiles!requester_id(id, display_name, job, avatar_url, larp_rating)"
        )
        .eq("addressee_id", user_id)
        .eq("status", "pending")
        .order("created_at", desc=True)
        .execute()
    )
    return {"pending": result.data}


@router.get("/connections/suggestions")
async def get_connection_suggestions(
    user_id: str = Depends(get_current_user),
    supabase=Depends(get_service_client),
):
    """All users not yet connected with (any status), excluding self."""
    existing = (
        supabase.table("connections")
        .select("requester_id, addressee_id")
        .or_(f"requester_id.eq.{user_id},addressee_id.eq.{user_id}")
        .execute()
    )
    excluded = {user_id}
    for c in existing.data:
        excluded.add(c["requester_id"])
        excluded.add(c["addressee_id"])

    all_profiles = (
        supabase.table("profiles")
        .select("id, display_name, job, avatar_url, larp_rating")
        .execute()
    )
    suggestions = [p for p in all_profiles.data if p["id"] not in excluded]
    return {"suggestions": suggestions}
