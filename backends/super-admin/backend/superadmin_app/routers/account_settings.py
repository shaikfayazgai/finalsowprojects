"""Per-account settings — a generic JSONB blob keyed by account_id, split into
named sections (e.g. mentor_notifications, mentor_availability, admin_console,
ent_security). Any role's settings page persists here so saves survive reload +
server restart. Account-scoped via the shared JWT, so it works for every role.
"""
from __future__ import annotations

import logging
from typing import Annotated, Any

from fastapi import APIRouter, Body, Depends, HTTPException
from psycopg2.extras import RealDictCursor, Json

from shared.db import get_pg_connection
from shared.deps import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(tags=["account-settings"])


def init_account_settings_schema() -> None:
    conn = get_pg_connection()
    with conn.cursor() as cur:
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS account_settings (
                account_id BIGINT PRIMARY KEY,
                data       JSONB NOT NULL DEFAULT '{}',
                updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
            )
            """
        )
    conn.commit()
    logger.info("account_settings table ready.")


def _acct(user: dict) -> int:
    try:
        return int(user.get("id"))
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="Invalid account")


def _load(cur: Any, acct: int) -> dict:
    cur.execute("SELECT data FROM account_settings WHERE account_id = %s", (acct,))
    r = cur.fetchone()
    return r["data"] if r and isinstance(r.get("data"), dict) else {}


@router.get("/api/v1/prefs")
async def get_all_prefs(user: Annotated[dict, Depends(get_current_user)]):
    """The whole settings blob for the caller."""
    acct = _acct(user)
    conn = get_pg_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        return {"data": _load(cur, acct)}


@router.get("/api/v1/prefs/{section}")
async def get_pref_section(section: str, user: Annotated[dict, Depends(get_current_user)]):
    """One section (e.g. mentor_availability) — {} if never saved."""
    acct = _acct(user)
    conn = get_pg_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        data = _load(cur, acct)
    return data.get(section) or {}


@router.patch("/api/v1/prefs/{section}")
async def patch_pref_section(
    section: str,
    user: Annotated[dict, Depends(get_current_user)],
    body: dict[str, Any] = Body(...),
):
    """Shallow-merge `body` into the named section + persist (upsert)."""
    acct = _acct(user)
    conn = get_pg_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        data = _load(cur, acct)
        sect = data.get(section) if isinstance(data.get(section), dict) else {}
        sect = {**sect, **(body if isinstance(body, dict) else {})}
        data[section] = sect
        cur.execute(
            "INSERT INTO account_settings (account_id, data, updated_at) "
            "VALUES (%s, %s, now()) "
            "ON CONFLICT (account_id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()",
            (acct, Json(data)),
        )
    conn.commit()
    return {"success": True, "section": section, "data": sect}
