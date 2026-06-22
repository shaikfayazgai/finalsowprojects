"""Unified Support + Complaints case engine (Phase 1 of the Resolution Center).

One table `glimmora_cases` + a `case_messages` thread serves EVERY role: any
logged-in user raises a **Support** question or a **Complaint** to Glimmora; the
super-admin desk triages, replies and resolves. `stream / lane / priority /
status` are carried from day 1 so the fuller Resolution Center (payment, safety,
security, appeals, routing) slots in later with no migration — see
RESOLUTION_CENTER_PLAN.md. Other lanes/streams stay hidden in Phase 1.
"""
from __future__ import annotations

import logging
import uuid
from typing import Annotated, Any

from fastapi import APIRouter, Body, Depends, HTTPException, Request
from pydantic import BaseModel
from psycopg2.extras import RealDictCursor

from shared.audit import write_audit
from shared.db import get_pg_connection
from shared.deps import get_current_admin, get_current_user

try:  # notify is best-effort; never block a case action on it
    from shared.notify import create_notification, notify_role
except Exception:  # noqa: BLE001 — pragma: no cover
    def create_notification(*_a: Any, **_k: Any) -> None: ...
    def notify_role(*_a: Any, **_k: Any) -> None: ...

logger = logging.getLogger(__name__)
router = APIRouter(tags=["cases"])

_STREAMS = {"support", "complaint"}            # Phase 1 surfaces
_PRIORITIES = {"critical", "high", "medium", "low"}
_STATUSES = {"new", "investigating", "awaiting_user", "resolved", "closed", "reopened"}
_ADMIN_ROLES = {"admin", "superadmin", "super_admin"}
# The raiser's portal landing for the bell deep-link (Phase 1 user surface).
_USER_CASE_URL = "/contributor/support-center"
_DESK_URL = "/admin/cases"


