"""Tenant complaints / contact-the-platform-admin.

An enterprise user submits a complaint (tenant-scoped); it lands in the
super-admin **Complaints** section where the platform admin can review +
resolve. Single table `complaints`.
"""

from __future__ import annotations

import logging
import uuid
from datetime import date
from typing import Annotated, Any

from fastapi import APIRouter, Body, Depends, HTTPException, Request
from pydantic import BaseModel
from psycopg2.extras import RealDictCursor

from shared.audit import write_audit
from shared.db import get_pg_connection
from shared.deps import get_current_admin, get_current_user
from auth_app import repo as auth_repo

logger = logging.getLogger(__name__)
router = APIRouter(tags=["complaints"])

_VALID_STATUS = {"open", "in_progress", "resolved"}
_VALID_CATEGORY = {
    "general", "access", "billing", "account", "technical",
    "data", "feature", "performance", "abuse", "other",
}
_VALID_PRIORITY = {"low", "medium", "high", "urgent"}
# Only a tenant's ADMIN (the workspace owner, or an invited ent.admin) may raise a
# ticket with the platform. Other tenant roles must go through their own admin.
_TICKET_ROLES = {"enterprise", "ent.admin"}


def init_complaints_schema() -> None:
    conn = get_pg_connection()
    with conn.cursor() as cur:
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS complaints (
                id                 TEXT PRIMARY KEY,
                tenant_id          TEXT,
                tenant_name        TEXT,
                submitted_by_email TEXT,
                submitted_by_name  TEXT,
                category           TEXT NOT NULL DEFAULT 'general',
                priority           TEXT NOT NULL DEFAULT 'medium',
                issue_started_on   DATE,
                subject            TEXT NOT NULL,
                message            TEXT NOT NULL,
                status             TEXT NOT NULL DEFAULT 'open',
                admin_note         TEXT,
                created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
                updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
                resolved_at        TIMESTAMPTZ
            )
            """
        )
        # Additive columns for tables created before priority / issue-date existed.
        cur.execute("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'medium'")
        cur.execute("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS issue_started_on DATE")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints (status)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_complaints_tenant ON complaints (tenant_id)")
    conn.commit()
    logger.info("complaints table ready.")


def _out(r: dict[str, Any]) -> dict[str, Any]:
    def iso(v: Any) -> str | None:
        return v.isoformat() if v else None
    return {
        "id": r["id"],
        "tenantId": r.get("tenant_id"),
        "tenantName": r.get("tenant_name"),
        "submittedByEmail": r.get("submitted_by_email"),
        "submittedByName": r.get("submitted_by_name"),
        "category": r.get("category") or "general",
        "priority": r.get("priority") or "medium",
        "issueStartedOn": iso(r.get("issue_started_on")),
        "subject": r.get("subject"),
        "message": r.get("message"),
        "status": r.get("status") or "open",
        "adminNote": r.get("admin_note"),
        "createdAt": iso(r.get("created_at")),
        "updatedAt": iso(r.get("updated_at")),
        "resolvedAt": iso(r.get("resolved_at")),
    }


# ── Enterprise side: submit + view own complaints ─────────────────────────────

class _SubmitComplaintRequest(BaseModel):
    subject: str
    message: str
    category: str | None = None
    priority: str | None = None
    issueStartedOn: str | None = None  # YYYY-MM-DD


@router.post("/api/v1/enterprise/complaints", status_code=201)
async def submit_complaint(
    body: _SubmitComplaintRequest,
    request: Request,
    user: Annotated[dict, Depends(get_current_user)],
):
    """An enterprise user files a complaint → goes to the super-admin Complaints.

    Restricted to the tenant's admin — other tenant roles must raise issues
    through their own workspace admin, not directly with the platform.
    """
    if (user.get("role") or "").lower() not in _TICKET_ROLES:
        raise HTTPException(
            status_code=403,
            detail="Only your workspace admin can contact Glimmora support. Please reach out to your admin.",
        )
    subject = (body.subject or "").strip()
    message = (body.message or "").strip()
    if not subject or not message:
        raise HTTPException(status_code=422, detail="Subject and message are required")
    acct = auth_repo.find_account_by_id(user["id"]) or {}
    tid = acct.get("tenant_id")
    tname = None
    if tid:
        t = auth_repo.get_tenant(tid)
        tname = t.get("name") if t else None
    name = (acct.get("name")
            or f"{acct.get('first_name','') or ''} {acct.get('last_name','') or ''}".strip()
            or acct.get("email"))
    category = (body.category or "general").lower()
    if category not in _VALID_CATEGORY:
        category = "general"
    priority = (body.priority or "medium").lower()
    if priority not in _VALID_PRIORITY:
        priority = "medium"
    # Accept an ISO date (YYYY-MM-DD); ignore anything malformed or in the
    # future (the issue can't have started after today) rather than 400.
    issue_started = None
    if body.issueStartedOn:
        s = body.issueStartedOn.strip()[:10]
        if (len(s) == 10 and s[4] == "-" and s[7] == "-"
                and s.replace("-", "").isdigit() and s <= date.today().isoformat()):
            issue_started = s
    cid = f"cmp_{uuid.uuid4().hex[:12]}"
    conn = get_pg_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """
            INSERT INTO complaints
                (id, tenant_id, tenant_name, submitted_by_email, submitted_by_name,
                 category, priority, issue_started_on, subject, message, status, created_at, updated_at)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,'open', now(), now())
            RETURNING *
            """,
            (cid, tid, tname, acct.get("email"), name, category, priority, issue_started,
             subject[:200], message),
        )
        row = cur.fetchone()
    conn.commit()
    try:
        write_audit(actor_id=user.get("id"), actor_email=acct.get("email"),
                    actor_role=acct.get("role"), action="submit_complaint",
                    target=subject[:80], target_id=cid, tenant_id=tid,
                    service="superadmin-service",
                    ip_address=request.client.host if request.client else None)
    except Exception:  # noqa: BLE001
        pass
    return _out(row)


@router.get("/api/v1/enterprise/complaints")
async def list_my_complaints(user: Annotated[dict, Depends(get_current_user)]):
    """The caller's tenant's complaints (so they can track status)."""
    acct = auth_repo.find_account_by_id(user["id"]) or {}
    tid = acct.get("tenant_id")
    conn = get_pg_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        if tid:
            cur.execute("SELECT * FROM complaints WHERE tenant_id = %s ORDER BY created_at DESC", (tid,))
        else:
            cur.execute("SELECT * FROM complaints WHERE submitted_by_email = %s ORDER BY created_at DESC",
                        (acct.get("email"),))
        rows = cur.fetchall()
    items = [_out(r) for r in rows]
    return {"items": items, "total": len(items)}


# ── Super-admin side: list all + resolve ──────────────────────────────────────

@router.get("/api/superadmin/complaints")
async def list_all_complaints(
    admin: Annotated[dict, Depends(get_current_admin)],
    status: str | None = None,
):
    conn = get_pg_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        if status and status in _VALID_STATUS:
            cur.execute("SELECT * FROM complaints WHERE status = %s ORDER BY created_at DESC", (status,))
        else:
            cur.execute("SELECT * FROM complaints ORDER BY "
                        "CASE status WHEN 'open' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END, "
                        "created_at DESC")
        rows = cur.fetchall()
        counts: dict[str, int] = {"open": 0, "in_progress": 0, "resolved": 0}
        cur.execute("SELECT status, COUNT(*) n FROM complaints GROUP BY status")
        for r in cur.fetchall():
            counts[r["status"]] = int(r["n"])
    items = [_out(r) for r in rows]
    return {"items": items, "total": len(items), "counts": counts}


class _UpdateComplaintRequest(BaseModel):
    status: str | None = None       # open | in_progress | resolved
    adminNote: str | None = None


@router.patch("/api/superadmin/complaints/{complaint_id}")
async def update_complaint(
    complaint_id: str,
    admin: Annotated[dict, Depends(get_current_admin)],
    body: _UpdateComplaintRequest = Body(...),
):
    """Resolve / progress a complaint + optional admin note."""
    sets, params = [], []
    if body.status is not None:
        st = body.status.strip().lower()
        if st not in _VALID_STATUS:
            raise HTTPException(status_code=422, detail="Invalid status")
        sets.append("status = %s")
        params.append(st)
        sets.append("resolved_at = " + ("now()" if st == "resolved" else "NULL"))
    if body.adminNote is not None:
        sets.append("admin_note = %s")
        params.append(body.adminNote)
    if not sets:
        raise HTTPException(status_code=422, detail="Nothing to update")
    sets.append("updated_at = now()")
    params.append(complaint_id)
    conn = get_pg_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(f"UPDATE complaints SET {', '.join(sets)} WHERE id = %s RETURNING *", tuple(params))
        row = cur.fetchone()
    conn.commit()
    if not row:
        raise HTTPException(status_code=404, detail="Complaint not found")
    try:
        write_audit(actor_id=admin.get("id"), actor_email=admin.get("email"),
                    actor_role=admin.get("role"), action="update_complaint",
                    target=row.get("subject"), target_id=complaint_id,
                    tenant_id=row.get("tenant_id"), service="superadmin-service",
                    extra={"status": body.status})
    except Exception:  # noqa: BLE001
        pass
    return _out(row)
