"""
Audit logging → MongoDB `audit_log` collection. Every privileged/mutating
action records actor, action, target, details, IP, and timestamp. Also emits
a Kafka `audit.event` so analytics can consume the same stream. Fail-open.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from shared.db import get_mongo_db, mongo_audit_collection
from shared.kafka_bus import publish_event

logger = logging.getLogger(__name__)


def write_txn_event(
    *,
    direction: str,                 # "in" (enterprise→Glimmora) | "out" (→contributor)
    status: str,                    # "success" | "failed"
    transaction_id: str | None = None,
    payout_id: str | None = None,
    task_id: str | None = None,
    plan_id: str | None = None,
    order_id: str | None = None,
    amount_minor: int | None = None,
    currency: str | None = None,
    error: str | None = None,
    error_code: str | None = None,
    verified: bool | None = None,
    raw: dict[str, Any] | None = None,
    service: str | None = None,
) -> None:
    """Best-effort record of ONE money-movement transaction (success OR failure) to
    the Mongo `razorpay_events` collection. Never raises — payment handlers stay fast
    and a logging failure never affects the disburse/webhook. Both successful and
    failed transactions are recorded so finance/audit has the full ledger."""
    doc = {
        "direction": direction,
        "status": status,
        "transactionId": transaction_id,
        "payoutId": payout_id,
        "taskId": task_id,
        "planId": plan_id,
        "orderId": order_id,
        "amountMinor": amount_minor,
        "currency": currency,
        "error": error,
        "errorCode": error_code,
        "verified": verified,
        "raw": raw,
        "service": service,
        "timestamp": datetime.now(timezone.utc),
    }
    try:
        db = get_mongo_db()
        if db is not None:
            db["razorpay_events"].insert_one(dict(doc))
    except Exception as exc:  # noqa: BLE001
        logger.warning("Txn event write failed: %s", exc)


def write_audit(
    *,
    actor_id: str | None,
    actor_email: str | None,
    actor_role: str | None,
    action: str,
    target: str | None = None,
    target_id: str | None = None,
    details: str | None = None,
    service: str | None = None,
    tenant_id: str | None = None,
    ip_address: str | None = None,
    extra: dict[str, Any] | None = None,
) -> None:
    """Write one audit row to Mongo + emit a Kafka event. Never raises."""
    doc = {
        "actorId": actor_id,
        "actorEmail": actor_email,
        "actorRole": actor_role,
        "action": action,
        "target": target,
        "targetId": target_id,
        "details": details,
        "service": service,
        "tenantId": tenant_id,
        "ipAddress": ip_address,
        "timestamp": datetime.now(timezone.utc),
        **(extra or {}),
    }
    try:
        col = mongo_audit_collection()
        if col is not None:
            col.insert_one(dict(doc))
    except Exception as exc:  # noqa: BLE001
        logger.warning("Audit write failed: %s", exc)
    try:
        publish_event("audit.event", {**doc, "timestamp": doc["timestamp"].isoformat()},
                      key=actor_email or action)
    except Exception:
        pass


def query_audit(
    *,
    filters: dict[str, Any] | None = None,
    page: int = 1,
    page_size: int = 50,
) -> dict[str, Any]:
    """Paginated audit reader for admin viewers."""
    page = max(1, page)
    page_size = max(1, min(200, page_size))
    empty = {"items": [], "page": page, "page_size": page_size, "total": 0}
    # Fail-open: Mongo unconfigured OR unreachable (DNS/network) must not 500 the
    # admin audit viewer — return an empty page instead. write_audit is already
    # fail-open, so audit is best-effort end to end.
    try:
        col = mongo_audit_collection()
        if col is None:
            return empty
        q = filters or {}
        total = col.count_documents(q)
        cursor = col.find(q).sort("timestamp", -1).skip((page - 1) * page_size).limit(page_size)
        items = []
        for d in cursor:
            d["_id"] = str(d.get("_id"))
            if isinstance(d.get("timestamp"), datetime):
                d["timestamp"] = d["timestamp"].isoformat()
            items.append(d)
        return {"items": items, "page": page, "page_size": page_size, "total": total}
    except Exception as exc:  # noqa: BLE001
        logger.warning("Audit read failed (returning empty): %s", exc)
        return empty