def init_cases_schema() -> None:
    conn = get_pg_connection()
    with conn.cursor() as cur:
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS glimmora_cases (
                id            TEXT PRIMARY KEY,
                account_id    BIGINT,
                raiser_email  TEXT,
                raiser_name   TEXT,
                raiser_role   TEXT,
                stream        TEXT NOT NULL DEFAULT 'support',   -- support | complaint (+future)
                lane          TEXT NOT NULL DEFAULT 'support',
                subtype       TEXT,
                subject       TEXT NOT NULL,
                body          TEXT NOT NULL DEFAULT '',
                priority      TEXT NOT NULL DEFAULT 'medium',    -- critical|high|medium|low
                status        TEXT NOT NULL DEFAULT 'new',
                assigned_to   BIGINT,
                resolution    TEXT,
                data          JSONB NOT NULL DEFAULT '{}',
                created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
                updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
                resolved_at   TIMESTAMPTZ
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS case_messages (
                id         BIGSERIAL PRIMARY KEY,
                case_id    TEXT NOT NULL,
                author_id  BIGINT,
                author     TEXT NOT NULL DEFAULT 'user',   -- user | glimmora
                type       TEXT NOT NULL DEFAULT 'public',  -- public | internal
                body       TEXT NOT NULL DEFAULT '',
                created_at TIMESTAMPTZ NOT NULL DEFAULT now()
            )
            """
        )
        cur.execute("CREATE INDEX IF NOT EXISTS idx_cases_account ON glimmora_cases (account_id)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_cases_status ON glimmora_cases (status)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_case_msgs_case ON case_messages (case_id)")
    conn.commit()
    logger.info("glimmora_cases + case_messages tables ready.")


# ── helpers ───────────────────────────────────────────────────────────────────

def _iso(v: Any) -> str | None:
    return v.isoformat() if v else None


def _acct_int(v: Any) -> int | None:
    try:
        return int(v)
    except (TypeError, ValueError):
        return None


def _is_admin(user: dict) -> bool:
    return (user.get("role") or "").lower() in _ADMIN_ROLES


def _out(r: dict[str, Any], *, messages: list | None = None) -> dict[str, Any]:
    out = {
        "id": r["id"],
        "accountId": r.get("account_id"),
        "raiserEmail": r.get("raiser_email"),
        "raiserName": r.get("raiser_name"),
        "raiserRole": r.get("raiser_role"),
        "stream": r.get("stream") or "support",
        "lane": r.get("lane") or "support",
        "subject": r.get("subject"),
        "body": r.get("body"),
        "priority": r.get("priority") or "medium",
        "status": r.get("status") or "new",
        "assignedTo": r.get("assigned_to"),
        "resolution": r.get("resolution"),
        "createdAt": _iso(r.get("created_at")),
        "updatedAt": _iso(r.get("updated_at")),
        "resolvedAt": _iso(r.get("resolved_at")),
    }
    if messages is not None:
        out["messages"] = messages
    return out


def _msg_out(m: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": m["id"],
        "author": m.get("author") or "user",
        "type": m.get("type") or "public",
        "body": m.get("body"),
        "createdAt": _iso(m.get("created_at")),
    }


def _load_case(cur: Any, case_id: str) -> dict[str, Any] | None:
    cur.execute("SELECT * FROM glimmora_cases WHERE id = %s", (case_id,))
    return cur.fetchone()


# ── Any role: raise + track ───────────────────────────────────────────────────

class _RaiseRequest(BaseModel):
    stream: str                       # support | complaint
    subject: str
    body: str
    priority: str | None = None


@router.post("/api/v1/cases", status_code=201)
async def raise_case(
    body: _RaiseRequest,
    request: Request,
    user: Annotated[dict, Depends(get_current_user)],
):
    """Any logged-in role raises a Support question or a Complaint to Glimmora."""
    stream = (body.stream or "support").strip().lower()
    if stream not in _STREAMS:
        raise HTTPException(status_code=422, detail="stream must be 'support' or 'complaint'")
    subject = (body.subject or "").strip()
    text = (body.body or "").strip()
    if not subject or not text:
        raise HTTPException(status_code=422, detail="Subject and message are required")
    priority = (body.priority or "medium").strip().lower()
    if priority not in _PRIORITIES:
        priority = "medium"

    cid = f"case_{uuid.uuid4().hex[:12]}"
    acct = _acct_int(user.get("id"))
    role = (user.get("role") or "").lower()
    email = user.get("email")

    conn = get_pg_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """
            INSERT INTO glimmora_cases
                (id, account_id, raiser_email, raiser_role, stream, lane,
                 subject, body, priority, status, created_at, updated_at)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,'new', now(), now())
            RETURNING *
            """,
            (cid, acct, email, role, stream, stream, subject[:200], text, priority),
        )
        row = cur.fetchone()
        # The opening message becomes the first entry in the thread.
        cur.execute(
            "INSERT INTO case_messages (case_id, author_id, author, type, body) "
            "VALUES (%s,%s,'user','public',%s)",
            (cid, acct, text),
        )
    conn.commit()

    notify_role(
        ["superadmin"],
        category="complaint" if stream == "complaint" else "update",
        kind=f"case.{stream}.created", severity="important",
        title=f"New {stream}: {subject[:60]}",
        body=f"{email or role} raised a {stream}.",
        resource_type="case", resource_id=cid,
        action_url=_DESK_URL, action_label="Open desk",
    )
    try:
        write_audit(
            actor_id=user.get("id"), actor_email=email, actor_role=role,
            action=f"case.{stream}.created", target=subject[:80], target_id=cid,
            service="superadmin-service",
            ip_address=request.client.host if request.client else None,
            extra={"stream": stream, "priority": priority},
        )
    except Exception:  # noqa: BLE001
        pass
    return _out(row)


@router.get("/api/v1/cases/mine")
async def my_cases(user: Annotated[dict, Depends(get_current_user)]):
    """The caller's own cases (so they can track status + reply)."""
    acct = _acct_int(user.get("id"))
    conn = get_pg_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            "SELECT * FROM glimmora_cases WHERE account_id = %s ORDER BY created_at DESC",
            (acct,),
        )
        rows = cur.fetchall()
    return {"items": [_out(r) for r in rows], "total": len(rows)}


