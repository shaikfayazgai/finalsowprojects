"""
Contributor domain router — /api/contributor/** plus the public credential
share endpoint /api/public/credentials/{shareId}.

All endpoints (except the public share) are Bearer-protected via
get_current_user. Many also accept an optional X-Contributor-Id header that
overrides the acting account id (used by admin tooling / impersonation). Bodies
are snake_case dicts returned directly (no success wrapper), per the contract.
"""

from __future__ import annotations

import json
import re
import secrets
from typing import Annotated, Any

import pyotp
from fastapi import (
    APIRouter,
    Body,
    Depends,
    File,
    Header,
    HTTPException,
    Query,
    Request,
    UploadFile,
)
from psycopg2.extras import Json

from shared.audit import write_audit
from shared.blob import blob_is_configured, upload_blob
from shared.deps import get_current_user
from shared.kafka_bus import publish_event
from shared.security import hash_password, verify_password

from contributor_app import db

router = APIRouter(prefix="/api/contributor", tags=["contributor"])
public_router = APIRouter(prefix="/api/public", tags=["contributor-public"])


# ── acting-account resolver (token + optional X-Contributor-Id override) ──────

def acting_account_id(
    user: Annotated[dict, Depends(get_current_user)],
    x_contributor_id: Annotated[str | None, Header(alias="X-Contributor-Id")] = None,
) -> int:
    raw = x_contributor_id or user.get("id")
    try:
        account_id = int(raw)
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="Invalid contributor id")
    db.seed_demo_data(account_id)
    return account_id


AcctId = Annotated[int, Depends(acting_account_id)]


def _require(row: dict[str, Any] | None, what: str = "Resource") -> dict[str, Any]:
    if row is None:
        raise HTTPException(status_code=404, detail=f"{what} not found")
    return row


def _parse_dt(v: Any):
    """Parse a DB timestamp (the db layer returns ISO strings) to a tz-aware
    datetime so it can be compared/bucketed. Returns None if unparseable."""
    from datetime import datetime, timezone
    if v is None:
        return None
    if isinstance(v, datetime):
        return v if v.tzinfo else v.replace(tzinfo=timezone.utc)
    try:
        dt = datetime.fromisoformat(str(v).replace("Z", "+00:00"))
    except ValueError:
        return None
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


# ════════════════════════════════════════════════════════════════════════════
# Dashboard
# ════════════════════════════════════════════════════════════════════════════

@router.get("/dashboard")
async def dashboard(account_id: AcctId):
    acct = db.get_account(account_id) or {}
    tasks = db.fetch_all("SELECT * FROM contributor_tasks WHERE account_id=%s", (account_id,))
    earnings = db.fetch_all("SELECT * FROM contributor_earnings WHERE account_id=%s", (account_id,))
    unread = db.fetch_one(
        "SELECT COUNT(*) AS c FROM contributor_notifications WHERE account_id=%s AND is_read=FALSE",
        (account_id,),
    )
    total_earned = sum(float(e.get("amount", 0)) for e in earnings if e.get("status") in ("cleared", "paid"))
    pending_earned = sum(float(e.get("amount", 0)) for e in earnings if e.get("status") == "pending")
    return {
        "contributor": {
            "id": str(account_id),
            "name": (acct.get("name") or "").strip() or acct.get("email", ""),
            "email": acct.get("email", ""),
        },
        "stats": {
            "active_tasks": len([t for t in tasks if t.get("status") in ("assigned", "in_progress")]),
            "available_tasks": len([t for t in tasks if t.get("status") == "available"]),
            "completed_tasks": len([t for t in tasks if t.get("status") == "completed"]),
            "total_earned": total_earned,
            "pending_earnings": pending_earned,
            "unread_notifications": int(unread["c"]) if unread else 0,
        },
        "recent_tasks": tasks[:5],
        "recent_earnings": earnings[:5],
    }


# ════════════════════════════════════════════════════════════════════════════
# Notifications
# ════════════════════════════════════════════════════════════════════════════

@router.get("/notifications")
async def list_notifications(account_id: AcctId, page: int = 1, page_size: int = 20):
    rows = db.fetch_all(
        "SELECT * FROM contributor_notifications WHERE account_id=%s ORDER BY created_at DESC",
        (account_id,),
    )
    result = db.paginate(rows, page, page_size)
    result["unread_count"] = len([r for r in rows if not r.get("is_read")])
    return result


@router.patch("/notifications/{notif_id}/read")
async def mark_notification_read(account_id: AcctId, notif_id: int):
    row = db.execute(
        "UPDATE contributor_notifications SET is_read=TRUE WHERE id=%s AND account_id=%s RETURNING *",
        (notif_id, account_id),
    )
    return _require(row, "Notification")


@router.post("/notifications/read-all")
async def mark_all_read(account_id: AcctId):
    db.execute(
        "UPDATE contributor_notifications SET is_read=TRUE WHERE account_id=%s", (account_id,)
    )
    return {"ok": True}


# ════════════════════════════════════════════════════════════════════════════
# Settings
# ════════════════════════════════════════════════════════════════════════════

def _settings_row(account_id: int) -> dict[str, Any]:
    row = db.fetch_one("SELECT * FROM contributor_settings WHERE account_id=%s", (account_id,))
    if row is None:
        db.execute(
            "INSERT INTO contributor_settings (account_id, data) VALUES (%s, %s) "
            "ON CONFLICT (account_id) DO NOTHING",
            (account_id, Json({})),
        )
        row = db.fetch_one("SELECT * FROM contributor_settings WHERE account_id=%s", (account_id,))
    return row


@router.get("/settings")
async def get_settings(account_id: AcctId):
    return _settings_row(account_id)


def _merge_settings(account_id: int, section: str | None, payload: dict) -> dict[str, Any]:
    row = _settings_row(account_id)
    data = {k: v for k, v in row.items() if k not in ("account_id", "mfa_enabled", "mfa_secret", "updated_at")}
    data.pop("id", None)
    if section:
        merged = {**(data.get(section) or {}), **payload}
        data[section] = merged
    else:
        data.update(payload)
    db.execute(
        "UPDATE contributor_settings SET data=%s, updated_at=now() WHERE account_id=%s",
        (Json(data), account_id),
    )
    return _settings_row(account_id)


@router.patch("/settings")
async def update_settings(account_id: AcctId, payload: dict = Body(default={})):
    return _merge_settings(account_id, None, payload)


@router.patch("/settings/account")
async def update_settings_account(account_id: AcctId, payload: dict = Body(default={})):
    return _merge_settings(account_id, "account", payload)


@router.patch("/settings/notifications")
async def update_settings_notifications(account_id: AcctId, payload: dict = Body(default={})):
    return _merge_settings(account_id, "notifications", payload)


@router.patch("/settings/locale")
async def update_settings_locale(account_id: AcctId, payload: dict = Body(default={})):
    return _merge_settings(account_id, "locale", payload)


@router.post("/settings/security/2fa/setup")
async def twofa_setup(account_id: AcctId):
    acct = db.get_account(account_id) or {}
    row = _settings_row(account_id)
    secret = row.get("mfa_secret") or pyotp.random_base32()
    db.execute("UPDATE contributor_settings SET mfa_secret=%s WHERE account_id=%s", (secret, account_id))
    otpauth = pyotp.totp.TOTP(secret).provisioning_uri(
        name=acct.get("email", "contributor"), issuer_name="Glimmora"
    )
    return {"secret": secret, "otpauth_uri": otpauth}


@router.post("/settings/security/2fa/verify")
async def twofa_verify(account_id: AcctId, payload: dict = Body(default={})):
    code = str(payload.get("code", ""))
    row = _settings_row(account_id)
    secret = row.get("mfa_secret")
    if not secret:
        raise HTTPException(status_code=409, detail="Run 2fa/setup first")
    if not pyotp.TOTP(secret).verify(code, valid_window=1):
        raise HTTPException(status_code=400, detail="Invalid code")
    db.execute("UPDATE contributor_settings SET mfa_enabled=TRUE WHERE account_id=%s", (account_id,))
    db.execute("UPDATE login_accounts SET mfa_enabled=TRUE, mfa_secret=%s WHERE id=%s", (secret, account_id))
    return {"ok": True, "mfa_enabled": True}


@router.post("/settings/security/2fa/disable")
async def twofa_disable(account_id: AcctId):
    db.execute("UPDATE contributor_settings SET mfa_enabled=FALSE, mfa_secret=NULL WHERE account_id=%s",
               (account_id,))
    db.execute("UPDATE login_accounts SET mfa_enabled=FALSE, mfa_secret=NULL WHERE id=%s", (account_id,))
    return {"ok": True, "mfa_enabled": False}


@router.post("/settings/security/change-password")
async def change_password(account_id: AcctId, payload: dict = Body(default={})):
    acct = db.get_account(account_id)
    if not acct:
        raise HTTPException(status_code=404, detail="Account not found")
    new_password = payload.get("new_password") or payload.get("newPassword")
    if not new_password:
        raise HTTPException(status_code=422, detail="new_password is required")
    old_password = payload.get("old_password") or payload.get("oldPassword")
    if acct.get("is_password_set") and acct.get("password_hash") and old_password is not None:
        if not verify_password(old_password, acct["password_hash"]):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
    db.execute(
        "UPDATE login_accounts SET password_hash=%s, is_password_set=TRUE, updated_at=now() WHERE id=%s",
        (hash_password(new_password), account_id),
    )
    return {"ok": True}


# ════════════════════════════════════════════════════════════════════════════
# Tasks + Workroom
# ════════════════════════════════════════════════════════════════════════════

def _get_task(account_id: int, task_id: int) -> dict[str, Any]:
    row = db.fetch_one("SELECT * FROM contributor_tasks WHERE id=%s AND account_id=%s",
                       (task_id, account_id))
    return _require(row, "Task")


def _patch_task_data(account_id: int, task_id: int, mutate) -> dict[str, Any]:
    c = db.conn()
    from psycopg2.extras import RealDictCursor
    with c.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT data, status FROM contributor_tasks WHERE id=%s AND account_id=%s",
                    (task_id, account_id))
        row = cur.fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Task not found")
        data = dict(row["data"] or {})
        new_status = mutate(data)
        cur.execute(
            "UPDATE contributor_tasks SET data=%s, status=COALESCE(%s, status), updated_at=now() "
            "WHERE id=%s AND account_id=%s",
            (Json(data), new_status, task_id, account_id),
        )
    c.commit()
    return _get_task(account_id, task_id)


# contributor_tasks.status is the backend's lifecycle vocabulary
# (available -> assigned -> in_progress -> submitted -> completed, or declined).
# The contributor FE was built around the task-definition vocabulary
# (matched / in_progress / submitted / reviewed / accepted), so translate on the
# way out so the portal's status logic works. Internal logic still reads the raw
# DB status (accept/decline/submit/accept-impact all query contributor_tasks).
_FE_TASK_STATUS = {
    "available": "matched",
    "assigned": "matched",
    "in_progress": "in_progress",
    "submitted": "submitted",
    "completed": "accepted",
    "declined": "reviewed",
}


def _fe_status(raw: str | None) -> str:
    return _FE_TASK_STATUS.get((raw or "").lower(), raw or "matched")


def _task_ref(task_key) -> str:
    """Human-readable, role-shared task code: 'tsk_1281b0cd…' -> 'T-1281B0CD'.
    Must match the submissions service so contributor/mentor/reviewer agree."""
    s = str(task_key or "").strip()
    if not s:
        return "T-?"
    tail = s.split("_")[-1]
    hexpart = "".join(ch for ch in tail if ch.isalnum())[:8]
    return f"T-{hexpart.upper()}" if hexpart else f"T-{s}"


@router.get("/tasks")
async def list_tasks(
    account_id: AcctId,
    status: list[str] | None = Query(default=None),
    category: str | None = None,
    priority: str | None = None,
    limit: int = Query(default=50, ge=1, le=100),
    page: int = 1,
    page_size: int = 20,
):
    rows = db.fetch_all(
        "SELECT * FROM contributor_tasks WHERE account_id=%s ORDER BY updated_at DESC NULLS LAST, created_at DESC",
        (account_id,),
    )
    if status:
        status_set = set(status)
        rows = [r for r in rows if r.get("status") in status_set]
    if category:
        rows = [r for r in rows if r.get("category") == category]
    if priority:
        rows = [r for r in rows if r.get("priority") == priority]

    # Batch the latest-submission lookup into ONE query (was N+1: one fetch_one per
    # task → 40+ round-trips to remote Neon → ~18s for a busy contributor). DISTINCT
    # ON gives the newest submission per task in a single round-trip.
    latest_by_task: dict[str, dict] = {}
    try:
        # Read the REAL `submissions` table — the contributor submit AND the mentor
        # decide both write here. (Was reading a legacy `contributor_submissions`
        # table that the write path never touches, so latestSubmission came back
        # null → rework'd tasks never reached the Revisions lane and the contributor
        # saw the wrong status/lane.)
        sub_rows = db.fetch_all(
            "SELECT DISTINCT ON (task_definition_id) task_definition_id AS task_id, id, "
            "       version, status, submitted_at, created_at, updated_at "
            "FROM submissions WHERE account_id=%s "
            "ORDER BY task_definition_id, COALESCE(submitted_at, created_at) DESC, version DESC",
            (account_id,),
        )
        latest_by_task = {str(s.get("task_id")): s for s in sub_rows}
    except Exception:  # noqa: BLE001
        latest_by_task = {}

    # Fallback: the POST /tasks/{id}/submissions path writes to the legacy
    # `contributor_submissions` table. Fill in any task not already covered by
    # `submissions`, so a submitted/accepted task ALWAYS shows its submission —
    # otherwise latestSubmission stays null (task vanishes from Submissions, shows
    # no history in Completed, and the contributor sees a payout with "no submission").
    try:
        cs_rows = db.fetch_all(
            "SELECT DISTINCT ON (task_id) task_id, id, status, created_at, updated_at "
            "FROM contributor_submissions WHERE account_id=%s "
            "ORDER BY task_id, created_at DESC",
            (account_id,),
        )
        for s in cs_rows:
            k = str(s.get("task_id"))
            if k not in latest_by_task:
                latest_by_task[k] = {
                    "id": s.get("id"), "version": 1, "status": s.get("status"),
                    "submitted_at": s.get("created_at"), "created_at": s.get("created_at"),
                    "updated_at": s.get("updated_at"),
                }
    except Exception:  # noqa: BLE001
        pass

    # Normalise to the FE TaskDefinition shape so consumers never hit undefined fields.
    items = []
    for r in rows:
        d = r.get("data") if isinstance(r.get("data"), dict) else r  # data is flattened to r
        sub = latest_by_task.get(str(r["id"]))
        items.append({
            "id": str(r["id"]),
            "title": r.get("title") or "",
            "externalKey": d.get("externalKey") or d.get("external_key"),
            "status": _fe_status(r.get("status")),
            "requiredSkills": d.get("requiredSkills") or d.get("skills_required") or d.get("skills") or [],
            "estimatedHours": d.get("estimatedHours") or d.get("effort_hours") or 0,
            "complexity": d.get("complexity"),
            "acceptanceCriteria": d.get("acceptanceCriteria") or d.get("acceptance_criteria"),
            "agreedRatePerHour": r.get("reward"),
            "agreedCurrency": r.get("currency") or "USD",
            # FIXED price set by Glimmora — drives the contributor payout view
            # DIRECTLY. Without this the FE falls back to agreedRatePerHour ×
            # estimatedHours, which wrongly treated a FIXED ₹ amount as an hourly
            # rate (e.g. ₹3,000 fixed → ₹3,000 × 19h = ₹57,000). The contributor
            # sees exactly what Glimmora priced; hours are not part of the payout.
            "pricing": ({
                "payoutMode": "fixed",
                "fixedAmount": float(r.get("reward") or 0),
                "contributorPayout": float(r.get("reward") or 0),
                "estimatedHours": d.get("estimatedHours") or d.get("effort_hours"),
                "currency": r.get("currency") or "INR",
            } if (r.get("reward") or 0) else None),
            # Contributor pay (set by Glimmora at pricing). Paid IN FULL — GST is a
            # pass-through on the enterprise side, never deducted from the contributor.
            "payGrossMinor": int(round(float(r.get("reward") or 0) * 100)),
            "payNetMinor": int(round(float(r.get("reward") or 0) * 100)),
            "payCurrency": r.get("currency") or "INR",
            "assignedAt": d.get("assignedAt") or d.get("assigned_at"),
            "acceptedAt": d.get("acceptedAt") or d.get("accepted_at"),
            "updatedAt": r.get("updated_at"),
            "sow": d.get("sow"),
            "milestone": d.get("milestone"),
            "latestSubmission": {
                "id": str(sub["id"]),
                "version": sub.get("version", 1),
                "status": sub.get("status"),
                "submittedAt": sub.get("submitted_at") or sub.get("created_at"),
                "decidedAt": sub.get("updated_at"),
            } if sub else None,
            # Delivery deadline (set at assignment) — surfaced both ways so the
            # contributor's task card can show "due by".
            "dueDate": r.get("due_at") or d.get("dueAt"),
            "deadline": r.get("due_at") or d.get("dueAt"),
            # Keep legacy fields for backward compat
            "category": r.get("category"),
            "priority": r.get("priority") or "medium",
            "due_at": r.get("due_at"),
        })

    return {"items": items[:limit]}


