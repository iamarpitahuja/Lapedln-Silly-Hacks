from datetime import datetime, timedelta, timezone
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import jwt, JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import User, Profile
from app.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    display_name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _create_access_token(user_id: str, email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    payload = {
        "sub": user_id,
        "email": email,
        "exp": expire,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=ALGORITHM)


def _decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


async def _get_current_user(
    token: str = Depends(lambda: None),  # placeholder – overridden below
):
    ...  # implemented via the /me endpoint directly


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/register", response_model=AuthResponse)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Check if email already taken
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail="Email already registered")

    user_id = str(uuid4())
    hashed_pw = pwd_context.hash(body.password)

    # Create User row
    user = User(id=user_id, email=body.email, hashed_password=hashed_pw)
    db.add(user)

    # Create matching Profile row
    profile = Profile(id=user_id, display_name=body.display_name)
    db.add(profile)

    await db.commit()

    token = _create_access_token(user_id, body.email)
    return AuthResponse(
        access_token=token,
        user={
            "id": user_id,
            "email": body.email,
            "display_name": body.display_name,
        },
    )


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if user is None or not pwd_context.verify(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Fetch display_name from profile
    prof_result = await db.execute(select(Profile).where(Profile.id == user.id))
    profile = prof_result.scalar_one_or_none()
    display_name = profile.display_name if profile else "Anonymous Larper"

    token = _create_access_token(str(user.id), user.email)
    return AuthResponse(
        access_token=token,
        user={
            "id": str(user.id),
            "email": user.email,
            "display_name": display_name,
        },
    )


@router.get("/me")
async def me(
    token: str = Depends(lambda request: request.headers.get("Authorization", "").replace("Bearer ", "")),
    db: AsyncSession = Depends(get_db),
):
    if not token:
        raise HTTPException(status_code=401, detail="Missing authorization header")

    payload = _decode_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    prof_result = await db.execute(select(Profile).where(Profile.id == user_id))
    profile = prof_result.scalar_one_or_none()

    return {
        "id": str(user.id),
        "email": user.email,
        "display_name": profile.display_name if profile else "Anonymous Larper",
    }
