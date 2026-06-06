"""Lightweight API gateway — replaces Kong for no-Docker dev AND cloud deploy.

Listens on :9000 (local) / $PORT (cloud) and reverse-proxies each path prefix to
the matching FastAPI service. Mirrors the routing in gateway/kong/kong.yml.

Target resolution per service, in order:
  1. SERVICE_URL_<NAME> env var (full base URL) — set this on Railway/Render to the
     service's private hostname, e.g. SERVICE_URL_AUTH=http://auth.railway.internal:8000
  2. fallback http://127.0.0.1:<local port>  — for `run_local.ps1` dev with no env.
"""
from __future__ import annotations
import os
import httpx
from fastapi import FastAPI, Request
from fastapi.responses import Response

# service name → local port (must match run_local.ps1)
SERVICE_PORTS = {
    "auth": 8011, "contributor": 8012, "enterprise": 8013, "superadmin": 8014,
    "mentor": 8015, "universities": 8016, "women": 8017, "email": 8018, "file": 8019,
}


def _base_url(svc: str) -> str:
    """Cloud: SERVICE_URL_<SVC> private hostname. Local: 127.0.0.1:<port>."""
    env = os.getenv(f"SERVICE_URL_{svc.upper()}")
    if env:
        return env.rstrip("/")
    return f"http://127.0.0.1:{SERVICE_PORTS[svc]}"

# Longest-prefix-first so e.g. /api/superadmin wins over /api, and
# /api/v1/users/reviewers (superadmin) wins over /api/v1/users (superadmin too).
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
# sort by length desc so the most specific prefix matches first
ROUTES.sort(key=lambda r: len(r[0]), reverse=True)

app = FastAPI(title="local-gateway")
_client = httpx.AsyncClient(timeout=120.0)


def _target(path: str) -> str | None:
    for prefix, svc in ROUTES:
        if path == prefix or path.startswith(prefix + "/") or path.startswith(prefix):
            return svc
    return None


@app.get("/healthz")
async def healthz():
    return {"ok": True, "gateway": "local"}


@app.api_route("/{full_path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
async def proxy(full_path: str, request: Request):
    path = "/" + full_path
    svc = _target(path)
    if not svc:
        return Response(content=b'{"detail":"No route"}', status_code=404, media_type="application/json")
    url = f"{_base_url(svc)}{path}"
    if request.url.query:
        url += "?" + request.url.query
    body = await request.body()
    headers = {k: v for k, v in request.headers.items() if k.lower() not in ("host", "content-length")}
    try:
        resp = await _client.request(request.method, url, content=body, headers=headers)
    except Exception as exc:  # noqa: BLE001
        return Response(content=f'{{"detail":"upstream {svc} error: {exc}"}}'.encode(),
                        status_code=502, media_type="application/json")
    excluded = {"content-encoding", "transfer-encoding", "connection", "content-length"}
    out_headers = {k: v for k, v in resp.headers.items() if k.lower() not in excluded}
    return Response(content=resp.content, status_code=resp.status_code, headers=out_headers,
                    media_type=resp.headers.get("content-type"))
