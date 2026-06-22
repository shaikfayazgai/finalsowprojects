"""Enterprise review-queue — /api/v1/enterprise/review-queue/**

Surfaces mentor-accepted submissions that are awaiting a final enterprise
decision.  Uses the dedicated ``enterprise_review_queue`` Postgres table so
state (claim / decision) is durable and isolated from the main deliverables
table.

Routes:
  GET  /api/v1/enterprise/review-queue          list pending + optionally claimed
  GET  /api/v1/enterprise/review-queue/history  decided (accepted/rework) items
  GET  /api/v1/enterprise/review-queue/{id}     single submission detail
  POST /api/v1/enterprise/review-queue/{id}/claim
  POST /api/v1/enterprise/review-queue/{id}/release
  POST /api/v1/enterprise/review-queue/{id}/decide

Response shapes must match the FE contracts in:
  src/lib/api/enterprise-review.ts
  src/lib/enterprise-review/types.ts
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Annotated, Any

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from psycopg2.extras import Json, RealDictCursor

from shared.audit import write_audit
from shared.db import ensure_pg_clean, get_pg_connection
from shared.deps import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/enterprise/review-queue", tags=["review-queue"])

# ── DDL ─────────────────────────────────────────────────────────────────────

REVIEW_QUEUE_DDL = """
CREATE TABLE IF NOT EXISTS enterprise_review_queue (
    submission_id   TEXT PRIMARY KEY,
    data            JSONB NOT NULL DEFAULT '{}'::jsonb,
    status          TEXT NOT NULL DEFAULT 'pending',
    claimed_by      TEXT,
    claimed_at      TIMESTAMPTZ,
    decision        TEXT,
    decided_at      TIMESTAMPTZ,
    decided_by      TEXT,
    decision_note   TEXT,
    decision_id     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ent_rq_status ON enterprise_review_queue(status);
CREATE INDEX IF NOT EXISTS idx_ent_rq_claimed ON enterprise_review_queue(claimed_by);
"""


def init_review_queue_schema() -> None:
    """Idempotently create the enterprise_review_queue table."""
    ensure_pg_clean()
    conn = get_pg_connection()
    with conn.cursor() as cur:
        cur.execute(REVIEW_QUEUE_DDL)
    conn.commit()


# ── helpers ──────────────────────────────────────────────────────────────────

def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _new_id(prefix: str = "") -> str:
    base = uuid.uuid4().hex[:24]
    return f"{prefix}{base}" if prefix else base


def _row_to_item(row: dict) -> dict:
    """Convert a DB row (RealDictRow) to the EnterpriseReviewQueueItem shape."""
    data: dict[str, Any] = dict(row.get("data") or {})
    # Overlay the mutable columns that can change after initial insert.
    data["enterpriseReviewerId"] = row.get("claimed_by")
    data["enterpriseReviewerAssignedAt"] = (
        row["claimed_at"].isoformat() if row.get("claimed_at") else None
    )
    return data


def _fetch_row(submission_id: str) -> dict | None:
    ensure_pg_clean()
    conn = get_pg_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            "SELECT * FROM enterprise_review_queue WHERE submission_id = %s",
            [submission_id],
        )
        return cur.fetchone()


def _release_payout_and_complete(data: dict) -> None:
    """Enterprise accept = the money gate. Mark the contributor task completed
    and create the eligible payout (net of 18% GST). Idempotent per submission."""
    from psycopg2.extras import Json as _Json, RealDictCursor as _RDC

    acct_id = data.get("accountId") or data.get("contributorId")
    task_id = data.get("taskId") or data.get("taskDefinitionId")
    submission_id = data.get("submissionId")
    try:
        account_id = int(acct_id) if acct_id not in (None, "") else None
    except (TypeError, ValueError):
        account_id = None
    if not account_id:
        return

    ensure_pg_clean()
    conn = get_pg_connection()
    with conn.cursor() as cur:
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS payouts (
                id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
                account_id    BIGINT NOT NULL, task_id TEXT, task_title TEXT DEFAULT '',
                amount_minor  BIGINT NOT NULL DEFAULT 0, currency TEXT NOT NULL DEFAULT 'INR',
                status        TEXT NOT NULL DEFAULT 'eligible',
                eligible_at   TIMESTAMPTZ NOT NULL DEFAULT now(), paid_at TIMESTAMPTZ,
                external_ref  TEXT, failure_reason TEXT, method_id TEXT,
                data          JSONB NOT NULL DEFAULT '{}',
                created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
                updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
            )
            """)
    conn.commit()

    # Mark the contributor task completed (numeric row id or JSONB taskId).
    with conn.cursor() as cur:
        if task_id and str(task_id).isdigit():
            cur.execute("UPDATE contributor_tasks SET status='completed', updated_at=now() "
                        "WHERE id=%s AND account_id=%s", (int(task_id), account_id))
        elif task_id:
            cur.execute("UPDATE contributor_tasks SET status='completed', updated_at=now() "
                        "WHERE account_id=%s AND data->>'taskId'=%s", (account_id, str(task_id)))
    conn.commit()

    # Idempotency: one payout per delivered task+account. (Keyed on task_id, NOT
    # submissionId — contributor submission ids are per-contributor sequences and
    # collide across tasks, which previously suppressed legitimate payouts. When a
    # submissionId is present we additionally require it to match so a re-accept of
    # the SAME task+submission stays idempotent.)
    with conn.cursor() as cur:
        if task_id is not None:
            cur.execute("SELECT 1 FROM payouts WHERE account_id=%s AND task_id=%s "
                        "AND status NOT IN ('failed','reversed') LIMIT 1",
                        (account_id, str(task_id)))
        elif submission_id is not None:
            cur.execute("SELECT 1 FROM payouts WHERE account_id=%s AND data->>'submissionId'=%s "
                        "AND status NOT IN ('failed','reversed') LIMIT 1", (account_id, str(submission_id)))
        else:
            cur.execute("SELECT 1 FROM payouts WHERE account_id=%s LIMIT 0", (account_id,))
        if cur.fetchone():
            return

    reward, currency, ct_title, ct_id = 0.0, "INR", None, None
    with conn.cursor(cursor_factory=_RDC) as cur:
        row = None
        if task_id and str(task_id).isdigit():
            cur.execute("SELECT id,reward,currency,title FROM contributor_tasks WHERE id=%s AND account_id=%s LIMIT 1",
                        (int(task_id), account_id)); row = cur.fetchone()
        if not row and task_id:
            cur.execute("SELECT id,reward,currency,title FROM contributor_tasks "
                        "WHERE account_id=%s AND data->>'taskId'=%s ORDER BY updated_at DESC LIMIT 1",
                        (account_id, str(task_id))); row = cur.fetchone()
        if not row:
            cur.execute("SELECT id,reward,currency,title FROM contributor_tasks "
                        "WHERE account_id=%s AND status IN ('completed','submitted','assigned') "
                        "ORDER BY updated_at DESC LIMIT 1", (account_id,)); row = cur.fetchone()
        if row:
            reward = float(row.get("reward") or 0); currency = (row.get("currency") or "INR").upper()
            ct_title = row.get("title"); ct_id = row.get("id")

    # GST is super-admin-configurable (platform_settings.data['commission']['gstPct']).
    gst_pct = 18.0
    try:
        with conn.cursor(cursor_factory=_RDC) as cur:
            cur.execute("SELECT data->'commission'->>'gstPct' AS g FROM platform_settings WHERE id=1")
            r = cur.fetchone()
            if r and r.get("g") is not None:
                gst_pct = max(0.0, min(float(r["g"]), 50.0))
    except Exception:  # noqa: BLE001 — fall back to 18% if the setting is unreadable
        gst_pct = 18.0
    amount_minor = int(round(reward * 100))
    net_minor = int(round(amount_minor * (1 - gst_pct / 100)))
    title = ct_title or data.get("taskTitle") or "Delivered task"
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO payouts (account_id, task_id, task_title, amount_minor, currency, status, data) "
            "VALUES (%s,%s,%s,%s,%s,'eligible',%s)",
            (account_id, str(ct_id) if ct_id is not None else (str(task_id) if task_id is not None else None),
             title, amount_minor, currency,
             _Json({"submissionId": submission_id, "grossMinor": amount_minor, "gstPct": gst_pct,
                    "netMinor": net_minor, "source": "enterprise_acceptance"})))
    conn.commit()
    # The payout is now eligible → tell Glimmora (super-admins) it can be requested,
    # and confirm the final acceptance to the contributor.
    try:
        from shared.notify import create_notification, notify_role
        _rid = str(ct_id) if ct_id is not None else (str(task_id) if task_id is not None else None)
        create_notification(
            account_id, category="payment", kind="task.accepted", severity="important",
            title="Your work was accepted",
            body=f"“{title}” was accepted by the enterprise — your payout is being processed.",
            resource_type="task", resource_id=_rid,
            action_url="/contributor/earnings", action_label="View earnings")
        notify_role(
            ["superadmin", "super_admin", "admin"],
            category="payment", kind="payout.eligible", severity="important",
            title="Payout eligible to request",
            body=f"“{title}” was accepted — the contributor payout is eligible to request.",
            resource_type="task", resource_id=_rid,
            action_url="/admin/payouts", action_label="Review payouts")
    except Exception:  # noqa: BLE001
        pass


