"""File service entrypoint."""

from __future__ import annotations

import logging

from shared.app_factory import create_service_app
from shared.init_schema import init_schema

from file_app.db_init import init_file_schema
from file_app.routers import files

logger = logging.getLogger(__name__)


def _startup() -> None:
    try:
        init_schema()
        init_file_schema()
    except Exception as exc:  # noqa: BLE001
        logger.warning("file-service startup tasks failed: %s", exc)


app = create_service_app("file-service", routers=[files.router], on_startup=_startup)
