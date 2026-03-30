from fastapi import APIRouter, Depends

from app.dependencies import get_current_user, get_service_client

router = APIRouter(tags=["notifications"])


@router.get("/notifications")
async def get_notifications(
    limit: int = 25,
    user_id: str = Depends(get_current_user),
    supabase=Depends(get_service_client),
):
    """Aggregate lightweight notifications for the current user."""
    notifications: list[dict] = []

    # Pending connection requests
    pending = (
        supabase.table("connections")
        .select("id, created_at, requester:profiles!requester_id(display_name)")
        .eq("addressee_id", user_id)
        .eq("status", "pending")
        .order("created_at", desc=True)
        .execute()
    )
    for row in (pending.data or []):
        requester = row.get("requester") or {}
        notifications.append({
            "id": f"conn-{row['id']}",
            "type": "connection_request",
            "created_at": row["created_at"],
            "title": "New connection request",
            "body": f"{requester.get('display_name', 'Someone')} wants to connect.",
            "meta": {"connection_id": row["id"]},
        })

    # Unread messages
    unread_messages = (
        supabase.table("messages")
        .select("id, created_at, content, sender:profiles!sender_id(display_name)")
        .eq("receiver_id", user_id)
        .eq("read", False)
        .order("created_at", desc=True)
        .execute()
    )
    for row in (unread_messages.data or []):
        sender = row.get("sender") or {}
        notifications.append({
            "id": f"msg-{row['id']}",
            "type": "message",
            "created_at": row["created_at"],
            "title": "Unread message",
            "body": f"{sender.get('display_name', 'Someone')}: {row.get('content', '')[:80]}",
            "meta": {"message_id": row["id"]},
        })

    # Recent comments on my posts
    my_posts = (
        supabase.table("posts")
        .select("id")
        .eq("author_id", user_id)
        .execute()
    )
    post_ids = [p["id"] for p in (my_posts.data or [])]
    if post_ids:
        recent_comments = (
            supabase.table("comments")
            .select("id, created_at, content, post_id, author:profiles!author_id(display_name)")
            .in_("post_id", post_ids)
            .neq("author_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        for row in (recent_comments.data or []):
            author = row.get("author") or {}
            notifications.append({
                "id": f"comment-{row['id']}",
                "type": "comment",
                "created_at": row["created_at"],
                "title": "New comment on your post",
                "body": f"{author.get('display_name', 'Someone')}: {row.get('content', '')[:80]}",
                "meta": {"post_id": row["post_id"]},
            })

    notifications.sort(key=lambda n: n.get("created_at", ""), reverse=True)
    return {"notifications": notifications[:limit]}