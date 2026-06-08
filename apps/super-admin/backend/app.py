"""Superadmin service entrypoint — Glimmora admin backend."""

from __future__ import annotations

import logging

from shared.app_factory import create_service_app
from shared.init_schema import init_schema

from superadmin_app.routers import audit, bulk, kyc, reviewer, settings, users
from superadmin_app.schema import init_superadmin_schema
from auth_app.routers import auth as auth_router

logger = logging.getLogger(__name__)


def _startup() -> None:
    try:
        init_schema()
        init_superadmin_schema()
    except Exception as exc:  # noqa: BLE001
        logger.warning("superadmin-service startup tasks failed: %s", exc)


app = create_service_app(
    "superadmin-service",
    routers=[auth_router.router, users.router, settings.router, reviewer.router, bulk.router, audit.router, kyc.router],
    on_startup=_startup,
)
