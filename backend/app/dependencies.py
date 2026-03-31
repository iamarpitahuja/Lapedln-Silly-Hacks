from fastapi import Header, HTTPException
from jose import jwt, JWTError

from app.config import settings

DEV_USER_ID = "00000000-0000-0000-0000-000000000000"
ALGORITHM = "HS256"


def get_current_user(authorization: str = Header(default="")) -> str:
    """Extract and verify user_id from JWT."""
    if settings.skip_auth:
        return DEV_USER_ID

    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = authorization.removeprefix("Bearer ")

    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
