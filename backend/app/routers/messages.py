from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.dependencies import get_current_user, get_service_client

router = APIRouter(tags=["messages"])


class SendMessage(BaseModel):
    receiver_id: str
    content: str


@router.get("/messages/conversations")
async def get_conversations(
    user_id: str = Depends(get_current_user),
    supabase=Depends(get_service_client),
):
    """
    List all conversations for the current user.
    Returns one entry per unique conversation partner with:
    - other user's profile
    - latest message preview
    - unread count
    """
    result = (
        supabase.table("messages")
        .select(
            "*, "
            "sender:profiles!sender_id(id, display_name, avatar_url), "
            "receiver:profiles!receiver_id(id, display_name, avatar_url)"
        )
        .or_(f"sender_id.eq.{user_id},receiver_id.eq.{user_id}")
        .order("created_at", desc=True)
        .execute()
    )

    seen: dict[str, dict] = {}
    for msg in result.data:
        other_id = msg["receiver_id"] if msg["sender_id"] == user_id else msg["sender_id"]
        other_profile = msg["receiver"] if msg["sender_id"] == user_id else msg["sender"]
        if other_id not in seen:
            seen[other_id] = {
                "other_user": other_profile,
                "latest_message": msg["content"],
                "latest_at": msg["created_at"],
                "unread_count": 0,
            }
        if msg["receiver_id"] == user_id and not msg["read"]:
            seen[other_id]["unread_count"] += 1

    return {"conversations": list(seen.values())}


@router.get("/messages/{other_user_id}")
async def get_message_history(
    other_user_id: str,
    user_id: str = Depends(get_current_user),
    supabase=Depends(get_service_client),
):
    """Full message history with one person, oldest first."""
    result = (
        supabase.table("messages")
        .select("*, sender:profiles!sender_id(id, display_name, avatar_url)")
        .or_(
            f"and(sender_id.eq.{user_id},receiver_id.eq.{other_user_id}),"
            f"and(sender_id.eq.{other_user_id},receiver_id.eq.{user_id})"
        )
        .order("created_at", desc=False)
        .execute()
    )

    # Mark received messages as read
    supabase.table("messages").update({"read": True}).eq(
        "sender_id", other_user_id
    ).eq("receiver_id", user_id).eq("read", False).execute()

    return {"messages": result.data}


@router.post("/messages", status_code=201)
async def send_message(
    body: SendMessage,
    user_id: str = Depends(get_current_user),
    supabase=Depends(get_service_client),
):
    """
    Send a direct message.
    Supabase Realtime automatically broadcasts the INSERT to subscribers.
    """
    if not body.content.strip():
        raise HTTPException(status_code=400, detail="Message content cannot be empty")
    if body.receiver_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot message yourself")

    result = (
        supabase.table("messages")
        .insert({
            "sender_id": user_id,
            "receiver_id": body.receiver_id,
            "content": body.content.strip(),
        })
        .execute()
    )
    return result.data[0]
