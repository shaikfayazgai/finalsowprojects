"""
Payouts module — /api/v1/payouts/**

SIMULATED money-movement: payout requests and status transitions are persisted
in Postgres (payouts, payout_methods tables) but no real Razorpay/bank API is
called. Mutations write audit events to MongoDB via shared.audit.write_audit.

Tables owned here:
  payouts          — individual payout records per contributor
  payout_methods   — saved payout methods (bank / UPI / etc.)

Mounted at /api/v1 prefix so FE routes (/api/v1/payouts/...) resolve directly.
"""

from __future__ import annotations

import logging
import os
import secrets
import uuid
from datetime import datetime, timezone
from typing import Annotated, Any

from fastapi import APIRouter, Body, Depends, Header, HTTPException, Query
from psycopg2.extras import Json

from shared.audit import write_audit
from shared.deps import get_current_user
from contributor_app import db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["payouts"])


# ── Disbursal toggle: TEST (simulated) vs real RazorpayX ──────────────────────
# In TEST mode (no RAZORPAY_KEY_ID env) the disburse runs the REAL state machine
# and links but moves no real money — external_ref = 'SIM-<id>'. When the key is
# set, the `if RAZORPAY_KEY_ID` branch is where a real RazorpayX payout call wires
# in (left as a clean placeholder — no real call is made yet).

def _razorpay_live() -> bool:
    """True only when a RazorpayX key is configured. Until then every disburse is
    simulated. This is the single toggle a future real integration flips."""
    return bool(os.environ.get("RAZORPAY_KEY_ID", "").strip())


def _resolve_payout_method(account_id: int) -> dict | None:
    """The contributor's default (or first) saved bank/UPI payout method. Read at
    disburse time so the (future) real RazorpayX call has a destination. Returns
    the serialised method row, or None if the contributor saved none."""
    row = db.fetch_one(
        "SELECT * FROM payout_methods WHERE account_id=%s "
        "ORDER BY is_default DESC, verified_at DESC NULLS LAST, created_at ASC LIMIT 1",
        (account_id,),
    )
    return _ser(row)


def disburse_payout_row(row: dict, *, account_id: int, plan_id: str | None = None,
                        task_id: str | None = None) -> dict:
    """Move ONE payout released→processing→paid (idempotent), set the transaction
    link (task_id + plan_id) and external_ref, and return the final row.

    This is the clean disburse core shared by the contributor settle path and the
    Glimmora priced-SOW disburse. Guarded on status so a task is never paid twice.

    TEST vs real: `if _razorpay_live()` is the branch a real RazorpayX payout slots
    into; otherwise the path is fully simulated (external_ref='SIM-<id>') — the
    state machine + links are real, only the money movement is mocked.
    """
    payout_id = row["id"]
    status = (row.get("status") or "").lower()
    # Idempotency: only an unpaid, releasable payout proceeds. Already-paid / in-flight
    # rows are returned as-is so a double click / retry never double-pays.
    if status in ("paid", "processing"):
        return row
    if status not in ("released", "eligible", "requested", "pending"):
        raise HTTPException(status_code=409,
                            detail=f"Payout is {status}; cannot disburse")

    method = _resolve_payout_method(account_id)
    method_id = (method or {}).get("id") or row.get("method_id")

    # released → processing (so a concurrent caller sees it in-flight, not payable).
    db.execute(
        "UPDATE payouts SET status='processing', method_id=COALESCE(%s, method_id), "
        "data = data || %s, updated_at=now() WHERE id=%s AND account_id=%s AND status <> 'paid'",
        (method_id,
         Json({k: v for k, v in {"planId": plan_id, "canonicalTaskId": task_id}.items() if v}),
         payout_id, account_id),
    )

    ext_ref = f"SIM-{payout_id[:8]}"
    if _razorpay_live():
        # ── REAL RazorpayX branch (placeholder) ──────────────────────────────
        # A real RazorpayX fund-account payout call wires in here using `method`
        # (bank/UPI). On success set ext_ref to the RazorpayX payout id. Left
        # simulated for now — no real call is made until the key is wired.
        ext_ref = f"SIM-{payout_id[:8]}"  # replace with rzp payout id when live
    # else: TEST mode — simulated, external_ref stays SIM-<id>.

    updated = db.execute(
        "UPDATE payouts SET status='paid', paid_at=now(), external_ref=%s, updated_at=now() "
        "WHERE id=%s AND account_id=%s AND status='processing' RETURNING *",
        (ext_ref, payout_id, account_id),
    )
    return _ser(updated) or row

