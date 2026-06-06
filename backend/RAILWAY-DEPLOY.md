# Deploying GTPROJECT Backend to Railway

The backend is **9 FastAPI microservices + 1 gateway** (10 Railway services total),
all from this one repo. The DB stays on **Neon** (no Railway Postgres needed).

---

## What was made Railway-ready (already committed)

| File | Change |
|---|---|
| `local_gateway.py` | Resolves each service via `SERVICE_URL_<NAME>` env var (Railway private hostname), falls back to `127.0.0.1:<port>` for local dev. |
| `Dockerfile.gateway` | New image for the gateway (fastapi + uvicorn + httpx only). Binds `$PORT`. |
| `services/*/Dockerfile` | All 9 now bind `--port ${PORT:-8000}` so they work on Railway **and** locally. |

Nothing about `run_local.ps1` local dev changed — it still works unchanged.

---

## One-time setup

1. **Railway → New Project → Deploy from GitHub repo** → `shaikfayazgai/gtproject`.
2. You'll add **10 services** to this ONE project. For each:
   - **Settings → Source → Root Directory** = `backend`
   - **Settings → Build → Dockerfile Path** = (per table below)
   - **Settings → Networking → Generate Domain** = ONLY for the gateway.

### Services to create

| Railway service name | Dockerfile Path | Public domain? |
|---|---|---|
| `auth` | `services/auth-service/Dockerfile` | no |
| `contributor` | `services/contributor-service/Dockerfile` | no |
| `enterprise` | `services/enterprise-service/Dockerfile` | no |
| `superadmin` | `services/superadmin-service/Dockerfile` | no |
| `mentor` | `services/mentor-service/Dockerfile` | no |
| `universities` | `services/universities-service/Dockerfile` | no |
| `women` | `services/women-service/Dockerfile` | no |
| `email` | `services/email-service/Dockerfile` | no |
| `file` | `services/file-service/Dockerfile` | no |
| `gateway` | `Dockerfile.gateway` | **YES** ← this is your backend URL |

> Name each service EXACTLY as above — the private hostname becomes
> `<name>.railway.internal`, which the gateway env vars below depend on.

---

## Environment variables

### Shared (set on ALL 10 services)
Use Railway **Project → Shared Variables** so you enter these once. Copy from your
local `backend/.env` (it is git-ignored, so values are NOT in the repo):

```
DATABASE_URL=postgresql://<neon-glimmora-connection-string>
JWT_SECRET=<your jwt secret>
SUPER_ADMIN_EMAIL=<superadmin email>
SUPER_ADMIN_PASSWORD=<superadmin password>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=sfayazmr@gmail.com
SMTP_PASSWORD=<gmail app password>
```
(Add any other keys your `.env` has — copy the whole file.)

### Gateway-only (set on the `gateway` service)
These point the gateway at the other 9 over Railway's private network:

```
SERVICE_URL_AUTH=http://auth.railway.internal:8000
SERVICE_URL_CONTRIBUTOR=http://contributor.railway.internal:8000
SERVICE_URL_ENTERPRISE=http://enterprise.railway.internal:8000
SERVICE_URL_SUPERADMIN=http://superadmin.railway.internal:8000
SERVICE_URL_MENTOR=http://mentor.railway.internal:8000
SERVICE_URL_UNIVERSITIES=http://universities.railway.internal:8000
SERVICE_URL_WOMEN=http://women.railway.internal:8000
SERVICE_URL_EMAIL=http://email.railway.internal:8000
SERVICE_URL_FILE=http://file.railway.internal:8000
```

> Port is `8000` because the service containers default to `${PORT:-8000}` and
> Railway's private network reaches the container's listening port directly.
> If Railway assigns a `$PORT` to a private service, set that service's
> `SERVICE_URL_*` port to match — or pin `PORT=8000` on the 9 services.

---

## Deploy order
1. Deploy the 9 services first (any order). Confirm each shows "Active".
2. Deploy the `gateway` last.
3. Hit `https://<gateway-domain>/healthz` → `{"ok": true, "gateway": "local"}`.
4. Smoke-test through the gateway, e.g. a public route like
   `POST https://<gateway-domain>/api/v1/auth/login`.

---

## Point the frontend at it
In the Next.js frontend (Vercel/Railway), set the backend base URL env var
(whatever `apiCall` reads — e.g. `NEXT_PUBLIC_API_BASE_URL` /
`BACKEND_GATEWAY_URL`) to `https://<gateway-domain>`.

---

## Notes / gotchas
- **Build context must be `backend/`** (Root Directory = `backend`) so each
  service Dockerfile's `COPY shared/` resolves. The gateway Dockerfile also
  expects this.
- **Neon free tier sleeps** — first request after idle is slow. Fine for demo.
- **file-service uploads**: Railway containers have ephemeral disk. If the file
  service writes to local disk, attach a Railway Volume or move to S3/Neon for
  persistence. (Fine for Phase-1 demo as-is.)
- **Cost**: 10 small services on Railway's usage-based plan. To cut cost for a
  demo you can instead run everything in one service (see "Single-service" below).

---

## Alternative: single-service (cheapest for demo)
If 10 services is overkill, create ONE Railway service from `Dockerfile.gateway`
re-pointed at a process manager that boots all 9 uvicorns + the gateway in one
container (like `run_local.ps1` does locally). Trade-off: no independent scaling,
one crash takes everything down. The 10-service layout above is the proper one.