@router.get("/tasks/summary")
async def tasks_summary(account_id: AcctId):
    rows = db.fetch_all("SELECT status FROM contributor_tasks WHERE account_id=%s", (account_id,))
    counts: dict[str, int] = {}
    for r in rows:
        counts[r["status"]] = counts.get(r["status"], 0) + 1
    return {"total": len(rows), "by_status": counts}


@router.get("/tasks/discovery/summary")
async def tasks_discovery_summary(account_id: AcctId):
    rows = db.fetch_all(
        "SELECT * FROM contributor_tasks WHERE account_id=%s AND status='available'", (account_id,)
    )
    by_cat: dict[str, int] = {}
    for r in rows:
        cat = r.get("category") or "other"
        by_cat[cat] = by_cat.get(cat, 0) + 1
    return {"available_count": len(rows), "by_category": by_cat,
            "recommended": rows[:5]}


@router.get("/tasks/completed")
async def list_completed_tasks(account_id: AcctId):
    """Completed/accepted work joined with its real payout (from `payouts`). Each row
    only exists because the task was submitted → reviewed → accepted → paid."""
    rows = db.fetch_all(
        "SELECT * FROM contributor_tasks WHERE account_id=%s AND status IN "
        "('completed','accepted','paid') ORDER BY updated_at DESC NULLS LAST", (account_id,))
    pay_by_task = {p["taskId"]: p for p in _real_payouts(account_id)}
    items: list[dict[str, Any]] = []
    total_earned = 0
    for r in rows:
        # db.fetch_all flattens the JSONB `data` into top-level row keys, so the
        # task fields (taskId, sowId, description, …) live directly on `r`.
        d = r
        tid = d.get("taskId") or str(r.get("id"))
        p = pay_by_task.get(tid)
        payout_minor = p["amountMinor"] if p else int(round(float(r.get("reward") or 0) * 100))
        payout_status = p["status"] if p else "eligible"
        if payout_status == "sent":
            total_earned += payout_minor
        items.append({
            "task": {
                "id": tid, "externalKey": "", "title": r.get("title") or "Task",
                "status": "completed", "description": d.get("description") or "",
                "acceptanceCriteria": [d.get("acceptanceCriteria")] if d.get("acceptanceCriteria") else [],
                "requiredSkills": d.get("skills_required") or d.get("requiredSkills") or [],
                "estimatedHours": d.get("estimatedHours") or 0, "complexity": d.get("complexity") or "medium",
                "agreedCurrency": r.get("currency") or "INR", "agreedRatePerHour": float(r.get("reward") or 0),
                "assignedAt": d.get("acceptedAt") or _iso(r.get("created_at")),
                "acceptedAt": d.get("acceptedAt") or _iso(r.get("created_at")),
                "decidedAt": _iso(r.get("updated_at")), "dueAt": _iso(r.get("due_at")) or d.get("dueAt"),
                "sow": d.get("sow") or {"id": d.get("sowId") or "", "title": "new sow flow going test", "tenantId": "", "tenantName": ""},
                "milestone": d.get("milestone"),
                "mentor": {"id": "54", "name": "SHAIK FAYAZ", "initials": "SF", "role": "mentor"},
                "round": 1, "totalRounds": 1, "criteriaAddressed": [True], "readinessPct": 100,
            },
            "payoutMinor": payout_minor,
            "payoutStatus": payout_status,
            "credentialId": None,
        })
    return {"items": items, "total": len(items), "totalEarnedMinor": total_earned}


@router.get("/tasks/{task_id}")
async def get_task(account_id: AcctId, task_id: int):
    r = _get_task(account_id, task_id)
    # The freelancer db helper SPREADS the `data` JSONB to top-level keys (so there's
    # often no nested "data" dict). Fall back to the flattened row `r` so brief fields
    # (skills, estimate, criteria) resolve instead of returning []/0/None.
    d = r.get("data") if isinstance(r.get("data"), dict) else r
    # The contributor's draft / submitted work lives in the `submissions` table
    # (written by the submissions service), NOT contributor_submissions. Read it
    # here so the workroom sees the open draft and the submitted version.
    canonical = d.get("taskId") or r.get("taskId") or str(task_id)
    tref = _task_ref(canonical)
    # Live delivery lifecycle stage (single source of truth = the decomposition task)
    # + the enterprise's reference files attached to the task (so the contributor
    # can actually open them).
    delivery_status = None
    task_attachments: list = []
    if canonical:
        try:
            _dt = db.fetch_one("SELECT status, attachments FROM decomp_tasks WHERE id=%s", (canonical,))
            delivery_status = (_dt or {}).get("status")
            _att = (_dt or {}).get("attachments")
            if isinstance(_att, list):
                task_attachments = _att
        except Exception:  # noqa: BLE001
            delivery_status = None
    subs_raw = db.fetch_all(
        "SELECT * FROM submissions WHERE task_definition_id=%s AND account_id=%s "
        "AND status NOT IN ('cancelled','superseded') ORDER BY version DESC, id DESC",
        (str(task_id), account_id),
    )
    subs = []
    for s in subs_raw:
        sp = s.get("payload") if isinstance(s.get("payload"), dict) else {}
        try:
            arts = db.fetch_all(
                "SELECT id, kind, name, url, size_bytes FROM contributor_submission_artifacts "
                "WHERE submission_id=%s ORDER BY created_at ASC", (s["id"],))
        except Exception:  # noqa: BLE001
            arts = []
        ver = s.get("version", 1)
        subs.append({
            "id": str(s["id"]),
            "version": ver,
            "status": s.get("status"),
            "body": s.get("body"),
            "payload": sp,
            "githubUrl": sp.get("githubUrl"),
            "taskRef": tref,
            "submissionRef": f"{tref}-SUB-v{ver}",
            "submittedAt": s.get("submitted_at"),
            "decidedAt": s.get("decided_at"),
            "decisionRationale": s.get("decision_rationale"),
            "artifacts": [{"id": str(a["id"]), "kind": a.get("kind"), "name": a.get("name"),
                           "url": a.get("url"), "sizeBytes": a.get("size_bytes")} for a in arts],
        })
    return {
        "task": {
            "id": str(r["id"]),
            "title": r.get("title") or "",
            "externalKey": d.get("externalKey") or d.get("external_key"),
            # Role-shared task id (same code the mentor/reviewer see). The freelancer
            # db helper spreads JSONB data to top-level keys, so check r too.
            "taskId": d.get("taskId") or r.get("taskId"),
            "taskRef": _task_ref(d.get("taskId") or r.get("taskId") or r["id"]),
            # Live delivery stage (submitted/qa_review/revision/completed) for status labels.
            "deliveryStatus": delivery_status,
            # Reference files the enterprise attached to the task — downloadable.
            "referenceFiles": d.get("referenceFiles") or d.get("attachments") or task_attachments or [],
            "description": d.get("description") or r.get("description"),
            "status": _fe_status(r.get("status")),
            "requiredSkills": d.get("requiredSkills") or d.get("skills_required") or d.get("skills") or [],
            "estimatedHours": d.get("estimatedHours") or d.get("effort_hours") or 0,
            "complexity": d.get("complexity"),
            "acceptanceCriteria": d.get("acceptanceCriteria") or d.get("acceptance_criteria"),
            "agreedRatePerHour": r.get("reward"),
            "agreedCurrency": r.get("currency") or "USD",
            # FIXED price set by Glimmora — drives the contributor payout view
            # DIRECTLY. Without this the FE falls back to agreedRatePerHour ×
            # estimatedHours, which wrongly treated a FIXED ₹ amount as an hourly
            # rate (e.g. ₹3,000 fixed → ₹3,000 × 19h = ₹57,000). The contributor
            # sees exactly what Glimmora priced; hours are not part of the payout.
            "pricing": ({
                "payoutMode": "fixed",
                "fixedAmount": float(r.get("reward") or 0),
                "contributorPayout": float(r.get("reward") or 0),
                "estimatedHours": d.get("estimatedHours") or d.get("effort_hours"),
                "currency": r.get("currency") or "INR",
            } if (r.get("reward") or 0) else None),
            # Contributor pay (set by Glimmora at pricing). Paid IN FULL — GST is a
            # pass-through on the enterprise side, never deducted from the contributor.
            "payGrossMinor": int(round(float(r.get("reward") or 0) * 100)),
            "payNetMinor": int(round(float(r.get("reward") or 0) * 100)),
            "payCurrency": r.get("currency") or "INR",
            "assignedAt": d.get("assignedAt") or d.get("assigned_at"),
            "acceptedAt": d.get("acceptedAt") or d.get("accepted_at"),
            "createdAt": r.get("created_at"),
            "updatedAt": r.get("updated_at"),
            "plan": d.get("plan"),
            "milestone": d.get("milestone"),
            "sow": d.get("sow"),
            "submissions": subs,
            # Delivery deadline (set at assignment).
            "dueDate": r.get("due_at") or d.get("dueAt"),
            "deadline": r.get("due_at") or d.get("dueAt"),
            # Legacy fields
            "category": r.get("category"),
            "priority": r.get("priority") or "medium",
            "due_at": r.get("due_at"),
            "checklist": d.get("checklist") or [],
            "workroom": d.get("workroom") or {},
            "timeline": d.get("timeline") or [],
        }
    }


@router.get("/tasks/{task_id}/history")
async def get_task_history(account_id: AcctId, task_id: int):
    """Full lifecycle history for a task: the quality ratings (mentor + QA → final)
    plus a chronological timeline — assigned → submitted (each version) → revisions →
    review decisions → QA approval + rating → payout eligible → paid."""
    r = _get_task(account_id, task_id)
    d = r.get("data") if isinstance(r.get("data"), dict) else {}
    canonical = d.get("taskId") or r.get("taskId") or str(task_id)
    tref = _task_ref(canonical)

    def _f(v):
        try:
            return round(float(v), 2) if v is not None else None
        except (ValueError, TypeError):
            return None

    # ── Quality ratings (recorded on QA approval; table created lazily) ──
    try:
        wr = db.fetch_one(
            "SELECT mentor_overall, qa_overall, final_rating, mentor_ratings, qa_ratings, created_at "
            "FROM work_ratings WHERE task_id=%s AND account_id=%s "
            "ORDER BY updated_at DESC NULLS LAST LIMIT 1",
            (str(canonical), account_id))
    except Exception:  # noqa: BLE001 — table doesn't exist until first QA approval
        wr = None
    ratings = None
    if wr:
        ratings = {
            "final": _f(wr.get("final_rating")),
            "mentorOverall": _f(wr.get("mentor_overall")),
            "qaOverall": _f(wr.get("qa_overall")),
            "mentorRatings": wr.get("mentor_ratings"),
            "qaRatings": wr.get("qa_ratings"),
            "ratedAt": _iso(wr.get("created_at")),
        }

    # ── Chronological timeline ──
    events = []

    def add(at, kind, label, meta=None):
        iso = _iso(at)
        if not iso:
            return
        events.append({"at": iso, "kind": kind, "label": label, "meta": meta or {}})

    add(d.get("assignedAt") or d.get("assigned_at") or r.get("created_at"), "assigned", "Task assigned to you")
    add(d.get("acceptedAt") or d.get("accepted_at"), "accepted", "You accepted the task")

    # Include superseded versions so the full revision journey shows (a superseded
    # version means a newer revision replaced it). Only drafts/cancelled are skipped.
    subs = db.fetch_all(
        "SELECT id, version, status, submitted_at, decided_at, decision_rationale "
        "FROM submissions WHERE task_definition_id=%s AND account_id=%s "
        "AND status NOT IN ('cancelled','draft') AND submitted_at IS NOT NULL "
        "ORDER BY version ASC, id ASC",
        (str(task_id), account_id))
    for s in subs:
        ver = s.get("version", 1)
        add(s.get("submitted_at"), "submitted", f"Submitted v{ver} for review",
            {"version": ver, "ref": f"{tref}-SUB-v{ver}"})
        st = (s.get("status") or "").lower()
        note = s.get("decision_rationale")
        if s.get("decided_at"):
            if st in ("accepted", "approved"):
                add(s.get("decided_at"), "accepted", f"Submission accepted (v{ver})", {"note": note})
            elif st == "rejected":
                add(s.get("decided_at"), "rejected", f"Submission rejected (v{ver})", {"note": note})
            else:  # feedback_requested / rework / revision / superseded → a revision was requested
                add(s.get("decided_at"), "revision", f"Returned for revision (v{ver})", {"note": note})

    if ratings and ratings.get("ratedAt"):
        bits = []
        if ratings.get("mentorOverall"):
            bits.append(f"mentor {ratings['mentorOverall']:.1f}")
        if ratings.get("qaOverall"):
            bits.append(f"QA {ratings['qaOverall']:.1f}")
        sub = f" ({' · '.join(bits)})" if bits else ""
        label = (f"QA approved · final rating {ratings['final']:.1f}/5{sub}"
                 if ratings.get("final") is not None else "QA approved")
        add(ratings["ratedAt"], "rating", label, {"ratings": ratings})

    try:
        # The freelancer payout stores the task ref in data.canonicalTaskId (the
        # task_id column may be null); match either.
        po = db.fetch_one(
            "SELECT amount_minor, currency, status, eligible_at, paid_at "
            "FROM payouts WHERE account_id=%s AND (data->>'canonicalTaskId'=%s OR task_id=%s) "
            "ORDER BY created_at DESC LIMIT 1",
            (account_id, str(canonical), str(canonical)))
    except Exception:  # noqa: BLE001
        po = None
    if po:
        cur_ = po.get("currency") or "INR"
        amt = f"{cur_} {int(po.get('amount_minor') or 0) / 100:,.0f}"
        add(po.get("eligible_at"), "payout_eligible", f"Payout eligible: {amt}")
        if (po.get("status") or "").lower() in ("paid", "sent", "released"):
            add(po.get("paid_at") or po.get("eligible_at"), "paid", f"Paid {amt}")

    events.sort(key=lambda e: e["at"])
    return {"taskRef": tref, "ratings": ratings, "timeline": events}


