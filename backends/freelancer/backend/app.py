"""Contributor / freelancer service entrypoint.

Owns the contributor portal domain (tasks, submissions, earnings, payouts,
messages, learning, support, credentials, profile/digital-twin) plus OAuth
sign-in for contributors (Google + Microsoft).
"""

from __future__ import annotations

import logging

from shared.app_factory import create_service_app
from shared.init_schema import init_schema

from contributor_app.db import init_contributor_schema
from contributor_app.routers import contributor, oauth
from auth_app.routers import auth as auth_router

logger = logging.getLogger(__name__)


def _startup() -> None:
    try:
        init_schema()
        init_contributor_schema()
    except Exception as exc:  # noqa: BLE001
        logger.warning("contributor-service startup tasks failed: %s", exc)


app = create_service_app(
    "contributor-service",
    routers=[auth_router.router, oauth.router, contributor.router, contributor.public_router],
    on_startup=_startup,
)
