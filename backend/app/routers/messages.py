from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, and_, or_, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models import (
    Connection,
    Conversation,
    ConversationMember,
    GroupMessage,
    Message,
    Profile,
)
from app.websocket import manager

router = APIRouter(tags=["messages"])


class SendMessage(BaseModel):
    receiver_id: str
    content: str


class CreateConversation(BaseModel):
    member_ids: list[str]
    name: str = ""


class SendGroupMessage(BaseModel):
    content: str


# -- Compose picker -----------------------------------------------------------


@router.get("/messages/users")
async def get_messageable_users(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all users for the compose picker. Connections first, then others."""
    conn_result = await db.execute(
        select(Connection).where(
            or_(
                Connection.requester_id == user_id,
                Connection.addressee_id == user_id,
            ),
            Connection.status == "accepted",
        )
    )
    conn_rows = conn_result.scalars().all()

    connection_ids: set[str] = set()
    connections: list[dict] = []
    for c in conn_rows:
        other_id = c.addressee_id if c.requester_id == user_id else c.requester_id
        connection_ids.add(other_id)
        profile = await db.get(Profile, other_id)
        if profile:
            connections.append({
                "id": profile.id,
                "display_name": profile.display_name,
                "job": profile.job,
                "avatar_url": profile.avatar_url,
                "larp_rating": profile.larp_rating,
            })

    all_profiles_result = await db.execute(
        select(Profile).where(
            Profile.id != user_id,
            Profile.id.notin_(connection_ids) if connection_ids else True,
        )
    )
    others = [
        {
            "id": p.id,
            "display_name": p.display_name,
            "job": p.job,
            "avatar_url": p.avatar_url,
            "larp_rating": p.larp_rating,
        }
        for p in all_profiles_result.scalars().all()
    ]

    return {"connections": connections, "others": others}


# -- Conversations (1:1 + groups) --------------------------------------------


@router.get("/messages/conversations")
async def get_conversations(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all 1:1 conversations and group conversations."""
    # 1:1 conversations (derived from messages table)
    dm_result = await db.execute(
        select(Message).where(
            or_(
                Message.sender_id == user_id,
                Message.receiver_id == user_id,
            )
        ).order_by(Message.created_at.desc())
    )
    dm_rows = dm_result.scalars().all()

    seen: dict[str, dict] = {}
    for msg in dm_rows:
        other_id = msg.receiver_id if msg.sender_id == user_id else msg.sender_id
        if other_id not in seen:
            other_profile = await db.get(Profile, other_id)
            seen[other_id] = {
                "other_user": {
                    "id": other_profile.id,
                    "display_name": other_profile.display_name,
                    "job": other_profile.job,
                    "avatar_url": other_profile.avatar_url,
                } if other_profile else None,
                "latest_message": msg.content,
                "latest_at": msg.created_at.isoformat() if msg.created_at else None,
                "unread_count": 0,
            }
        if msg.receiver_id == user_id and not msg.read:
            seen[other_id]["unread_count"] += 1

    dm_conversations = list(seen.values())

    # Group conversations
    memberships_result = await db.execute(
        select(ConversationMember.conversation_id).where(
            ConversationMember.user_id == user_id
        )
    )
    conv_ids = [m[0] for m in memberships_result.all()]

    groups: list[dict] = []
    if conv_ids:
        convs_result = await db.execute(
            select(Conversation).where(
                Conversation.id.in_(conv_ids),
                Conversation.is_group == True,
            )
        )
        for conv in convs_result.scalars().all():
            # Get members with profiles
            members_result = await db.execute(
                select(ConversationMember, Profile)
                .join(Profile, ConversationMember.user_id == Profile.id)
                .where(ConversationMember.conversation_id == conv.id)
            )
            members = [
                {
                    "id": profile.id,
                    "display_name": profile.display_name,
                    "avatar_url": profile.avatar_url,
                }
                for _, profile in members_result.all()
            ]

            # Get latest message
            latest_result = await db.execute(
                select(GroupMessage)
                .where(GroupMessage.conversation_id == conv.id)
                .order_by(GroupMessage.created_at.desc())
                .limit(1)
            )
            latest_msg = latest_result.scalars().first()

            groups.append({
                "id": conv.id,
                "name": conv.name,
                "is_group": True,
                "members": members,
                "latest_message": latest_msg.content if latest_msg else None,
                "latest_at": (
                    latest_msg.created_at.isoformat()
                    if latest_msg and latest_msg.created_at
                    else (conv.created_at.isoformat() if conv.created_at else None)
                ),
            })

        groups.sort(key=lambda g: g["latest_at"] or "", reverse=True)

    return {"conversations": dm_conversations, "groups": groups}


# -- Group conversations ------------------------------------------------------


@router.post("/messages/conversations", status_code=201)
async def create_conversation(
    body: CreateConversation,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new group conversation."""
    member_ids = list(set(body.member_ids))
    if user_id in member_ids:
        member_ids.remove(user_id)
    if len(member_ids) < 2:
        raise HTTPException(
            status_code=400,
            detail="Group conversations need at least 2 other members",
        )

    all_member_ids = [user_id] + member_ids

    profiles_result = await db.execute(
        select(Profile).where(Profile.id.in_(all_member_ids))
    )
    profiles = profiles_result.scalars().all()
    names_by_id = {p.id: p.display_name for p in profiles}
    other_names = [names_by_id.get(mid, "Unknown") for mid in member_ids]
    auto_name = body.name.strip() or ", ".join(other_names[:4])
    if len(other_names) > 4:
        auto_name += f" +{len(other_names) - 4}"

    conv = Conversation(name=auto_name, is_group=True, created_by=user_id)
    db.add(conv)
    await db.flush()

    for uid in all_member_ids:
        db.add(ConversationMember(conversation_id=conv.id, user_id=uid))
    await db.commit()
    await db.refresh(conv)

    return {
        "id": conv.id,
        "name": conv.name,
        "is_group": True,
        "members": [
            {"id": p.id, "display_name": p.display_name} for p in profiles
        ],
    }


@router.get("/messages/groups/{conversation_id}")
async def get_group_message_history(
    conversation_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Fetch message history for a group conversation."""
    membership = await db.execute(
        select(ConversationMember).where(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == user_id,
        )
    )
    if not membership.scalars().first():
        raise HTTPException(status_code=403, detail="Not a member of this conversation")

    result = await db.execute(
        select(GroupMessage, Profile)
        .join(Profile, GroupMessage.sender_id == Profile.id)
        .where(GroupMessage.conversation_id == conversation_id)
        .order_by(GroupMessage.created_at.asc())
    )
    messages = []
    for msg, sender in result.all():
        d = msg.to_dict()
        d["sender"] = {
            "id": sender.id,
            "display_name": sender.display_name,
            "avatar_url": sender.avatar_url,
        }
        messages.append(d)

    return {"messages": messages}


@router.post("/messages/groups/{conversation_id}", status_code=201)
async def send_group_message(
    conversation_id: str,
    body: SendGroupMessage,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Send a message to a group conversation."""
    content = body.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="Message content cannot be empty")

    membership = await db.execute(
        select(ConversationMember).where(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == user_id,
        )
    )
    if not membership.scalars().first():
        raise HTTPException(status_code=403, detail="Not a member of this conversation")

    msg = GroupMessage(
        conversation_id=conversation_id, sender_id=user_id, content=content
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)

    msg_dict = msg.to_dict()

    # Push via WebSocket to all members
    members_result = await db.execute(
        select(ConversationMember.user_id).where(
            ConversationMember.conversation_id == conversation_id
        )
    )
    member_ids = [m[0] for m in members_result.all()]
    await manager.send_to_users(
        member_ids, {"type": "group_message", "data": msg_dict}, exclude=user_id
    )

    return msg_dict


# -- Legacy 1:1 messages -----------------------------------------------------


@router.get("/messages/{other_user_id}")
async def get_message_history(
    other_user_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Full message history with one person, oldest first."""
    result = await db.execute(
        select(Message, Profile)
        .join(Profile, Message.sender_id == Profile.id)
        .where(
            or_(
                and_(
                    Message.sender_id == user_id,
                    Message.receiver_id == other_user_id,
                ),
                and_(
                    Message.sender_id == other_user_id,
                    Message.receiver_id == user_id,
                ),
            )
        )
        .order_by(Message.created_at.asc())
    )
    messages = []
    for msg, sender in result.all():
        d = msg.to_dict()
        d["sender"] = {
            "id": sender.id,
            "display_name": sender.display_name,
            "avatar_url": sender.avatar_url,
        }
        messages.append(d)

    # Mark unread messages as read
    await db.execute(
        update(Message)
        .where(
            Message.sender_id == other_user_id,
            Message.receiver_id == user_id,
            Message.read == False,
        )
        .values(read=True)
    )
    await db.commit()

    return {"messages": messages}


@router.post("/messages", status_code=201)
async def send_message(
    body: SendMessage,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Send a direct message."""
    if not body.content.strip():
        raise HTTPException(status_code=400, detail="Message content cannot be empty")
    if body.receiver_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot message yourself")

    msg = Message(
        sender_id=user_id,
        receiver_id=body.receiver_id,
        content=body.content.strip(),
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)

    msg_dict = msg.to_dict()

    # Push via WebSocket
    await manager.send_to_user(
        body.receiver_id, {"type": "direct_message", "data": msg_dict}
    )

    return msg_dict