@router.get("/tasks/{task_id}/workroom")
async def get_workroom(account_id: AcctId, task_id: int):
    task = _get_task(account_id, task_id)
    return task.get("workroom") or {"links": [], "templates": [], "checklist": task.get("checklist", [])}


@router.get("/tasks/{task_id}/workroom/links")
async def get_workroom_links(account_id: AcctId, task_id: int):
    task = _get_task(account_id, task_id)
    return {"links": (task.get("workroom") or {}).get("links", [])}


@router.get("/tasks/{task_id}/workroom/templates")
async def get_workroom_templates(account_id: AcctId, task_id: int):
    task = _get_task(account_id, task_id)
    return {"templates": (task.get("workroom") or {}).get("templates", [])}


@router.get("/tasks/{task_id}/workroom/messages")
async def get_workroom_messages(account_id: AcctId, task_id: int):
    _get_task(account_id, task_id)
    rows = db.fetch_all(
        "SELECT * FROM contributor_task_messages WHERE task_id=%s ORDER BY created_at ASC", (task_id,)
    )
    return {"items": rows}


@router.post("/tasks/{task_id}/workroom/messages")
async def post_workroom_message(account_id: AcctId, task_id: int, payload: dict = Body(default={})):
    _get_task(account_id, task_id)
    row = db.execute(
        "INSERT INTO contributor_task_messages (task_id, account_id, author, body, data) "
        "VALUES (%s,%s,%s,%s,%s) RETURNING *",
        (task_id, account_id, payload.get("author", "contributor"),
         payload.get("body", ""), Json(payload)),
    )
    return row


@router.post("/tasks/{task_id}/workroom/uploads")
async def upload_workroom_file(account_id: AcctId, task_id: int, file: UploadFile = File(...)):
    _get_task(account_id, task_id)
    contents = await file.read()
    if not blob_is_configured():
        raise HTTPException(status_code=503,
                            detail="Blob storage is not configured (BLOB_READ_WRITE_TOKEN missing)")
    descriptor = await upload_blob(
        pathname=f"contributor/{account_id}/tasks/{task_id}/{file.filename}",
        data=contents,
        content_type=file.content_type,
    )
    row = db.execute(
        "INSERT INTO contributor_uploads (account_id, task_id, filename, url, content_type, size_bytes, data) "
        "VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING *",
        (account_id, task_id, file.filename, descriptor.get("url", ""),
         file.content_type, len(contents), Json(descriptor)),
    )
    return row


@router.delete("/tasks/{task_id}/workroom/uploads/{upload_id}")
async def delete_workroom_upload(account_id: AcctId, task_id: int, upload_id: int):
    row = db.execute(
        "DELETE FROM contributor_uploads WHERE id=%s AND task_id=%s AND account_id=%s RETURNING id",
        (upload_id, task_id, account_id),
    )
    _require(row, "Upload")
    return {"ok": True, "deleted_id": upload_id}


@router.patch("/tasks/{task_id}/workroom/checklist/{item_id}")
async def patch_checklist_item(account_id: AcctId, task_id: int, item_id: str, payload: dict = Body(default={})):
    def mutate(data: dict):
        checklist = data.get("checklist")
        if checklist is None:
            checklist = (data.get("workroom") or {}).get("checklist", [])
        for item in checklist:
            if str(item.get("id")) == str(item_id):
                if "done" in payload:
                    item["done"] = bool(payload["done"])
                if "label" in payload:
                    item["label"] = payload["label"]
        data["checklist"] = checklist
        return None
    return _patch_task_data(account_id, task_id, mutate)


@router.get("/tasks/{task_id}/timeline")
async def get_timeline(account_id: AcctId, task_id: int):
    task = _get_task(account_id, task_id)
    return {"items": task.get("timeline") or []}


def _append_timeline(account_id: int, task_id: int, event: str, status: str | None = None):
    from datetime import datetime, timezone

    def mutate(data: dict):
        timeline = data.get("timeline") or []
        timeline.append({"event": event, "at": datetime.now(timezone.utc).isoformat()})
        data["timeline"] = timeline
        return status
    return _patch_task_data(account_id, task_id, mutate)


@router.post("/tasks/{task_id}/request-extension")
async def request_extension(account_id: AcctId, task_id: int, payload: dict = Body(default={})):
    def mutate(data: dict):
        data["extension_request"] = payload
        return None
    _patch_task_data(account_id, task_id, mutate)
    return _append_timeline(account_id, task_id, "extension_requested")


@router.post("/tasks/{task_id}/start")
async def start_task(account_id: AcctId, task_id: int):
    return _append_timeline(account_id, task_id, "started", status="in_progress")


@router.post("/tasks/{task_id}/decline")
async def decline_task(account_id: AcctId, task_id: int, payload: dict = Body(default={})):
    canonical: dict[str, Any] = {}

    def mutate(data: dict):
        data["decline_reason"] = payload.get("reason", "")
        canonical["taskId"] = data.get("taskId")
        return "declined"
    out = _patch_task_data(account_id, task_id, mutate)
    # Canonical lifecycle: 'declined' → enterprise sees "Declined — reassign" and can
    # reassign the decomposition task (which sends it back to 'assigned').
    ctid = canonical.get("taskId")
    if ctid and str(ctid).startswith("tsk_"):
        try:
            db.execute("UPDATE decomp_tasks SET status='declined', updated_at=now() WHERE id=%s", (ctid,))
        except Exception:  # noqa: BLE001
            pass
    return out


@router.post("/tasks/{task_id}/accept")
async def accept_task(account_id: AcctId, task_id: int):
    """Contributor accepts an assigned task → moves it into active work.

    'Accept & start' in the FE: stamp acceptedAt and advance to in_progress so
    the task leaves the Ready lane and the accept prompt clears.
    """
    from datetime import datetime, timezone

    def mutate(data: dict):
        timeline = data.get("timeline") or []
        timeline.append({"event": "accepted", "at": datetime.now(timezone.utc).isoformat()})
        data["timeline"] = timeline
        data["acceptedAt"] = datetime.now(timezone.utc).isoformat()
        return "in_progress"

    return _patch_task_data(account_id, task_id, mutate)


@router.get("/tasks/{task_id}/accept-impact")
async def accept_impact(account_id: AcctId, task_id: int):
    task = _get_task(account_id, task_id)
    active = db.fetch_one(
        "SELECT COUNT(*) AS c FROM contributor_tasks WHERE account_id=%s AND status IN ('assigned','in_progress')",
        (account_id,),
    )
    return {
        "task_id": task_id,
        "reward": task.get("reward", 0),
        "current_active_tasks": int(active["c"]) if active else 0,
        "estimated_weekly_hours": (task.get("data") or {}).get("estimated_hours", 4),
        "conflicts": [],
    }


@router.get("/tasks/{task_id}/review-feedback")
async def review_feedback(account_id: AcctId, task_id: int):
    sub = db.fetch_one(
        "SELECT * FROM contributor_submissions WHERE task_id=%s AND account_id=%s ORDER BY created_at DESC",
        (task_id, account_id),
    )
    return {"task_id": task_id, "feedback": (sub or {}).get("feedback") if sub else None,
            "status": (sub or {}).get("status") if sub else None}


@router.get("/tasks/{task_id}/latest-submission")
async def latest_submission(account_id: AcctId, task_id: int):
    sub = db.fetch_one(
        "SELECT * FROM contributor_submissions WHERE task_id=%s AND account_id=%s ORDER BY created_at DESC",
        (task_id, account_id),
    )
    return sub or {}


@router.post("/tasks/{task_id}/submissions")
async def create_task_submission(account_id: AcctId, task_id: int, payload: dict = Body(default={})):
    task = _get_task(account_id, task_id)
    row = db.execute(
        "INSERT INTO contributor_submissions (account_id, task_id, status, summary, data) "
        "VALUES (%s,%s,'submitted',%s,%s) RETURNING *",
        (account_id, task_id, payload.get("summary", ""), Json(payload)),
    )
    db.execute("UPDATE contributor_tasks SET status='submitted', updated_at=now() WHERE id=%s AND account_id=%s",
               (task_id, account_id))
    publish_event("contributor.submission_created",
                  {"accountId": str(account_id), "taskId": task_id, "submissionId": row["id"]})
    # Two-stage review routing: external contributors go to the MENTOR queue
    # first (Glimmora QA), then the enterprise reviewer. Internal employees skip
    # the mentor. We create a pending mentor_reviews row here (shared DB) so the
    # submission shows up in the mentor queue. Failures are non-fatal.
    try:
        acct = db.fetch_one("SELECT email, first_name, last_name, role, department FROM login_accounts WHERE id=%s",
                            (account_id,))
        is_internal = bool(acct and (acct.get("role") == "employee"
                                     or (acct.get("department") or "").lower() == "internal"))
        if not is_internal:
            name = (f"{(acct or {}).get('first_name','') or ''} {(acct or {}).get('last_name','') or ''}".strip()
                    or (acct or {}).get("email") or f"Contributor {account_id}")
            title = (task or {}).get("title") or payload.get("summary") or "Task submission"
            url = payload.get("url") or payload.get("deliverableUrl")
            # Route to the mentor the Super Admin ASSIGNED to this task's SOW. If
            # none assigned, fall back to the open 'pool' so nothing gets stuck.
            mentor_id, mentor_email = "pool", None
            try:
                # The DB layer spreads the JSONB `data` into top-level row keys,
                # so sowId may live at task["sowId"] OR inside task["data"].
                tdata = (task or {}).get("data") or {}
                if isinstance(tdata, str):
                    import json as _j; tdata = _j.loads(tdata)
                sow_id = (task or {}).get("sowId") or tdata.get("sowId")
                if sow_id:
                    rec = db.fetch_one(
                        "SELECT data FROM admin_records WHERE kind='sow_mentor' AND name=%s "
                        "AND deleted_at IS NULL ORDER BY updated_at DESC LIMIT 1", (sow_id,))
                    # The DB layer spreads JSONB `data` into the row, so mentorId
                    # may be a top-level key OR inside rec["data"].
                    rec = rec or {}
                    rdata = rec.get("data") if isinstance(rec.get("data"), dict) else rec
                    if isinstance(rdata, str):
                        import json as _j; rdata = _j.loads(rdata)
                    if isinstance(rdata, dict) and rdata.get("mentorId"):
                        mentor_id = str(rdata["mentorId"]); mentor_email = rdata.get("mentorEmail")
            except Exception:  # noqa: BLE001
                mentor_id, mentor_email = "pool", None
            db.execute(
                "INSERT INTO mentor_reviews "
                "  (mentor_id, mentor_email, title, submission_type, contributor_id, contributor_name, "
                "   priority, status, payload) "
                "VALUES (%s,%s,%s,'assignment',%s,%s,'normal','pending',%s)",
                (mentor_id, mentor_email, title, str(account_id), name,
                 Json({"taskId": task_id, "submissionId": row["id"], "accountId": account_id,
                       "url": url, "summary": payload.get("summary", ""), "stage": "mentor"})),
            )
            # Notify the mentor (or the mentor pool) that a new submission awaits review.
            from shared.notify import create_notification, notify_role
            _mt = "New submission to review"
            _mb = f"{name} submitted “{title}” — it's waiting in your review queue."
            if mentor_id and str(mentor_id).isdigit():
                create_notification(int(mentor_id), category="action", kind="submission.received",
                    severity="important", title=_mt, body=_mb,
                    resource_type="submission", resource_id=str(row["id"]),
                    action_url="/mentor/queue", action_label="Open queue")
            else:
                notify_role(["mentor"], category="action", kind="submission.received",
                    severity="important", title=_mt, body=_mb,
                    resource_type="submission", resource_id=str(row["id"]),
                    action_url="/mentor/queue", action_label="Open queue")
    except Exception:  # noqa: BLE001 — review-queue wiring must never block submit
        pass
    return row


# ════════════════════════════════════════════════════════════════════════════
# Submissions
# ════════════════════════════════════════════════════════════════════════════

@router.get("/submissions")
async def list_submissions(account_id: AcctId, status: str | None = None, page: int = 1, page_size: int = 20):
    rows = db.fetch_all(
        "SELECT * FROM contributor_submissions WHERE account_id=%s ORDER BY created_at DESC", (account_id,)
    )
    if status:
        rows = [r for r in rows if r.get("status") == status]
    return db.paginate(rows, page, page_size)


@router.get("/submissions/{submission_id}")
async def get_submission(account_id: AcctId, submission_id: int):
    return _require(db.fetch_one(
        "SELECT * FROM contributor_submissions WHERE id=%s AND account_id=%s", (submission_id, account_id)
    ), "Submission")


@router.patch("/submissions/{submission_id}")
async def patch_submission(account_id: AcctId, submission_id: int, payload: dict = Body(default={})):
    existing = _require(db.fetch_one(
        "SELECT * FROM contributor_submissions WHERE id=%s AND account_id=%s", (submission_id, account_id)
    ), "Submission")
    merged = {**(existing.get("data") if isinstance(existing.get("data"), dict) else {}), **payload}
    row = db.execute(
        "UPDATE contributor_submissions SET summary=COALESCE(%s, summary), data=%s, updated_at=now() "
        "WHERE id=%s AND account_id=%s RETURNING *",
        (payload.get("summary"), Json(merged), submission_id, account_id),
    )
    return row


@router.post("/submissions/{submission_id}/resubmit")
async def resubmit_submission(account_id: AcctId, submission_id: int, payload: dict = Body(default={})):
    row = db.execute(
        "UPDATE contributor_submissions SET status='submitted', summary=COALESCE(%s, summary), updated_at=now() "
        "WHERE id=%s AND account_id=%s RETURNING *",
        (payload.get("summary"), submission_id, account_id),
    )
    return _require(row, "Submission")


# ════════════════════════════════════════════════════════════════════════════
# Earnings + Payouts
# ════════════════════════════════════════════════════════════════════════════

def _earnings_rows(account_id: int) -> list[dict[str, Any]]:
    return db.fetch_all(
        "SELECT * FROM contributor_earnings WHERE account_id=%s ORDER BY created_at DESC", (account_id,)
    )


def _iso(v: Any) -> str | None:
    if v is None:
        return None
    return v if isinstance(v, str) else v.isoformat()


