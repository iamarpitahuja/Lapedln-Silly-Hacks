from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.dependencies import get_current_user, get_service_client

router = APIRouter(tags=["messages"])


class SendMessage(BaseModel):
    receiver_id: str
    content: str


class CreateConversation(BaseModel):
    member_ids: list[str]
    name: str = ""


class SendGroupMessage(BaseModel):
    content: str


# ── Compose picker ───────────────────────────────────────────────────────────


@router.get("/messages/users")
async def get_messageable_users(
    user_id: str = Depends(get_current_user),
    supabase=Depends(get_service_client),
):
    """List all users for the compose picker. Connections first, then others."""
    conn_result = (
        supabase.table("connections")
        .select(
            "requester_id, addressee_id, "
            "requester:profiles!requester_id(id, display_name, job, avatar_url, larp_rating), "
            "addressee:profiles!addressee_id(id, display_name, job, avatar_url, larp_rating)"
        )
        .or_(f"requester_id.eq.{user_id},addressee_id.eq.{user_id}")
        .eq("status", "accepted")
        .execute()
    )

    connection_ids = set()
    connections = []
    for c in conn_result.data:
        profile = c["addressee"] if c["requester_id"] == user_id else c["requester"]
        connection_ids.add(profile["id"])
        connections.append(profile)

    all_profiles = (
        supabase.table("profiles")
        .select("id, display_name, job, avatar_url, larp_rating")
        .execute()
    )
    others = [
        p for p in all_profiles.data
        if p["id"] != user_id and p["id"] not in connection_ids
    ]

    return {"connections": connections, "others": others}


# ── Conversations (1:1 + groups) ─────────────────────────────────────────────


@router.get("/messages/conversations")
async def get_conversations(
    user_id: str = Depends(get_current_user),
    supabase=Depends(get_service_client),
):
    """List all 1:1 conversations and group conversations."""
    # 1:1 conversations (derived from messages table)
    dm_result = (
        supabase.table("messages")
        .select(
            "*, "
            "sender:profiles!sender_id(id, display_name, job, avatar_url), "
            "receiver:profiles!receiver_id(id, display_name, job, avatar_url)"
        )
        .or_(f"sender_id.eq.{user_id},receiver_id.eq.{user_id}")
        .order("created_at", desc=True)
        .execute()
    )

    seen: dict[str, dict] = {}
    for msg in dm_result.data:
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

    dm_conversations = list(seen.values())

    # Group conversations
    memberships = (
        supabase.table("conversation_members")
        .select("conversation_id")
        .eq("user_id", user_id)
        .execute()
    )
    conv_ids = [m["conversation_id"] for m in memberships.data]

    groups = []
    if conv_ids:
        convs = (
            supabase.table("conversations")
            .select("*")
            .in_("id", conv_ids)
            .eq("is_group", True)
            .execute()
        )

        for conv in convs.data:
            members_result = (
                supabase.table("conversation_members")
                .select("user_id, profiles!user_id(id, display_name, avatar_url)")
                .eq("conversation_id", conv["id"])
                .execute()
            )
            members = [m["profiles"] for m in members_result.data if m.get("profiles")]

            latest = (
                supabase.table("group_messages")
                .select("content, created_at, sender_id")
                .eq("conversation_id", conv["id"])
                .order("created_at", desc=True)
                .limit(1)
                .execute()
            )
            latest_msg = latest.data[0] if latest.data else None

            groups.append({
                "id": conv["id"],
                "name": conv["name"],
                "is_group": True,
                "members": members,
                "latest_message": latest_msg["content"] if latest_msg else None,
                "latest_at": latest_msg["created_at"] if latest_msg else conv["created_at"],
            })

        groups.sort(key=lambda g: g["latest_at"] or "", reverse=True)

    return {"conversations": dm_conversations, "groups": groups}


# ── Group conversations ──────────────────────────────────────────────────────


@router.post("/messages/conversations", status_code=201)
async def create_conversation(
    body: CreateConversation,
    user_id: str = Depends(get_current_user),
    supabase=Depends(get_service_client),
):
    """Create a new group conversation."""
    member_ids = list(set(body.member_ids))
    if user_id in member_ids:
        member_ids.remove(user_id)
    if len(member_ids) < 2:
        raise HTTPException(status_code=400, detail="Group conversations need at least 2 other members")

    all_member_ids = [user_id] + member_ids

    profiles_result = (
        supabase.table("profiles")
        .select("id, display_name")
        .in_("id", all_member_ids)
        .execute()
    )
    names_by_id = {p["id"]: p["display_name"] for p in profiles_result.data}
    other_names = [names_by_id.get(mid, "Unknown") for mid in member_ids]
    auto_name = body.name.strip() or ", ".join(other_names[:4])
    if len(other_names) > 4:
        auto_name += f" +{len(other_names) - 4}"

    conv_result = (
        supabase.table("conversations")
        .insert({
            "name": auto_name,
            "is_group": True,
            "created_by": user_id,
        })
        .execute()
    )
    conv = conv_result.data[0]

    members = [{"conversation_id": conv["id"], "user_id": uid} for uid in all_member_ids]
    supabase.table("conversation_members").insert(members).execute()

    return {
        "id": conv["id"],
        "name": conv["name"],
        "is_group": True,
        "members": profiles_result.data,
    }


@router.get("/messages/groups/{conversation_id}")
async def get_group_message_history(
    conversation_id: str,
    user_id: str = Depends(get_current_user),
    supabase=Depends(get_service_client),
):
    """Fetch message history for a group conversation."""
    membership = (
        supabase.table("conversation_members")
        .select("conversation_id")
        .eq("conversation_id", conversation_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not membership.data:
        raise HTTPException(status_code=403, detail="Not a member of this conversation")

    result = (
        supabase.table("group_messages")
        .select("*, sender:profiles!sender_id(id, display_name, avatar_url)")
        .eq("conversation_id", conversation_id)
        .order("created_at", desc=False)
        .execute()
    )
    return {"messages": result.data}


@router.post("/messages/groups/{conversation_id}", status_code=201)
async def send_group_message(
    conversation_id: str,
    body: SendGroupMessage,
    user_id: str = Depends(get_current_user),
    supabase=Depends(get_service_client),
):
    """Send a message to a group conversation."""
    content = body.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="Message content cannot be empty")

    membership = (
        supabase.table("conversation_members")
        .select("conversation_id")
        .eq("conversation_id", conversation_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not membership.data:
        raise HTTPException(status_code=403, detail="Not a member of this conversation")

    result = (
        supabase.table("group_messages")
        .insert({
            "conversation_id": conversation_id,
            "sender_id": user_id,
            "content": content,
        })
        .execute()
    )
    return result.data[0]


# ── Legacy 1:1 messages ──────────────────────────────────────────────────────


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
    """Send a direct message."""
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
