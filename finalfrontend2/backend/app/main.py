"""
Glimmora FastAPI backend — Admin Dashboard APIs
Run from backend/ directory:
    uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database.postgres import create_pg_pool, close_pg_pool
from app.database.mongodb import create_mongo_client, close_mongo_client
from app.routers.admin import dashboard as admin_dashboard_router


_CREATE_SYSTEM_HEALTH_TABLE = """
CREATE TABLE IF NOT EXISTS system_health (
    service_id   TEXT PRIMARY KEY,
    service_name TEXT        NOT NULL,
    status       TEXT        NOT NULL DEFAULT 'healthy',
    service_type TEXT        NOT NULL DEFAULT 'service',
    title        TEXT,
    entity       TEXT,
    href         TEXT,
    updated_at   TIMESTAMP   NOT NULL DEFAULT NOW(),
    created_at   TIMESTAMP   NOT NULL DEFAULT NOW()
);
"""


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ──────────────────────────────────────────────────────────────
    app.state.pg_pool = await create_pg_pool(settings.DATABASE_URL)

    # Ensure system_health table exists (operational data → PostgreSQL)
    async with app.state.pg_pool.acquire() as conn:
        await conn.execute(_CREATE_SYSTEM_HEALTH_TABLE)

    # MongoDB is used ONLY for vector / AI data (platform_signals)
    app.state.mongo_client, app.state.mongo_db = await create_mongo_client(
        url=settings.MONGODB_URL,
        db_name=settings.DATABASE_NAME,
        server_selection_timeout_ms=settings.MONGODB_SERVER_SELECTION_TIMEOUT_MS,
        connect_timeout_ms=settings.MONGODB_CONNECT_TIMEOUT_MS,
    )
    app.state.app_env = settings.APP_ENV
    yield
    # ── Shutdown ─────────────────────────────────────────────────────────────
    await close_pg_pool(app.state.pg_pool)
    close_mongo_client(app.state.mongo_client)


app = FastAPI(
    title="Glimmora Admin API",
    description=(
        "FastAPI backend for the Glimmora platform admin dashboard. "
        "PostgreSQL (Neon) stores all operational data including system health. "
        "MongoDB stores only AI/vector data (platform_signals)."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.BACKEND_CORS_ORIGINS.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(
    admin_dashboard_router.router,
    prefix="/api/v1/admin/dashboard",
)


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/api/v1/health", tags=["Health"])
async def health():
    return {
        "ok": True,
        "service": "glimmora-fastapi",
        "version": "1.0.0",
        "status": "running",
    }
