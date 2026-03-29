from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client

from app.config import settings
from app.routers import feed, posts, jobs


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create service-role Supabase client (singleton)
    app.state.supabase = create_client(
        settings.supabase_url, settings.supabase_service_role_key
    )
    yield
    # Shutdown: nothing to clean up


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


@app.get("/health")
async def health():
    return {"status": "larping"}
