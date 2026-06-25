"""Durable in-app notifications — direct write to the shared
`contributor_notifications` table (account-scoped by a GLOBAL account_id, so the
one table + read endpoint serve every role's bell). No api-to-api: each backend
writes straight to the shared DB, the same pattern as write_audit.

Best-effort: a notification failure must never block the triggering action.
"""
from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)


def create_notification(
    account_id: Any,
    *,
    title: str,
    body: str = "",
    category: str = "update",        # action | update | payment | complaint | security
    kind: str = "system.generic",    # dotted event key, e.g. qa.accepted
    severity: str = "informational",  # informational | important | critical
    action_url: str | None = None,
    action_label: str | None = None,
    resource_type: str | None = None,
    resource_id: Any = None,
) -> None:
    if account_id is None:
        return
    try:
        acct = int(account_id)
    except (TypeError, ValueError):
        return
    conn = None
    recipient_role = None
    recipient_tenant = None
    try:
        from shared.db import get_pg_connection
        conn = get_pg_connection()
        with conn.cursor() as cur:
            # Best-effort recipient context for the audit row (same connection, one
            # cheap lookup). A failure here must never block the notification insert.
            try:
                cur.execute("SELECT role, tenant_id FROM login_accounts WHERE id = %s", (acct,))
                _r = cur.fetchone()
                if _r:
                    recipient_role, recipient_tenant = _r[0], _r[1]
            except Exception:  # noqa: BLE001
                pass
            cur.execute(
                "INSERT INTO contributor_notifications "
                "(account_id, category, kind, severity, title, body, action_url, action_label, "
                " resource_type, resource_id, channels) "
                "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s, ARRAY['in_app'])",
                (acct, category, kind, severity, title, body or "", action_url, action_label,
                 resource_type, str(resource_id) if resource_id is not None else None),
            )
        conn.commit()
    except Exception as exc:  # noqa: BLE001 — never block the action on a notify failure
        logger.warning("create_notification failed: %s", exc)
        if conn is not None:
            try:
                conn.rollback()
            except Exception:  # noqa: BLE001
                pass
        return
    # Mirror the dispatched notification into the audit trail so the audit log
    # shows the actual messages sent (not just reads). ONE audit per create →
    # notify_role (which loops create_notification) yields one row per recipient,
    # so there's no double-write. Fully best-effort; write_audit never raises.
    try:
        from shared.audit import write_audit
        write_audit(
            actor_id=str(acct), actor_email=None, actor_role=recipient_role,
            action="notification.create", target=resource_type,
            target_id=str(resource_id) if resource_id is not None else None,
            details=title, service="notifications", tenant_id=recipient_tenant,
            extra={"category": category, "kind": kind, "severity": severity,
                   "recipientAccountId": acct, "title": title, "body": body or ""},
        )
    except Exception:  # noqa: BLE001
        pass


def notify_role(roles: list[str] | str, **kwargs: Any) -> None:
    """Notify every account holding one of `roles` (e.g. all super-admins).
    kwargs are forwarded to create_notification. Best-effort."""
    if isinstance(roles, str):
        roles = [roles]
    want = [r.lower() for r in roles]
    ids: list = []
    conn = None
    try:
        from shared.db import get_pg_connection
        conn = get_pg_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM login_accounts WHERE LOWER(role) = ANY(%s)", (want,))
            ids = [r[0] for r in cur.fetchall()]
    except Exception as exc:  # noqa: BLE001
        logger.warning("notify_role lookup failed: %s", exc)
        return
    for aid in ids:
        create_notification(aid, **kwargs)