def _real_payouts(account_id: int) -> list[dict[str, Any]]:
    """The contributor's REAL payouts from the canonical 3-party `payouts` table,
    mapped to the MockPayout shape the earnings UI consumes. Single source of truth —
    not the legacy/empty contributor_earnings/contributor_payouts tables."""
    rows = db.fetch_all(
        "SELECT id, task_title, amount_minor, currency, status, eligible_at, paid_at, "
        "external_ref, failure_reason, created_at, data->>'canonicalTaskId' AS tid, "
        "data->>'sowId' AS sow FROM payouts WHERE account_id=%s ORDER BY created_at DESC",
        (account_id,),
    )
    # Map the 3-party payout status → the contributor UI's PayoutStatus taxonomy.
    #   paid (Glimmora disbursed)      → sent      (counts as paid)
    #   released (enterprise released) → processing(in transit to contributor)
    #   requested (awaiting release)   → requested (in transit / pending)
    #   eligible                       → eligible
    STATUS_MAP = {"paid": "sent", "released": "processing", "requested": "requested",
                  "eligible": "eligible", "failed": "failed", "reversed": "failed"}
    out: list[dict[str, Any]] = []
    for r in rows:
        raw = r.get("status") or "eligible"
        sent_at = _iso(r.get("paid_at"))
        out.append({
            "id": str(r.get("id")),
            "taskId": r.get("tid") or "",
            "taskDefinitionId": r.get("tid") or "",
            "taskTitle": r.get("task_title") or "Task",
            "amountMinor": int(r.get("amount_minor") or 0),
            "currency": r.get("currency") or "INR",
            "status": STATUS_MAP.get(raw, raw),
            "eligibleAt": _iso(r.get("eligible_at") or r.get("created_at")),
            "sentAt": sent_at,        # earnings UI reads sentAt for paid/this-week/month
            "paidAt": sent_at,        # MockPayout compat
            "externalRef": r.get("external_ref"),
            "failureReason": r.get("failure_reason"),
            "project": r.get("sow") or "",
        })
    return out


@router.get("/earnings/summary")
async def earnings_summary(account_id: AcctId):
    """Earnings overview from the real payouts (MockPayout/EarningsSummary shape)."""
    rows = _real_payouts(account_id)
    paid = [r for r in rows if r["status"] == "sent"]
    pending = [r for r in rows if r["status"] in ("requested", "processing", "eligible")]
    all_time = sum(r["amountMinor"] for r in paid)
    return {
        "withdrawableMinor": 0,  # 3-party flow disburses on payout; nothing to self-withdraw
        "kpis": {"thisWeekMinor": all_time, "thisMonthMinor": all_time, "allTimeMinor": all_time},
        "pending": pending,
        "recent": [r for r in rows][:5],
    }


@router.get("/earnings/overview")
async def earnings_overview(account_id: AcctId):
    rows = _earnings_rows(account_id)
    by_status: dict[str, float] = {}
    for r in rows:
        by_status[r["status"]] = by_status.get(r["status"], 0) + float(r["amount"])
    return {"by_status": by_status, "recent": rows[:10], "currency": "USD"}


@router.get("/earnings/chart")
async def earnings_chart(account_id: AcctId):
    rows = _earnings_rows(account_id)
    monthly: dict[str, float] = {}
    for r in rows:
        month = str(r.get("created_at", ""))[:7]
        monthly[month] = monthly.get(month, 0) + float(r["amount"])
    series = [{"period": k, "amount": v} for k, v in sorted(monthly.items())]
    return {"series": series, "currency": "USD"}


@router.get("/earnings/kyc/status")
async def kyc_status(account_id: AcctId):
    row = db.fetch_one("SELECT * FROM contributor_kyc WHERE account_id=%s", (account_id,))
    if row is None:
        db.execute("INSERT INTO contributor_kyc (account_id, status, data) VALUES (%s,'not_started',%s) "
                   "ON CONFLICT (account_id) DO NOTHING", (account_id, Json({})))
        row = db.fetch_one("SELECT * FROM contributor_kyc WHERE account_id=%s", (account_id,))
    return row


@router.post("/earnings/kyc/start")
async def kyc_start(account_id: AcctId, payload: dict = Body(default={})):
    row = db.execute(
        "INSERT INTO contributor_kyc (account_id, status, data) VALUES (%s,'pending',%s) "
        "ON CONFLICT (account_id) DO UPDATE SET status='pending', data=EXCLUDED.data, updated_at=now() "
        "RETURNING *",
        (account_id, Json(payload)),
    )
    return row


@router.get("/earnings/export")
async def export_earnings(account_id: AcctId):
    """Export the contributor's earnings as a CSV download.

    Defined BEFORE /earnings/{earning_id} so the literal path isn't captured by
    the int path param.
    """
    import csv
    import io
    from fastapi.responses import Response

    rows = db.fetch_all(
        "SELECT id, task_id, amount, currency, status, description, created_at "
        "FROM contributor_earnings WHERE account_id=%s ORDER BY created_at DESC",
        (account_id,),
    )
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["id", "task_id", "amount", "currency", "status", "description", "created_at"])
    for r in rows:
        w.writerow([
            r.get("id"), r.get("task_id"), r.get("amount"), r.get("currency"),
            r.get("status"), r.get("description"), r.get("created_at"),
        ])
    return Response(
        content=buf.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=glimmora-earnings.csv"},
    )


@router.get("/earnings/{earning_id}")
async def get_earning(account_id: AcctId, earning_id: int):
    return _require(db.fetch_one(
        "SELECT * FROM contributor_earnings WHERE id=%s AND account_id=%s", (earning_id, account_id)
    ), "Earning")


@router.get("/earnings")
async def list_earnings(account_id: AcctId, status: str | None = None, page: int = 1, page_size: int = 20):
    rows = _earnings_rows(account_id)
    if status:
        rows = [r for r in rows if r.get("status") == status]
    return db.paginate(rows, page, page_size)


@router.get("/payouts")
async def list_payouts(account_id: AcctId, page: int = 1, page_size: int = 20):
    """The contributor's real payout ledger (from the canonical `payouts` table)."""
    rows = _real_payouts(account_id)
    return {"items": rows, "total": len(rows), "page": page, "limit": page_size}


@router.get("/payouts/{payout_id}")
async def get_payout(account_id: AcctId, payout_id: int):
    return _require(db.fetch_one(
        "SELECT * FROM contributor_payouts WHERE id=%s AND account_id=%s", (payout_id, account_id)
    ), "Payout")


@router.get("/payouts/{payout_id}/receipt")
async def get_payout_receipt(account_id: AcctId, payout_id: int):
    row = _require(db.fetch_one(
        "SELECT * FROM contributor_payouts WHERE id=%s AND account_id=%s", (payout_id, account_id)
    ), "Payout")
    acct = db.get_account(account_id) or {}
    return {
        "receipt_id": f"RCPT-{payout_id}",
        "payout_id": payout_id,
        "amount": row.get("amount"),
        "currency": row.get("currency"),
        "status": row.get("status"),
        "method": row.get("method"),
        "reference": row.get("reference"),
        "issued_to": acct.get("email"),
        "issued_at": row.get("created_at"),
    }


@router.get("/payout-preferences")
async def get_payout_preferences(account_id: AcctId):
    row = db.fetch_one("SELECT * FROM contributor_payout_preferences WHERE account_id=%s", (account_id,))
    if row is None:
        db.execute("INSERT INTO contributor_payout_preferences (account_id, data) VALUES (%s,%s) "
                   "ON CONFLICT (account_id) DO NOTHING", (account_id, Json({})))
        row = db.fetch_one("SELECT * FROM contributor_payout_preferences WHERE account_id=%s", (account_id,))
    return row


@router.put("/payout-preferences")
async def update_payout_preferences(account_id: AcctId, payload: dict = Body(default={})):
    row = db.execute(
        "INSERT INTO contributor_payout_preferences (account_id, data) VALUES (%s,%s) "
        "ON CONFLICT (account_id) DO UPDATE SET data=EXCLUDED.data, updated_at=now() RETURNING *",
        (account_id, Json(payload)),
    )
    return row


# ════════════════════════════════════════════════════════════════════════════
# Messages (threads)
# ════════════════════════════════════════════════════════════════════════════

@router.get("/messages/threads")
async def list_threads(account_id: AcctId, page: int = 1, page_size: int = 20):
    rows = db.fetch_all(
        "SELECT * FROM contributor_message_threads WHERE account_id=%s ORDER BY updated_at DESC", (account_id,)
    )
    return db.paginate(rows, page, page_size)


@router.get("/messages/threads/{thread_id}")
async def get_thread(account_id: AcctId, thread_id: int):
    thread = _require(db.fetch_one(
        "SELECT * FROM contributor_message_threads WHERE id=%s AND account_id=%s", (thread_id, account_id)
    ), "Thread")
    thread["messages"] = db.fetch_all(
        "SELECT * FROM contributor_thread_messages WHERE thread_id=%s ORDER BY created_at ASC", (thread_id,)
    )
    return thread


@router.post("/messages/threads/{thread_id}/messages")
async def post_thread_message(account_id: AcctId, thread_id: int, payload: dict = Body(default={})):
    _require(db.fetch_one(
        "SELECT id FROM contributor_message_threads WHERE id=%s AND account_id=%s", (thread_id, account_id)
    ), "Thread")
    row = db.execute(
        "INSERT INTO contributor_thread_messages (thread_id, account_id, author, body, data) "
        "VALUES (%s,%s,'contributor',%s,%s) RETURNING *",
        (thread_id, account_id, payload.get("body", ""), Json(payload)),
    )
    db.execute("UPDATE contributor_message_threads SET updated_at=now() WHERE id=%s", (thread_id,))
    return row


@router.post("/messages/threads/{thread_id}/read")
async def mark_thread_read(account_id: AcctId, thread_id: int):
    db.execute(
        "UPDATE contributor_thread_messages SET is_read=TRUE WHERE thread_id=%s AND account_id=%s",
        (thread_id, account_id),
    )
    return {"ok": True}


@router.post("/messages/{message_id}/rating")
async def rate_message(account_id: AcctId, message_id: int, payload: dict = Body(default={})):
    rating = payload.get("rating")
    row = db.execute(
        "UPDATE contributor_thread_messages SET rating=%s WHERE id=%s RETURNING *",
        (rating, message_id),
    )
    return _require(row, "Message")


# ════════════════════════════════════════════════════════════════════════════
# Learning
# ════════════════════════════════════════════════════════════════════════════

@router.get("/learning/recommendations")
async def learning_recommendations(account_id: AcctId):
    rows = db.fetch_all(
        "SELECT * FROM contributor_learning WHERE account_id=%s AND status!='dismissed' ORDER BY created_at DESC",
        (account_id,),
    )
    return {"items": rows}


@router.post("/learning/recommendations/{rec_id}/dismiss")
async def dismiss_recommendation(account_id: AcctId, rec_id: int):
    row = db.execute(
        "UPDATE contributor_learning SET status='dismissed' WHERE id=%s AND account_id=%s RETURNING *",
        (rec_id, account_id),
    )
    return _require(row, "Recommendation")


@router.post("/learning/recommendations/{rec_id}/mark-opened")
async def mark_recommendation_opened(account_id: AcctId, rec_id: int):
    row = db.execute(
        "UPDATE contributor_learning SET status='opened' WHERE id=%s AND account_id=%s RETURNING *",
        (rec_id, account_id),
    )
    return _require(row, "Recommendation")


# ════════════════════════════════════════════════════════════════════════════
# Support (tickets + grievances + safety reports + faqs)
# ════════════════════════════════════════════════════════════════════════════

@router.get("/support/tickets")
async def list_tickets(account_id: AcctId, page: int = 1, page_size: int = 20):
    rows = db.fetch_all(
        "SELECT * FROM contributor_support_tickets WHERE account_id=%s AND kind='ticket' ORDER BY created_at DESC",
        (account_id,),
    )
    return db.paginate(rows, page, page_size)


@router.post("/support/tickets")
async def create_ticket(account_id: AcctId, payload: dict = Body(default={})):
    row = db.execute(
        "INSERT INTO contributor_support_tickets (account_id, kind, subject, priority, data) "
        "VALUES (%s,'ticket',%s,%s,%s) RETURNING *",
        (account_id, payload.get("subject", ""), payload.get("priority", "normal"), Json(payload)),
    )
    return row


@router.get("/support/tickets/{ticket_id}")
async def get_ticket(account_id: AcctId, ticket_id: int):
    ticket = _require(db.fetch_one(
        "SELECT * FROM contributor_support_tickets WHERE id=%s AND account_id=%s AND kind='ticket'",
        (ticket_id, account_id),
    ), "Ticket")
    ticket["messages"] = db.fetch_all(
        "SELECT * FROM contributor_support_messages WHERE ticket_id=%s ORDER BY created_at ASC", (ticket_id,)
    )
    return ticket


@router.patch("/support/tickets/{ticket_id}")
async def patch_ticket(account_id: AcctId, ticket_id: int, payload: dict = Body(default={})):
    row = db.execute(
        "UPDATE contributor_support_tickets SET status=COALESCE(%s, status), "
        "subject=COALESCE(%s, subject), updated_at=now() "
        "WHERE id=%s AND account_id=%s AND kind='ticket' RETURNING *",
        (payload.get("status"), payload.get("subject"), ticket_id, account_id),
    )
    return _require(row, "Ticket")


@router.post("/support/tickets/{ticket_id}/messages")
async def post_ticket_message(account_id: AcctId, ticket_id: int, payload: dict = Body(default={})):
    _require(db.fetch_one(
        "SELECT id FROM contributor_support_tickets WHERE id=%s AND account_id=%s", (ticket_id, account_id)
    ), "Ticket")
    row = db.execute(
        "INSERT INTO contributor_support_messages (ticket_id, account_id, author, body) "
        "VALUES (%s,%s,'contributor',%s) RETURNING *",
        (ticket_id, account_id, payload.get("body", "")),
    )
    db.execute("UPDATE contributor_support_tickets SET updated_at=now() WHERE id=%s", (ticket_id,))
    return row


@router.get("/support/grievances")
async def list_grievances(account_id: AcctId, page: int = 1, page_size: int = 20):
    rows = db.fetch_all(
        "SELECT * FROM contributor_support_tickets WHERE account_id=%s AND kind='grievance' ORDER BY created_at DESC",
        (account_id,),
    )
    return db.paginate(rows, page, page_size)


@router.post("/support/grievances")
async def create_grievance(account_id: AcctId, payload: dict = Body(default={})):
    row = db.execute(
        "INSERT INTO contributor_support_tickets (account_id, kind, subject, priority, data) "
        "VALUES (%s,'grievance',%s,%s,%s) RETURNING *",
        (account_id, payload.get("subject", ""), payload.get("priority", "high"), Json(payload)),
    )
    return row


@router.get("/support/grievances/{grievance_id}")
async def get_grievance(account_id: AcctId, grievance_id: int):
    return _require(db.fetch_one(
        "SELECT * FROM contributor_support_tickets WHERE id=%s AND account_id=%s AND kind='grievance'",
        (grievance_id, account_id),
    ), "Grievance")


@router.get("/support/safety-reports")
async def list_safety_reports(account_id: AcctId, page: int = 1, page_size: int = 20):
    rows = db.fetch_all(
        "SELECT * FROM contributor_support_tickets WHERE account_id=%s AND kind='safety_report' ORDER BY created_at DESC",
        (account_id,),
    )
    return db.paginate(rows, page, page_size)


@router.post("/support/safety-reports")
async def create_safety_report(account_id: AcctId, payload: dict = Body(default={})):
    row = db.execute(
        "INSERT INTO contributor_support_tickets (account_id, kind, subject, priority, data) "
        "VALUES (%s,'safety_report',%s,'urgent',%s) RETURNING *",
        (account_id, payload.get("subject", "Safety report"), Json(payload)),
    )
    write_audit(actor_id=str(account_id), actor_email=None, actor_role="contributor",
                action="safety_report_filed", service="contributor-service",
                target_id=str(row["id"]))
    return row


