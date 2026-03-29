from fastapi import Header, HTTPException, Request
from jose import JWTError, jwt
from supabase import create_client, Client

from app.config import settings


def get_current_user(authorization: str = Header(...)) -> str:
    """Extract and verify user_id from Supabase JWT."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    token = authorization.removeprefix("Bearer ")

    try:
        payload = jwt.decode(
            token,
            settings.supabase_service_role_key,
            algorithms=["HS256"],
            audience="authenticated",
        )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token: no sub claim")
        return user_id
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")


def get_service_client(request: Request) -> Client:
    """Return the service-role Supabase client (bypasses RLS)."""
    return request.app.state.supabase


def get_user_client(authorization: str = Header(...)) -> Client:
    """Create a Supabase client with the user's JWT so RLS applies."""
    token = authorization.removeprefix("Bearer ")
    client = create_client(settings.supabase_url, settings.supabase_anon_key)
    client.postgrest.auth(token)
    return client
