"""
Gateway for the role-based backends.

Listens on :9000 (local) / $PORT (cloud) and reverse-proxies each API path
prefix to the matching per-role backend:

    mentor 8101 · super-admin 8102 · enterprise 8103 · freelancer 8104 · reviewer 8105

Shared auth (/api/v1/auth/*) is served by every backend, so it is routed to the
super-admin backend by default (any would do). Cloud deploys can override each
upstream with SERVICE_URL_<ROLE> (e.g. SERVICE_URL_ENTERPRISE).

Run:  cd backends ; python -m uvicorn gateway:app --host 127.0.0.1 --port 9000
"""

from __future__ import annotations

import os

import httpx
from fastapi import FastAPI, Request
from fastapi.responses import Response

# role -> local port
ROLE_PORTS = {
    "mentor": 8101,
    "super-admin": 8102,
    "enterprise": 8103,
    "freelancer": 8104,
    "reviewer": 8105,
}


def _base_url(role: str) -> str:
    """Cloud: SERVICE_URL_<ROLE> hostname. Local: 127.0.0.1:<port>."""
    env = os.getenv(f"SERVICE_URL_{role.upper().replace('-', '_')}")
    if env:
        return env.rstrip("/")
    return f"http://127.0.0.1:{ROLE_PORTS[role]}"


# Path-prefix -> role. Longest prefix wins (sorted below), so more specific
# prefixes (/api/superadmin) beat generic ones (/api).
ROUTES: list[tuple[str, str]] = [
    # shared auth — served by all; send to super-admin
    ("/api/v1/auth", "super-admin"),
    # OAuth contributor provisioning (Google/Microsoft SSO sign-up) is implemented
    # ONLY in the freelancer backend's auth_app, so this longer prefix must win
    # over the generic /api/v1/auth → super-admin above. Without it, SSO sign-up's
    # /api/v1/auth/oauth/provision 404s on super-admin → the NextAuth session ends
    # up with no backend access token → contributor profile save returns 401.
    ("/api/v1/auth/oauth", "freelancer"),
    # super-admin / platform
    ("/api/superadmin", "super-admin"),
    ("/api/v1/superadmin", "super-admin"),
    ("/api/admin", "super-admin"),
    ("/api/v1/admin", "super-admin"),
    ("/api/v1/cases", "super-admin"),
    ("/api/v1/prefs", "super-admin"),
    ("/api/ai", "super-admin"),
    ("/api/audit", "super-admin"),
    ("/api/email", "super-admin"),
    ("/api/file-scan", "super-admin"),
    ("/api/breadcrumb", "super-admin"),
    ("/api/v1/matching", "super-admin"),
    # platform settings + public config (commission %, contributor pricing, SMTP)
    ("/api/v1/settings", "super-admin"),
    ("/api/v1/config", "super-admin"),
    # reviewer (its endpoints live under /api/v1/reviewer)
    ("/api/v1/reviewer", "reviewer"),
    # mentor
    ("/api/mentor", "mentor"),
    ("/api/v1/mentor", "mentor"),
    # user login-session management (lives in mentor's auth_app)
    ("/api/v1/sessions", "mentor"),
    ("/api/sessions", "mentor"),
    # contributor / freelancer
    ("/api/contributor", "freelancer"),
    ("/api/public/credentials", "freelancer"),
    ("/api/v1/submissions", "freelancer"),
    ("/api/v1/payouts", "freelancer"),
    # enterprise-side payout views live in the enterprise backend; these longer
    # prefixes win over /api/v1/payouts → freelancer above.
    ("/api/v1/payouts/tenant", "enterprise"),
    ("/api/v1/payouts/release-batch", "enterprise"),
    ("/api/v1/notifications", "freelancer"),
    # enterprise-team + complaints are hosted in the SUPER-ADMIN backend, not the
    # enterprise one — these longer prefixes win over /api/v1/enterprise below.
    ("/api/v1/enterprise/team", "super-admin"),
    ("/api/v1/enterprise/complaints", "super-admin"),
    # enterprise
    ("/api/v1/razorpay", "enterprise"),
    ("/api/v1/sows", "enterprise"),
    ("/api/v1/sow", "enterprise"),
    ("/api/v1/approvals", "enterprise"),
    ("/api/v1/enterprise", "enterprise"),
    ("/api/v1/billing", "enterprise"),
    ("/api/v1/wizards", "enterprise"),
    ("/api/v1/portfolio", "enterprise"),
    ("/api/v1/projects", "enterprise"),
    ("/api/v1/review", "enterprise"),
    ("/api/v1/internal", "enterprise"),
    ("/api/enterprise", "enterprise"),
]
ROUTES.sort(key=lambda r: len(r[0]), reverse=True)

app = FastAPI(title="gtproject-backends-gateway")
# No keep-alive pool: the upstreams are localhost (handshake cost ~negligible) and
# pooled sockets go dead whenever a backend restarts, which caused intermittent
# 502/connection-reset until now. A fresh connection per request trades a hair of
# throughput for not breaking the UI every time a role backend is bounced.
_client = httpx.AsyncClient(
    timeout=120.0,
    limits=httpx.Limits(max_keepalive_connections=0, max_connections=100),
)


def _target(path: str) -> str | None:
    for prefix, role in ROUTES:
        if path == prefix or path.startswith(prefix + "/") or path.startswith(prefix):
            return role
    return None


@app.get("/")
async def root():
    return {"ok": True, "service": "gtproject-backends-gateway", "roles": list(ROLE_PORTS)}


@app.get("/healthz")
async def healthz():
    return {"ok": True, "gateway": "backends"}


@app.api_route("/{full_path:path}",
               methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
async def proxy(full_path: str, request: Request):
    path = "/" + full_path
    role = _target(path)
    if not role:
        return Response(content=b'{"detail":"No route"}', status_code=404,
                        media_type="application/json")
    url = f"{_base_url(role)}{path}"
    if request.url.query:
        url += "?" + request.url.query
    body = await request.body()
    headers = {k: v for k, v in request.headers.items()
               if k.lower() not in ("host", "content-length")}
    # Retry once on connection-level errors: after a backend restart the pooled
    # keep-alive sockets are dead, so the first reuse fails before the request is
    # sent (safe to retry — and these upstream writes are idempotent upserts).
    _conn_errors = (httpx.ConnectError, httpx.ConnectTimeout, httpx.ReadError,
                    httpx.WriteError, httpx.RemoteProtocolError, httpx.PoolTimeout)
    resp = None
    last_exc = None
    # Several pooled sockets can be dead at once right after a backend restart, so
    # retry a few times — each attempt discards a stale socket and grabs a fresh one.
    for _attempt in range(5):
        try:
            resp = await _client.request(request.method, url, content=body, headers=headers)
            break
        except _conn_errors as exc:
            last_exc = exc  # stale socket — drop it and retry with a fresh connection
            continue
        except Exception as exc:  # noqa: BLE001
            return Response(content=f'{{"detail":"upstream {role} error: {exc}"}}'.encode(),
                            status_code=502, media_type="application/json")
    if resp is None:
        return Response(content=f'{{"detail":"upstream {role} unreachable: {last_exc}"}}'.encode(),
                        status_code=502, media_type="application/json")
    excluded = {"content-encoding", "transfer-encoding", "connection", "content-length"}
    out_headers = {k: v for k, v in resp.headers.items() if k.lower() not in excluded}
    return Response(content=resp.content, status_code=resp.status_code,
                    headers=out_headers, media_type=resp.headers.get("content-type"))
