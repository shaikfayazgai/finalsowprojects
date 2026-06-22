"""
Submissions API — /api/v1/submissions/*

Lifecycle:
  draft → submitted → under_review → (feedback_requested ↔ resubmitted)* → accepted | rejected

POST /api/v1/submissions            create draft
GET  /api/v1/submissions            list (with ?status= / ?taskId= / ?limit=)
GET  /api/v1/submissions/{id}       detail
PATCH /api/v1/submissions/{id}      update draft (body / payload)
POST /api/v1/submissions/{id}/submit    transition → submitted, route to mentor
POST /api/v1/submissions/{id}/withdraw  transition → draft (pull back)
POST /api/v1/submissions/{id}/artifacts          attach artifact
DELETE /api/v1/submissions/{id}/artifacts/{aid}  remove artifact
"""

from __future__ import annotations

import logging
import re
from datetime import datetime, timezone
from typing import Annotated, Any

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from psycopg2.extras import Json

from shared.audit import write_audit
from shared.deps import get_current_user
from shared.kafka_bus import publish_event

from contributor_app import db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/submissions", tags=["submissions-v1"])

# ── Auth dependency ───────────────────────────────────────────────────────────

def _acting_account_id(user: Annotated[dict, Depends(get_current_user)]) -> int:
    raw = user.get("id")
    try:
        return int(raw)
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="Invalid account id in token")


AcctId = Annotated[int, Depends(_acting_account_id)]

_now = lambda: datetime.now(timezone.utc).isoformat()


# ── Schema (idempotent) ───────────────────────────────────────────────────────

