"""Universities service entrypoint."""

from __future__ import annotations

import logging

from shared.app_factory import create_service_app
from shared.init_schema import init_schema

from universities_app.routers import universities

logger = logging.getLogger(__name__)


def _startup() -> None:
    try:
        init_schema()
    except Exception as exc:  # noqa: BLE001
        logger.warning("universities-service startup tasks failed: %s", exc)


app = create_service_app(
    "universities-service",
    routers=[universities.router],
    on_startup=_startup,
)