@router.get("/support/safety-reports/{report_id}")
async def get_safety_report(account_id: AcctId, report_id: int):
    return _require(db.fetch_one(
        "SELECT * FROM contributor_support_tickets WHERE id=%s AND account_id=%s AND kind='safety_report'",
        (report_id, account_id),
    ), "Safety report")


@router.get("/support/faqs")
async def support_faqs(account_id: AcctId):
    return {"items": [
        {"id": "faq1", "question": "How do I get paid?",
         "answer": "Complete a task, get it approved, then request a payout once your balance clears."},
        {"id": "faq2", "question": "How do I accept a task?",
         "answer": "Open the task and click Accept; check the accept-impact preview first."},
        {"id": "faq3", "question": "What is KYC?",
         "answer": "Identity verification required before your first payout."},
    ]}


# ════════════════════════════════════════════════════════════════════════════
# Credentials + wallet + shares
# ════════════════════════════════════════════════════════════════════════════

@router.get("/credentials")
async def list_credentials(
    account_id: AcctId,
    skill: str | None = None,
    date_filter: str | None = None,
    page: int = 1,
    page_size: int = 20,
):
    rows = db.fetch_all(
        "SELECT * FROM contributor_credentials WHERE account_id=%s ORDER BY issued_at DESC", (account_id,)
    )
    # skill filter — match against skill tags stored inside data.skills[]
    if skill:
        skill_lower = skill.lower()
        filtered = []
        for r in rows:
            d = r.get("data") if isinstance(r.get("data"), dict) else {}
            tags = [str(s).lower() for s in (d.get("skills") or [])]
            if skill_lower in tags or skill_lower in str(r.get("title", "")).lower():
                filtered.append(r)
        rows = filtered
    # date_filter: "30d" | "90d" | "6m"
    if date_filter:
        from datetime import timedelta
        delta_map = {"30d": 30, "90d": 90, "6m": 180}
        days = delta_map.get(date_filter)
        if days:
            cutoff = db._now().isoformat()
            from datetime import timedelta as _td
            cutoff_dt = db._now() - _td(days=days)
            filtered = []
            for r in rows:
                issued = r.get("issued_at") or ""
                if issued and str(issued) >= cutoff_dt.isoformat()[:10]:
                    filtered.append(r)
            rows = filtered
    return db.paginate(rows, page, page_size)


@router.get("/credentials/wallet/summary")
async def wallet_summary(account_id: AcctId):
    rows = db.fetch_all("SELECT status FROM contributor_credentials WHERE account_id=%s", (account_id,))
    by_status: dict[str, int] = {}
    for r in rows:
        by_status[r["status"]] = by_status.get(r["status"], 0) + 1
    return {"total": len(rows), "by_status": by_status}


@router.post("/credentials/wallet/summary", status_code=201)
async def wallet_summary_post(account_id: AcctId, payload: dict = Body(default={})):
    """Store a custom wallet summary annotation (e.g. a category grouping) linked to
    the current contributor. Requires `category` field. Persisted in a credential row
    with kind='wallet_summary'."""
    category = payload.get("category")
    if not category:
        raise HTTPException(status_code=422, detail="Category field is required.")
    row = db.execute(
        "INSERT INTO contributor_credentials (account_id, title, issuer, kind, status, data) "
        "VALUES (%s, %s, 'Glimmora', 'wallet_summary', 'issued', %s) RETURNING *",
        (account_id, f"Wallet summary — {category}", Json(payload)),
    )
    write_audit(
        actor_id=str(account_id), actor_email=None, actor_role="contributor",
        action="wallet_summary_created", service="contributor-service",
        target_id=str(row["id"]),
        extra={"category": category},
    )
    return row


@router.get("/credentials/wallet/cards")
async def wallet_cards(account_id: AcctId):
    rows = db.fetch_all(
        "SELECT * FROM contributor_credentials WHERE account_id=%s ORDER BY issued_at DESC", (account_id,)
    )
    return {"cards": rows}


@router.get("/credentials/skills/verification")
async def skills_verification(account_id: AcctId):
    creds = db.fetch_all(
        "SELECT * FROM contributor_credentials WHERE account_id=%s", (account_id,)
    )
    skills: dict[str, str] = {}
    for c in creds:
        for s in (c.get("data") or {}).get("skills", []) if isinstance(c.get("data"), dict) else []:
            skills[s] = "verified"
    return {"verified_skills": skills, "credentials_count": len(creds)}


def _get_credential(account_id: int, credential_id: int) -> dict[str, Any]:
    return _require(db.fetch_one(
        "SELECT * FROM contributor_credentials WHERE id=%s AND account_id=%s", (credential_id, account_id)
    ), "Credential")


@router.get("/credentials/{credential_id}")
async def get_credential(account_id: AcctId, credential_id: int):
    return _get_credential(account_id, credential_id)


@router.get("/credentials/{credential_id}/certificate")
async def get_certificate(account_id: AcctId, credential_id: int):
    cred = _get_credential(account_id, credential_id)
    acct = db.get_account(account_id) or {}
    return {
        "credential_id": credential_id,
        "title": cred.get("title"),
        "issuer": cred.get("issuer"),
        "holder": (acct.get("name") or "").strip() or acct.get("email"),
        "verification_code": cred.get("verification_code"),
        "issued_at": cred.get("issued_at"),
        "certificate_url": (cred.get("data") or {}).get("certificate_url"),
    }


@router.get("/credentials/{credential_id}/verification")
async def get_verification(account_id: AcctId, credential_id: int):
    cred = _get_credential(account_id, credential_id)
    return {
        "credential_id": credential_id,
        "verification_code": cred.get("verification_code"),
        "status": cred.get("status"),
        "verified": cred.get("status") == "issued",
    }


@router.post("/credentials/{credential_id}/share")
async def share_credential(account_id: AcctId, credential_id: int, payload: dict = Body(default={})):
    _get_credential(account_id, credential_id)
    share_id = secrets.token_urlsafe(10)
    row = db.execute(
        "INSERT INTO credential_shares (share_id, credential_id, account_id, data) "
        "VALUES (%s,%s,%s,%s) RETURNING *",
        (share_id, credential_id, account_id, Json(payload)),
    )
    row["share_url"] = f"/api/public/credentials/{share_id}"
    return row


@router.post("/credentials/{credential_id}/academic-portfolio")
async def add_to_academic_portfolio(account_id: AcctId, credential_id: int, payload: dict = Body(default={})):
    cred = _get_credential(account_id, credential_id)
    data = cred.get("data") if isinstance(cred.get("data"), dict) else {}
    data["academic_portfolio"] = {**(data.get("academic_portfolio") or {}), **payload, "added": True}
    row = db.execute(
        "UPDATE contributor_credentials SET data=%s WHERE id=%s AND account_id=%s RETURNING *",
        (Json(data), credential_id, account_id),
    )
    return row


# ════════════════════════════════════════════════════════════════════════════
# Profile + evidence + digital twin + search
# ════════════════════════════════════════════════════════════════════════════

def _profile(account_id: int) -> dict[str, Any]:
    acct = db.get_account(account_id) or {}
    prof = db.fetch_one("SELECT * FROM contributor_profiles WHERE account_id=%s", (account_id,)) or {}
    return {
        "id": str(account_id),
        "email": acct.get("email"),
        "first_name": acct.get("first_name"),
        "last_name": acct.get("last_name"),
        "name": acct.get("name"),
        "phone": acct.get("phone"),
        "bio": prof.get("bio"),
        "job_title": prof.get("job_title"),
        "country": prof.get("country"),
        "city": prof.get("city"),
        "timezone": prof.get("timezone"),
        "primary_skills": prof.get("primary_skills") or [],
        "secondary_skills": prof.get("secondary_skills") or [],
        "other_skills": prof.get("other_skills") or [],
        "linkedin": prof.get("linkedin"),
        "availability": prof.get("availability"),
    }


@router.get("/profile")
async def get_profile(account_id: AcctId):
    return _profile(account_id)


@router.patch("/profile")
async def patch_profile(account_id: AcctId, payload: dict = Body(default={})):
    # account-level fields
    if any(k in payload for k in ("first_name", "last_name", "phone")):
        db.execute(
            "UPDATE login_accounts SET first_name=COALESCE(%s, first_name), "
            "last_name=COALESCE(%s, last_name), phone=COALESCE(%s, phone), "
            "name=TRIM(COALESCE(%s, first_name) || ' ' || COALESCE(%s, last_name)), updated_at=now() "
            "WHERE id=%s",
            (payload.get("first_name"), payload.get("last_name"), payload.get("phone"),
             payload.get("first_name"), payload.get("last_name"), account_id),
        )
    # ensure a profile row exists, then update profile-level fields
    db.execute("INSERT INTO contributor_profiles (account_id) VALUES (%s) ON CONFLICT (account_id) DO NOTHING",
               (account_id,))
    db.execute(
        "UPDATE contributor_profiles SET bio=COALESCE(%s, bio), job_title=COALESCE(%s, job_title), "
        "country=COALESCE(%s, country), city=COALESCE(%s, city), timezone=COALESCE(%s, timezone), "
        "linkedin=COALESCE(%s, linkedin), availability=COALESCE(%s, availability), "
        "years_experience=COALESCE(%s, years_experience), updated_at=now() "
        "WHERE account_id=%s",
        (payload.get("bio"), payload.get("job_title"), payload.get("country"), payload.get("city"),
         payload.get("timezone"), payload.get("linkedin"), payload.get("availability"),
         payload.get("years_experience"), account_id),
    )
    return _profile(account_id)


@router.put("/profile/skills")
async def update_skills(account_id: AcctId, payload: dict = Body(default={})):
    db.execute("INSERT INTO contributor_profiles (account_id) VALUES (%s) ON CONFLICT (account_id) DO NOTHING",
               (account_id,))
    db.execute(
        "UPDATE contributor_profiles SET primary_skills=%s, secondary_skills=%s, other_skills=%s, updated_at=now() "
        "WHERE account_id=%s",
        (payload.get("primary_skills") or [], payload.get("secondary_skills") or [],
         payload.get("other_skills") or [], account_id),
    )
    return _profile(account_id)


# ── Structured skill registry (level + category persist) ───────────────────
_SKILL_CAT_HINTS = {
    "design": ("figma", "ui", "ux", "prototyp", "wireframe", "design", "accessib"),
    "data": ("sql", "pandas", "tableau", "machine learning", "ml", "data", "airflow", "scikit"),
}


def _skill_slug(name: str) -> str:
    return "skill-" + re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def _guess_skill_category(name: str) -> str:
    low = name.lower()
    for cat, hints in _SKILL_CAT_HINTS.items():
        if any(h in low for h in hints):
            return cat
    return "engineering"


def _skill_to_fe(r: dict[str, Any]) -> dict[str, Any]:
    d = r.get("data") if isinstance(r.get("data"), dict) else {}
    return {
        "id": r["slug"],
        "name": r.get("name") or "",
        "level": r.get("level") or "L2",
        "category": r.get("category") or "engineering",
        "tasksCompletedWithThisSkill": int(d.get("tasksCompleted", 0) or 0),
        "evidenceCount": int(r.get("evidence_count") or 0),
    }


def _resync_profile_skills(account_id: int) -> None:
    """Keep contributor_profiles.primary_skills in sync with the structured table
    so skill-matching / the /track read stay consistent."""
    names = [
        r["name"]
        for r in db.fetch_all(
            "SELECT name FROM contributor_skills WHERE account_id=%s ORDER BY created_at", (account_id,)
        )
    ]
    db.execute("INSERT INTO contributor_profiles (account_id) VALUES (%s) ON CONFLICT (account_id) DO NOTHING",
               (account_id,))
    db.execute(
        "UPDATE contributor_profiles SET primary_skills=%s, updated_at=now() WHERE account_id=%s",
        (names, account_id),
    )


@router.get("/skills")
async def list_skills(account_id: AcctId):
    rows = db.fetch_all(
        "SELECT * FROM contributor_skills WHERE account_id=%s ORDER BY created_at", (account_id,)
    )
    # One-time backfill from the onboarding skill arrays so existing accounts keep
    # their declared skills (primary→L3, secondary→L2, other→L1).
    if not rows:
        prof = db.fetch_one(
            "SELECT primary_skills, secondary_skills, other_skills FROM contributor_profiles WHERE account_id=%s",
            (account_id,),
        )
        if prof:
            def seed(names, level):
                for n in (names or []):
                    nm = (n or "").strip()
                    if not nm:
                        continue
                    db.execute(
                        "INSERT INTO contributor_skills (account_id, slug, name, category, level) "
                        "VALUES (%s,%s,%s,%s,%s) ON CONFLICT (account_id, slug) DO NOTHING",
                        (account_id, _skill_slug(nm), nm, _guess_skill_category(nm), level),
                    )
            seed(prof.get("primary_skills"), "L3")
            seed(prof.get("secondary_skills"), "L2")
            seed(prof.get("other_skills"), "L1")
        rows = db.fetch_all(
            "SELECT * FROM contributor_skills WHERE account_id=%s ORDER BY created_at", (account_id,)
        )
    items = [_skill_to_fe(r) for r in rows]
    return {"items": items, "total": len(items)}