# The `submissions` table is required for the delivery → review flow.
SUBMISSIONS_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS submissions (
    id                  BIGSERIAL PRIMARY KEY,
    account_id          BIGINT NOT NULL,
    task_definition_id  TEXT NOT NULL,
    tenant_id           TEXT,
    version             INT NOT NULL DEFAULT 1,
    status              TEXT NOT NULL DEFAULT 'draft',
    body                TEXT,
    payload             JSONB DEFAULT '{}',
    reviewer_id         TEXT,
    reviewer_assigned_at TIMESTAMPTZ,
    submitted_at        TIMESTAMPTZ,
    decided_at          TIMESTAMPTZ,
    ai_suggested_decision TEXT,
    ai_invocation_id    TEXT,
    decision_rationale  TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_submissions_account ON submissions(account_id);
CREATE INDEX IF NOT EXISTS idx_submissions_task    ON submissions(task_definition_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status  ON submissions(status);
"""

# Artifacts are optional (file uploads). NOTE: a differently-shaped
# `contributor_submission_artifacts` table may already exist in the shared DB (owned by
# another service). We create ours only if the name is free, and isolate this
# block so a collision can never roll back the required `submissions` table.
SUBMISSION_ARTIFACTS_SQL = """
CREATE TABLE IF NOT EXISTS contributor_submission_artifacts (
    id              BIGSERIAL PRIMARY KEY,
    submission_id   BIGINT NOT NULL,
    kind            TEXT NOT NULL DEFAULT 'link',
    name            TEXT NOT NULL DEFAULT '',
    url             TEXT NOT NULL DEFAULT '',
    mime_type       TEXT,
    size_bytes      BIGINT DEFAULT 0,
    caption         TEXT,
    scan_cleared    BOOLEAN NOT NULL DEFAULT TRUE,
    scan_attempted_at TIMESTAMPTZ,
    scan_error      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sub_artifacts_sub ON contributor_submission_artifacts(submission_id);
"""


def ensure_submissions_schema() -> None:
    """Idempotent DDL — called from init_contributor_schema and on startup.

    The `submissions` table is committed in its own transaction so the optional
    (and potentially name-colliding) artifacts block can never block it.
    """
    c = db.conn()
    with c.cursor() as cur:
        cur.execute(SUBMISSIONS_TABLE_SQL)
    c.commit()
    try:
        with c.cursor() as cur:
            cur.execute(SUBMISSION_ARTIFACTS_SQL)
        c.commit()
    except Exception as exc:  # noqa: BLE001
        c.rollback()
        logger.warning(
            "contributor_submission_artifacts schema skipped (pre-existing/colliding table): %s", exc
        )
    logger.info("submissions schema ensured.")


# ── Serialisers ───────────────────────────────────────────────────────────────

def _serialize_artifact(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(row["id"]),
        "kind": row.get("kind", "link"),
        "name": row.get("name", ""),
        "url": row.get("url", ""),
        "mimeType": row.get("mime_type"),
        "sizeBytes": row.get("size_bytes"),
        "caption": row.get("caption"),
        "scanCleared": bool(row.get("scan_cleared", True)),
        "scanAttemptedAt": _iso(row.get("scan_attempted_at")),
        "scanError": row.get("scan_error"),
        "createdAt": _iso(row.get("created_at")),
    }


def _iso(v: Any) -> str | None:
    if v is None:
        return None
    if isinstance(v, str):
        return v
    if isinstance(v, datetime):
        return v.isoformat()
    return str(v)


def _task_ref(task_key: Any) -> str:
    """Human-readable, role-shared task code derived from the decomposition task id.
    'tsk_1281b0cd9b9d…' -> 'T-1281B0CD'. Shown identically to contributor, mentor
    and reviewer so everyone refers to the same task."""
    s = str(task_key or "").strip()
    if not s:
        return "T-?"
    tail = s.split("_")[-1]
    hexpart = "".join(ch for ch in tail if ch.isalnum())[:8]
    return f"T-{hexpart.upper()}" if hexpart else f"T-{s}"


def _submission_ref(task_ref: str, version: Any) -> str:
    """Readable submission id: <taskRef>-SUB-v<version> (e.g. T-1281B0CD-SUB-v1)."""
    try:
        v = int(version)
    except (TypeError, ValueError):
        v = 1
    return f"{task_ref}-SUB-v{v}"


def _serialize_submission(row: dict[str, Any], artifacts: list[dict[str, Any]]) -> dict[str, Any]:
    acct = db.get_account(row["account_id"]) or {}
    _payload = row.get("payload") if isinstance(row.get("payload"), dict) else {}
    _canonical = _payload.get("canonicalTaskId") or row.get("task_definition_id") or ""
    _tref = _task_ref(_canonical)
    return {
        "id": str(row["id"]),
        "taskDefinitionId": row.get("task_definition_id") or "",
        # Role-shared task id + readable submission id (taskid + version).
        "canonicalTaskId": _canonical,
        "taskRef": _tref,
        "submissionRef": _submission_ref(_tref, row.get("version", 1)),
        "contributorId": str(row["account_id"]),
        "tenantId": row.get("tenant_id") or "",
        "version": row.get("version", 1),
        "status": row.get("status", "draft"),
        "body": row.get("body"),
        "payload": row.get("payload") if isinstance(row.get("payload"), dict) else {},
        # Deliverable link (GitHub repo/PR) lives in payload — surfaced top-level so
        # the contributor form + the mentor/reviewer view can read it directly.
        "githubUrl": (row.get("payload") or {}).get("githubUrl") if isinstance(row.get("payload"), dict) else None,
        # Contributor's self-assessed completion % (0-100), set at submit.
        "completionPct": (row.get("payload") or {}).get("completionPct") if isinstance(row.get("payload"), dict) else None,
        "reviewerId": row.get("reviewer_id"),
        "reviewerAssignedAt": _iso(row.get("reviewer_assigned_at")),
        "submittedAt": _iso(row.get("submitted_at")),
        "decidedAt": _iso(row.get("decided_at")),
        "aiSuggestedDecision": row.get("ai_suggested_decision"),
        "aiInvocationId": row.get("ai_invocation_id"),
        "decisionRationale": row.get("decision_rationale"),
        "createdAt": _iso(row.get("created_at")),
        "updatedAt": _iso(row.get("updated_at")),
        "artifacts": [_serialize_artifact(a) for a in artifacts],
        # Extra context useful to FE
        "_contributorEmail": acct.get("email"),
        "_contributorName": acct.get("name") or acct.get("email"),
    }


def _serialize_summary(row: dict[str, Any], artifact_count: int) -> dict[str, Any]:
    acct = db.get_account(row["account_id"]) or {}
    return {
        "id": str(row["id"]),
        "taskDefinitionId": row.get("task_definition_id") or "",
        "taskTitle": row.get("task_title") or "",
        "contributorId": str(row["account_id"]),
        "contributorName": acct.get("name") or acct.get("email") or f"Contributor {row['account_id']}",
        "version": row.get("version", 1),
        "status": row.get("status", "draft"),
        "submittedAt": _iso(row.get("submitted_at")),
        "reviewerId": row.get("reviewer_id"),
        "artifactCount": artifact_count,
    }


# ── DB helpers ────────────────────────────────────────────────────────────────

def _get_submission_row(submission_id: int, account_id: int) -> dict[str, Any]:
    row = db.fetch_one(
        "SELECT * FROM submissions WHERE id=%s AND account_id=%s",
        (submission_id, account_id),
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Submission not found")
    return row


def _get_artifacts(submission_id: int) -> list[dict[str, Any]]:
    # Resilient: a differently-shaped `contributor_submission_artifacts` table may pre-exist
    # in the shared DB (owned by another service). If our columns aren't present,
    # degrade to "no artifacts" rather than failing the whole submission flow.
    try:
        return db.fetch_all(
            "SELECT * FROM contributor_submission_artifacts WHERE submission_id=%s ORDER BY created_at ASC",
            (submission_id,),
        )
    except Exception as exc:  # noqa: BLE001
        try:
            db.conn().rollback()
        except Exception:  # noqa: BLE001
            pass
        logger.warning("contributor_submission_artifacts read skipped (schema mismatch): %s", exc)
        return []


def _load_detail(submission_id: int, account_id: int) -> dict[str, Any]:
    row = _get_submission_row(submission_id, account_id)
    artifacts = _get_artifacts(submission_id)
    return _serialize_submission(row, artifacts)


# ── SOW-assignee resolution (route reviews to the named mentor/reviewer) ───────

def _resolve_submission_sow(account_id: int, task_definition_id: str, payload: dict) -> str | None:
    """Best-effort resolve the SOW id for a submission: payload first, else the
    contributor_tasks row for this task."""
    sow_id = payload.get("sowId") or payload.get("sow_id")
    if sow_id:
        return sow_id
    try:
        trow = db.fetch_one(
            "SELECT data->>'sowId' AS sid FROM contributor_tasks "
            "WHERE account_id=%s AND (CAST(id AS TEXT)=%s OR data->>'taskId'=%s) "
            "ORDER BY updated_at DESC LIMIT 1",
            (account_id, str(task_definition_id), str(task_definition_id)),
        )
        return (trow or {}).get("sid")
    except Exception:  # noqa: BLE001
        return None


def _resolve_sow_reviewer(sow_id: str | None) -> tuple[str | None, str | None]:
    """Return (reviewer_id, reviewer_email) for the enterprise-assigned reviewer on
    the SOW, or (None, None) when unknown (→ shared reviewer pool)."""
    if not sow_id:
        return None, None
    try:
        row = db.fetch_one(
            "SELECT data->'reviewer' AS reviewer FROM enterprise_sows WHERE id=%s", (sow_id,))
        rv = (row or {}).get("reviewer") if isinstance(row, dict) else None
        if isinstance(rv, dict) and (rv.get("id") or rv.get("email")):
            rid = rv.get("id")
            return (str(rid) if rid is not None else None), rv.get("email")
    except Exception:  # noqa: BLE001
        pass
    return None, None


# ── Mentor routing helper (mirrors existing task-submission flow) ──────────────

def _route_to_mentor(account_id: int, submission_id: int, task_definition_id: str,
                     body: str | None, payload: dict) -> bool:
    """Create a mentor_reviews row so the submission enters the mentor queue.
    Returns True if a mentor review was created, False if the mentor gate was
    skipped (internal/single-stage). Non-fatal — failures are swallowed."""
    try:
        acct = db.fetch_one(
            "SELECT email, first_name, last_name, role, department FROM login_accounts WHERE id=%s",
            (account_id,),
        )
        is_internal = bool(acct and (acct.get("role") == "employee"
                                     or (acct.get("department") or "").lower() == "internal"))
        if is_internal:
            return False  # internal employees skip mentor queue → straight to reviewer

        name = (
            f"{(acct or {}).get('first_name') or ''} {(acct or {}).get('last_name') or ''}".strip()
            or (acct or {}).get("email") or f"Contributor {account_id}"
        )
        title = (payload.get("taskTitle") or payload.get("title")
                 or task_definition_id or "Task submission")

        # Resolve the SOW this work belongs to so it flows to the mentor/reviewer
        # for delivery-review context (best-effort).
        sow_id = _resolve_submission_sow(account_id, task_definition_id, payload)

        # Try to find SOW-assigned mentor from admin_records. NOTE: reuse the
        # `sow_id` already resolved above (payload → contributor_tasks fallback);
        # do NOT re-read it from the payload here — that overwrites the resolved
        # value with None and the review lands unrouted in the shared pool.
        mentor_id, mentor_email = "pool", None
        try:
            if sow_id:
                rec = db.fetch_one(
                    "SELECT data FROM admin_records WHERE kind='sow_mentor' AND name=%s "
                    "AND deleted_at IS NULL ORDER BY updated_at DESC LIMIT 1",
                    (sow_id,),
                )
                rec = rec or {}
                rdata = rec.get("data") if isinstance(rec.get("data"), dict) else rec
                if isinstance(rdata, dict) and rdata.get("mentorId"):
                    mentor_id = str(rdata["mentorId"])
                    mentor_email = rdata.get("mentorEmail")
        except Exception:  # noqa: BLE001
            mentor_id, mentor_email = "pool", None

        # Carry the contributor's uploaded files so the mentor can view them.
        arts = _get_artifacts(submission_id)
        art_list = [{"name": a.get("name") or "file", "url": a.get("url") or "",
                     "kind": a.get("kind") or "doc", "sizeBytes": a.get("size_bytes") or 0}
                    for a in arts if a.get("url")]
        db.execute(
            "INSERT INTO mentor_reviews "
            "  (mentor_id, mentor_email, title, submission_type, contributor_id, contributor_name, "
            "   priority, status, payload) "
            "VALUES (%s,%s,%s,'assignment',%s,%s,'normal','pending',%s)",
            (mentor_id, mentor_email, title, str(account_id), name,
             Json({
                 "submissionId": submission_id,
                 "taskDefinitionId": task_definition_id,
                 "accountId": account_id,
                 "sowId": sow_id,
                 "body": body,
                 "stage": "mentor",
                 "artifacts": art_list,
                 **{k: v for k, v in payload.items() if k not in ("body",)},
             })),
        )
        # Notify the assigned mentor of the new submission (skip the open pool).
        if mentor_id and str(mentor_id) != "pool":
            try:
                from shared.notify import create_notification
                create_notification(
                    mentor_id, category="action", kind="submission.received", severity="important",
                    title="New submission to review",
                    body=f"“{title}” was submitted and is waiting for your requirement check.",
                    resource_type="submission", resource_id=submission_id,
                    action_url="/mentor/queue", action_label="Open queue")
            except Exception:  # noqa: BLE001
                pass
        return True
    except Exception as exc:  # noqa: BLE001
        logger.warning("mentor routing failed for submission %s: %s", submission_id, exc)
        return False


def _route_to_reviewer(account_id: int, submission_id: int, task_definition_id: str,
                       body: str | None, payload: dict) -> bool:
    """Create a pending reviewer_assignments row so the submission enters the
    reviewer's QA queue directly — used for single-stage (internal) tasks and for
    resubmissions after a QA rework (which skip the mentor and go straight back to
    the reviewer). Non-fatal."""
    try:
        acct = db.fetch_one(
            "SELECT email, first_name, last_name FROM login_accounts WHERE id=%s", (account_id,))
        name = (f"{(acct or {}).get('first_name') or ''} {(acct or {}).get('last_name') or ''}".strip()
                or (acct or {}).get("email") or f"Contributor {account_id}")
        title = (payload.get("taskTitle") or payload.get("title")
                 or task_definition_id or "Task submission")
        arts = _get_artifacts(submission_id)
        art_list = [{"name": a.get("name") or "file", "url": a.get("url") or "",
                     "kind": a.get("kind") or "doc", "sizeBytes": a.get("size_bytes") or 0}
                    for a in arts if a.get("url")]
        sow_id = _resolve_submission_sow(account_id, task_definition_id, payload)
        rev_id, rev_email = _resolve_sow_reviewer(sow_id)
        db.execute(
            "INSERT INTO reviewer_assignments "
            "  (reviewer_id, reviewer_email, project_id, project_name, title, status, priority, data) "
            "VALUES (%s, %s, %s, %s, %s, 'pending', 'normal', %s)",
            (rev_id, rev_email,
             str(payload.get("canonicalTaskId") or payload.get("taskId") or ""),
             f"Review: {title}", title,
             Json({"stage": "enterprise_reviewer", "direct": True,
                   "taskId": payload.get("taskId"), "canonicalTaskId": payload.get("canonicalTaskId"),
                   "taskRef": payload.get("taskRef"), "submissionRef": payload.get("submissionRef"),
                   "submissionId": submission_id, "sowId": sow_id,
                   "accountId": account_id, "contributorName": name,
                   "body": body, "summary": payload.get("summary"),
                   "description": payload.get("description"),
                   "acceptanceCriteria": payload.get("acceptanceCriteria"),
                   "dueAt": payload.get("dueAt"), "githubUrl": payload.get("githubUrl"),
                   "artifacts": art_list, "referenceFiles": payload.get("referenceFiles") or [],
                   "completionPct": payload.get("completionPct")})),
        )
        return True
    except Exception as exc:  # noqa: BLE001
        logger.warning("reviewer routing failed for submission %s: %s", submission_id, exc)
        return False


# ════════════════════════════════════════════════════════════════════════════
# Endpoints
# ════════════════════════════════════════════════════════════════════════════

@router.get("")
async def list_submissions(
    account_id: AcctId,
    status: list[str] | None = Query(default=None),
    task_id: str | None = Query(default=None, alias="taskId"),
    limit: int | None = Query(default=None),
    page: int = 1,
    page_size: int = 20,
):
    """List submissions for the authenticated contributor.
    Returns { items: SubmissionSummary[] }.
    """
    rows = db.fetch_all(
        "SELECT * FROM submissions WHERE account_id=%s ORDER BY created_at DESC",
        (account_id,),
    )
    if status:
        rows = [r for r in rows if r.get("status") in status]
    if task_id:
        rows = [r for r in rows if r.get("task_definition_id") == task_id]
    if limit:
        rows = rows[:limit]

    # Get artifact counts in one go
    import psycopg2.extras as _pge
    sub_ids = [r["id"] for r in rows]
    counts: dict[int, int] = {}
    if sub_ids:
        c = db.conn()
        with c.cursor(cursor_factory=_pge.RealDictCursor) as cur:
            cur.execute(
                "SELECT submission_id, COUNT(*) AS cnt FROM contributor_submission_artifacts "
                "WHERE submission_id = ANY(%s) GROUP BY submission_id",
                (sub_ids,),
            )
            for cnt_row in cur.fetchall():
                counts[int(cnt_row["submission_id"])] = int(cnt_row["cnt"])

    # Enrich task_title from contributor_tasks (best-effort)
    task_titles: dict[str, str] = {}
    for r in rows:
        tdid = r.get("task_definition_id") or ""
        if tdid and tdid not in task_titles:
            try:
                tid_int = int(tdid)
                t = db.fetch_one("SELECT title FROM contributor_tasks WHERE id=%s AND account_id=%s",
                                 (tid_int, account_id))
                task_titles[tdid] = (t or {}).get("title") or ""
            except (ValueError, Exception):  # noqa: BLE001
                task_titles[tdid] = ""
        r["task_title"] = task_titles.get(tdid, "")

    items = [_serialize_summary(r, counts.get(r["id"], 0)) for r in rows]
    if limit:
        return {"items": items}
    result = db.paginate(items, page, page_size)
    # Ensure FE contract: key is "items"
    return result


@router.post("", status_code=201)
async def create_draft(account_id: AcctId, payload: dict = Body(default={})):
    """Create a new draft submission.
    Body: { taskDefinitionId, body?, payload? }
    Returns { submission: SubmissionDetail }
    """
    task_definition_id = (
        payload.get("taskDefinitionId") or payload.get("task_definition_id")
        # accept taskId / task_id as a fallback — callers commonly send the task id
        or payload.get("taskId") or payload.get("task_id") or ""
    )
    if not task_definition_id:
        raise HTTPException(status_code=422, detail="taskDefinitionId (or taskId) is required")

    # Reuse an existing open draft instead of creating duplicates — clicking
    # "Open draft" again (or a double-submit) returns the same draft.
    existing_open = db.fetch_one(
        "SELECT * FROM submissions WHERE task_definition_id=%s AND account_id=%s "
        "AND status IN ('draft','feedback_requested') ORDER BY version DESC, id DESC LIMIT 1",
        (str(task_definition_id), account_id))
    if existing_open:
        return {"submission": _serialize_submission(existing_open, _get_artifacts(existing_open["id"]))}

    body_text = payload.get("body")
    extra_payload = dict(payload.get("payload") or {})
    tenant_id = payload.get("tenantId") or payload.get("tenant_id")

    # Resolve the canonical decomposition task id (tsk_…) so the submission carries a
    # stable, role-shared task ref even though task_definition_id is the contributor row id.
    if not extra_payload.get("canonicalTaskId"):
        try:
            ct = db.fetch_one(
                "SELECT data->>'taskId' AS tid FROM contributor_tasks WHERE id=%s AND account_id=%s",
                (int(task_definition_id), account_id))
            if ct and ct.get("tid"):
                extra_payload["canonicalTaskId"] = ct["tid"]
        except (ValueError, Exception):  # noqa: BLE001
            pass

    row = db.execute(
        """
        INSERT INTO submissions
            (account_id, task_definition_id, tenant_id, version, status, body, payload)
        VALUES (%s, %s, %s, 1, 'draft', %s, %s)
        RETURNING *
        """,
        (account_id, task_definition_id, tenant_id, body_text, Json(extra_payload)),
    )
    artifacts: list[dict[str, Any]] = []
    sub = _serialize_submission(row, artifacts)

    write_audit(
        actor_id=str(account_id), actor_email=None, actor_role="contributor",
        action="submission_draft_created", service="contributor-service",
        target_id=str(row["id"]),
        extra={"taskDefinitionId": task_definition_id},
    )
    publish_event("contributor.submission_draft_created",
                  {"accountId": str(account_id), "submissionId": str(row["id"]),
                   "taskDefinitionId": task_definition_id})
    return {"submission": sub}


@router.get("/{submission_id}")
async def get_submission(account_id: AcctId, submission_id: int):
    """Return { submission: SubmissionDetail }."""
    return {"submission": _load_detail(submission_id, account_id)}


@router.patch("/{submission_id}")
async def update_submission(account_id: AcctId, submission_id: int, payload: dict = Body(default={})):
    """Update draft body/payload. Returns { submission: SubmissionDetail }."""
    existing = _get_submission_row(submission_id, account_id)
    if existing.get("status") not in ("draft", "feedback_requested"):
        raise HTTPException(status_code=409,
                            detail=f"Cannot edit a submission in status '{existing.get('status')}'")

    body_text = payload.get("body", existing.get("body"))
    new_payload = payload.get("payload")
    if new_payload is not None:
        merged = {**(existing.get("payload") or {}), **new_payload}
    else:
        merged = existing.get("payload") or {}

    # Bump version on every edit so reviewers can track iterations
    new_version = int(existing.get("version", 1)) + 1

    row = db.execute(
        """
        UPDATE submissions
           SET body=%s, payload=%s, version=%s, updated_at=now()
         WHERE id=%s AND account_id=%s
        RETURNING *
        """,
        (body_text, Json(merged), new_version, submission_id, account_id),
    )
    write_audit(
        actor_id=str(account_id), actor_email=None, actor_role="contributor",
        action="submission_updated", service="contributor-service",
        target_id=str(submission_id),
    )
    return {"submission": _serialize_submission(row, _get_artifacts(submission_id))}


@router.post("/{submission_id}/submit")
async def submit_submission(account_id: AcctId, submission_id: int, payload: dict = Body(default={})):
    """Transition draft → submitted and route to mentor queue.
    Returns { submission: SubmissionDetail }.
    """
    existing = _get_submission_row(submission_id, account_id)
    allowed = {"draft", "feedback_requested", "resubmitted"}
    if existing.get("status") not in allowed:
        raise HTTPException(status_code=409,
                            detail=f"Cannot submit from status '{existing.get('status')}'")

    # A verified GitHub deliverable link is REQUIRED to submit; notes and files
    # stay optional. Also capture the contributor's self-assessed completion %.
    merged_payload = dict(existing.get("payload") or {})
    incoming_link = (payload.get("githubUrl") or payload.get("github_url") or "").strip()
    if incoming_link:
        merged_payload["githubUrl"] = incoming_link
    if payload.get("completionPct") is not None:
        try:
            merged_payload["completionPct"] = max(0, min(100, int(float(payload.get("completionPct")))))
        except (TypeError, ValueError):
            pass
    github_url = (merged_payload.get("githubUrl") or "").strip()
    if not github_url:
        raise HTTPException(status_code=422, detail="A GitHub deliverable link is required to submit.")
    if not re.match(r"^https?://(www\.)?github\.com/[^/]+/[^/]+", github_url, re.IGNORECASE):
        raise HTTPException(
            status_code=422,
            detail="Enter a valid GitHub repository or pull-request link (e.g. https://github.com/org/repo).")

    now = datetime.now(timezone.utc)
    # For resubmission bump version
    new_status = "submitted"
    new_version = int(existing.get("version", 1)) + 1 if existing.get("status") == "feedback_requested" else int(existing.get("version", 1))

    row = db.execute(
        """
        UPDATE submissions
           SET status='submitted', submitted_at=%s, version=%s, payload=%s, updated_at=now()
         WHERE id=%s AND account_id=%s
        RETURNING *
        """,
        (now, new_version, Json(merged_payload), submission_id, account_id),
    )

    sub = _serialize_submission(row, _get_artifacts(submission_id))

    # Route to mentor queue (non-fatal) WITH the full task context, so the mentor
    # (and later the reviewer) see the same brief, criteria, deadline, task id and
    # readable submission id as the contributor.
    task_definition_id = row.get("task_definition_id") or ""
    body_text = row.get("body")
    sub_payload = dict(row.get("payload") if isinstance(row.get("payload"), dict) else {})
    try:
        ctrow = db.fetch_one(
            "SELECT data, due_at, title FROM contributor_tasks "
            "WHERE account_id=%s AND (CAST(id AS TEXT)=%s OR data->>'taskId'=%s) "
            "ORDER BY updated_at DESC LIMIT 1",
            (account_id, str(task_definition_id), str(task_definition_id)))
        ctd = (ctrow or {}).get("data") if isinstance((ctrow or {}).get("data"), dict) else {}
    except Exception:  # noqa: BLE001
        ctrow, ctd = None, {}
    # NB: the freelancer db helper spreads JSONB `data` to top-level keys, so read
    # task fields from ctrow too (ctd may be empty).
    _cr = ctrow or {}
    canonical_task = (sub_payload.get("canonicalTaskId") or ctd.get("taskId")
                      or _cr.get("taskId") or task_definition_id)
    tref = _task_ref(canonical_task)
    sub_payload.update({
        "canonicalTaskId": canonical_task,
        "taskRef": tref,
        "submissionRef": _submission_ref(tref, new_version),
        "taskTitle": sub_payload.get("taskTitle") or _cr.get("title"),
        "description": sub_payload.get("description") or ctd.get("description") or _cr.get("description"),
        "acceptanceCriteria": (sub_payload.get("acceptanceCriteria")
                               or ctd.get("acceptanceCriteria") or ctd.get("acceptance_criteria")
                               or _cr.get("acceptanceCriteria") or _cr.get("acceptance_criteria")),
        "dueAt": (sub_payload.get("dueAt") or ctd.get("dueAt") or _cr.get("dueAt")
                  or (_iso(_cr.get("due_at")) if _cr.get("due_at") else None)),
        # Enterprise's task reference files, so the mentor/reviewer can open them too.
        "referenceFiles": (ctd.get("referenceFiles") or _cr.get("referenceFiles")
                           or ctd.get("attachments") or []),
    })
    # Routing is status-aware:
    #  • a resubmission AFTER a QA rework (decomp status 'qa_review_rework') goes
    #    STRAIGHT BACK to the reviewer (skips the mentor) → qa_review_pending
    #  • a single-stage / internal task skips the mentor too → qa_review_pending
    #  • everything else (fresh submit, or resubmit after a requirement-check
    #    rework) goes to the mentor → req_check_pending
    prev_status = None
    if canonical_task and str(canonical_task).startswith("tsk_"):
        try:
            _r = db.fetch_one("SELECT status FROM decomp_tasks WHERE id=%s", (canonical_task,))
            prev_status = (_r or {}).get("status")
        except Exception:  # noqa: BLE001
            prev_status = None

    resubmit_to_reviewer = prev_status == "qa_review_rework"
    if resubmit_to_reviewer:
        routed_reviewer = _route_to_reviewer(account_id, submission_id, task_definition_id,
                                             body_text, sub_payload)
        delivery_status = "qa_review_pending" if routed_reviewer else "qa_review_pending"
    else:
        routed_mentor = _route_to_mentor(account_id, submission_id, task_definition_id,
                                         body_text, sub_payload)
        if routed_mentor:
            delivery_status = "req_check_pending"
        else:
            # single-stage / internal → no mentor gate, go straight to reviewer
            _route_to_reviewer(account_id, submission_id, task_definition_id, body_text, sub_payload)
            delivery_status = "qa_review_pending"

    # Update contributor_tasks status if task_definition_id is a numeric task id
    try:
        tid = int(task_definition_id)
        db.execute(
            "UPDATE contributor_tasks SET status='submitted', updated_at=now() "
            "WHERE id=%s AND account_id=%s",
            (tid, account_id),
        )
    except (ValueError, Exception):  # noqa: BLE001
        pass

    # Advance the decomposition task to the canonical granular lifecycle status so
    # all four portals read the same source of truth (each maps it to its own label).
    if canonical_task and str(canonical_task).startswith("tsk_"):
        try:
            db.execute("UPDATE decomp_tasks SET status=%s, updated_at=now() WHERE id=%s",
                       (delivery_status, canonical_task))
        except Exception:  # noqa: BLE001
            pass

    write_audit(
        actor_id=str(account_id), actor_email=None, actor_role="contributor",
        action="submission_submitted", service="contributor-service",
        target_id=str(submission_id),
        extra={"taskDefinitionId": task_definition_id, "version": new_version},
    )
    publish_event("contributor.submission_submitted",
                  {"accountId": str(account_id), "submissionId": str(submission_id),
                   "taskDefinitionId": task_definition_id})
    return {"submission": sub}


@router.post("/{submission_id}/withdraw")
async def withdraw_submission(account_id: AcctId, submission_id: int, payload: dict = Body(default={})):
    """Pull a submission back to draft status.
    Allowed from: submitted, under_review (if not yet decided).
    Returns { submission: SubmissionDetail }.
    """
    existing = _get_submission_row(submission_id, account_id)
    allowed = {"submitted", "under_review", "resubmitted"}
    if existing.get("status") not in allowed:
        raise HTTPException(status_code=409,
                            detail=f"Cannot withdraw from status '{existing.get('status')}'")

    row = db.execute(
        """
        UPDATE submissions
           SET status='draft', updated_at=now()
         WHERE id=%s AND account_id=%s
        RETURNING *
        """,
        (submission_id, account_id),
    )

    # Revert task status if applicable
    task_definition_id = row.get("task_definition_id") or ""
    try:
        tid = int(task_definition_id)
        db.execute(
            "UPDATE contributor_tasks SET status='in_progress', updated_at=now() "
            "WHERE id=%s AND account_id=%s",
            (tid, account_id),
        )
    except (ValueError, Exception):  # noqa: BLE001
        pass

    write_audit(
        actor_id=str(account_id), actor_email=None, actor_role="contributor",
        action="submission_withdrawn", service="contributor-service",
        target_id=str(submission_id),
    )
    return {"submission": _serialize_submission(row, _get_artifacts(submission_id))}


@router.post("/{submission_id}/artifacts", status_code=201)
async def attach_artifact(account_id: AcctId, submission_id: int, payload: dict = Body(default={})):
    """Attach an artifact (file/link/evidence) to a draft submission.
    Body: { kind, name, url, mimeType?, sizeBytes?, caption?, scanCleared? }
    Returns { artifact: SubmissionArtifactDetail }
    """
    # Ownership check
    _get_submission_row(submission_id, account_id)

    kind = payload.get("kind", "link")
    if kind not in ("file", "link", "evidence"):
        raise HTTPException(status_code=422, detail="kind must be file, link, or evidence")
    name = payload.get("name") or ""
    url = payload.get("url") or ""
    if not url:
        raise HTTPException(status_code=422, detail="url is required")

    # Files start uncleared until scan; links/evidence default cleared
    scan_cleared = payload.get("scanCleared", kind != "file")

    row = db.execute(
        """
        INSERT INTO contributor_submission_artifacts
            (submission_id, kind, name, url, mime_type, size_bytes, caption, scan_cleared)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING *
        """,
        (submission_id, kind, name, url,
         payload.get("mimeType"), payload.get("sizeBytes", 0),
         payload.get("caption"), scan_cleared),
    )
    # Touch submission updated_at
    db.execute("UPDATE submissions SET updated_at=now() WHERE id=%s", (submission_id,))

    write_audit(
        actor_id=str(account_id), actor_email=None, actor_role="contributor",
        action="submission_artifact_attached", service="contributor-service",
        target_id=str(submission_id),
        extra={"artifactId": str(row["id"]), "kind": kind, "name": name},
    )
    return {"artifact": _serialize_artifact(row)}


@router.delete("/{submission_id}/artifacts/{artifact_id}")
async def remove_artifact(account_id: AcctId, submission_id: int, artifact_id: int):
    """Remove an artifact. Returns { removed: true }."""
    # Ownership check
    _get_submission_row(submission_id, account_id)

    row = db.execute(
        "DELETE FROM contributor_submission_artifacts WHERE id=%s AND submission_id=%s RETURNING id",
        (artifact_id, submission_id),
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Artifact not found")

    db.execute("UPDATE submissions SET updated_at=now() WHERE id=%s", (submission_id,))

    write_audit(
        actor_id=str(account_id), actor_email=None, actor_role="contributor",
        action="submission_artifact_removed", service="contributor-service",
        target_id=str(submission_id),
        extra={"artifactId": str(artifact_id)},
    )
    return {"removed": True}
