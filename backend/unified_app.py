"""Single-process unified backend — all 9 services in ONE uvicorn worker.

Render's Free instance has 512 MB RAM. Running 9 separate uvicorn processes +
a gateway (10 Python interpreters) OOMs at ~600-800 MB. This module loads all 9
FastAPI service apps into ONE process and dispatches each request to the correct
sub-app *in-process* (ASGI call, no HTTP hop) using the same longest-prefix
routing table the gateway used. Memory drops to ~150-200 MB.

Used by Dockerfile.allinone via:  uvicorn unified_app:app
"""
from __future__ import annotations

import importlib
import logging
from contextlib import AsyncExitStack

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.requests import Request
from starlette.responses import Response
from starlette.types import Scope

logger = logging.getLogger("unified")

# service name -> "<package>.main" module that exposes `app`.
SERVICE_MODULES = {
    "auth": "auth_app.main",
    "contributor": "contributor_app.main",
    "enterprise": "enterprise_app.main",
    "superadmin": "superadmin_app.main",
    "mentor": "mentor_app.main",
    "universities": "universities_app.main",
    "women": "women_app.main",
    "email": "email_app.main",
    "file": "file_app.main",
}

# Longest-prefix-first routing (mirrors local_gateway.ROUTES / kong.yml).
ROUTES: list[tuple[str, str]] = [
    ("/api/v1/auth/oauth", "contributor"),
    ("/api/v1/auth/contributor", "contributor"),
    ("/api/v1/auth", "auth"),
    ("/api/contributor", "contributor"),
    ("/api/public/credentials", "contributor"),
    ("/api/superadmin", "superadmin"),
    ("/api/admin", "superadmin"),
    ("/api/v1/admin", "superadmin"),
    ("/api/v1/users/reviewers", "superadmin"),
    ("/api/v1/reviewer", "superadmin"),
    ("/api/v1/settings/contributor-pricing", "superadmin"),
    ("/api/v1/config/contributor-pricing", "superadmin"),
    ("/api/v1/users", "superadmin"),
    ("/api/v1/sow", "enterprise"),
    ("/api/v1/sows", "enterprise"),
    ("/api/v1/wizards", "enterprise"),
    ("/api/v1/approvals", "enterprise"),
    ("/api/v1/enterprise", "enterprise"),
    ("/api/v1/portfolio", "enterprise"),
    ("/api/v1/projects", "enterprise"),
    ("/api/v1/billing", "enterprise"),
    ("/api/v1/review", "enterprise"),
    ("/api/v1/internal", "enterprise"),
    ("/api/enterprise", "enterprise"),
    ("/api/universities", "universities"),
    ("/api/women", "women"),
    ("/api/mentor", "mentor"),
    ("/api/email", "email"),
    ("/api/files", "file"),
    ("/api/file", "file"),
]
ROUTES.sort(key=lambda r: len(r[0]), reverse=True)


def _target(path: str) -> str | None:
    for prefix, svc in ROUTES:
        if path == prefix or path.startswith(prefix + "/") or path.startswith(prefix):
            return svc
    return None


# Import each service app once. Their @asynccontextmanager lifespans (schema
# init, seeding) run when we drive them through the lifespan protocol below.
_apps: dict[str, FastAPI] = {}
for _svc, _mod in SERVICE_MODULES.items():
    logger.info("loading %s from %s", _svc, _mod)
    _apps[_svc] = importlib.import_module(_mod).app


from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Enter each sub-app's lifespan (runs schema init / seed) SEQUENTIALLY so 9
    # concurrent CREATE TABLE/ALTER statements don't deadlock on the shared Neon
    # DB. Keep them all open for the process lifetime via a single exit stack.
    stack = AsyncExitStack()
    for svc, sub in _apps.items():
        try:
            await stack.enter_async_context(sub.router.lifespan_context(sub))
            logger.info("[%s] sub-app startup complete", svc)
        except Exception as exc:  # noqa: BLE001
            logger.warning("[%s] sub-app startup failed: %s", svc, exc)
    try:
        yield
    finally:
        await stack.aclose()


app = FastAPI(title="gtproject-unified", lifespan=lifespan)

# CORS on the front app (the sub-apps have their own too, but the front handles
# the request first for non-/api paths).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"ok": True, "service": "gtproject-unified"}


@app.get("/healthz")
async def healthz():
    return {"ok": True, "gateway": "unified"}


@app.middleware("http")
async def _dispatch(request: Request, call_next):
    """Route /api/* into the matching sub-app in-process; everything else (/, /healthz)
    falls through to this app's own routes."""
    path = request.url.path
    if path in ("/", "/healthz", "/metrics"):
        return await call_next(request)
    svc = _target(path)
    if svc is None:
        return await call_next(request)  # let FastAPI 404 it
    sub = _apps[svc]
    # Hand the raw ASGI scope to the sub-app — no HTTP round trip, same process.
    return await _ASGIResponder(sub)(request)


class _ASGIResponder:
    """Invoke a sub-ASGI-app with the current request's scope and capture its
    response so it can be returned through Starlette's middleware chain."""

    def __init__(self, sub_app):
        self._sub = sub_app

    async def __call__(self, request: Request) -> Response:
        scope: Scope = dict(request.scope)
        body = await request.body()
        sent = {"started": False}
        chunks: list[bytes] = []
        status_code = {"code": 500}
        headers: list[tuple[bytes, bytes]] = []

        async def receive() -> dict:
            return {"type": "http.request", "body": body, "more_body": False}

        async def send(message: dict) -> None:
            if message["type"] == "http.response.start":
                status_code["code"] = message["status"]
                headers.extend(message.get("headers", []))
                sent["started"] = True
            elif message["type"] == "http.response.body":
                chunks.append(message.get("body", b""))

        await self._sub(scope, receive, send)

        raw = b"".join(chunks)
        hdrs = {k.decode("latin-1"): v.decode("latin-1") for k, v in headers}
        media = hdrs.pop("content-type", "application/json")
        # content-length is recomputed by Starlette from the body.
        hdrs.pop("content-length", None)
        return Response(content=raw, status_code=status_code["code"], headers=hdrs, media_type=media)