@router.get("/api/v1/cases/{case_id}")
async def get_case(case_id: str, user: Annotated[dict, Depends(get_current_user)]):
    """Case detail + thread. Owner sees public messages only; admin sees all."""
    acct = _acct_int(user.get("id"))
    is_admin = _is_admin(user)
    conn = get_pg_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        row = _load_case(cur, case_id)
        if not row:
            raise HTTPException(status_code=404, detail="Case not found")
        if not is_admin and row.get("account_id") != acct:
            raise HTTPException(status_code=403, detail="Not your case")
        if is_admin:
            cur.execute(
                "SELECT * FROM case_messages WHERE case_id = %s ORDER BY created_at ASC, id ASC",
                (case_id,),
            )
        else:
            cur.execute(
                "SELECT * FROM case_messages WHERE case_id = %s AND type = 'public' "
                "ORDER BY created_at ASC, id ASC",
                (case_id,),
            )
        msgs = [_msg_out(m) for m in cur.fetchall()]
    return _out(row, messages=msgs)


class _ReplyRequest(BaseModel):
    body: str
    internal: bool | None = False     # only honoured for admins (staff-only note)


@router.post("/api/v1/cases/{case_id}/messages", status_code=201)
async def add_message(
    case_id: str,
    body: _ReplyRequest,
    user: Annotated[dict, Depends(get_current_user)],
):
    """Add a message to the thread. Admin can flag it INTERNAL (staff-only)."""
    text = (body.body or "").strip()
    if not text:
        raise HTTPException(status_code=422, detail="Message is required")
    acct = _acct_int(user.get("id"))
    is_admin = _is_admin(user)

    conn = get_pg_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        row = _load_case(cur, case_id)
        if not row:
            raise HTTPException(status_code=404, detail="Case not found")
        if not is_admin and row.get("account_id") != acct:
            raise HTTPException(status_code=403, detail="Not your case")

        author = "glimmora" if is_admin else "user"
        mtype = "internal" if (is_admin and body.internal) else "public"
        cur.execute(
            "INSERT INTO case_messages (case_id, author_id, author, type, body) "
            "VALUES (%s,%s,%s,%s,%s) RETURNING *",
            (case_id, acct, author, mtype, text),
        )
        msg = cur.fetchone()

        # Status nudge: admin public reply on a fresh case → investigating;
        # a raiser reply on a resolved/closed case → reopened.
        new_status = row.get("status")
        if is_admin and mtype == "public" and new_status in ("new", "reopened"):
            new_status = "investigating"
        elif not is_admin and new_status in ("resolved", "closed"):
            new_status = "reopened"
        cur.execute(
            "UPDATE glimmora_cases SET updated_at = now(), status = %s WHERE id = %s",
            (new_status, case_id),
        )
    conn.commit()

    if mtype == "public":
        if is_admin:
            create_notification(
                row.get("account_id"), category="update", kind="case.replied",
                severity="informational", title="Glimmora replied to your case",
                body=text[:120], resource_type="case", resource_id=case_id,
                action_url=_USER_CASE_URL, action_label="View case",
            )
        else:
            notify_role(
                ["superadmin"], category="update", kind="case.user_replied",
                severity="informational", title=f"New reply on {row.get('stream')} case",
                body=text[:120], resource_type="case", resource_id=case_id,
                action_url=_DESK_URL, action_label="Open desk",
            )
    return _msg_out(msg)


# ── Glimmora desk (admin) ─────────────────────────────────────────────────────

