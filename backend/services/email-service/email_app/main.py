"""Email service entrypoint."""

from __future__ import annotations

import logging

from shared.app_factory import create_service_app
from shared.init_schema import init_schema

from email_app import repo
from email_app.routers import email

logger = logging.getLogger(__name__)


def _startup() -> None:
    try:
        init_schema()
        repo.init_email_schema()
    except Exception as exc:  # noqa: BLE001
        logger.warning("email-service startup tasks failed: %s", exc)


app = create_service_app("email-service", routers=[email.router], on_startup=_startup)
