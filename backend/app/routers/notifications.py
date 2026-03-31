from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Comment, Connection, Message, Post, Profile

router = APIRouter(tags=["notifications"])


@router.get("/notifications")
async def get_notifications(
    limit: int = 25,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Aggregate lightweight notifications for the current user."""
    notifications: list[dict] = []

    # Pending connection requests
    pending_stmt = (
        select(Connection, Profile)
        .join(Profile, Connection.requester_id == Profile.id)
        .where(
            Connection.addressee_id == user_id,
            Connection.status == "pending",
        )
        .order_by(Connection.created_at.desc())
    )
    pending_result = await db.execute(pending_stmt)
    for conn, requester in pending_result.all():
        notifications.append({
            "id": f"conn-{conn.id}",
            "type": "connection_request",
            "created_at": conn.created_at.isoformat() if conn.created_at else None,
            "title": "New connection request",
            "body": f"{requester.display_name or 'Someone'} wants to connect.",
            "meta": {"connection_id": conn.id},
        })

    # Unread messages
    unread_stmt = (
        select(Message, Profile)
        .join(Profile, Message.sender_id == Profile.id)
        .where(
            Message.receiver_id == user_id,
            Message.read == False,
        )
        .order_by(Message.created_at.desc())
    )
    unread_result = await db.execute(unread_stmt)
    for msg, sender in unread_result.all():
        notifications.append({
            "id": f"msg-{msg.id}",
            "type": "message",
            "created_at": msg.created_at.isoformat() if msg.created_at else None,
            "title": "Unread message",
            "body": f"{sender.display_name or 'Someone'}: {(msg.content or '')[:80]}",
            "meta": {"message_id": msg.id},
        })

    # Recent comments on my posts
    my_posts_result = await db.execute(
        select(Post.id).where(Post.author_id == user_id)
    )
    post_ids = [row[0] for row in my_posts_result.all()]

    if post_ids:
        comments_stmt = (
            select(Comment, Profile)
            .join(Profile, Comment.author_id == Profile.id)
            .where(
                Comment.post_id.in_(post_ids),
                Comment.author_id != user_id,
            )
            .order_by(Comment.created_at.desc())
        )
        comments_result = await db.execute(comments_stmt)
        for comment, author in comments_result.all():
            notifications.append({
                "id": f"comment-{comment.id}",
                "type": "comment",
                "created_at": comment.created_at.isoformat() if comment.created_at else None,
                "title": "New comment on your post",
                "body": f"{author.display_name or 'Someone'}: {(comment.content or '')[:80]}",
                "meta": {"post_id": comment.post_id},
            })

    notifications.sort(key=lambda n: n.get("created_at") or "", reverse=True)
    return {"notifications": notifications[:limit]}
