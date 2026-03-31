import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from jose import jwt, JWTError

from app.config import settings
from app.database import init_db
from app.websocket import manager
from app.routers import (
    auth,
    connections,
    feed,
    games,
    jobs,
    larpmaxxer,
    messages,
    notifications,
    posts,
    profile,
    relarps,
    roleplay,
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing SQLite database...")
    await init_db()
    logger.info("Database ready.")
    yield


app = FastAPI(title="LARP Platform", version="0.2.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/api")
app.include_router(feed.router, prefix="/api")
app.include_router(posts.router, prefix="/api")
app.include_router(jobs.router, prefix="/api")
app.include_router(profile.router, prefix="/api")
app.include_router(connections.router, prefix="/api")
app.include_router(messages.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(relarps.router, prefix="/api")
app.include_router(games.router)
app.include_router(larpmaxxer.router, prefix="/api")
app.include_router(roleplay.router, prefix="/api")

# Static file serving for uploads
uploads_dir = Path(__file__).parent.parent / "uploads"
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")


@app.get("/health")
async def health():
    return {"status": "larping", "dev_mode": settings.dev_mode}


@app.websocket("/api/ws/messages")
async def websocket_messages(websocket: WebSocket, token: str = ""):
    """WebSocket endpoint for real-time messaging."""
    # Authenticate
    user_id = None
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        user_id = payload.get("sub")
    except JWTError:
        if settings.skip_auth:
            user_id = "00000000-0000-0000-0000-000000000000"
        else:
            await websocket.close(code=4001, reason="Invalid token")
            return

    if not user_id:
        await websocket.close(code=4001, reason="Invalid token")
        return

    await manager.connect(user_id, websocket)
    try:
        while True:
            # Keep connection alive, receive pings
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)