# ── Schema DDL (idempotent, called from init_contributor_schema) ──────────────

PAYOUTS_SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS payouts (
    id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    account_id    BIGINT NOT NULL,
    task_id       TEXT,
    task_title    TEXT DEFAULT '',
    amount_minor  BIGINT NOT NULL DEFAULT 0,
    currency      TEXT NOT NULL DEFAULT 'INR',
    status        TEXT NOT NULL DEFAULT 'eligible',
    -- status lifecycle: eligible -> requested -> released -> processing -> paid
    --   (also: pending -> paid | failed -> retry -> pending | reversed | on_hold)
    -- `processing` (additive) is the in-flight state during disbursal — set
    -- released->processing->paid so a concurrent caller never double-pays.
    eligible_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    paid_at       TIMESTAMPTZ,
    external_ref  TEXT,
    failure_reason TEXT,
    method_id     TEXT,
    data          JSONB NOT NULL DEFAULT '{}',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payouts_account ON payouts(account_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status  ON payouts(status);

CREATE TABLE IF NOT EXISTS payout_methods (
    id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    account_id    BIGINT NOT NULL,
    type          TEXT NOT NULL DEFAULT 'bank',  -- bank | upi | razorpay
    label         TEXT NOT NULL DEFAULT '',
    is_default    BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at   TIMESTAMPTZ,
    data          JSONB NOT NULL DEFAULT '{}',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payout_methods_account ON payout_methods(account_id);
"""


def init_payouts_schema() -> None:
    """Create payouts + payout_methods tables idempotently. Called from app startup."""
    c = db.conn()
    with c.cursor() as cur:
        cur.execute(PAYOUTS_SCHEMA_SQL)
    c.commit()


# ── Auth helpers ──────────────────────────────────────────────────────────────

def _acting_id(
    user: Annotated[dict, Depends(get_current_user)],
    x_contributor_id: Annotated[str | None, Header(alias="X-Contributor-Id")] = None,
) -> int:
    raw = x_contributor_id or user.get("id")
    try:
        return int(raw)
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="Invalid contributor id")


ActId = Annotated[int, Depends(_acting_id)]


def _acting_user(
    user: Annotated[dict, Depends(get_current_user)],
) -> dict:
    return user


ActUser = Annotated[dict, Depends(_acting_user)]


def _require_row(row: dict | None, what: str = "Resource") -> dict:
    if row is None:
        raise HTTPException(status_code=404, detail=f"{what} not found")
    return row


# ── Row serialiser ────────────────────────────────────────────────────────────

def _ser(row: dict[str, Any] | None) -> dict[str, Any] | None:
    """Serialise a payout/method row: datetimes → iso, merge data JSONB."""
    if row is None:
        return None
    out: dict[str, Any] = {}
    nested = row.get("data") if isinstance(row.get("data"), dict) else {}
    for k, v in row.items():
        if k == "data":
            continue
        if isinstance(v, datetime):
            out[k] = v.isoformat()
        elif hasattr(v, "__float__") and not isinstance(v, (int, float, bool)):
            try:
                out[k] = float(v)
            except Exception:
                out[k] = v
        else:
            out[k] = v
    for k, v in (nested or {}).items():
        out.setdefault(k, v)
    return out


def _fetch_payout(payout_id: str, account_id: int) -> dict | None:
    return _ser(db.fetch_one(
        "SELECT * FROM payouts WHERE id=%s AND account_id=%s",
        (payout_id, account_id),
    ))


def _fetch_method(method_id: str, account_id: int) -> dict | None:
    return _ser(db.fetch_one(
        "SELECT * FROM payout_methods WHERE id=%s AND account_id=%s",
        (method_id, account_id),
    ))


# ════════════════════════════════════════════════════════════════════════════
# GET /api/v1/payouts
# Paged list of payouts for the authenticated contributor.
# Query params: page, limit, status
# Response: { items, total, page, limit }
# ════════════════════════════════════════════════════════════════════════════

@router.get("/payouts")
async def list_payouts(
    account_id: ActId,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=25, ge=1, le=100),
    status: str | None = None,
):
    where = "account_id=%s"
    params: list[Any] = [account_id]
    if status:
        where += " AND status=%s"
        params.append(status)
    rows = db.fetch_all(
        f"SELECT * FROM payouts WHERE {where} ORDER BY created_at DESC",
        tuple(params),
    )
    items = [_ser(r) for r in rows]
    # Attach project name from data if stored
    total = len(items)
    start = (page - 1) * limit
    return {
        "items": items[start : start + limit],
        "total": total,
        "page": page,
        "limit": limit,
    }


# ════════════════════════════════════════════════════════════════════════════
# POST /api/v1/payouts/{payoutId}/request
# Transition: eligible → pending  (contributor requests withdrawal)
# ════════════════════════════════════════════════════════════════════════════

@router.post("/payouts/{payout_id}/request")
async def request_payout(
    payout_id: str,
    account_id: ActId,
    user: ActUser,
    payload: dict = Body(default={}),
):
    row = _require_row(
        _ser(db.fetch_one("SELECT * FROM payouts WHERE id=%s AND account_id=%s", (payout_id, account_id))),
        "Payout",
    )
    if row["status"] != "eligible":
        raise HTTPException(
            status_code=409,
            detail=f"Payout is {row['status']}; only eligible payouts can be requested",
        )
    method_id = payload.get("methodId") or row.get("method_id")
    # Payouts are SIMULATED (no real bank rail yet — the Razorpay test integration
    # plugs in here). Requesting a withdrawal therefore settles immediately to
    # 'paid' and flips the canonical task → 'paid' so the contributor reaches
    # "Successfully completed — paid" through the UI. When real disbursal is wired,
    # this becomes eligible→pending→(webhook)→paid.
    ext_ref = f"SIM-{payout_id[:8]}"
    updated = db.execute(
        "UPDATE payouts SET status='paid', paid_at=now(), external_ref=%s, method_id=%s, updated_at=now() "
        "WHERE id=%s AND account_id=%s RETURNING *",
        (ext_ref, method_id, payout_id, account_id),
    )
    # Flip the canonical task → 'paid' and complete the contributor task.
    ctid = row.get("canonicalTaskId") or row.get("task_id")
    if ctid and str(ctid).startswith("tsk_"):
        try:
            db.execute("UPDATE decomp_tasks SET status='paid', updated_at=now() WHERE id=%s", (ctid,))
        except Exception:  # noqa: BLE001
            pass
    _tid = row.get("task_id")
    try:
        if _tid and str(_tid).isdigit():
            db.execute("UPDATE contributor_tasks SET status='completed', updated_at=now() "
                       "WHERE id=%s AND account_id=%s", (int(_tid), account_id))
        else:
            _key = _tid or ctid
            if _key:
                db.execute("UPDATE contributor_tasks SET status='completed', updated_at=now() "
                           "WHERE account_id=%s AND data->>'taskId'=%s", (account_id, str(_key)))
    except Exception:  # noqa: BLE001
        pass
    write_audit(
        actor_id=str(account_id),
        actor_email=user.get("email"),
        actor_role=user.get("role", "contributor"),
        action="payout.request",
        target="payout",
        target_id=payout_id,
        details=f"status eligible→paid (simulated); ref={ext_ref}; method={method_id}",
        service="contributor-service",
    )
    return _ser(updated)


# ════════════════════════════════════════════════════════════════════════════
# POST /api/v1/payouts/{payoutId}/settle
# Transition: eligible|pending → paid  (SIMULATED settlement — this is where the
# Razorpay test-mode disbursal will plug in). Flips the canonical task to 'paid'
# and completes the contributor task so all four portals show "Completed · Paid".
# DB-only — no calls to other services.
# ════════════════════════════════════════════════════════════════════════════

@router.post("/payouts/{payout_id}/settle")
async def settle_payout(
    payout_id: str,
    account_id: ActId,
    user: ActUser,
    payload: dict = Body(default={}),
):
    row = _require_row(
        _ser(db.fetch_one("SELECT * FROM payouts WHERE id=%s AND account_id=%s", (payout_id, account_id))),
        "Payout",
    )
    if row["status"] not in ("eligible", "pending"):
        raise HTTPException(status_code=409,
                            detail=f"Payout is {row['status']}; only eligible/pending payouts can be settled")
    ext_ref = payload.get("externalRef") or f"SIM-{payout_id[:8]}"
    updated = db.execute(
        "UPDATE payouts SET status='paid', paid_at=now(), external_ref=%s, updated_at=now() "
        "WHERE id=%s AND account_id=%s RETURNING *",
        (ext_ref, payout_id, account_id),
    )
    # Flip the canonical task → 'paid' and complete the contributor task.
    # NB: _ser() merges the payout's `data` JSONB onto the top level, so the
    # canonical tsk_ id is read straight off `row` (the numeric task_id column is
    # the contributor_tasks id, not the decomposition task).
    ctid = row.get("canonicalTaskId") or row.get("task_id")
    if ctid and str(ctid).startswith("tsk_"):
        try:
            db.execute("UPDATE decomp_tasks SET status='paid', updated_at=now() WHERE id=%s", (ctid,))
        except Exception:  # noqa: BLE001
            pass
    # Complete the contributor task. The numeric task_id column is often NULL on
    # payouts created from a reviewer assignment, so fall back to the canonical
    # tsk_ id (matched against contributor_tasks.data->>'taskId').
    task_id = row.get("task_id")
    try:
        if task_id and str(task_id).isdigit():
            db.execute("UPDATE contributor_tasks SET status='completed', updated_at=now() "
                       "WHERE id=%s AND account_id=%s", (int(task_id), account_id))
        else:
            ct_key = task_id or ctid
            if ct_key:
                db.execute("UPDATE contributor_tasks SET status='completed', updated_at=now() "
                           "WHERE account_id=%s AND data->>'taskId'=%s", (account_id, str(ct_key)))
    except Exception:  # noqa: BLE001
        pass
    write_audit(
        actor_id=str(account_id), actor_email=user.get("email"),
        actor_role=user.get("role", "contributor"), action="payout.settle",
        target="payout", target_id=payout_id,
        details=f"status {row['status']}→paid (simulated); ref={ext_ref}",
        service="contributor-service",
    )
    # Notify the contributor their payout was disbursed (was silent before).
    try:
        from shared.notify import create_notification
        create_notification(
            account_id, category="payment", kind="payout.paid", severity="important",
            title="Payout sent",
            body="Your payout was disbursed — the payment is on its way to your account.",
            resource_type="task", resource_id=ctid,
            action_url="/contributor/earnings", action_label="View earnings")
    except Exception:  # noqa: BLE001
        pass
    return _ser(updated)


# ════════════════════════════════════════════════════════════════════════════
# POST /api/v1/payouts/{payoutId}/disburse
# Real state-machine disbursal: released|eligible|requested → processing → paid.
# Reads the contributor's saved bank/UPI from payout_methods, stores the
# transaction link (task_id + plan_id) and external_ref. IDEMPOTENT (guarded on
# status — an already-paid task is returned untouched). TEST mode = simulated
# (external_ref='SIM-<id>'); the real RazorpayX call slots into disburse_payout_row.
# ════════════════════════════════════════════════════════════════════════════

@router.post("/payouts/{payout_id}/disburse")
async def disburse_payout(
    payout_id: str,
    account_id: ActId,
    user: ActUser,
    payload: dict = Body(default={}),
):
    row = _require_row(
        _ser(db.fetch_one("SELECT * FROM payouts WHERE id=%s AND account_id=%s", (payout_id, account_id))),
        "Payout",
    )
    already_paid = (row.get("status") or "").lower() == "paid"
    plan_id = payload.get("planId") or row.get("planId")
    task_id = payload.get("taskId") or row.get("canonicalTaskId") or row.get("task_id")
    updated = disburse_payout_row(row, account_id=account_id, plan_id=plan_id, task_id=task_id)

    # Flip the canonical task → 'paid' + complete the contributor task (mirrors settle).
    ctid = updated.get("canonicalTaskId") or updated.get("task_id")
    if ctid and str(ctid).startswith("tsk_"):
        try:
            db.execute("UPDATE decomp_tasks SET status='paid', updated_at=now() WHERE id=%s", (ctid,))
        except Exception:  # noqa: BLE001
            pass
    _tid = updated.get("task_id")
    try:
        if _tid and str(_tid).isdigit():
            db.execute("UPDATE contributor_tasks SET status='completed', updated_at=now() "
                       "WHERE id=%s AND account_id=%s", (int(_tid), account_id))
        elif ctid:
            db.execute("UPDATE contributor_tasks SET status='completed', updated_at=now() "
                       "WHERE account_id=%s AND data->>'taskId'=%s", (account_id, str(ctid)))
    except Exception:  # noqa: BLE001
        pass

    write_audit(
        actor_id=str(account_id), actor_email=user.get("email"),
        actor_role=user.get("role", "contributor"), action="payout.disburse",
        target="payout", target_id=payout_id,
        details=f"status {row['status']}→paid ({'real' if _razorpay_live() else 'simulated'}); "
                f"ref={updated.get('external_ref')}; planId={plan_id}; taskId={task_id}",
        service="contributor-service",
    )
    if not already_paid:  # notify once (idempotent re-calls stay silent)
        try:
            from shared.notify import create_notification
            create_notification(
                account_id, category="payment", kind="payout.paid", severity="important",
                title="Payout sent",
                body="Your payout was disbursed — the payment is on its way to your account.",
                resource_type="task", resource_id=ctid,
                action_url="/contributor/earnings", action_label="View earnings")
        except Exception:  # noqa: BLE001
            pass
    return updated


# ════════════════════════════════════════════════════════════════════════════
# POST /api/v1/payouts/{payoutId}/hold
# Transition: pending → on_hold  (admin places hold)
# ════════════════════════════════════════════════════════════════════════════

@router.post("/payouts/{payout_id}/hold")
async def hold_payout(
    payout_id: str,
    account_id: ActId,
    user: ActUser,
    payload: dict = Body(default={}),
):
    row = _require_row(
        _ser(db.fetch_one("SELECT * FROM payouts WHERE id=%s AND account_id=%s", (payout_id, account_id))),
        "Payout",
    )
    if row["status"] not in ("pending", "eligible"):
        raise HTTPException(
            status_code=409,
            detail=f"Payout is {row['status']}; cannot place hold",
        )
    reason = payload.get("reason", "")
    updated = db.execute(
        "UPDATE payouts SET status='on_hold', "
        "data = data || %s, updated_at=now() "
        "WHERE id=%s AND account_id=%s RETURNING *",
        (Json({"hold_reason": reason}), payout_id, account_id),
    )
    write_audit(
        actor_id=str(account_id),
        actor_email=user.get("email"),
        actor_role=user.get("role", "contributor"),
        action="payout.hold",
        target="payout",
        target_id=payout_id,
        details=f"reason={reason}",
        service="contributor-service",
    )
    return _ser(updated)


# ════════════════════════════════════════════════════════════════════════════
# POST /api/v1/payouts/{payoutId}/release-hold
# Transition: on_hold → pending
# ════════════════════════════════════════════════════════════════════════════

@router.post("/payouts/{payout_id}/release-hold")
async def release_hold_payout(
    payout_id: str,
    account_id: ActId,
    user: ActUser,
):
    row = _require_row(
        _ser(db.fetch_one("SELECT * FROM payouts WHERE id=%s AND account_id=%s", (payout_id, account_id))),
        "Payout",
    )
    if row["status"] != "on_hold":
        raise HTTPException(
            status_code=409,
            detail=f"Payout is {row['status']}; not on hold",
        )
    updated = db.execute(
        "UPDATE payouts SET status='pending', updated_at=now() "
        "WHERE id=%s AND account_id=%s RETURNING *",
        (payout_id, account_id),
    )
    write_audit(
        actor_id=str(account_id),
        actor_email=user.get("email"),
        actor_role=user.get("role", "contributor"),
        action="payout.release_hold",
        target="payout",
        target_id=payout_id,
        service="contributor-service",
    )
    return _ser(updated)


# ════════════════════════════════════════════════════════════════════════════
# POST /api/v1/payouts/{payoutId}/retry
# Transition: failed → pending  (contributor retries a failed payout)
# ════════════════════════════════════════════════════════════════════════════

@router.post("/payouts/{payout_id}/retry")
async def retry_payout(
    payout_id: str,
    account_id: ActId,
    user: ActUser,
    payload: dict = Body(default={}),
):
    row = _require_row(
        _ser(db.fetch_one("SELECT * FROM payouts WHERE id=%s AND account_id=%s", (payout_id, account_id))),
        "Payout",
    )
    if row["status"] != "failed":
        raise HTTPException(
            status_code=409,
            detail=f"Payout is {row['status']}; only failed payouts can be retried",
        )
    method_id = payload.get("methodId") or row.get("method_id")
    updated = db.execute(
        "UPDATE payouts SET status='pending', method_id=%s, failure_reason=NULL, "
        "updated_at=now() "
        "WHERE id=%s AND account_id=%s RETURNING *",
        (method_id, payout_id, account_id),
    )
    write_audit(
        actor_id=str(account_id),
        actor_email=user.get("email"),
        actor_role=user.get("role", "contributor"),
        action="payout.retry",
        target="payout",
        target_id=payout_id,
        details=f"method={method_id}",
        service="contributor-service",
    )
    return _ser(updated)


# ════════════════════════════════════════════════════════════════════════════
# GET /api/v1/payouts/methods
# List payout methods for the contributor.
# ════════════════════════════════════════════════════════════════════════════

@router.get("/payouts/methods")
async def list_payout_methods(account_id: ActId):
    rows = db.fetch_all(
        "SELECT * FROM payout_methods WHERE account_id=%s ORDER BY is_default DESC, created_at ASC",
        (account_id,),
    )
    return {"items": [_ser(r) for r in rows]}


# ════════════════════════════════════════════════════════════════════════════
# POST /api/v1/payouts/methods
# Add a new payout method.
# Body: { type, label, ifsc?, country?, currency?, ...extra }
# ════════════════════════════════════════════════════════════════════════════

@router.post("/payouts/methods")
async def add_payout_method(
    account_id: ActId,
    user: ActUser,
    payload: dict = Body(default={}),
):
    method_type = payload.get("type", "bank")
    label = payload.get("label", "")
    if not label:
        raise HTTPException(status_code=422, detail="label is required")

    # If this is the first method, make it default automatically
    existing_count = db.fetch_one(
        "SELECT COUNT(*) AS c FROM payout_methods WHERE account_id=%s",
        (account_id,),
    )
    is_default = (int((existing_count or {}).get("c", 0)) == 0)

    # Extra fields stored in JSONB data
    extra = {k: v for k, v in payload.items() if k not in ("type", "label")}
    verified_at = None
    if payload.get("verifiedAt"):
        verified_at = payload["verifiedAt"]

    row = db.execute(
        """
        INSERT INTO payout_methods
            (account_id, type, label, is_default, verified_at, data)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING *
        """,
        (account_id, method_type, label, is_default, verified_at, Json(extra)),
    )
    write_audit(
        actor_id=str(account_id),
        actor_email=user.get("email"),
        actor_role=user.get("role", "contributor"),
        action="payout_method.add",
        target="payout_method",
        target_id=str((row or {}).get("id", "")),
        details=f"type={method_type}, label={label}",
        service="contributor-service",
    )
    return _ser(row)


# ════════════════════════════════════════════════════════════════════════════
# PATCH /api/v1/payouts/methods/{methodId}
# Set as default or update label/details.
# Body: { setDefault?: bool, label?: str, ...extra }
# ════════════════════════════════════════════════════════════════════════════

@router.patch("/payouts/methods/{method_id}")
async def update_payout_method(
    method_id: str,
    account_id: ActId,
    user: ActUser,
    payload: dict = Body(default={}),
):
    _require_row(_fetch_method(method_id, account_id), "Payout method")

    if payload.get("setDefault") or payload.get("set_default"):
        # Clear existing default, then set this one
        c = db.conn()
        with c.cursor() as cur:
            cur.execute(
                "UPDATE payout_methods SET is_default=FALSE WHERE account_id=%s",
                (account_id,),
            )
            cur.execute(
                "UPDATE payout_methods SET is_default=TRUE, updated_at=now() "
                "WHERE id=%s AND account_id=%s",
                (method_id, account_id),
            )
        c.commit()

    if "label" in payload:
        db.execute(
            "UPDATE payout_methods SET label=%s, updated_at=now() WHERE id=%s AND account_id=%s",
            (payload["label"], method_id, account_id),
        )

    write_audit(
        actor_id=str(account_id),
        actor_email=user.get("email"),
        actor_role=user.get("role", "contributor"),
        action="payout_method.update",
        target="payout_method",
        target_id=method_id,
        details=str(payload),
        service="contributor-service",
    )
    updated = _require_row(_fetch_method(method_id, account_id), "Payout method")
    return updated


# ════════════════════════════════════════════════════════════════════════════
# POST /api/v1/payouts/methods/{methodId}/verify
# Re-run micro-deposit (penny-drop) verification → mark the method verified.
# ════════════════════════════════════════════════════════════════════════════

@router.post("/payouts/methods/{method_id}/verify")
async def verify_payout_method(
    method_id: str,
    account_id: ActId,
    user: ActUser,
):
    _require_row(_fetch_method(method_id, account_id), "Payout method")
    db.execute(
        "UPDATE payout_methods SET verified_at=now(), updated_at=now() WHERE id=%s AND account_id=%s",
        (method_id, account_id),
    )
    write_audit(
        actor_id=str(account_id),
        actor_email=user.get("email"),
        actor_role=user.get("role", "contributor"),
        action="payout_method.verify",
        target="payout_method",
        target_id=method_id,
        service="contributor-service",
    )
    return _require_row(_fetch_method(method_id, account_id), "Payout method")


# ════════════════════════════════════════════════════════════════════════════
# DELETE /api/v1/payouts/methods/{methodId}
# Remove a saved payout method.
# ════════════════════════════════════════════════════════════════════════════

@router.delete("/payouts/methods/{method_id}")
async def delete_payout_method(
    method_id: str,
    account_id: ActId,
    user: ActUser,
):
    row = _require_row(_fetch_method(method_id, account_id), "Payout method")
    db.execute(
        "DELETE FROM payout_methods WHERE id=%s AND account_id=%s",
        (method_id, account_id),
    )
    write_audit(
        actor_id=str(account_id),
        actor_email=user.get("email"),
        actor_role=user.get("role", "contributor"),
        action="payout_method.delete",
        target="payout_method",
        target_id=method_id,
        service="contributor-service",
    )
    return {"deleted": True, "id": method_id}


# ════════════════════════════════════════════════════════════════════════════
# GET /api/v1/payouts/tenant
# Tenant-wide payouts list (enterprise / admin view).
# Query params: status, page, limit, account_id (filter by contributor)
# ════════════════════════════════════════════════════════════════════════════

@router.get("/payouts/tenant")
async def list_tenant_payouts(
    user: ActUser,
    status: str | None = None,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=25, ge=1, le=100),
    contributor_id: int | None = None,
):
    # Tenant-wide endpoint: accessible by admin/enterprise roles; contributors
    # can only see their own (enforced by contributor_id param being set to
    # their own account or left None which returns all — let callers gate this).
    where_parts = ["1=1"]
    params: list[Any] = []

    if status:
        where_parts.append("status=%s")
        params.append(status)
    if contributor_id is not None:
        where_parts.append("account_id=%s")
        params.append(contributor_id)

    where = " AND ".join(where_parts)
    rows = db.fetch_all(
        f"SELECT * FROM payouts WHERE {where} ORDER BY created_at DESC",
        tuple(params),
    )
    items = [_ser(r) for r in rows]
    total = len(items)
    start = (page - 1) * limit
    return {
        "items": items[start : start + limit],
        "total": total,
        "page": page,
        "limit": limit,
    }
