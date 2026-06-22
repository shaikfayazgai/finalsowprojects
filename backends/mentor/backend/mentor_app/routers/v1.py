"""
Mentor service v1 router — /api/v1/mentor/**

Provides the FE-contracted endpoints:
  GET  /api/v1/mentor/me            — mentor profile + role + isSeniorOrLead + onboardingComplete
  POST /api/v1/mentor/me            — mark onboarding complete
  GET  /api/v1/mentor/queue         — submission review queue (with status/priority filter)
  GET  /api/v1/mentor/submissions/{id}          — submission detail
  POST /api/v1/mentor/submissions/{id}/claim    — claim a pool submission
  POST /api/v1/mentor/submissions/{id}/decide   — decide (accept|rework|reject|withdrawn|reassign)
  POST /api/v1/mentor/submissions/{id}/release  — unclaim / release back to pool

All endpoints are Bearer-protected with mentor role scope.
Mutations emit audit events to MongoDB via shared.audit.write_audit.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Annotated, Any, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from psycopg2.extras import Json, RealDictCursor
from pydantic import BaseModel, Field

from shared.audit import write_audit
from shared.db import ensure_pg_clean, get_pg_connection
from shared.deps import require_roles

from mentor_app.seed import ensure_profile

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/mentor", tags=["mentor-v1"])

# Allowed roles for all mentor endpoints.
mentor_user = require_roles("mentor", "reviewer", "admin", "superadmin", "super_admin")
MentorDep = Annotated[dict, Depends(mentor_user)]

# FE kind → DB status mapping (extended beyond the legacy "escalate" decision)
_KIND_STATUS: dict[str, str] = {
    "accept": "accepted",
    "rework": "rework",
    "reject": "rejected",
    "withdrawn": "withdrawn",
    "reassign": "pending",      # reassign returns the item to pool
    "reassigned": "pending",
    "escalate": "escalated",
}

# Mentor decision → canonical decomp_tasks lifecycle status (the single source of
# truth every role reads from the shared DB).
_DELIVERY_STATUS: dict[str, str] = {
    "accept": "qa_review_pending",   # requirement check passed → reviewer QA
    "rework": "req_check_rework",    # returned to contributor to fix
    "reject": "req_check_failed",    # requirement check failed (terminal)
}

# Whether a senior/lead role string qualifies as isSeniorOrLead
_SENIOR_CODES = {"mentor.senior", "mentor.lead"}


# ── helpers ───────────────────────────────────────────────────────────────────

def _ok(data: Any) -> dict:
    return {"success": True, "message": None, "data": data}


def _conn():
    ensure_pg_clean()
    return get_pg_connection()


def _serialize(row: dict) -> dict:
    out = dict(row)
    for k, v in out.items():
        if isinstance(v, datetime):
            out[k] = v.isoformat()
    return out


def _resolve_mentor_role(user: dict) -> str:
    """
    Resolve the fine-grained mentor tier from login_accounts / user claims.
    Falls back to 'mentor' if no sub-role is recorded.
    """
    # Token may carry a scoped role code directly (e.g. 'mentor.senior').
    token_role = (user.get("role") or "").lower()
    if token_role in _SENIOR_CODES or token_role.startswith("mentor."):
        return token_role
    return "mentor"


def _is_senior_or_lead(role: str) -> bool:
    return role in _SENIOR_CODES


# ── /api/v1/mentor/me ─────────────────────────────────────────────────────────

class _OnboardingMarkRequest(BaseModel):
    """Optional body for POST /me — currently unused but accepted gracefully."""
    onboardingComplete: bool = True


@router.get("/me")
def mentor_me(user: MentorDep):
    """Return mentor profile + role + isSeniorOrLead + onboardingComplete."""
    mentor_id = str(user["id"])
    conn = _conn()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        ensure_profile(cur, user)
        conn.commit()
        cur.execute(
            "SELECT * FROM mentor_profiles WHERE mentor_id = %s",
            (mentor_id,),
        )
        row = cur.fetchone()
    row = _serialize(row) if row else {}

    # Strip internal sentinel
    settings = row.get("settings") or {}
    if isinstance(settings, dict):
        settings.pop("_demo_seeded", None)
        row["settings"] = settings

    role = _resolve_mentor_role(user)

    # onboarding_complete stored in settings JSONB
    onboarding_complete = bool(
        (settings or {}).get("onboarding_complete") or
        (settings or {}).get("onboardingComplete")
    )

    # Build profile shape matching FE MentorProfile
    display_name = (
        row.get("display_name") or
        (user.get("email") or "").split("@")[0].replace(".", " ").title() or
        "Mentor"
    )
    profile = {
        "id": mentor_id,
        "email": user.get("email"),
        "displayName": display_name,
        "role": role,
        "title": (
            "Lead Mentor" if role == "mentor.lead"
            else "Senior Mentor" if role == "mentor.senior"
            else "Mentor"
        ),
        "headline": row.get("headline") or "",
        "bio": row.get("bio") or "",
        "expertise": row.get("expertise") or [],
        "languages": row.get("languages") or [],
        "timezone": row.get("timezone") or "UTC",
        "avatarUrl": row.get("avatar_url"),
        "links": row.get("links") or {},
        "settings": settings,
    }

    return {
        "profile": profile,
        "role": role,
        "isSeniorOrLead": _is_senior_or_lead(role),
        "onboardingComplete": onboarding_complete,
    }


@router.post("/me")
def mark_onboarding(user: MentorDep):
    """Mark onboarding as complete for this mentor."""
    mentor_id = str(user["id"])
    conn = _conn()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        ensure_profile(cur, user)
        cur.execute(
            """
            UPDATE mentor_profiles
               SET settings = jsonb_set(
                       COALESCE(settings, '{}'::jsonb),
                       '{onboarding_complete}', 'true'::jsonb
                   ),
                   updated_at = now()
             WHERE mentor_id = %s
            """,
            (mentor_id,),
        )
    conn.commit()
    write_audit(
        actor_id=mentor_id, actor_email=user.get("email"), actor_role=user.get("role"),
        action="mentor.onboarding.complete", target="mentor_profiles",
        target_id=mentor_id, service="mentor-service",
        tenant_id=user.get("tenant_id"),
    )
    return {"success": True, "onboardingComplete": True}


# ── /api/v1/mentor/queue ─────────────────────────────────────────────────────

@router.get("/queue")
def list_queue_v1(
    user: MentorDep,
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """
    Return the review queue for this mentor.
    Includes pool items (unclaimed) as well as items assigned to this mentor.
    Supports status / priority / text-search filters.
    """
    mentor_id = str(user["id"])
    where = ["(mentor_id = %s OR mentor_id = 'pool' OR claimed_by IS NULL OR claimed_by = %s)"]
    params: list[Any] = [mentor_id, mentor_id]

    if status:
        where.append("status = %s")
        params.append(status)
    else:
        where.append("status IN ('pending','in_review','escalated')")

    if priority:
        where.append("priority = %s")
        params.append(priority)

    if q:
        where.append("(title ILIKE %s OR contributor_name ILIKE %s)")
        params.extend([f"%{q}%", f"%{q}%"])

    clause = " AND ".join(where)
    offset = (page - 1) * page_size

    conn = _conn()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(f"SELECT COUNT(*) AS total FROM mentor_reviews WHERE {clause}", params)
        total = (cur.fetchone() or {}).get("total", 0)
        cur.execute(
            f"""
            SELECT id, title, submission_type, contributor_name, priority, status,
                   decision, score, mentee_id, claimed_by, created_at, updated_at
            FROM mentor_reviews WHERE {clause}
            ORDER BY
              CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1
                            WHEN 'normal' THEN 2 ELSE 3 END,
              created_at DESC
            LIMIT %s OFFSET %s
            """,
            params + [page_size, offset],
        )
        items = [_serialize(r) for r in cur.fetchall()]

    return _ok({
        "items": items,
        "page": page,
        "page_size": page_size,
        "total": int(total or 0),
    })


# ── /api/v1/mentor/assigned-sows ─────────────────────────────────────────────

@router.get("/assigned-sows")
def list_assigned_sows(user: MentorDep):
    """SOWs this mentor is assigned to (admin_records kind=sow_mentor), shown as
    soon as they're assigned — scope/files/decomposition status via work-context.
    """
    mentor_id = str(user.get("id") or "")
    email = (user.get("email") or "").lower()
    conn = _conn()
    sows: list[dict] = []
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """
            SELECT ar.name AS sow_id, ar.status AS assign_status, ar.updated_at AS assigned_at,
                   s.data AS sow_data, s.owner_email
            FROM admin_records ar
            LEFT JOIN enterprise_sows s ON s.id = ar.name
            WHERE ar.kind = 'sow_mentor' AND ar.deleted_at IS NULL
              AND (ar.data->>'mentorId' = %s OR lower(ar.data->>'mentorEmail') = %s)
            ORDER BY ar.updated_at DESC
            """,
            (mentor_id, email),
        )
        for r in cur.fetchall():
            sd = r["sow_data"] or {}
            if isinstance(sd, str):
                try:
                    sd = json.loads(sd)
                except (ValueError, TypeError):
                    sd = {}
            title = sd.get("projectTitle") or sd.get("title") or sd.get("fileName") if isinstance(sd, dict) else None
            sows.append({
                "sowId": r["sow_id"],
                "title": title or r["sow_id"],
                "status": sd.get("status") if isinstance(sd, dict) else None,
                "ownerEmail": r.get("owner_email"),
                "assignmentStatus": r.get("assign_status") or "assigned",
                "assignedAt": r["assigned_at"].isoformat() if r.get("assigned_at") else None,
            })
    return {"sows": sows, "total": len(sows)}


# ── /api/v1/mentor/submissions/{id} ──────────────────────────────────────────

@router.get("/submissions/{submission_id}")
def get_submission(submission_id: int, user: MentorDep):
    """Return full detail for a submission (mentor_reviews row + notes)."""
    mentor_id = str(user["id"])
    conn = _conn()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """
            SELECT * FROM mentor_reviews
             WHERE id = %s
               AND (mentor_id = %s OR mentor_id = 'pool'
                    OR claimed_by = %s OR claimed_by IS NULL)
            """,
            (submission_id, mentor_id, mentor_id),
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Submission not found")
        cur.execute(
            """
            SELECT id, body, attachments, kind, created_at
              FROM mentor_notes
             WHERE review_id = %s
             ORDER BY created_at DESC
            """,
            (submission_id,),
        )
        notes = [_serialize(n) for n in cur.fetchall()]
    out = _serialize(row)
    out["notes"] = notes
    return _ok(out)


# ── /api/v1/mentor/submissions/{id}/claim ────────────────────────────────────

@router.post("/submissions/{submission_id}/claim")
def claim_submission(submission_id: int, user: MentorDep):
    """Claim a pool/unclaimed submission for review by this mentor."""
    mentor_id = str(user["id"])
    conn = _conn()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            "SELECT id, status, claimed_by FROM mentor_reviews WHERE id = %s",
            (submission_id,),
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Submission not found")
        # Allow reclaim by same mentor (idempotent); reject if claimed by someone else
        if row.get("claimed_by") and str(row["claimed_by"]) != mentor_id:
            raise HTTPException(status_code=409, detail="Submission already claimed by another mentor")

        cur.execute(
            """
            UPDATE mentor_reviews
               SET claimed_by = %s,
                   mentor_id = %s,
                   mentor_email = %s,
                   status = CASE WHEN status = 'pending' THEN 'in_review' ELSE status END,
                   updated_at = now()
             WHERE id = %s
            RETURNING *
            """,
            (mentor_id, mentor_id, user.get("email"), submission_id),
        )
        updated = cur.fetchone()
    conn.commit()
    write_audit(
        actor_id=mentor_id, actor_email=user.get("email"), actor_role=user.get("role"),
        action="mentor.submission.claim", target="mentor_reviews",
        target_id=str(submission_id), service="mentor-service",
        tenant_id=user.get("tenant_id"),
    )
    return _ok(_serialize(updated))


# ── /api/v1/mentor/submissions/{id}/release ──────────────────────────────────

@router.post("/submissions/{submission_id}/release")
def release_submission(submission_id: int, user: MentorDep):
    """Release a claimed submission back to the pool."""
    mentor_id = str(user["id"])
    conn = _conn()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            "SELECT id, claimed_by, mentor_id FROM mentor_reviews WHERE id = %s",
            (submission_id,),
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Submission not found")
        if row.get("claimed_by") and str(row["claimed_by"]) != mentor_id:
            raise HTTPException(status_code=403, detail="Cannot release a submission claimed by another mentor")

        cur.execute(
            """
            UPDATE mentor_reviews
               SET claimed_by = NULL,
                   mentor_id = 'pool',
                   mentor_email = NULL,
                   status = CASE WHEN status = 'in_review' THEN 'pending' ELSE status END,
                   updated_at = now()
             WHERE id = %s
            RETURNING *
            """,
            (submission_id,),
        )
        updated = cur.fetchone()
    conn.commit()
    write_audit(
        actor_id=mentor_id, actor_email=user.get("email"), actor_role=user.get("role"),
        action="mentor.submission.release", target="mentor_reviews",
        target_id=str(submission_id), service="mentor-service",
        tenant_id=user.get("tenant_id"),
    )
    return _ok(_serialize(updated))


# ── /api/v1/mentor/submissions/{id}/decide ───────────────────────────────────

class SubmissionDecideRequest(BaseModel):
    kind: Literal["accept", "rework", "reject", "withdrawn", "reassign", "reassigned", "escalate"]
    finalComment: Optional[str] = None
    comments: Optional[str] = None        # legacy alias for finalComment
    score: Optional[float] = None
    rubricOverall: Optional[float] = None
    reviewerConfidence: Optional[str] = None
    rejectReason: Optional[str] = None
    rejectCategory: Optional[str] = None
    reworkCorrections: Optional[list[str]] = None
    withdrawType: Optional[str] = None
    qualityRatings: Optional[dict[str, Any]] = None      # 5★ per-dimension quality rating
    qualityRatingOverall: Optional[float] = None         # their average
    meta: dict[str, Any] = Field(default_factory=dict)


@router.post("/submissions/{submission_id}/decide")
def decide_submission(submission_id: int, body: SubmissionDecideRequest, user: MentorDep):
    """
    Record a mentor decision on a submission.

    kind=accept   → status=accepted; route to reviewer_assignments (handoff).
    kind=rework   → status=rework; submission goes back to contributor.
    kind=reject   → status=rejected.
    kind=withdrawn / kind=reassigned → status=pending returned to pool.
    kind=escalate → status=escalated; creates a mentor_escalations row.

    Audit logged to MongoDB.
    """
    mentor_id = str(user["id"])
    new_status = _KIND_STATUS.get(body.kind, "pending")
    comment = body.finalComment or body.comments or ""
    # The mentor's 5★ quality rating is the primary score when present (falls back
    # to the legacy rubric overall).
    score = (body.qualityRatingOverall if body.qualityRatingOverall is not None
             else (body.score if body.score is not None else body.rubricOverall))

    conn = _conn()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """
            SELECT id, mentor_id, claimed_by, mentee_id, contributor_id, title, contributor_name, payload
              FROM mentor_reviews
             WHERE id = %s
               AND (mentor_id = %s OR claimed_by = %s
                    OR mentor_id = 'pool' OR claimed_by IS NULL)
            """,
            (submission_id, mentor_id, mentor_id),
        )
        existing = cur.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Submission not found")

        # Persist the decision (carry the per-dimension quality rating into payload).
        merged_payload = dict(existing.get("payload") or {})
        if body.qualityRatings is not None:
            merged_payload["qualityRatings"] = body.qualityRatings
            merged_payload["qualityRatingOverall"] = body.qualityRatingOverall
        cur.execute(
            """
            UPDATE mentor_reviews
               SET decision    = %s,
                   status      = %s,
                   score       = %s,
                   comments    = %s,
                   mentor_id   = %s,
                   mentor_email = %s,
                   claimed_by  = %s,
                   payload     = %s,
                   decided_at  = now(),
                   updated_at  = now()
             WHERE id = %s
            RETURNING *
            """,
            (
                body.kind, new_status, score, comment or None,
                mentor_id, user.get("email"), mentor_id,
                Json(merged_payload),
                submission_id,
            ),
        )
        updated = cur.fetchone()

        # ── accept → route to reviewer_assignments (two-stage handoff) ────────
        if body.kind == "accept":
            pl = existing.get("payload") or {}
            if isinstance(pl, str):
                try:
                    pl = json.loads(pl)
                except (ValueError, TypeError):
                    pl = {}
            # Route to the enterprise-assigned reviewer on this SOW (else NULL = pool).
            _rev_id, _rev_email = None, None
            _sid = pl.get("sowId")
            if _sid:
                try:
                    cur.execute("SELECT data->'reviewer' AS reviewer FROM enterprise_sows WHERE id=%s", (_sid,))
                    _rrow = cur.fetchone()
                    _rv = (_rrow or {}).get("reviewer") if _rrow else None
                    if isinstance(_rv, dict) and (_rv.get("id") or _rv.get("email")):
                        _rev_id = str(_rv["id"]) if _rv.get("id") is not None else None
                        _rev_email = _rv.get("email")
                except Exception:  # noqa: BLE001
                    _rev_id, _rev_email = None, None
            try:
                cur.execute(
                    """
                    INSERT INTO reviewer_assignments
                        (reviewer_id, reviewer_email, project_id, project_name, title,
                         status, priority, data)
                    VALUES (%s, %s, %s, %s, %s, 'pending', 'normal', %s)
                    """,
                    (
                        _rev_id, _rev_email,
                        str(pl.get("taskId") or ""),
                        existing.get("title"),
                        f"Review: {existing.get('title')}",
                        Json({
                            "stage": "enterprise_reviewer",
                            "fromMentorReview": submission_id,
                            "taskId": pl.get("taskId"),
                            "canonicalTaskId": pl.get("canonicalTaskId") or pl.get("taskId"),
                            "taskRef": pl.get("taskRef"),
                            "submissionRef": pl.get("submissionRef"),
                            "sowId": pl.get("sowId"),
                            "submissionId": pl.get("submissionId"),
                            "accountId": pl.get("accountId"),
                            "contributorName": existing.get("contributor_name"),
                            "url": pl.get("url"),
                            "summary": pl.get("summary"),
                            # Full task context so the reviewer sees the same brief,
                            # criteria, deadline, deliverable link + files as the mentor.
                            "description": pl.get("description"),
                            "acceptanceCriteria": pl.get("acceptanceCriteria"),
                            "dueAt": pl.get("dueAt"),
                            "githubUrl": pl.get("githubUrl"),
                            "artifacts": pl.get("artifacts") or [],
                            "referenceFiles": pl.get("referenceFiles") or [],
                            "completionPct": pl.get("completionPct"),
                            # Carry the mentor's verdict forward so the reviewer queue
                            # shows the gate-1 score/context (not zero-defaults).
                            "mentorOverall": float(score) if score is not None else 0,
                            "mentorRatings": body.qualityRatings,
                            "mentorName": user.get("name") or user.get("email") or "Mentor",
                            "mentorNote": comment or "",
                            "submittedAt": datetime.now(timezone.utc).isoformat(),
                            "mentorAcceptedAt": datetime.now(timezone.utc).isoformat(),
                            "round": int(pl.get("round") or 1),
                        }),
                    ),
                )
            except Exception:  # noqa: BLE001 — reviewer table may not exist on this service
                pass

            # Notify the enterprise reviewer that mentor-approved work is ready for QA.
            if _rev_id:
                try:
                    from shared.notify import create_notification
                    create_notification(
                        _rev_id, category="action", kind="qa.ready", severity="important",
                        title="New work ready for QA review",
                        body=f"“{existing.get('title')}” passed the mentor's check and is in your QA queue.",
                        resource_type="task", resource_id=pl.get("canonicalTaskId") or pl.get("taskId"),
                        action_url="/enterprise/reviewer/queue", action_label="Open QA queue")
                except Exception:  # noqa: BLE001
                    pass

            # Requirement check PASSED → canonical 'qa_review_pending'.
            _ctid = pl.get("canonicalTaskId") or pl.get("taskId")
            if _ctid and str(_ctid).startswith("tsk_"):
                try:
                    cur.execute("UPDATE decomp_tasks SET status='qa_review_pending', updated_at=now() WHERE id=%s",
                                (_ctid,))
                except Exception:  # noqa: BLE001
                    pass

        # ── rework / reject → return to (or close for) the contributor ────────
        if body.kind in ("rework", "reject"):
            pl = existing.get("payload") or {}
            if isinstance(pl, str):
                try:
                    pl = json.loads(pl)
                except (ValueError, TypeError):
                    pl = {}
            _ctid = pl.get("canonicalTaskId") or pl.get("taskId")
            _sub_id = pl.get("submissionId")
            _acct = pl.get("accountId")
            _delivery = _DELIVERY_STATUS[body.kind]
            if _ctid and str(_ctid).startswith("tsk_"):
                try:
                    cur.execute("UPDATE decomp_tasks SET status=%s, updated_at=now() WHERE id=%s",
                                (_delivery, _ctid))
                except Exception:  # noqa: BLE001
                    pass
            # Submission: feedback_requested (rework, resubmittable) or rejected.
            if _sub_id:
                try:
                    _ss = "feedback_requested" if body.kind == "rework" else "rejected"
                    cur.execute("UPDATE submissions SET status=%s, updated_at=now() WHERE id=%s",
                                (_ss, _sub_id))
                except Exception:  # noqa: BLE001
                    pass
            # contributor_tasks: in_progress (rework) or rejected (terminal).
            if _acct and _ctid:
                try:
                    _cs = "in_progress" if body.kind == "rework" else "rejected"
                    cur.execute(
                        "UPDATE contributor_tasks SET status=%s, updated_at=now() "
                        "WHERE account_id=%s AND (CAST(id AS TEXT)=%s OR data->>'taskId'=%s)",
                        (_cs, _acct, str(pl.get("taskId") or ""), str(_ctid)))
                except Exception:  # noqa: BLE001
                    pass

        # ── record a note for any non-trivial comment ─────────────────────────
        if comment:
            cur.execute(
                """
                INSERT INTO mentor_notes
                    (mentor_id, tenant_id, mentee_id, review_id, kind, body)
                VALUES (%s, %s, %s, %s, 'review', %s)
                """,
                (
                    mentor_id, user.get("tenant_id"),
                    existing.get("mentee_id"), submission_id,
                    comment,
                ),
            )

        # ── escalate → create escalation row ──────────────────────────────────
        if body.kind == "escalate":
            now_iso = datetime.now(timezone.utc).isoformat()
            cur.execute(
                """
                INSERT INTO mentor_escalations
                    (mentor_id, mentor_email, tenant_id, review_id, mentee_id,
                     subject, category, priority, status, description, timeline)
                VALUES (%s,%s,%s,%s,%s,%s,'quality','high','open',%s,%s)
                """,
                (
                    mentor_id, user.get("email"), user.get("tenant_id"),
                    submission_id, existing.get("mentee_id"),
                    f"Escalation: {existing.get('title')}",
                    comment or "Escalated from review queue.",
                    Json([{
                        "at": now_iso, "status": "open",
                        "by": user.get("email"),
                        "note": "Auto-created from submission decide",
                    }]),
                ),
            )

    conn.commit()

    # Notify the contributor of the mentor's decision (gate 1).
    try:
        from shared.notify import create_notification
        # Routing sets contributor_id (mentee_id may be NULL); fall back through both
        # and finally the payload's accountId so the contributor is always reached.
        _mentee = (existing.get("mentee_id") or existing.get("contributor_id")
                   or (existing.get("payload") or {}).get("accountId"))
        _ttitle = existing.get("title") or "your task"
        if body.kind == "accept":
            create_notification(
                _mentee, category="action", kind="mentor.accepted", severity="important",
                title="Mentor accepted your work",
                body=f"“{_ttitle}” passed the requirement check and moved to QA review.",
                resource_type="task", action_url="/contributor/tasks/submissions", action_label="View")
        elif body.kind == "rework":
            create_notification(
                _mentee, category="action", kind="mentor.rework", severity="important",
                title="Mentor requested changes",
                body=f"The mentor sent “{_ttitle}” back for rework — see the feedback and resubmit.",
                resource_type="task", action_url="/contributor/tasks/revisions", action_label="View feedback")
        elif body.kind == "reject":
            create_notification(
                _mentee, category="action", kind="mentor.rejected", severity="critical",
                title="Mentor rejected your submission",
                body=f"“{_ttitle}” was rejected at the requirement check.",
                resource_type="task", action_url="/contributor/tasks", action_label="View task")
    except Exception:  # noqa: BLE001
        pass

    write_audit(
        actor_id=mentor_id, actor_email=user.get("email"), actor_role=user.get("role"),
        action=f"mentor.submission.decide.{body.kind}",
        target="mentor_reviews", target_id=str(submission_id),
        details=body.kind, service="mentor-service",
        tenant_id=user.get("tenant_id"),
        extra={"score": score, "kind": body.kind},
    )
    return _ok(_serialize(updated))
