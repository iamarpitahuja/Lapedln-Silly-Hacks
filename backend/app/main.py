import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import feed, posts, jobs, profile, connections, messages, notifications, relarps, games, larpmaxxer

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    from supabase import create_client
    logger.info("Connecting to Supabase at %s", settings.supabase_url)
    app.state.supabase = create_client(
        settings.supabase_url, settings.supabase_service_role_key
    )
    yield


app = FastAPI(title="LARP Platform", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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


@app.get("/health")
async def health():
    return {"status": "larping", "dev_mode": settings.dev_mode}