# ── list ─────────────────────────────────────────────────────────────────────

@router.get("")
def list_review_queue(
    user: Annotated[dict, Depends(get_current_user)],
    mine: bool = Query(False),
    includeClaimed: bool = Query(False),
    limit: int | None = Query(None),
) -> dict:
    """Return pending (undecided) items in the enterprise review queue.

    Query params:
      mine           – only items claimed by the current user
      includeClaimed – include items claimed by *anyone*; default excludes
                       items claimed by others (except the caller)
      limit          – cap the result count
    """
    ensure_pg_clean()
    conn = get_pg_connection()
    clauses = ["decision IS NULL"]
    params: list[Any] = []

    if mine:
        clauses.append("claimed_by = %s")
        params.append(user["id"])
    elif not includeClaimed:
        # Return unclaimed OR claimed by this user.
        clauses.append("(claimed_by IS NULL OR claimed_by = %s)")
        params.append(user["id"])

    sql = (
        "SELECT * FROM enterprise_review_queue"
        + (" WHERE " + " AND ".join(clauses) if clauses else "")
        + " ORDER BY created_at ASC"
    )
    if limit:
        sql += f" LIMIT {int(limit)}"

    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(sql, params)
        rows = cur.fetchall()

    items = [_row_to_item(r) for r in rows]
    return {"items": items}