@router.post("/skills", status_code=201)
async def add_skill(account_id: AcctId, payload: dict = Body(default={})):
    name = (payload.get("name") or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Skill name is required.")
    slug = _skill_slug(name)
    from psycopg2.extras import Json
    row = db.execute(
        "INSERT INTO contributor_skills (account_id, slug, name, category, level, data) "
        "VALUES (%s,%s,%s,%s,%s,%s) "
        "ON CONFLICT (account_id, slug) DO UPDATE SET name=EXCLUDED.name, "
        "category=EXCLUDED.category, level=EXCLUDED.level, data=EXCLUDED.data RETURNING *",
        (account_id, slug, name, payload.get("category") or "engineering", payload.get("level") or "L2",
         Json({"years": payload.get("years") or ""})),
    )
    _resync_profile_skills(account_id)
    return _skill_to_fe(row)


@router.get("/skills/{slug}")
async def get_skill(account_id: AcctId, slug: str):
    r = _require(
        db.fetch_one("SELECT * FROM contributor_skills WHERE account_id=%s AND slug=%s", (account_id, slug)),
        "Skill",
    )
    return {"skill": _skill_to_fe(r), "tasksUsingSkill": [], "credentialsForSkill": []}


@router.delete("/skills/{slug}")
async def delete_skill(account_id: AcctId, slug: str):
    db.execute("DELETE FROM contributor_skills WHERE account_id=%s AND slug=%s", (account_id, slug))
    _resync_profile_skills(account_id)
    return {"ok": True}


@router.get("/profile/evidence")
async def list_evidence(account_id: AcctId):
    rows = db.fetch_all(
        "SELECT * FROM contributor_evidence WHERE account_id=%s AND status!='deleted' ORDER BY created_at DESC",
        (account_id,),
    )
    return {"items": rows}


@router.post("/profile/evidence")
async def create_evidence(account_id: AcctId, payload: dict = Body(default={})):
    row = db.execute(
        "INSERT INTO contributor_evidence (account_id, title, kind, url, data) VALUES (%s,%s,%s,%s,%s) RETURNING *",
        (account_id, payload.get("title", ""), payload.get("kind", "link"),
         payload.get("url"), Json(payload)),
    )
    return row


@router.patch("/profile/evidence/{evidence_id}")
async def patch_evidence(account_id: AcctId, evidence_id: int, payload: dict = Body(default={})):
    row = db.execute(
        "UPDATE contributor_evidence SET title=COALESCE(%s, title), kind=COALESCE(%s, kind), "
        "url=COALESCE(%s, url) WHERE id=%s AND account_id=%s RETURNING *",
        (payload.get("title"), payload.get("kind"), payload.get("url"), evidence_id, account_id),
    )
    return _require(row, "Evidence")


@router.delete("/profile/evidence/{evidence_id}")
async def delete_evidence(account_id: AcctId, evidence_id: int):
    row = db.execute(
        "UPDATE contributor_evidence SET status='deleted' WHERE id=%s AND account_id=%s RETURNING id",
        (evidence_id, account_id),
    )
    _require(row, "Evidence")
    return {"ok": True, "deleted_id": evidence_id}


def _build_digital_twin(account_id: int) -> dict[str, Any]:
    profile = _profile(account_id)
    tasks = db.fetch_all("SELECT status FROM contributor_tasks WHERE account_id=%s", (account_id,))
    creds = db.fetch_all("SELECT id FROM contributor_credentials WHERE account_id=%s", (account_id,))
    earnings = _earnings_rows(account_id)
    return {
        "account_id": str(account_id),
        "skills": (profile.get("primary_skills") or []) + (profile.get("secondary_skills") or []),
        "tasks_completed": len([t for t in tasks if t.get("status") == "completed"]),
        "credentials_count": len(creds),
        "total_earned": sum(float(e["amount"]) for e in earnings if e["status"] in ("cleared", "paid")),
        "profile_completeness": _completeness(profile),
    }


def _completeness(profile: dict) -> int:
    """Backward-compatible basic completeness (used by digital twin)."""
    fields = ["bio", "job_title", "country", "timezone", "primary_skills", "linkedin"]
    filled = sum(1 for f in fields if profile.get(f))
    return int(filled / len(fields) * 100)


# ── Profile completion (skills + projects + experience + education + basics) ──
# Required for contributor-umbrella personas (freelancer/student/internal/women)
# to access the dashboard. Each section contributes equally; 100% = all done.

def _ensure_profile(account_id: int) -> None:
    """Seeded accounts (e.g. service users) may have no contributor_profiles row.
    Auto-create an empty one so profile writes/UPDATEs aren't silent no-ops."""
    db.execute(
        "INSERT INTO contributor_profiles (account_id) VALUES (%s) ON CONFLICT (account_id) DO NOTHING",
        (account_id,))


def _completion_status(account_id: int) -> dict[str, Any]:
    _ensure_profile(account_id)
    # Read the raw profile row directly (the mapped _profile() dict omits the
    # newer columns like expertise_areas).
    profile = db.fetch_one("SELECT * FROM contributor_profiles WHERE account_id=%s", (account_id,)) or {}
    projects = db.fetch_all("SELECT id FROM contributor_projects WHERE account_id=%s", (account_id,))
    experience = db.fetch_all("SELECT id FROM contributor_experience WHERE account_id=%s", (account_id,))
    education = db.fetch_all("SELECT id FROM contributor_education WHERE account_id=%s", (account_id,))

    # Professional, weighted completion — a searchable-talent-database profile, not
    # a basic form. Each section carries a weight; the contributor unlocks public
    # work only at 100%. Every gating section has a fill-in form on the complete page.
    n_skills = len(db.fetch_all("SELECT id FROM contributor_skills WHERE account_id=%s", (account_id,)))
    extra = profile.get("profile_extra") or {}
    verif = extra.get("verification") or {}
    links = extra.get("links") or {}
    bank = extra.get("bank") or {}
    agree = extra.get("agreements") or {}
    sections = {
        "basic": bool(profile.get("country") and profile.get("city") and profile.get("timezone")
                      and extra.get("mobileNumber") and (extra.get("languages") or [])),
        "professional": bool(profile.get("bio") and profile.get("job_title")
                             and profile.get("years_experience") and profile.get("availability")),
        "skills": n_skills > 0 or bool(profile.get("primary_skills")),
        "expertise": bool(profile.get("expertise_areas")),
        "portfolio": len(projects) > 0,
        "experience": len(experience) > 0,
        "education": len(education) > 0,
        "verification": bool(links.get("linkedin") and verif.get("idType") and verif.get("idNumber")),
        "bank": bool(bank.get("accountHolderName") and bank.get("accountNumber") and bank.get("ifscCode")),
        "agreements": bool(agree.get("termsAccepted") and agree.get("paymentPolicyAccepted")
                           and agree.get("privacyPolicyAccepted") and agree.get("notificationConsent")
                           and agree.get("truthDeclaration")),
    }
    # Weighted gate (sums to 100, mirrors the template's step weights). expertise +
    # agreements are required steps in the wizard but carry 0 weight there too.
    WEIGHTS = {
        "basic": 15, "professional": 15, "skills": 20, "portfolio": 20,
        "experience": 10, "education": 10, "verification": 5, "bank": 5,
    }
    pct = sum(w for k, w in WEIGHTS.items() if sections.get(k))
    complete = pct >= 100
    # Persist the flag so the gate can read it cheaply.
    if bool(profile.get("profile_completed")) != complete:
        db.execute("UPDATE contributor_profiles SET profile_completed=%s WHERE account_id=%s",
                   (complete, account_id))
    return {
        "completeness": pct,
        "complete": complete,
        "sections": sections,
        "weights": WEIGHTS,
        "missing": [k for k in WEIGHTS if not sections.get(k)],
    }


@router.get("/profile/completion")
async def profile_completion(account_id: AcctId):
    return _completion_status(account_id)


# ---- Projects CRUD ----
@router.get("/profile/projects")
async def list_projects(account_id: AcctId):
    return db.fetch_all(
        "SELECT * FROM contributor_projects WHERE account_id=%s ORDER BY created_at DESC", (account_id,))


@router.post("/profile/projects", status_code=201)
async def add_project(account_id: AcctId, body: dict = Body(default={})):
    row = db.execute(
        """INSERT INTO contributor_projects (account_id,title,description,role,url,skills,keywords,category,video,screenshots,start_date,end_date)
           VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING *""",
        (account_id, body.get("title", ""), body.get("description", ""), body.get("role"),
         body.get("url"), body.get("skills") or [], body.get("keywords") or [], body.get("category"),
         body.get("video"), body.get("screenshots") or [],
         body.get("start_date"), body.get("end_date")))
    return row


@router.delete("/profile/projects/{project_id}")
async def delete_project(account_id: AcctId, project_id: int):
    row = db.execute("DELETE FROM contributor_projects WHERE id=%s AND account_id=%s RETURNING id",
                     (project_id, account_id))
    _require(row, "Project")
    return {"ok": True, "deleted_id": project_id}


# ---- Experience / internships CRUD ----
@router.get("/profile/experience")
async def list_experience(account_id: AcctId):
    return db.fetch_all(
        "SELECT * FROM contributor_experience WHERE account_id=%s ORDER BY created_at DESC", (account_id,))


@router.post("/profile/experience", status_code=201)
async def add_experience(account_id: AcctId, body: dict = Body(default={})):
    row = db.execute(
        """INSERT INTO contributor_experience
           (account_id,kind,organization,role,description,location,start_date,end_date,is_current)
           VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING *""",
        (account_id, body.get("kind", "internship"), body.get("organization", ""), body.get("role", ""),
         body.get("description"), body.get("location"), body.get("start_date"),
         body.get("end_date"), bool(body.get("is_current"))))
    return row


@router.delete("/profile/experience/{exp_id}")
async def delete_experience(account_id: AcctId, exp_id: int):
    row = db.execute("DELETE FROM contributor_experience WHERE id=%s AND account_id=%s RETURNING id",
                     (exp_id, account_id))
    _require(row, "Experience")
    return {"ok": True, "deleted_id": exp_id}


# ---- Education CRUD ----
@router.get("/profile/education")
async def list_education(account_id: AcctId):
    return db.fetch_all(
        "SELECT * FROM contributor_education WHERE account_id=%s ORDER BY created_at DESC", (account_id,))


@router.post("/profile/education", status_code=201)
async def add_education(account_id: AcctId, body: dict = Body(default={})):
    row = db.execute(
        """INSERT INTO contributor_education (account_id,institution,degree,field,grade,start_year,end_year)
           VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING *""",
        (account_id, body.get("institution", ""), body.get("degree"), body.get("field"),
         body.get("grade"), body.get("start_year"), body.get("end_year")))
    return row


@router.delete("/profile/education/{edu_id}")
async def delete_education(account_id: AcctId, edu_id: int):
    row = db.execute("DELETE FROM contributor_education WHERE id=%s AND account_id=%s RETURNING id",
                     (edu_id, account_id))
    _require(row, "Education")
    return {"ok": True, "deleted_id": edu_id}


# ---- Expertise areas (stored on profile) ----
@router.patch("/profile/expertise")
async def update_expertise(account_id: AcctId, body: dict = Body(default={})):
    _ensure_profile(account_id)
    db.execute("UPDATE contributor_profiles SET expertise_areas=%s WHERE account_id=%s",
               (body.get("expertise_areas") or [], account_id))
    return _completion_status(account_id)


@router.patch("/profile/extra")
async def update_profile_extra(account_id: AcctId, body: dict = Body(default={})):
    """Shallow-merge into profile_extra JSONB — languages, links, preferences,
    verification meta, certifications (the richer 10-step wizard fields). Each step
    PATCHes its own top-level key, so a shallow merge is the right granularity."""
    from psycopg2.extras import Json
    _ensure_profile(account_id)
    db.execute(
        "UPDATE contributor_profiles SET "
        "profile_extra = COALESCE(profile_extra,'{}'::jsonb) || %s, updated_at=now() "
        "WHERE account_id=%s",
        (Json(body or {}), account_id))
    return _completion_status(account_id)


@router.get("/profile/extra")
async def get_profile_extra(account_id: AcctId):
    row = db.fetch_one("SELECT profile_extra FROM contributor_profiles WHERE account_id=%s", (account_id,))
    return (row or {}).get("profile_extra") or {}


@router.post("/profile/upload")
async def upload_profile_file(
    account_id: AcctId,
    file: UploadFile = File(...),
    kind: Annotated[str, Query()] = "document",
):
    """Upload a profile-wizard file (avatar, government-ID document, passport photo)
    to Vercel Blob and return its public URL. The wizard then persists that URL
    into profile_extra (avatar_url / verification.idDocument) via PATCH
    /profile/extra, so the super-admin document-verification view can open it.

    Returns: { url, filename, content_type, size_bytes }. No DB row is written
    here — the URL lives in profile_extra (verbatim JSONB), keeping this additive."""
    contents = await file.read()
    if not blob_is_configured():
        raise HTTPException(
            status_code=503,
            detail="Blob storage is not configured (BLOB_READ_WRITE_TOKEN missing)",
        )
    # Namespace by kind so avatars / id-docs don't collide; random suffix avoids
    # overwrite and makes the URL unguessable.
    safe_kind = re.sub(r"[^a-z0-9_-]", "", (kind or "document").lower()) or "document"
    safe_name = re.sub(r"[^A-Za-z0-9._-]", "_", file.filename or "file")
    descriptor = await upload_blob(
        pathname=f"contributor/{account_id}/profile/{safe_kind}/{safe_name}",
        data=contents,
        content_type=file.content_type,
    )
    return {
        "url": descriptor.get("url", ""),
        "filename": file.filename,
        "content_type": file.content_type,
        "size_bytes": len(contents),
    }


@router.get("/profile/digital-twin")
async def get_digital_twin(account_id: AcctId):
    snapshot = _build_digital_twin(account_id)
    db.execute("INSERT INTO contributor_digital_twin (account_id, snapshot) VALUES (%s,%s)",
               (account_id, Json(snapshot)))
    return snapshot


@router.get("/profile/digital-twin/history")
async def digital_twin_history(account_id: AcctId, page: int = 1, page_size: int = 20):
    rows = db.fetch_all(
        "SELECT id, snapshot, created_at FROM contributor_digital_twin WHERE account_id=%s ORDER BY created_at DESC",
        (account_id,),
    )
    return db.paginate(rows, page, page_size)


@router.get("/profile/stats")
async def get_profile_stats(account_id: AcctId):
    """Real delivery record for the profile "Your record" + digital-twin rail.

    Computed live from the contributor's OWN tasks (taken / completed /
    in-flight / declined / on-time-vs-deadline) and the mentor reviews they
    received (rating on a 0–5 rubric + first-try acceptance). Returns a null
    `twin` until the contributor has any history, so the UI keeps its empty
    state instead of showing zeros.
    """
    from datetime import datetime, timedelta, timezone

    tasks = db.fetch_all(
        "SELECT id, title, status, due_at, created_at, updated_at, data "
        "FROM contributor_tasks WHERE account_id=%s",
        (account_id,),
    )

    TAKEN = {"assigned", "in_progress", "submitted", "completed"}
    IN_FLIGHT = {"assigned", "in_progress", "submitted"}
    completed = [t for t in tasks if t.get("status") == "completed"]
    taken = [t for t in tasks if t.get("status") in TAKEN]
    in_flight = [t for t in tasks if t.get("status") in IN_FLIGHT]
    declined = [t for t in tasks if t.get("status") == "declined"]

    def _as_dt(v: Any) -> Any:
        """The db layer hands timestamps back as ISO strings — parse to
        tz-aware datetimes so they can be compared."""
        if v is None:
            return None
        if isinstance(v, datetime):
            return v if v.tzinfo else v.replace(tzinfo=timezone.utc)
        try:
            dt = datetime.fromisoformat(str(v).replace("Z", "+00:00"))
        except ValueError:
            return None
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)

    def _completed_at(t: dict) -> Any:
        return _as_dt(t.get("updated_at")) or _as_dt(t.get("created_at"))

    now = datetime.now(timezone.utc)

    # On-time = completed task whose completion (updated_at) is on/before its
    # deadline (due_at). Only completed tasks that HAD a deadline count toward
    # the denominator — tasks without a due date can't be on/late.
    on_time_total = [t for t in completed if t.get("due_at")]
    on_time = []
    for t in on_time_total:
        done, due = _as_dt(t.get("updated_at")), _as_dt(t.get("due_at"))
        if done and due and done <= due:
            on_time.append(t)

    cutoff = now - timedelta(days=30)
    completed_30d = [t for t in completed
                     if (_completed_at(t) or now) >= cutoff]

    # Ratings + first-try acceptance from the mentor reviews this contributor
    # received. mentor_reviews.contributor_id stores the account id as text;
    # score is a 0–5 rubric overall.
    reviews = db.fetch_all(
        "SELECT score, decision FROM mentor_reviews WHERE contributor_id=%s",
        (str(account_id),),
    )
    # Rubric overall is 1–5; a stored 0 means "accepted without a score", not a
    # real zero rating, so it's excluded from the average.
    scores = [float(r["score"]) for r in reviews
              if r.get("score") is not None and float(r["score"]) > 0]
    avg_rating = round(sum(scores) / len(scores), 1) if scores else 0.0
    decided = [r for r in reviews if r.get("decision")]
    accepted_first = [r for r in decided if r.get("decision") == "accept"]
    first_try_pct = round(len(accepted_first) / len(decided) * 100) if decided else 0

    accept_denom = len(completed) + len(declined)
    acceptance_pct = (round(len(completed) / accept_denom * 100) if accept_denom
                      else (100 if completed else 0))
    on_time_pct = round(len(on_time) / len(on_time_total) * 100) if on_time_total else 0

    has_record = bool(taken or completed or reviews)
    twin = None
    if has_record:
        twin = {
            "tasksReinforcing": len(completed),
            "tasksCompleted30d": len(completed_30d),
            "tasksInFlight": len(in_flight),
            "tasksDeclined30d": len(declined),
            "onTimePct": on_time_pct,
            "firstTryAcceptPct": first_try_pct,
            "withdrawals": 0,
            "acceptanceRatePct": acceptance_pct,
            # Real extras surfaced in the enriched "Your record" grid.
            "tasksTaken": len(taken),
            "onTimeCount": len(on_time),
            "onTimeTotal": len(on_time_total),
            "averageReviewScore": avg_rating,
            "ratingCount": len(scores),
        }

    # Recent completed contributions (last 5) for the profile list.
    recent = sorted(completed, key=lambda t: _completed_at(t) or now, reverse=True)[:5]
    recent_tasks = []
    for t in recent:
        data = t.get("data") if isinstance(t.get("data"), dict) else {}
        tenant = (data.get("tenantName") or data.get("orgName")
                  or data.get("client") or data.get("sowTitle") or "Glimmora delivery")
        recent_tasks.append({
            "id": str(t["id"]),
            "title": t.get("title") or "Task",
            "tenantName": tenant,
            "decidedAt": t.get("updated_at"),
            "assignedAt": t.get("created_at"),
        })

    return {"twin": twin, "recentTasks": recent_tasks}


