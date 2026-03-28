from fastapi import Header, HTTPException, Request
from jose import JWTError, jwt

from app.config import settings

DEV_USER_ID = "00000000-0000-0000-0000-000000000000"


def get_current_user(authorization: str = Header(default="")) -> str:
    """Extract and verify user_id from Supabase JWT. Skips auth until login UI is built."""
    if settings.skip_auth:
        return DEV_USER_ID

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


def get_service_client(request: Request):
    """Return the service-role Supabase client (bypasses RLS)."""
    return request.app.state.supabase


def get_user_client(request: Request):
    """Return the service-role client for now (no user JWT yet). TODO: use user JWT once auth is built."""
    return request.app.state.supabase
