"""
Standalone REVIEWER backend (per-user split).

The reviewer endpoints originated inside the super-admin service, so this app
bundles `superadmin_app` (for the reviewer router + repo + schema) but mounts
ONLY the reviewer router — it exposes no admin/users/audit endpoints. Fully
independent: depends only on its bundled code + the shared Neon DB.

Run:  uvicorn app:app --host 127.0.0.1 --port 8105
"""

from __future__ import annotations

import asyncio
import logging

import psycopg2

from shared.app_factory import create_service_app
from shared.config import settings
from shared.init_schema import init_schema

from superadmin_app.routers import reviewer
from superadmin_app.schema import init_superadmin_schema
from auth_app.routers import auth as auth_router

logger = logging.getLogger(__name__)

# Neon (serverless) suspends its compute after ~5 min idle; the first query after
# that pays a multi-second cold start — which the user sees as a slow login. A
# lightweight keepalive on a DEDICATED connection (isolated from request traffic)
# runs `SELECT 1` every few minutes so the compute stays warm and login stays fast.
_KEEPALIVE_INTERVAL_SECONDS = 240


async def _neon_keepalive() -> None:
    conn = None
    while True:
        try:
            await asyncio.sleep(_KEEPALIVE_INTERVAL_SECONDS)
            if conn is None or conn.closed:
                conn = psycopg2.connect(settings.postgres_dsn, connect_timeout=10)
                conn.autocommit = True
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
                cur.fetchone()
        except asyncio.CancelledError:
            break
        except Exception as exc:  # noqa: BLE001
            logger.warning("Neon keepalive ping failed: %s", exc)
            try:
                if conn is not None:
                    conn.close()
            except Exception:  # noqa: BLE001
                pass
            conn = None


async def _startup() -> None:
    try:
        init_schema()
        init_superadmin_schema()  # reviewer_assignments + reviewer_recommendations
    except Exception as exc:  # noqa: BLE001
        logger.warning("reviewer backend startup tasks failed: %s", exc)
    # Spawn the keepalive on the running loop (best-effort; never blocks startup).
    try:
        asyncio.create_task(_neon_keepalive())
    except Exception as exc:  # noqa: BLE001
        logger.warning("could not start Neon keepalive: %s", exc)


app = create_service_app(
    "reviewer-service", routers=[auth_router.router, reviewer.router], on_startup=_startup
)