@router.get("/profile/twin-detail")
async def get_twin_detail(account_id: AcctId):
    """Full digital-twin record for the /profile/digital-twin page — activity
    chart, reliability signals, reinforcing skills, streaks, trend and
    data-derived observations. Everything is computed LIVE from the
    contributor's own tasks + the mentor reviews they received. Returns a null
    `twin` until they have any history (page keeps its empty state)."""
    from datetime import datetime, timedelta, timezone
    import calendar

    prof = _profile(account_id)
    tasks = db.fetch_all(
        "SELECT id, title, status, due_at, created_at, updated_at, data "
        "FROM contributor_tasks WHERE account_id=%s", (account_id,))
    reviews = db.fetch_all(
        "SELECT score, decision, payload FROM mentor_reviews WHERE contributor_id=%s",
        (str(account_id),))
    subs = db.fetch_all(
        "SELECT id FROM contributor_submissions WHERE account_id=%s", (account_id,))

    TAKEN = {"assigned", "in_progress", "submitted", "completed"}
    IN_FLIGHT = {"assigned", "in_progress", "submitted"}
    completed = [t for t in tasks if t.get("status") == "completed"]
    taken = [t for t in tasks if t.get("status") in TAKEN]
    in_flight = [t for t in tasks if t.get("status") in IN_FLIGHT]
    declined = [t for t in tasks if t.get("status") == "declined"]

    if not (taken or completed or reviews):
        return {"twin": None}

    now = datetime.now(timezone.utc)

    # The db layer spreads a row's JSONB `data` into top-level keys (and drops
    # `data`), so task fields like estimatedHours / skills_required live at the
    # top level. Read either location to be safe.
    def _field(t, *names):
        d = t.get("data") if isinstance(t.get("data"), dict) else {}
        for n in names:
            v = t.get(n)
            if v not in (None, "", []):
                return v
            v = d.get(n)
            if v not in (None, "", []):
                return v
        return None

    def _cat(t):  # completion timestamp
        return _parse_dt(t.get("updated_at")) or _parse_dt(t.get("created_at"))

    def _est(t):  # estimated effort hours (our proxy for hours logged)
        try:
            return float(_field(t, "estimatedHours", "effort_hours", "effortHours") or 0)
        except (TypeError, ValueError):
            return 0.0

    # On-time vs deadline.
    on_time_total = [t for t in completed if t.get("due_at")]
    on_time = [t for t in on_time_total
               if _parse_dt(t.get("updated_at")) and _parse_dt(t.get("due_at"))
               and _parse_dt(t.get("updated_at")) <= _parse_dt(t.get("due_at"))]
    on_time_pct = round(len(on_time) / len(on_time_total) * 100) if on_time_total else 0

    cutoff = now - timedelta(days=30)
    completed_30d = [t for t in completed if (_cat(t) or now) >= cutoff]
    declined_30d = [t for t in declined if (_cat(t) or now) >= cutoff]

    # Ratings + decisions; map score → task for per-skill scoring.
    score_by_task: dict[str, float] = {}
    scores_all: list[float] = []
    decided = accepted = rework = 0
    for r in reviews:
        pl = r.get("payload") if isinstance(r.get("payload"), dict) else {}
        sc = r.get("score")
        sc = float(sc) if sc is not None else None
        if sc and sc > 0:
            scores_all.append(sc)
            tid = pl.get("taskId")
            if tid is not None:
                score_by_task[str(tid)] = sc
        dec = r.get("decision")
        if dec:
            decided += 1
            accepted += 1 if dec == "accept" else 0
            rework += 1 if dec == "rework" else 0
    avg_rating = round(sum(scores_all) / len(scores_all), 1) if scores_all else 0.0
    first_try_pct = round(accepted / decided * 100) if decided else 0
    rework_pct = round(rework / decided * 100) if decided else 0
    accept_denom = len(completed) + len(declined)
    acceptance_pct = (round(len(completed) / accept_denom * 100) if accept_denom
                      else (100 if completed else 0))
    total_hours = round(sum(_est(t) for t in completed))

    # Monthly activity — last 12 months, chronological (page slices 3/6/all).
    buckets: dict[tuple[int, int], list[float]] = {}
    for t in completed:
        d = _cat(t)
        if not d:
            continue
        b = buckets.setdefault((d.year, d.month), [0, 0.0])
        b[0] += 1
        b[1] += _est(t)
    monthly_activity = []
    y, m = now.year, now.month
    seq = []
    for i in range(11, -1, -1):
        mm, yy = m - i, y
        while mm <= 0:
            mm += 12
            yy -= 1
        seq.append((yy, mm))
    for (yy, mm) in seq:
        b = buckets.get((yy, mm), [0, 0.0])
        monthly_activity.append({
            "month": calendar.month_abbr[mm],
            "tasksCompleted": int(b[0]),
            "hoursLogged": round(b[1]),
        })

    # Streaks over distinct completion dates.
    dates = sorted({_cat(t).date() for t in completed if _cat(t)})
    longest = cur = 0
    prev = None
    for dd in dates:
        cur = cur + 1 if (prev is not None and (dd - prev) == timedelta(days=1)) else 1
        longest = max(longest, cur)
        prev = dd
    streak = 0
    if dates and (now.date() - dates[-1]).days <= 1:
        streak, p = 1, dates[-1]
        for dd in reversed(dates[:-1]):
            if (p - dd) == timedelta(days=1):
                streak += 1
                p = dd
            else:
                break

    # Reinforcing (top) skills from completed tasks' required skills.
    skl: dict[str, list] = {}
    for t in completed:
        sks = _field(t, "skills_required", "requiredSkills", "skills") or []
        sc = score_by_task.get(str(t["id"]))
        for s in sks:
            if not s:
                continue
            e = skl.setdefault(str(s), [0, []])
            e[0] += 1
            if sc:
                e[1].append(sc)
    top_skills = sorted(
        ({"skill": k, "tasksCompleted": v[0],
          "avgScore": round(sum(v[1]) / len(v[1]), 1) if v[1] else (avg_rating or 0.0)}
         for k, v in skl.items()),
        key=lambda x: (-x["tasksCompleted"], x["skill"]))[:5]

    # Performance trend — honest heuristic from the real signals we have.
    if avg_rating >= 4.5 and (on_time_pct >= 85 or not on_time_total):
        trend = "improving"
    elif rework_pct >= 30 or (on_time_total and on_time_pct < 60):
        trend = "cooling"
    else:
        trend = "steady"

    # Data-derived observations (factual, not an AI model).
    insights: list[str] = []
    if on_time_total and on_time_pct == 100:
        insights.append(f"All {len(on_time_total)} deliveries with a deadline were on time.")
    elif on_time_total and on_time_pct >= 85:
        insights.append(f"{on_time_pct}% of deadline-bound deliveries landed on time.")
    if scores_all:
        insights.append(
            f"Average mentor review score {avg_rating}/5 across {len(scores_all)} "
            f"review{'s' if len(scores_all) != 1 else ''}.")
    if decided and rework == 0:
        insights.append("No rework requested on reviewed work so far.")
    if top_skills:
        insights.append(
            f"Most reinforced skill: {top_skills[0]['skill']} "
            f"({top_skills[0]['tasksCompleted']} task"
            f"{'s' if top_skills[0]['tasksCompleted'] != 1 else ''}).")

    # Availability (from onboarding) — we capture hours/week + timezone; specific
    # work-days aren't collected, so days stay 'Flexible'.
    try:
        hpw = int(float(prof.get("availability") or 0))
    except (TypeError, ValueError):
        hpw = 0
    tz = (prof.get("timezone") or "").strip() or "UTC"
    declared = (prof.get("primary_skills") or []) + (prof.get("secondary_skills") or [])

    twin = {
        "skillsDeclared": len(declared),
        "tasksReinforcing": len(completed),
        "tasksCompleted30d": len(completed_30d),
        "tasksInFlight": len(in_flight),
        "tasksDeclined30d": len(declined_30d),
        "onTimePct": on_time_pct,
        "firstTryAcceptPct": first_try_pct,
        "withdrawals": 0,
        "acceptanceRatePct": acceptance_pct,
        "weekDays": "Flexible",
        "weekHoursRange": f"~{hpw}h/week · {tz}" if hpw else f"Flexible · {tz}",
        "hoursPerWeek": hpw,
        "updatedAt": now.isoformat(),
        "totalSubmissions": len(subs) or len([t for t in tasks if t.get("status") in {"submitted", "completed"}]),
        "averageReviewScore": avg_rating,
        "totalHoursLogged": total_hours,
        "reworkRatePct": rework_pct,
        "streakDays": streak,
        "longestStreak": longest,
        "performanceTrend": trend,
        "topSkills": top_skills,
        "monthlyActivity": monthly_activity,
        "aiInsights": insights[:3],
    }
    return {"twin": twin}


# ════════════════════════════════════════════════════════════════════════════
# Task-interest board — the "I'm interested" marketplace (price-visible polling)
# Contributors see open, priced decomposition tasks (net pay), express interest,
# and the enterprise picks one. Writes to the shared `task_interests` table.
# ════════════════════════════════════════════════════════════════════════════

def _norm_skill(s: Any) -> str:
    """Canonicalise a skill for matching — must stay in sync with the enterprise
    backend's _norm_skill. Collapses JS-framework spelling variants so "React",
    "React.js", "reactjs" and "react js" all match (likewise node/Node.js, etc.)."""
    n = re.sub(r"[^a-z0-9]", "", str(s or "").lower())
    if len(n) > 2 and n.endswith("js"):
        n = n[:-2]  # reactjs -> react, nodejs -> node, nextjs -> next
    return n


@router.get("/opportunities")
async def list_opportunities(account_id: AcctId):
    """Open, priced decomposition tasks a contributor can express interest in.
    Price shown is the contributor's NET take-home (gross − 18% GST). Skill-
    matched against the contributor's declared skills (matched tasks first)."""
    # Eligibility gate: a freelancer can only view / pick up public tasks once
    # their profile is 100% complete. Return an empty "locked" payload until then
    # so the marketplace stays hidden even if the client bypasses the UI gate.
    _status = _completion_status(account_id)
    if not _status["complete"]:
        return {
            "items": [],
            "locked": True,
            "completeness": _status["completeness"],
            "missing": _status["missing"],
        }

    prof = _profile(account_id)
    my = {_norm_skill(s) for s in
          (prof.get("primary_skills") or []) + (prof.get("secondary_skills") or [])
          + (prof.get("other_skills") or []) if s}

    # NOTE: `interest_open_until` is part of the decomp_tasks schema (created by the
    # enterprise publish flow). DO NOT run DDL here — an `ALTER TABLE` per request
    # takes an ACCESS EXCLUSIVE lock on decomp_tasks and, under any contention (FE
    # polling, a stuck transaction), blocks every opportunities read until it times
    # out. Just read the column.
    rows = db.fetch_all(
        """SELECT t.id AS task_id, t.plan_id, t.title, t.description, t.required_skills,
                  t.estimated_hours, t.contributor_amount_minor, t.pay_currency,
                  t.interest_open_until,
                  p.sow_id, p.summary AS plan_summary
             FROM decomp_tasks t JOIN decomp_plans p ON p.id = t.plan_id
            WHERE t.status = 'ready' AND t.contributor_amount_minor IS NOT NULL
              AND p.status IN ('active', 'approved')
            ORDER BY t.updated_at DESC LIMIT 100""",
    )
    mine = {r["task_id"]: r["status"] for r in db.fetch_all(
        "SELECT task_id, status FROM task_interests WHERE account_id=%s", (account_id,))}

    items = []
    for r in rows:
        req = r.get("required_skills") or []
        if isinstance(req, str):
            try:
                req = json.loads(req)
            except (ValueError, TypeError):
                req = []
        matched = [s for s in req if s and _norm_skill(s) in my]
        gross = int(r.get("contributor_amount_minor") or 0)
        items.append({
            "taskId": r["task_id"],
            "planId": r["plan_id"],
            "sowId": r.get("sow_id"),
            "title": r.get("title") or "Task",
            "projectName": (r.get("plan_summary") or "").strip()[:60] or "Delivery plan",
            "requiredSkills": list(req),
            "matchedSkills": matched,
            "skillMatch": bool(matched),
            "estimatedHours": float(r.get("estimated_hours") or 0),
            "payCurrency": r.get("pay_currency") or "INR",
            "payGrossMinor": gross,
            "payNetMinor": gross,  # paid in full — GST is enterprise-side pass-through, never deducted
            "myStatus": mine.get(r["task_id"]),  # interested|withdrawn|selected|None
            "closesAt": r.get("interest_open_until"),  # interest window deadline (ISO) or None
        })
    items.sort(key=lambda x: (not x["skillMatch"], -len(x["matchedSkills"])))
    return {"items": items}


