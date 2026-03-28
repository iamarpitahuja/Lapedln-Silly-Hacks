from fastapi import Header, HTTPException, Request

from app.config import settings

DEV_USER_ID = "00000000-0000-0000-0000-000000000000"


def get_current_user(authorization: str = Header(default=""), request: Request = None) -> str:
    """Extract and verify user_id from Supabase JWT.

    Uses the Supabase service client to verify the token via Supabase Auth API,
    so no JWT secret is needed locally.
    """
    if settings.skip_auth:
        return DEV_USER_ID

    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = authorization.removeprefix("Bearer ")

    try:
        # Use Supabase Auth API to verify the token and get the user
        supabase = request.app.state.supabase
        user_response = supabase.auth.get_user(token)
        user = user_response.user
        if not user or not user.id:
            raise HTTPException(status_code=401, detail="Invalid token: no user found")
        return str(user.id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")


def get_service_client(request: Request):
    """Return the service-role Supabase client (bypasses RLS)."""
    return request.app.state.supabase


def get_user_client(request: Request):
    """Return the service-role client for now. TODO: use user JWT once Social Blindness is needed."""
    return request.app.state.supabase