@router.get("/api/v1/admin/cases")
async def admin_list_cases(
    admin: Annotated[dict, Depends(get_current_admin)],
    stream: str | None = None,
    status: str | None = None,
):
    """The unified Glimmora desk — every case, newest/open first, with counts."""
    clauses, params = [], []
    if stream and stream.lower() in _STREAMS:
        clauses.append("stream = %s")
        params.append(stream.lower())
    if status and status.lower() in _STATUSES:
        clauses.append("status = %s")
        params.append(status.lower())
    where = (" WHERE " + " AND ".join(clauses)) if clauses else ""
    conn = get_pg_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            f"SELECT * FROM glimmora_cases{where} ORDER BY "
            "CASE status WHEN 'new' THEN 0 WHEN 'reopened' THEN 0 WHEN 'investigating' THEN 1 "
            "WHEN 'awaiting_user' THEN 2 WHEN 'resolved' THEN 3 ELSE 4 END, created_at DESC",
            tuple(params),
        )
        rows = cur.fetchall()
        counts = {"support": 0, "complaint": 0}
        cur.execute("SELECT stream, COUNT(*) n FROM glimmora_cases GROUP BY stream")
        for r in cur.fetchall():
            if r["stream"] in counts:
                counts[r["stream"]] = int(r["n"])
        cur.execute(
            "SELECT COUNT(*) n FROM glimmora_cases "
            "WHERE status IN ('new','investigating','awaiting_user','reopened')"
        )
        open_n = int(cur.fetchone()["n"])
    return {"items": [_out(r) for r in rows], "total": len(rows), "counts": counts, "open": open_n}


class _AdminUpdateRequest(BaseModel):
    status: str | None = None         # new|investigating|awaiting_user|resolved|closed|reopened
    resolution: str | None = None
    assignToMe: bool | None = None


@router.patch("/api/v1/admin/cases/{case_id}")
async def admin_update_case(
    case_id: str,
    request: Request,
    admin: Annotated[dict, Depends(get_current_admin)],
    body: _AdminUpdateRequest = Body(...),
):
    """Triage / assign / resolve / close a case."""
    sets, params = [], []
    notify_resolved = False
    if body.assignToMe:
        sets.append("assigned_to = %s")
        params.append(_acct_int(admin.get("id")))
    if body.status is not None:
        st = body.status.strip().lower()
        if st not in _STATUSES:
            raise HTTPException(status_code=422, detail="Invalid status")
        sets.append("status = %s")
        params.append(st)
        sets.append("resolved_at = " + ("now()" if st in ("resolved", "closed") else "NULL"))
        if st in ("resolved", "closed"):
            notify_resolved = True
    if body.resolution is not None:
        sets.append("resolution = %s")
        params.append(body.resolution)
    if not sets:
        raise HTTPException(status_code=422, detail="Nothing to update")
    sets.append("updated_at = now()")
    params.append(case_id)

    conn = get_pg_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            f"UPDATE glimmora_cases SET {', '.join(sets)} WHERE id = %s RETURNING *",
            tuple(params),
        )
        row = cur.fetchone()
    conn.commit()
    if not row:
        raise HTTPException(status_code=404, detail="Case not found")

    if notify_resolved:
        create_notification(
            row.get("account_id"), category="update", kind="case.resolved",
            severity="important", title="Your case was resolved",
            body=(row.get("resolution") or "Glimmora marked your case resolved."),
            resource_type="case", resource_id=case_id,
            action_url=_USER_CASE_URL, action_label="View case",
        )
    try:
        write_audit(
            actor_id=admin.get("id"), actor_email=admin.get("email"), actor_role=admin.get("role"),
            action="case.updated", target=row.get("subject"), target_id=case_id,
            service="superadmin-service",
            ip_address=request.client.host if request.client else None,
            extra={"status": body.status, "resolution": bool(body.resolution)},
        )
    except Exception:  # noqa: BLE001
        pass
    return _out(row)
