"""Enterprise service entrypoint."""

from __future__ import annotations

import logging
import os
from pathlib import Path


def _load_env_file() -> None:
    """Load backend/.env into the process environment BEFORE shared.config is
    imported (its `settings` singleton reads os.environ at import time).

    Dependency-free (no python-dotenv needed) and idempotent — existing env
    vars win, so container/CI overrides are respected. Without this the sync
    psycopg2 path falls back to localhost:5432 and every DB call 500s.
    """
    env_path = Path(__file__).resolve().parent / ".env"
    if not env_path.exists():
        return
    for raw in env_path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


_load_env_file()

from shared.app_factory import create_service_app
from shared.init_schema import init_schema

from enterprise_app.db import init_enterprise_schema
from enterprise_app.routers import (
    approvals,
    billing,
    compliance_billing,
    decomp_plans,
    decomposition,
    manual_sow,
    me,
    portfolio,
    review_queue,
    sows,
    team,
    users,
    wizards,
    workforce,
)
from auth_app.routers import auth as auth_router

logger = logging.getLogger(__name__)


def _startup() -> None:
    try:
        init_schema()
        init_enterprise_schema()
    except Exception as exc:  # noqa: BLE001
        logger.warning("enterprise-service startup tasks failed: %s", exc)


app = create_service_app(
    "enterprise-service",
    routers=[
        auth_router.router,
        me.router,
        wizards.router,
        sows.router,
        sows.sow_alias_router,  # POST /api/v1/sow/{id}/approve (singular alias for FE proxy)
        approvals.router,
        users.router,
        manual_sow.router,
        # decomp_plans (normalised tables, with approve/activate/archive/copy) must
        # register BEFORE the legacy decomposition router so its /plans CRUD wins on
        # the shared /api/v1/enterprise/decomposition prefix — otherwise plan create
        # lands in the old JSONB table and approve/activate 404 ("Plan not found").
        decomp_plans.router,
        decomposition.router,
        decomposition.internal_router,
        portfolio.portfolio_router,
        portfolio.projects_router,
        billing.billing_router,
        billing.review_router,
        review_queue.router,
        compliance_billing.compliance_router,
        compliance_billing.rate_cards_router,
        compliance_billing.billing_export_router,
        compliance_billing.razorpay_router,
        workforce.router,
        team.router,
    ],
    on_startup=_startup,
)
