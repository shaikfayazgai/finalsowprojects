"""Women-team service entrypoint."""

from __future__ import annotations

import logging

from shared.app_factory import create_service_app
from shared.init_schema import init_schema

from women_app.routers import women

logger = logging.getLogger(__name__)


def _startup() -> None:
    try:
        init_schema()
    except Exception as exc:  # noqa: BLE001
        logger.warning("women-service startup tasks failed: %s", exc)


app = create_service_app("women-service", routers=[women.router], on_startup=_startup)
