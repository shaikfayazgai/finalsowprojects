"""Enterprise service entrypoint."""

from __future__ import annotations

import logging

from shared.app_factory import create_service_app
from shared.init_schema import init_schema

from enterprise_app.db import init_enterprise_schema
from enterprise_app.routers import (
    approvals,
    billing,
    decomposition,
    manual_sow,
    portfolio,
    sows,
    users,
    wizards,
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
        wizards.router,
        sows.router,
        approvals.router,
        users.router,
        manual_sow.router,
        decomposition.router,
        decomposition.internal_router,
        portfolio.portfolio_router,
        portfolio.projects_router,
        billing.billing_router,
        billing.review_router,
    ],
    on_startup=_startup,
)
