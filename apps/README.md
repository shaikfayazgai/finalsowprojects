# Per-role app split (`apps/`)

Each end-user role gets its **own standalone backend**, running independently on
its own port, all connected to the **same shared Neon database** (so cross-role
data — a SOW created by enterprise reaching the mentor/reviewer — keeps working).

The **frontend stays a single Next.js app** (`frontend4/frontend`) that already
routes per role (`/mentor`, `/enterprise`, `/admin`, `/reviewer`,
`/contributor`). Each role's pages point their API proxies at that role's
backend. (Per the chosen plan: split backends now, keep one frontend.)

```
end user        frontend route        backend (this folder)        DB
super-admin  →  /admin            →   apps/super-admin/backend :8102  ┐
enterprise   →  /enterprise       →   apps/enterprise/backend  :8103  │ shared
mentor       →  /mentor           →   apps/mentor/backend      :8101  ├ Neon
reviewer     →  /reviewer         →   apps/super-admin/backend :8102  │  DB
freelancer   →  /contributor      →   apps/freelancer/backend  :8104  ┘
```

> Reviewer endpoints currently live inside the super-admin service
> (`superadmin_app/routers/reviewer.py`), so the reviewer portal uses the
> super-admin backend (:8102). Split out later if needed.

## Each backend is self-contained
- `<pkg>_app/` — the role's routers + schema (copied from `backend/services/*`)
- `shared/` — shared helpers (db, auth deps, app factory, mailer, …)
- `app.py` — uvicorn entrypoint exposing `app`
- `requirements.txt`, `.env` (DATABASE_URL → shared DB, distinct PORT)

No backend imports another role's package.

## Run one backend
```powershell
cd apps/mentor/backend
# loads .env, sets PYTHONPATH to this folder, runs on its .env PORT
python -m uvicorn app:app --host 127.0.0.1 --port 8101
```

## Ports
| Role        | Port |
|-------------|------|
| mentor      | 8101 |
| super-admin | 8102 |
| enterprise  | 8103 |
| freelancer  | 8104 |

The shared monolith gateway (`backend/local_gateway.py`, :9000) still works and
is used for auth/login (one shared login endpoint for all roles).
