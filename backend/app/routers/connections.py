from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, and_, or_, delete, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Connection, Profile
from app.services.rating_engine import adjust_rating

router = APIRouter(tags=["connections"])


class ConnectionRequest(BaseModel):
    addressee_id: str


@router.post("/connections/request", status_code=201)
async def send_connection_request(
    body: ConnectionRequest,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Send a connection request to another user."""
    if body.addressee_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot connect with yourself")

    existing = await db.execute(
        select(Connection).where(
            or_(
                and_(
                    Connection.requester_id == user_id,
                    Connection.addressee_id == body.addressee_id,
                ),
                and_(
                    Connection.requester_id == body.addressee_id,
                    Connection.addressee_id == user_id,
                ),
            )
        )
    )
    if existing.scalars().first():
        raise HTTPException(status_code=409, detail="Connection already exists")

    conn = Connection(requester_id=user_id, addressee_id=body.addressee_id)
    db.add(conn)
    rating_change = await adjust_rating(db, user_id, "connection_requested")
    await db.commit()
    await db.refresh(conn)
    result = conn.to_dict()
    if rating_change:
        result["rating_change"] = rating_change
    return result


@router.patch("/connections/{connection_id}/accept")
async def accept_connection(
    connection_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Accept a pending connection request (addressee only)."""
    result = await db.execute(
        select(Connection).where(
            Connection.id == connection_id,
            Connection.addressee_id == user_id,
            Connection.status == "pending",
        )
    )
    conn = result.scalars().first()
    if not conn:
        raise HTTPException(status_code=404, detail="Connection request not found")

    conn.status = "accepted"
    # Both parties get rewarded
    acceptor_change = await adjust_rating(db, user_id, "connection_accepted_acceptor")
    await adjust_rating(db, conn.requester_id, "connection_accepted_requester")
    await db.commit()
    await db.refresh(conn)
    result = conn.to_dict()
    if acceptor_change:
        result["rating_change"] = acceptor_change
    return result


@router.patch("/connections/{connection_id}/decline")
async def decline_connection(
    connection_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Decline a pending connection request (addressee only)."""
    result = await db.execute(
        select(Connection).where(
            Connection.id == connection_id,
            Connection.addressee_id == user_id,
            Connection.status == "pending",
        )
    )
    conn = result.scalars().first()
    if not conn:
        raise HTTPException(status_code=404, detail="Connection request not found")

    conn.status = "declined"
    # Penalty to requester
    await adjust_rating(db, conn.requester_id, "connection_declined")
    await db.commit()
    await db.refresh(conn)
    return conn.to_dict()


@router.delete("/connections/{connection_id}", status_code=204)
async def remove_connection(
    connection_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Withdraw a sent request or remove an accepted connection (either party)."""
    result = await db.execute(
        select(Connection).where(
            Connection.id == connection_id,
            or_(
                Connection.requester_id == user_id,
                Connection.addressee_id == user_id,
            ),
        )
    )
    conn = result.scalars().first()
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")

    await db.execute(delete(Connection).where(Connection.id == connection_id))
    await db.commit()
    return None


@router.get("/connections")
async def get_my_connections(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all accepted connections with profile data."""
    result = await db.execute(
        select(Connection).where(
            or_(
                Connection.requester_id == user_id,
                Connection.addressee_id == user_id,
            ),
            Connection.status == "accepted",
        )
    )
    conn_rows = result.scalars().all()

    connections = []
    for conn in conn_rows:
        if conn.requester_id == user_id:
            other_profile = await db.get(Profile, conn.addressee_id)
        else:
            other_profile = await db.get(Profile, conn.requester_id)
        connections.append({
            "id": conn.id,
            "status": conn.status,
            "created_at": conn.created_at.isoformat() if conn.created_at else None,
            "profile": {
                "id": other_profile.id,
                "display_name": other_profile.display_name,
                "job": other_profile.job,
                "avatar_url": other_profile.avatar_url,
                "larp_rating": other_profile.larp_rating,
            } if other_profile else None,
        })
    return {"connections": connections}


@router.get("/connections/pending")
async def get_pending_connections(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List incoming pending connection requests with requester profile data."""
    result = await db.execute(
        select(Connection, Profile)
        .join(Profile, Connection.requester_id == Profile.id)
        .where(
            Connection.addressee_id == user_id,
            Connection.status == "pending",
        )
        .order_by(Connection.created_at.desc())
    )
    rows = result.all()

    pending = []
    for conn, profile in rows:
        d = conn.to_dict()
        d["requester"] = {
            "id": profile.id,
            "display_name": profile.display_name,
            "job": profile.job,
            "avatar_url": profile.avatar_url,
            "larp_rating": profile.larp_rating,
        }
        pending.append(d)
    return {"pending": pending}


@router.get("/connections/outgoing")
async def get_outgoing_connections(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List pending connection requests the current user has sent."""
    result = await db.execute(
        select(Connection, Profile)
        .join(Profile, Connection.addressee_id == Profile.id)
        .where(
            Connection.requester_id == user_id,
            Connection.status == "pending",
        )
        .order_by(Connection.created_at.desc())
    )
    rows = result.all()

    outgoing = []
    for conn, profile in rows:
        d = conn.to_dict()
        d["addressee"] = {
            "id": profile.id,
            "display_name": profile.display_name,
            "job": profile.job,
            "avatar_url": profile.avatar_url,
            "larp_rating": profile.larp_rating,
        }
        outgoing.append(d)
    return {"outgoing": outgoing}


@router.get("/connections/suggestions")
async def get_connection_suggestions(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """All users not yet connected with (any status), excluding self."""
    existing = await db.execute(
        select(Connection).where(
            or_(
                Connection.requester_id == user_id,
                Connection.addressee_id == user_id,
            )
        )
    )
    excluded = {user_id}
    for conn in existing.scalars().all():
        excluded.add(conn.requester_id)
        excluded.add(conn.addressee_id)

    all_profiles = await db.execute(
        select(Profile).where(Profile.id.notin_(excluded))
    )
    suggestions = [
        {
            "id": p.id,
            "display_name": p.display_name,
            "job": p.job,
            "avatar_url": p.avatar_url,
            "larp_rating": p.larp_rating,
        }
        for p in all_profiles.scalars().all()
    ]
    return {"suggestions": suggestions}