# ── history ───────────────────────────────────────────────────────────────────

@router.get("/history")
def list_review_history(
    user: Annotated[dict, Depends(get_current_user)],
    limit: int | None = Query(None),
) -> dict:
    """Return decided items (accept / rework) for the history view."""
    ensure_pg_clean()
    conn = get_pg_connection()
    sql = (
        "SELECT * FROM enterprise_review_queue"
        " WHERE decision IS NOT NULL"
        " ORDER BY decided_at DESC"
    )
    if limit:
        sql += f" LIMIT {int(limit)}"

    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(sql)
        rows = cur.fetchall()

    items = []
    for r in rows:
        base = _row_to_item(r)
        items.append({
            **base,
            "decision": r["decision"],
            "decidedAt": r["decided_at"].isoformat() if r.get("decided_at") else None,
            "decisionId": r.get("decision_id"),
            "note": r.get("decision_note"),
        })
    return {"items": items}


# ── detail ────────────────────────────────────────────────────────────────────

@router.get("/{submission_id}")
def get_review_submission(
    submission_id: str,
    user: Annotated[dict, Depends(get_current_user)],
) -> dict:
    """Return a single submission with its current state + any decision."""
    row = _fetch_row(submission_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Submission not found")

    item = _row_to_item(row)

    decided: dict | None = None
    if row.get("decision"):
        decided = {
            **item,
            "decision": row["decision"],
            "decidedAt": row["decided_at"].isoformat() if row.get("decided_at") else None,
            "decisionId": row.get("decision_id"),
            "note": row.get("decision_note"),
        }

    return {"item": item, "decided": decided}


# ── claim ─────────────────────────────────────────────────────────────────────

@router.post("/{submission_id}/claim")
def claim_review(
    submission_id: str,
    user: Annotated[dict, Depends(get_current_user)],
) -> dict:
    """Assign the current user as the enterprise reviewer for this submission."""
    row = _fetch_row(submission_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Submission not found")
    if row.get("decision"):
        raise HTTPException(status_code=409, detail="Submission already decided")
    if row.get("claimed_by") and row["claimed_by"] != user["id"]:
        raise HTTPException(status_code=409, detail="Submission already claimed by another reviewer")

    ensure_pg_clean()
    conn = get_pg_connection()
    now = datetime.now(timezone.utc)
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """
            UPDATE enterprise_review_queue
               SET claimed_by = %s,
                   claimed_at = %s,
                   updated_at = now()
             WHERE submission_id = %s
            RETURNING *
            """,
            [user["id"], now, submission_id],
        )
        updated = cur.fetchone()
    conn.commit()

    write_audit(
        actor_id=user["id"],
        actor_email=user.get("email"),
        actor_role=user.get("role"),
        action="enterprise_review_claim",
        target="enterprise_review_queue",
        target_id=submission_id,
        details=f"Claimed by {user.get('email')}",
        service="enterprise",
    )

    return {"item": _row_to_item(updated)}


# ── release ───────────────────────────────────────────────────────────────────

@router.post("/{submission_id}/release")
def release_review(
    submission_id: str,
    user: Annotated[dict, Depends(get_current_user)],
) -> dict:
    """Release a claim so another reviewer can take it."""
    row = _fetch_row(submission_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Submission not found")
    if row.get("decision"):
        raise HTTPException(status_code=409, detail="Submission already decided — cannot release")
    # Only the claimer (or an admin) may release.
    is_admin = (user.get("role") or "").lower() in {"admin", "superadmin", "super_admin"}
    if row.get("claimed_by") and row["claimed_by"] != user["id"] and not is_admin:
        raise HTTPException(status_code=403, detail="You do not hold this claim")

    ensure_pg_clean()
    conn = get_pg_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """
            UPDATE enterprise_review_queue
               SET claimed_by = NULL,
                   claimed_at = NULL,
                   updated_at = now()
             WHERE submission_id = %s
            RETURNING *
            """,
            [submission_id],
        )
        cur.fetchone()
    conn.commit()

    write_audit(
        actor_id=user["id"],
        actor_email=user.get("email"),
        actor_role=user.get("role"),
        action="enterprise_review_release",
        target="enterprise_review_queue",
        target_id=submission_id,
        details=f"Released by {user.get('email')}",
        service="enterprise",
    )

    return {"released": True}


# ── decide ────────────────────────────────────────────────────────────────────

@router.post("/{submission_id}/decide")
def decide_review(
    submission_id: str,
    user: Annotated[dict, Depends(get_current_user)],
    body: dict = Body(default={}),
) -> dict:
    """Record a final enterprise decision: 'accept' or 'rework'.

    Body: { decision: 'accept' | 'rework', note?: string, deciderInitials?: string }
    Returns: { result: EnterpriseDecisionResult }
    """
    row = _fetch_row(submission_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Submission not found")
    if row.get("decision"):
        raise HTTPException(status_code=409, detail="Submission already has a decision")

    decision = (body or {}).get("decision")
    valid = {"accept", "rework"}
    if decision not in valid:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid decision '{decision}'. Must be one of: {', '.join(sorted(valid))}.",
        )

    note = (body or {}).get("note") or None
    decision_id = _new_id("dec_")
    now = datetime.now(timezone.utc)

    ensure_pg_clean()
    conn = get_pg_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """
            UPDATE enterprise_review_queue
               SET decision      = %s,
                   decided_at    = %s,
                   decided_by    = %s,
                   decision_note = %s,
                   decision_id   = %s,
                   status        = %s,
                   updated_at    = now()
             WHERE submission_id = %s
            RETURNING *
            """,
            [
                decision,
                now,
                user["id"],
                note,
                decision_id,
                "accepted" if decision == "accept" else "rework_requested",
                submission_id,
            ],
        )
        updated = cur.fetchone()
    conn.commit()

    if updated is None:
        raise HTTPException(status_code=404, detail="Submission not found after update")

    # Accept = the money gate: complete the task + create the eligible payout.
    if decision == "accept":
        try:
            _release_payout_and_complete(dict(updated.get("data") or {}))
        except Exception:  # noqa: BLE001 — never block the decision on payout issues
            logger.exception("enterprise acceptance payout/complete failed for %s", submission_id)

    write_audit(
        actor_id=user["id"],
        actor_email=user.get("email"),
        actor_role=user.get("role"),
        action="enterprise_review_decide",
        target="enterprise_review_queue",
        target_id=submission_id,
        details=f"Decision '{decision}' by {user.get('email')}. note={note!r}",
        service="enterprise",
        extra={"decision": decision, "decisionId": decision_id},
    )

    result = {
        "submissionId": submission_id,
        "decision": decision,
        "decisionId": decision_id,
        "decidedAt": now.isoformat(),
    }
    return {"result": result}