@router.get("/opportunities/{task_id}")
async def get_opportunity(task_id: str, account_id: AcctId):
    """Full detail for ONE open opportunity — brief, acceptance criteria, the
    uploaded files (attachments), skills, effort, timing + price — so a contributor
    can review everything on a dedicated page BEFORE expressing interest."""
    prof = _profile(account_id)
    my = {_norm_skill(s) for s in
          (prof.get("primary_skills") or []) + (prof.get("secondary_skills") or [])
          + (prof.get("other_skills") or []) if s}
    rows = db.fetch_all(
        """SELECT t.id AS task_id, t.plan_id, t.title, t.description, t.required_skills,
                  t.estimated_hours, t.acceptance_criteria, t.complexity, t.attachments,
                  t.contributor_amount_minor, t.pay_currency, t.interest_open_until,
                  t.status AS task_status, p.sow_id, p.summary AS plan_summary
             FROM decomp_tasks t JOIN decomp_plans p ON p.id = t.plan_id
            WHERE t.id = %s AND p.status IN ('active', 'approved')""",
        (task_id,))
    if not rows:
        raise HTTPException(status_code=404, detail="Opportunity not found or no longer available")
    r = rows[0]

    def _as_list(v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (ValueError, TypeError):
                return v  # plain-string acceptance criteria
        return v

    req = _as_list(r.get("required_skills")) or []
    if not isinstance(req, list):
        req = []
    atts = _as_list(r.get("attachments")) or []
    if not isinstance(atts, list):
        atts = []
    matched = [s for s in req if s and _norm_skill(s) in my]
    gross = int(r.get("contributor_amount_minor") or 0)
    ir = db.fetch_all(
        "SELECT status FROM task_interests WHERE account_id=%s AND task_id=%s",
        (account_id, task_id))
    return {
        "taskId": r["task_id"],
        "planId": r["plan_id"],
        "sowId": r.get("sow_id"),
        "title": r.get("title") or "Task",
        "projectName": (r.get("plan_summary") or "").strip()[:80] or "Delivery plan",
        "description": r.get("description") or "",
        "acceptanceCriteria": _as_list(r.get("acceptance_criteria")),
        "requiredSkills": list(req),
        "matchedSkills": matched,
        "skillMatch": bool(matched),
        "estimatedHours": float(r.get("estimated_hours") or 0),
        "complexity": r.get("complexity"),
        "attachments": [a for a in atts if isinstance(a, dict)],
        "payCurrency": r.get("pay_currency") or "INR",
        "payGrossMinor": gross,
        "payNetMinor": gross,  # paid in full
        "myStatus": (ir[0].get("status") if ir else None),
        "closesAt": r.get("interest_open_until"),
        "taskStatus": r.get("task_status"),
    }


@router.post("/opportunities/{task_id}/interest", status_code=201)
async def express_interest(account_id: AcctId, task_id: str, payload: dict = Body(default={})):
    trow = db.fetch_one("SELECT plan_id FROM decomp_tasks WHERE id=%s", (task_id,))
    if not trow:
        raise HTTPException(status_code=404, detail="Task not found")
    plan_id = (payload or {}).get("planId") or trow.get("plan_id")
    sow = db.fetch_one("SELECT sow_id FROM decomp_plans WHERE id=%s", (plan_id,))
    acct = db.fetch_one(
        "SELECT email, first_name, last_name FROM login_accounts WHERE id=%s", (account_id,))
    name = (f"{(acct or {}).get('first_name', '') or ''} {(acct or {}).get('last_name', '') or ''}".strip()
            or (acct or {}).get("email") or f"Contributor {account_id}")
    db.execute(
        """INSERT INTO task_interests
               (plan_id, task_id, sow_id, account_id, contributor_name, contributor_email, status)
           VALUES (%s,%s,%s,%s,%s,%s,'interested')
           ON CONFLICT (plan_id, task_id, account_id)
           DO UPDATE SET status='interested', updated_at=now()""",
        (plan_id, task_id, (sow or {}).get("sow_id"), account_id,
         name, (acct or {}).get("email")),
    )
    publish_event("contributor.interest_expressed",
                  {"accountId": str(account_id), "taskId": task_id, "planId": plan_id})
    return {"taskId": task_id, "planId": plan_id, "status": "interested"}


@router.post("/opportunities/{task_id}/withdraw")
async def withdraw_interest(account_id: AcctId, task_id: str, payload: dict = Body(default={})):
    db.execute(
        "UPDATE task_interests SET status='withdrawn', updated_at=now() "
        "WHERE task_id=%s AND account_id=%s",
        (task_id, account_id))
    return {"taskId": task_id, "status": "withdrawn"}


@router.get("/search")
async def contributor_search(account_id: AcctId, q: str = Query(default="")):
    term = f"%{q.lower()}%"
    tasks = db.fetch_all(
        "SELECT id, title, status, category FROM contributor_tasks "
        "WHERE account_id=%s AND LOWER(title) LIKE %s LIMIT 10",
        (account_id, term),
    )
    creds = db.fetch_all(
        "SELECT id, title, status FROM contributor_credentials "
        "WHERE account_id=%s AND LOWER(title) LIKE %s LIMIT 10",
        (account_id, term),
    )
    return {"query": q, "tasks": tasks, "credentials": creds}


# ════════════════════════════════════════════════════════════════════════════
# Track (contributor persona + onboarding status)
# ════════════════════════════════════════════════════════════════════════════

@router.get("/track")
async def get_track(account_id: AcctId):
    """Return contributor track/persona + onboarding completion status.

    Derives from contributor_profiles (existing table) + contributor_kyc.
    Response shape matches the FE ContributorTrackStatus interface.
    """
    acct = db.get_account(account_id) or {}
    prof = db.fetch_one("SELECT * FROM contributor_profiles WHERE account_id=%s", (account_id,)) or {}
    kyc = db.fetch_one("SELECT status FROM contributor_kyc WHERE account_id=%s", (account_id,)) or {}

    contrib_type = prof.get("contrib_type") or prof.get("contribType") or "general_workforce"

    # Derive persona from contrib_type
    _type_to_persona = {
        "internal": "internal",
        "student": "student",
        "women_workforce": "women",
        "general_workforce": "freelancer",
    }
    persona = _type_to_persona.get(contrib_type, "freelancer")

    # Onboarding complete = has bio + country + timezone set
    onboarding_complete = bool(
        prof.get("bio") and prof.get("country") and prof.get("timezone")
    )

    # KYC: general_workforce + women_workforce require KYC
    _requires_kyc = contrib_type in ("general_workforce", "women_workforce")
    kyc_status = kyc.get("status") or "not_started"
    if not _requires_kyc:
        kyc_review_status = "not_required"
    elif kyc_status == "verified":
        kyc_review_status = "approved"
    else:
        kyc_review_status = "pending"

    portal_ready = onboarding_complete and (not _requires_kyc or kyc_status == "verified")

    # Onboarding track
    _track_map = {
        "internal": "internal",
        "student": "student",
        "women_workforce": "women_workforce",
        "general_workforce": "general",
    }
    onboarding_track = _track_map.get(contrib_type, "general")

    profile_out = None
    if prof:
        profile_out = {
            "country": prof.get("country") or "",
            "timezone": prof.get("timezone") or "",
            "degree": None,
            "branch": None,
            "departmentCategory": prof.get("department") or "general",
            "departmentOther": None,
            "availability": str(prof.get("availability") or ""),
            "primarySkills": prof.get("primary_skills") or [],
            "linkedin": prof.get("linkedin"),
        }

    # org chip for internal employees
    org_chip = None
    if persona == "internal" and acct:
        org_chip = {
            "tenant": acct.get("organization") or acct.get("name") or "",
            "department": prof.get("department") or "general",
        }

    return {
        "onboardingComplete": onboarding_complete,
        "portalReady": portal_ready,
        "kycReviewStatus": kyc_review_status,
        "onboardingTrack": onboarding_track,
        "contribType": contrib_type,
        "persona": persona,
        "profile": profile_out,
        "orgChip": org_chip,
        "supervision": None,
        "womenSupport": None,
    }


# ════════════════════════════════════════════════════════════════════════════
# Account-auth (sign-in method summary for Settings)
# ════════════════════════════════════════════════════════════════════════════

@router.get("/account-auth")
async def get_account_auth(account_id: AcctId):
    """Return auth mode info — password vs social OAuth vs enterprise SSO.

    Derives from login_accounts.provider / is_password_set / role columns.
    Response shape matches ContributorAccountAuth in the FE.
    """
    acct = db.get_account(account_id)
    if acct is None:
        raise HTTPException(status_code=404, detail="User not found.")

    has_password = bool(acct.get("is_password_set") or acct.get("password_hash"))
    provider = acct.get("provider") or None
    role = acct.get("role") or ""
    tenant_id = acct.get("tenant_id") or acct.get("organization_id") or None

    _social_providers = {"google", "microsoft-entra-id", "microsoft"}

    # Determine auth mode
    if has_password:
        auth_mode = "password"
    elif role == "internal" or (tenant_id and provider not in _social_providers):
        auth_mode = "enterprise_sso"
    else:
        auth_mode = "social_oauth"

    # connected providers list
    connected_providers: list[str] = []
    if provider == "google":
        connected_providers = ["google"]
    elif provider in ("microsoft-entra-id", "microsoft"):
        connected_providers = ["microsoft"]

    # organization name
    org_name: str | None = None
    if tenant_id:
        try:
            org_row = db.fetch_one("SELECT name FROM organizations WHERE id=%s", (tenant_id,))
            org_name = (org_row or {}).get("name")
        except Exception:  # noqa: BLE001
            pass  # organizations table may not exist — org_name stays None

    return {
        "authMode": auth_mode,
        "hasPassword": has_password,
        "provider": provider,
        "connectedProviders": connected_providers,
        "organizationName": org_name,
    }


# ════════════════════════════════════════════════════════════════════════════
# Mentorship opt-in + status
# ════════════════════════════════════════════════════════════════════════════

@router.post("/mentorship/opt-in", status_code=201)
async def mentorship_opt_in(account_id: AcctId, payload: dict = Body(default={})):
    """Opt the contributor into the mentorship programme. Idempotent — if
    already opted in, updates focus and returns the existing row.

    Persists to contributor_mentorship and writes an audit event.
    """
    focus = str(payload.get("focus") or "").strip()[:500] or None

    row = db.execute(
        """
        INSERT INTO contributor_mentorship (account_id, focus, status, opted_in_at, data)
        VALUES (%s, %s, 'pending', now(), %s)
        ON CONFLICT (account_id) DO UPDATE
            SET focus      = EXCLUDED.focus,
                updated_at = now(),
                data       = contributor_mentorship.data || EXCLUDED.data
        RETURNING *
        """,
        (account_id, focus, Json({"source": "contributor_self"})),
    )

    write_audit(
        actor_id=str(account_id), actor_email=None, actor_role="contributor",
        action="mentorship.opt_in", service="contributor-service",
        target_id=str(row["id"]),
        extra={"focus": focus},
    )

    session_like = {
        "id": str(row["id"]),
        "contributorAccountId": str(account_id),
        "mentorId": row.get("mentor_id"),
        "status": row.get("status") or "pending",
        "focus": row.get("focus"),
        "createdAt": row.get("opted_in_at"),
    }
    return {"session": session_like, "assigned": bool(row.get("mentor_id"))}


@router.get("/mentorship/status")
async def mentorship_status(account_id: AcctId):
    """Return the contributor's mentorship opt-in status and upcoming session info."""
    row = db.fetch_one(
        "SELECT * FROM contributor_mentorship WHERE account_id=%s", (account_id,)
    )
    opted_in = row is not None and row.get("opted_in_at") is not None

    upcoming_session = None
    if row and row.get("mentor_id") and row.get("status") in ("assigned", "active", "pending"):
        upcoming_session = {
            "id": str(row["id"]),
            "mentorId": row.get("mentor_id"),
            "status": row.get("status"),
            "scheduledAt": None,  # Populated when mentor sets a time
        }

    return {
        "optedIn": opted_in,
        "focus": (row or {}).get("focus"),
        "optedInAt": (row or {}).get("opted_in_at"),
        "upcomingSession": upcoming_session,
    }


# ════════════════════════════════════════════════════════════════════════════
# Account deactivate
# ════════════════════════════════════════════════════════════════════════════

@router.post("/account/deactivate")
async def deactivate_account(account_id: AcctId, payload: dict = Body(default={})):
    db.execute("UPDATE login_accounts SET is_active=FALSE, updated_at=now() WHERE id=%s", (account_id,))
    write_audit(actor_id=str(account_id), actor_email=None, actor_role="contributor",
                action="account_deactivated", service="contributor-service",
                details=payload.get("reason"))
    publish_event("contributor.account_deactivated", {"accountId": str(account_id)})
    return {"ok": True, "is_active": False}


@router.post("/settings/account/change-email")
async def change_email(account_id: AcctId, payload: dict = Body(default={})):
    """Change the contributor's login email (with cross-account uniqueness).

    Sets email_verified=FALSE so the new address can be re-verified via OTP.
    """
    new_email = (payload.get("email") or "").strip().lower()
    if not new_email or "@" not in new_email:
        raise HTTPException(status_code=400, detail="A valid email is required.")
    clash = db.fetch_one(
        "SELECT id FROM login_accounts WHERE LOWER(email)=%s AND id<>%s", (new_email, account_id)
    )
    if clash:
        raise HTTPException(status_code=409, detail="That email is already in use.")
    db.execute(
        "UPDATE login_accounts SET email=%s, email_verified=FALSE, updated_at=now() WHERE id=%s",
        (new_email, account_id),
    )
    write_audit(actor_id=str(account_id), actor_email=new_email, actor_role="contributor",
                action="email_changed", service="contributor-service")
    return {"ok": True, "email": new_email, "emailVerified": False}


@router.get("/sessions")
async def list_sessions(account_id: AcctId, request: Request):
    """Active sign-in sessions. Reads auth_sessions; if none are tracked yet,
    surfaces the current request as the active session so the page is usable."""
    rows = db.fetch_all(
        "SELECT id, user_agent, ip_address, device, is_current, created_at, last_active_at "
        "FROM auth_sessions WHERE account_id=%s AND revoked=FALSE ORDER BY last_active_at DESC",
        (account_id,),
    )
    if not rows:
        rows = [{
            "id": 0,
            "user_agent": request.headers.get("user-agent"),
            "ip_address": request.client.host if request.client else None,
            "device": "This device",
            "is_current": True,
            "created_at": None,
            "last_active_at": None,
        }]
    return {"items": rows}


@router.post("/sessions/{session_id}/revoke")
async def revoke_session(account_id: AcctId, session_id: int):
    db.execute(
        "UPDATE auth_sessions SET revoked=TRUE WHERE id=%s AND account_id=%s AND is_current=FALSE",
        (session_id, account_id),
    )
    return {"ok": True}


@router.post("/sessions/revoke-all")
async def revoke_all_sessions(account_id: AcctId):
    db.execute(
        "UPDATE auth_sessions SET revoked=TRUE WHERE account_id=%s AND is_current=FALSE",
        (account_id,),
    )
    return {"ok": True}


# ════════════════════════════════════════════════════════════════════════════
# Public credential share (NO auth)
# ════════════════════════════════════════════════════════════════════════════

@public_router.get("/credentials/{share_id}")
async def public_credential(share_id: str):
    share = db.fetch_one("SELECT * FROM credential_shares WHERE share_id=%s", (share_id,))
    if share is None:
        raise HTTPException(status_code=404, detail="Shared credential not found")
    cred = db.fetch_one("SELECT * FROM contributor_credentials WHERE id=%s", (share["credential_id"],))
    if cred is None:
        raise HTTPException(status_code=404, detail="Credential no longer available")
    acct = db.get_account(share["account_id"]) or {}
    return {
        "share_id": share_id,
        "title": cred.get("title"),
        "issuer": cred.get("issuer"),
        "kind": cred.get("kind"),
        "status": cred.get("status"),
        "verification_code": cred.get("verification_code"),
        "issued_at": cred.get("issued_at"),
        "holder": (acct.get("name") or "").strip() or "Glimmora Contributor",
    }
