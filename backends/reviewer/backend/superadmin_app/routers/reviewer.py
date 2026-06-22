"""
Reviewer-token endpoints the frontend reviewer pages call.

  GET   /api/v1/reviewer/dashboard
  GET   /api/v1/reviewer/projects
  PATCH /api/v1/reviewer/assignments/{id}
  POST  /api/v1/reviewer/evidence/{id}/recommend

All are protected with get_current_user and require role reviewer (admins allowed).
Assignments + recommendations are persisted in reviewer_assignments /
reviewer_recommendations.
"""

from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from shared.audit import write_audit
from shared.deps import get_current_user
from shared.kafka_bus import publish_event

from superadmin_app import repo

router = APIRouter(prefix="/api/v1/reviewer", tags=["reviewer"])

_REVIEWER_ROLES = {"reviewer", "admin", "superadmin", "super_admin"}


def _require_reviewer(user: dict) -> dict:
    if (user.get("role") or "").lower() not in _REVIEWER_ROLES:
        raise HTTPException(status_code=403, detail="Reviewer access required")
    return user


def _create_payout_on_approval(acct_id: Any, task_id: Any, existing: dict, ex_data: dict) -> None:
    """On final reviewer approval, record the contributor's eligible payout.

    This is the link that turns a cleared two-stage review into money owed.
    The amount is sourced from the contributor's task reward (set by the
    enterprise at assignment time). Idempotent per submission so re-approving
    never double-pays. Best-effort: any failure is swallowed by the caller so it
    never blocks the review decision.
    """
    from psycopg2.extras import Json as _Json, RealDictCursor as _RDC
    from shared.db import get_pg_connection

    try:
        account_id = int(acct_id) if acct_id not in (None, "") else None
    except (TypeError, ValueError):
        account_id = None
    if not account_id:
        return

    submission_id = ex_data.get("submissionId")
    conn = get_pg_connection()

    # Ensure the payouts table exists (owned by the freelancer service; created
    # defensively so this works even if that service hasn't booted in this env).
    with conn.cursor() as cur:
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS payouts (
                id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
                account_id    BIGINT NOT NULL,
                task_id       TEXT,
                task_title    TEXT DEFAULT '',
                amount_minor  BIGINT NOT NULL DEFAULT 0,
                currency      TEXT NOT NULL DEFAULT 'INR',
                status        TEXT NOT NULL DEFAULT 'eligible',
                eligible_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
                paid_at       TIMESTAMPTZ,
                external_ref  TEXT,
                failure_reason TEXT,
                method_id     TEXT,
                data          JSONB NOT NULL DEFAULT '{}',
                created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
                updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
            )
            """
        )
    conn.commit()

    # Idempotency: one payout per submission (or per task+account if no submission id).
    with conn.cursor() as cur:
        if submission_id is not None:
            cur.execute(
                "SELECT 1 FROM payouts WHERE account_id=%s AND data->>'submissionId'=%s "
                "AND status NOT IN ('failed','reversed') LIMIT 1",
                (account_id, str(submission_id)),
            )
        else:
            cur.execute(
                "SELECT 1 FROM payouts WHERE account_id=%s AND task_id=%s "
                "AND status NOT IN ('failed','reversed') LIMIT 1",
                (account_id, str(task_id) if task_id is not None else None),
            )
        if cur.fetchone():
            return  # already recorded — never double-pay

    # Resolve the task reward (contributor pay). Try numeric row id, then the
    # taskId stored in the task's JSONB, then the latest delivered task.
    reward, currency, ct_title, ct_id = 0.0, "INR", None, None
    with conn.cursor(cursor_factory=_RDC) as cur:
        row = None
        if task_id is not None and str(task_id).isdigit():
            cur.execute(
                "SELECT id, reward, currency, title FROM contributor_tasks "
                "WHERE id=%s AND account_id=%s LIMIT 1",
                (int(task_id), account_id),
            )
            row = cur.fetchone()
        if not row and task_id:
            cur.execute(
                "SELECT id, reward, currency, title FROM contributor_tasks "
                "WHERE account_id=%s AND data->>'taskId'=%s ORDER BY updated_at DESC LIMIT 1",
                (account_id, str(task_id)),
            )
            row = cur.fetchone()
        if not row:
            cur.execute(
                "SELECT id, reward, currency, title FROM contributor_tasks "
                "WHERE account_id=%s AND status IN ('completed','submitted','assigned') "
                "ORDER BY updated_at DESC LIMIT 1",
                (account_id,),
            )
            row = cur.fetchone()
        if row:
            reward = float(row.get("reward") or 0)
            currency = (row.get("currency") or "INR").upper()
            ct_title = row.get("title")
            ct_id = row.get("id")

    amount_minor = int(round(reward * 100))
    title = ct_title or existing.get("title") or ex_data.get("summary") or "Delivered task"
    net_minor = int(round(amount_minor * 0.82))  # contributor pay is net of 18% GST

    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO payouts
                (account_id, task_id, task_title, amount_minor, currency, status, data)
            VALUES (%s,%s,%s,%s,%s,'eligible',%s)
            """,
            (
                account_id,
                str(ct_id) if ct_id is not None else (str(task_id) if task_id is not None else None),
                title, amount_minor, currency,
                _Json({
                    "submissionId": submission_id,
                    "reviewerAssignmentId": existing.get("id"),
                    "fromMentorReview": ex_data.get("fromMentorReview"),
                    "contributorName": ex_data.get("contributorName"),
                    "grossMinor": amount_minor,
                    "gstPct": 18,
                    "netMinor": net_minor,
                    "source": "reviewer_approval",
                }),
            ),
        )
    conn.commit()


def _enqueue_enterprise_acceptance(existing: dict, ex_data: dict, sub_id: Any,
                                   task_id: Any, acct_id: Any) -> None:
    """Hand a QA-approved deliverable to the enterprise ACCEPTANCE queue (3rd
    gate). Writes a pending row into the shared `enterprise_review_queue` table;
    the enterprise admin's accept then releases the payout + completes the task.
    Idempotent per submission."""
    from datetime import datetime, timezone
    from psycopg2.extras import Json as _Json
    from shared.db import get_pg_connection

    key = str(sub_id) if sub_id not in (None, "") else f"ra_{existing.get('id')}"
    conn = get_pg_connection()
    with conn.cursor() as cur:
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS enterprise_review_queue (
                submission_id   TEXT PRIMARY KEY,
                data            JSONB NOT NULL DEFAULT '{}'::jsonb,
                status          TEXT NOT NULL DEFAULT 'pending',
                claimed_by      TEXT, claimed_at TIMESTAMPTZ,
                decision        TEXT, decided_at TIMESTAMPTZ, decided_by TEXT,
                decision_note   TEXT, decision_id TEXT,
                created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
                updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
            )
            """)
    conn.commit()

    item = {
        "submissionId": key,
        "taskDefinitionId": str(task_id) if task_id is not None else None,
        "taskTitle": existing.get("title") or ex_data.get("summary") or "Delivered task",
        "contributorId": str(acct_id) if acct_id is not None else None,
        "contributorName": ex_data.get("contributorName") or "",
        "version": int(ex_data.get("round") or 1),
        "acceptedAt": datetime.now(timezone.utc).isoformat(),
        "mentorReviewerId": (str(ex_data.get("fromMentorReview"))
                             if ex_data.get("fromMentorReview") else None),
        "enterpriseReviewerId": None,
        "enterpriseReviewerAssignedAt": None,
        "artifactCount": len(ex_data.get("evidence") or []) or 1,
        # extra context the acceptance step uses to release the payout:
        "taskId": task_id,
        "accountId": acct_id,
        "reviewerAssignmentId": existing.get("id"),
        "mentorOverall": ex_data.get("mentorOverall"),
        "url": ex_data.get("url"),
        "summary": ex_data.get("summary"),
    }
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO enterprise_review_queue (submission_id, data, status) "
            "VALUES (%s,%s,'pending') "
            "ON CONFLICT (submission_id) DO UPDATE SET data=EXCLUDED.data, "
            "status='pending', decision=NULL, decided_at=NULL, updated_at=now()",
            (key, _Json(item)))
    conn.commit()


def _create_payout(existing: dict, ex_data: dict, sub_id: Any,
                   task_id: Any, acct_id: Any) -> None:
    """Create a PENDING (eligible) payout for a QA-approved deliverable so finance
    can release it. Releasing the payout flips the task to 'paid'. Idempotent per
    task+account. DB-only — no calls to other services."""
    from psycopg2.extras import Json as _Json, RealDictCursor as _RDC
    from shared.db import get_pg_connection

    if acct_id is None:
        return
    try:
        account_id = int(acct_id)
    except (TypeError, ValueError):
        return
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

    # Idempotency: one live payout per delivered task + account.
    with conn.cursor() as cur:
        if task_id is not None:
            cur.execute("SELECT 1 FROM payouts WHERE account_id=%s AND task_id=%s "
                        "AND status NOT IN ('failed','reversed') LIMIT 1",
                        (account_id, str(task_id)))
        elif sub_id is not None:
            cur.execute("SELECT 1 FROM payouts WHERE account_id=%s AND data->>'submissionId'=%s "
                        "AND status NOT IN ('failed','reversed') LIMIT 1", (account_id, str(sub_id)))
        else:
            cur.execute("SELECT 1 FROM payouts WHERE account_id=%s LIMIT 0", (account_id,))
        if cur.fetchone():
            return

    # The reviewer_assignment often carries only canonicalTaskId (the tsk_ id) with
    # taskId=None, so fall back to it when looking up the contributor_tasks reward —
    # otherwise the payout amount comes out ₹0.
    eff_task = task_id or ex_data.get("canonicalTaskId")
    reward, currency, ct_title, ct_id = 0.0, "INR", None, None
    with conn.cursor(cursor_factory=_RDC) as cur:
        row = None
        if eff_task and str(eff_task).isdigit():
            cur.execute("SELECT id,reward,currency,title FROM contributor_tasks WHERE id=%s AND account_id=%s LIMIT 1",
                        (int(eff_task), account_id)); row = cur.fetchone()
        if not row and eff_task:
            cur.execute("SELECT id,reward,currency,title FROM contributor_tasks "
                        "WHERE account_id=%s AND data->>'taskId'=%s ORDER BY updated_at DESC LIMIT 1",
                        (account_id, str(eff_task))); row = cur.fetchone()
        if row:
            reward = float(row.get("reward") or 0); currency = (row.get("currency") or "INR").upper()
            ct_title = row.get("title"); ct_id = row.get("id")

    # GST + commission are super-admin-configurable (platform_settings.data['commission']).
    gst_pct, commission_pct = 18.0, 15.0
    try:
        with conn.cursor(cursor_factory=_RDC) as cur:
            cur.execute("SELECT data->'commission'->>'gstPct' AS g, data->'commission'->>'commissionPct' AS c "
                        "FROM platform_settings WHERE id=1")
            r = cur.fetchone()
            if r and r.get("g") is not None:
                gst_pct = max(0.0, min(float(r["g"]), 50.0))
            if r and r.get("c") is not None:
                commission_pct = max(0.0, min(float(r["c"]), 89.0))
    except Exception:  # noqa: BLE001
        gst_pct, commission_pct = 18.0, 15.0
    amount_minor = int(round(reward * 100))                       # contributor payout (paid in FULL)
    net_minor = amount_minor                                      # contributor receives the full amount
    # Enterprise budget for this task = contributor + Glimmora margin + GST.
    #   client price (deal) = cost ÷ (1 − commission%)   [contributor + margin]
    #   budget = client price × (1 + gst%)               [+ GST pass-through]
    # This is the ONLY money figure the enterprise sees (never the contributor pay or margin).
    client_price = amount_minor / (1 - commission_pct / 100) if commission_pct < 100 else amount_minor
    client_minor = int(round(client_price * (1 + gst_pct / 100)))
    sow_id = ex_data.get("sowId") or ex_data.get("sow_id")
    title = ct_title or ex_data.get("taskTitle") or existing.get("title") or "Delivered task"
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO payouts (account_id, task_id, task_title, amount_minor, currency, status, data) "
            "VALUES (%s,%s,%s,%s,%s,'eligible',%s)",
            (account_id, str(ct_id) if ct_id is not None else (str(task_id) if task_id is not None else None),
             title, amount_minor, currency,
             _Json({"submissionId": sub_id, "grossMinor": amount_minor, "gstPct": gst_pct,
                    "netMinor": net_minor, "commissionPct": commission_pct, "clientMinor": client_minor,
                    "source": "reviewer_qa_approval", "sowId": sow_id,
                    "canonicalTaskId": ex_data.get("canonicalTaskId") or task_id})))
    conn.commit()
    # The contributor payout is now eligible (created here on QA approval) → tell
    # Glimmora (super-admins) it can be requested from the enterprise.
    try:
        from shared.notify import notify_role
        notify_role(
            ["superadmin", "super_admin", "admin"],
            category="payment", kind="payout.eligible", severity="important",
            title="Payout eligible to request",
            body=f"“{title}” passed QA — the contributor payout is eligible to request.",
            resource_type="task",
            resource_id=str(ct_id) if ct_id is not None else (str(task_id) if task_id is not None else None),
            action_url="/admin/payouts", action_label="Review payouts")
    except Exception:  # noqa: BLE001
        pass


# ── GET /dashboard ────────────────────────────────────────────────────────────

@router.get("/dashboard")
async def reviewer_dashboard(user: Annotated[dict, Depends(get_current_user)]):
    _require_reviewer(user)
    counts = repo.reviewer_assignment_counts(user.get("id"), user.get("email"))
    assignments = repo.list_assignments_for_reviewer(user.get("id"), user.get("email"))
    return {
        "reviewer": {"id": user.get("id"), "email": user.get("email"), "role": user.get("role")},
        "stats": {
            "total": counts.get("total", 0),
            "pending": counts.get("pending", 0),
            "inReview": counts.get("in_review", 0),
            "approved": counts.get("approved", 0),
            "rejected": counts.get("rejected", 0),
            "completed": counts.get("completed", 0),
        },
        "assignments": assignments,
    }


# ── GET /assigned-sows ────────────────────────────────────────────────────────

@router.get("/assigned-sows")
async def reviewer_assigned_sows(user: Annotated[dict, Depends(get_current_user)]):
    """SOWs this reviewer was assigned to at intake (admin_records kind=sow_reviewer).
    Shown in the reviewer portal immediately — BEFORE any delivery — so the
    reviewer can see what they're responsible for. Delivered tasks for QA still
    flow through reviewer_assignments separately."""
    _require_reviewer(user)
    import json as _json
    from shared.db import get_pg_connection
    from psycopg2.extras import RealDictCursor

    rid = str(user.get("id") or "")
    email = (user.get("email") or "").lower()
    conn = get_pg_connection()
    by_id: dict[str, dict] = {}

    def _coerce(v):
        if isinstance(v, str):
            try:
                return _json.loads(v)
            except (ValueError, TypeError):
                return {}
        return v or {}

    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        # PRIMARY source of truth: the reviewer recorded directly on the SOW row
        # (enterprise_sows.data.reviewer). This is where reviewer allocation writes.
        cur.execute(
            """
            SELECT id AS sow_id, data AS sow_data, owner_email, updated_at AS assigned_at
            FROM enterprise_sows
            WHERE data->'reviewer'->>'id' = %s
               OR lower(data->'reviewer'->>'email') = %s
            ORDER BY updated_at DESC
            """,
            (rid, email),
        )
        rows = list(cur.fetchall())

        # SECONDARY: explicit admin_records sow_reviewer rows (future-proof / symmetric
        # with how mentors are assigned).
        cur.execute(
            """
            SELECT ar.name AS sow_id, ar.status AS assign_status,
                   ar.updated_at AS assigned_at, s.data AS sow_data, s.owner_email
            FROM admin_records ar
            LEFT JOIN enterprise_sows s ON s.id = ar.name
            WHERE ar.kind = 'sow_reviewer' AND ar.deleted_at IS NULL
              AND (ar.data->>'reviewerId' = %s OR lower(ar.data->>'reviewerEmail') = %s)
            ORDER BY ar.updated_at DESC
            """,
            (rid, email),
        )
        rows += list(cur.fetchall())

    for r in rows:
        sid = r["sow_id"]
        if sid in by_id:
            continue
        sd = _coerce(r.get("sow_data"))
        title = sd.get("projectTitle") or sd.get("title") or sd.get("fileName") if isinstance(sd, dict) else None
        by_id[sid] = {
            "sowId": sid,
            "title": title or sid,
            "status": sd.get("status") if isinstance(sd, dict) else None,
            "stage": sd.get("status") if isinstance(sd, dict) else None,
            "ownerEmail": r.get("owner_email"),
            "assignmentStatus": r.get("assign_status") or "assigned",
            "assignedAt": r["assigned_at"].isoformat() if r.get("assigned_at") else None,
        }
    sows = list(by_id.values())
    return {"sows": sows, "total": len(sows)}


# ── GET /projects ─────────────────────────────────────────────────────────────

@router.get("/projects")
async def reviewer_projects(user: Annotated[dict, Depends(get_current_user)]):
    _require_reviewer(user)
    assignments = repo.list_assignments_for_reviewer(user.get("id"), user.get("email"))
    # Group assignments by project so the reviewer page can render project cards.
    projects: dict[str, dict[str, Any]] = {}
    for a in assignments:
        pid = a.get("projectId") or a["id"]
        proj = projects.setdefault(pid, {
            "projectId": pid,
            "projectName": a.get("projectName") or a.get("title") or "Untitled",
            "assignments": [],
        })
        proj["assignments"].append(a)
    return {"projects": list(projects.values()), "total": len(assignments)}


def _record_work_rating(existing: dict, ex_data: dict, claim_data: dict,
                        sub_id: Any, task_id: Any, acct_id: Any) -> None:
    """On QA approval, record the work's FINAL quality rating = the average of the
    mentor's overall and the QA reviewer's overall (each out of 5). Persisted to the
    additive `work_ratings` table — the single source for the contributor's track
    record, the enterprise sourcing view, and the task timeline. Best-effort, DB-only."""
    from psycopg2.extras import Json as _Json
    from shared.db import get_pg_connection

    def _num(v):
        try:
            return round(float(v), 2) if v is not None else None
        except (ValueError, TypeError):
            return None

    mentor_overall = _num(ex_data.get("mentorOverall"))
    qa_overall = _num(claim_data.get("qaRatingOverall") or ex_data.get("qaRatingOverall"))
    # Average only the gate ratings that were actually captured — a missing/zero
    # rating (e.g. a task that predates the rating feature) must not drag it down.
    parts = [x for x in (mentor_overall, qa_overall) if x]
    final = round(sum(parts) / len(parts), 2) if parts else None
    if final is None:
        return  # no ratings captured → nothing to record

    mentor_ratings = ex_data.get("mentorRatings")
    qa_ratings = claim_data.get("qaRatings") or ex_data.get("qaRatings")
    ctask = ex_data.get("canonicalTaskId") or task_id

    conn = get_pg_connection()
    with conn.cursor() as cur:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS work_ratings (
                id              BIGSERIAL PRIMARY KEY,
                task_id         TEXT,
                submission_id   TEXT,
                account_id      BIGINT,
                mentor_overall  NUMERIC(4,2),
                qa_overall      NUMERIC(4,2),
                final_rating    NUMERIC(4,2),
                mentor_ratings  JSONB,
                qa_ratings      JSONB,
                created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
                updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
            )
        """)
        cur.execute("CREATE INDEX IF NOT EXISTS work_ratings_acct_idx ON work_ratings(account_id)")
        cur.execute("CREATE UNIQUE INDEX IF NOT EXISTS work_ratings_task_acct_uidx "
                    "ON work_ratings(task_id, account_id)")
    conn.commit()

    with conn.cursor() as cur:
        cur.execute("""
            INSERT INTO work_ratings (task_id, submission_id, account_id,
                mentor_overall, qa_overall, final_rating, mentor_ratings, qa_ratings)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
            ON CONFLICT (task_id, account_id) DO UPDATE SET
                submission_id = EXCLUDED.submission_id,
                mentor_overall = EXCLUDED.mentor_overall,
                qa_overall = EXCLUDED.qa_overall,
                final_rating = EXCLUDED.final_rating,
                mentor_ratings = EXCLUDED.mentor_ratings,
                qa_ratings = EXCLUDED.qa_ratings,
                updated_at = now()
        """, (str(ctask) if ctask is not None else None,
              str(sub_id) if sub_id is not None else None,
              acct_id, mentor_overall, qa_overall, final,
              _Json(mentor_ratings) if mentor_ratings is not None else None,
              _Json(qa_ratings) if qa_ratings is not None else None))
    conn.commit()


# ── PATCH /assignments/{id} ───────────────────────────────────────────────────

class AssignmentPatch(BaseModel):
    status: str | None = None
    priority: str | None = None
    data: dict[str, Any] | None = None


@router.patch("/assignments/{assignment_id}")
async def patch_assignment(
    assignment_id: str,
    body: AssignmentPatch,
    request: Request,
    user: Annotated[dict, Depends(get_current_user)],
):
    _require_reviewer(user)
    existing = repo.get_assignment(assignment_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # Claim a pool assignment to this reviewer when they act on it.
    claim_data = dict(body.data or {})
    updated = repo.update_assignment(
        assignment_id, status=body.status, priority=body.priority, data=body.data,
        reviewer_id=user.get("id"), reviewer_email=user.get("email"),
    )

    # When the enterprise reviewer QA-approves, mark the submission accepted and
    # hand the deliverable to the ENTERPRISE ACCEPTANCE queue (3rd gate). The task
    # is NOT completed and NO payout is created here — the enterprise admin's final
    # business sign-off (enterprise review-queue decide=accept) releases the payout.
    if (body.status or "").lower() in ("approved", "completed", "accepted"):
        ex_data = (existing.get("data") or {}) if isinstance(existing, dict) else {}
        if isinstance(ex_data, str):
            import json as _json
            try:
                ex_data = _json.loads(ex_data)
            except (ValueError, TypeError):
                ex_data = {}
        sub_id = ex_data.get("submissionId") or claim_data.get("submissionId")
        task_id = ex_data.get("taskId") or claim_data.get("taskId")
        acct_id = ex_data.get("accountId") or claim_data.get("accountId")
        from shared.db import get_pg_connection
        conn = get_pg_connection()

        # Mark the contributor submission accepted (QA passed). The freelancer
        # service stores these in `submissions`; tolerate the legacy name too.
        if sub_id:
            for tbl in ("submissions", "contributor_submissions"):
                try:
                    with conn.cursor() as cur:
                        cur.execute(f"UPDATE {tbl} SET status='accepted', updated_at=now() WHERE id=%s", (sub_id,))
                        hit = cur.rowcount
                    conn.commit()
                    if hit:
                        break
                except Exception:  # noqa: BLE001
                    conn.rollback()

        # Reviewer QA-approval is the final review gate (the enterprise acceptance
        # gate is dropped). The task moves to 'payment_pending' — QA accepted, payout
        # pending — and the payout step later flips it to 'paid'.
        _ctask = ex_data.get("canonicalTaskId") or task_id
        if _ctask and str(_ctask).startswith("tsk_"):
            try:
                with conn.cursor() as cur:
                    cur.execute("UPDATE decomp_tasks SET status='payment_pending', updated_at=now() WHERE id=%s",
                                (_ctask,))
                conn.commit()
            except Exception:  # noqa: BLE001
                conn.rollback()

        # Create the (simulated) payout record so finance can release it; releasing
        # the payout flips the task to 'paid'. Best-effort, DB-only.
        try:
            _create_payout(existing, ex_data, sub_id, task_id, acct_id)
        except Exception:  # noqa: BLE001
            try:
                conn.rollback()
            except Exception:  # noqa: BLE001
                pass

        # Record the FINAL quality rating (avg of mentor + QA) for this work.
        try:
            _record_work_rating(existing, ex_data, claim_data, sub_id, task_id, acct_id)
        except Exception:  # noqa: BLE001
            try:
                conn.rollback()
            except Exception:  # noqa: BLE001
                pass

        # Notify the contributor their work passed QA (now heads to enterprise acceptance).
        try:
            from shared.notify import create_notification
            _ttitle = existing.get("title") or ex_data.get("summary") or "your task"
            create_notification(
                acct_id, category="action", kind="qa.accepted", severity="important",
                title="QA approved your work",
                body=f"Your submission for “{_ttitle}” passed QA review — your payout is now being processed.",
                resource_type="task", resource_id=ex_data.get("canonicalTaskId") or task_id,
                action_url="/contributor/tasks/completed", action_label="View task",
            )
        except Exception:  # noqa: BLE001
            pass
        # NOTE: Glimmora's "payout eligible" notification fires at enterprise
        # acceptance (_release_payout_and_complete), where the eligible payout is
        # actually created — not here (reviewer QA-accept creates no payout).

    # Reviewer REWORK → return to the contributor; resubmission goes STRAIGHT BACK to
    # the reviewer (qa_review_pending), skipping the mentor. Reviewer REJECT →
    # qa_review_failed, terminal (no payout).
    elif (body.status or "").lower() in ("rework", "rejected", "revision", "request_rework"):
        is_reject = (body.status or "").lower() == "rejected"
        ex_data = (existing.get("data") or {}) if isinstance(existing, dict) else {}
        if isinstance(ex_data, str):
            import json as _json
            try:
                ex_data = _json.loads(ex_data)
            except (ValueError, TypeError):
                ex_data = {}
        sub_id = ex_data.get("submissionId") or claim_data.get("submissionId")
        acct_id = ex_data.get("accountId") or claim_data.get("accountId")
        _ctask = ex_data.get("canonicalTaskId") or ex_data.get("taskId")
        from shared.db import get_pg_connection
        conn = get_pg_connection()
        # Submission → feedback_requested (rework, resubmittable) or rejected (terminal).
        _sub_status = "rejected" if is_reject else "feedback_requested"
        if sub_id:
            for tbl in ("submissions", "contributor_submissions"):
                try:
                    with conn.cursor() as cur:
                        cur.execute(f"UPDATE {tbl} SET status=%s, updated_at=now() WHERE id=%s",
                                    (_sub_status, sub_id))
                        hit = cur.rowcount
                    conn.commit()
                    if hit:
                        break
                except Exception:  # noqa: BLE001
                    conn.rollback()
        # contributor_tasks: in_progress (rework, active again) or rejected (terminal).
        _ct_status = "rejected" if is_reject else "in_progress"
        if acct_id:
            try:
                with conn.cursor() as cur:
                    cur.execute("UPDATE contributor_tasks SET status=%s, updated_at=now() "
                                "WHERE account_id=%s AND (CAST(id AS TEXT)=%s OR data->>'taskId'=%s)",
                                (_ct_status, acct_id, str(_ctask), str(_ctask)))
                conn.commit()
            except Exception:  # noqa: BLE001
                conn.rollback()
        # Canonical task lifecycle.
        _delivery = "qa_review_failed" if is_reject else "qa_review_rework"
        if _ctask and str(_ctask).startswith("tsk_"):
            try:
                with conn.cursor() as cur:
                    cur.execute("UPDATE decomp_tasks SET status=%s, updated_at=now() WHERE id=%s",
                                (_delivery, _ctask))
                conn.commit()
            except Exception:  # noqa: BLE001
                conn.rollback()

        # Notify the contributor of the QA decision (rework / reject).
        try:
            from shared.notify import create_notification
            _ttitle = existing.get("title") or ex_data.get("summary") or "your task"
            if is_reject:
                create_notification(
                    acct_id, category="action", kind="qa.rejected", severity="critical",
                    title="QA rejected your submission",
                    body=f"Your submission for “{_ttitle}” was rejected at QA review.",
                    resource_type="task", resource_id=_ctask,
                    action_url="/contributor/tasks", action_label="View task")
            else:
                create_notification(
                    acct_id, category="action", kind="qa.rework", severity="important",
                    title="QA sent your work back for rework",
                    body=f"The reviewer requested changes on “{_ttitle}”. Resubmit when ready.",
                    resource_type="task", resource_id=_ctask,
                    action_url="/contributor/tasks/revisions", action_label="View feedback")
        except Exception:  # noqa: BLE001
            pass

    publish_event("reviewer.assignment_updated",
                  {"assignmentId": assignment_id, "status": body.status,
                   "reviewerId": user.get("id")})
    write_audit(actor_id=user.get("id"), actor_email=user.get("email"), actor_role=user.get("role"),
                action="update_assignment", target_id=assignment_id, service="superadmin-service",
                ip_address=request.client.host if request.client else None,
                extra={"status": body.status})
    return {"assignment": updated}


# ── GET /queue ───────────────────────────────────────────────────────────────

@router.get("/queue")
async def reviewer_queue(user: Annotated[dict, Depends(get_current_user)]):
    """Pending assignments for this reviewer in the MockReviewerItem-compatible shape.

    The UI queue workspace expects: id, taskTitle, taskSubtitle, project, tenant,
    contributorName, mentorName, round, totalRounds, submittedAt, mentorAcceptedAt,
    dueAt, slaTier, state, evidence[], criteria[], mentorOverall, mentorNote,
    contributorCoverNote, criteriaValidatedCount.

    We map reviewer_assignments rows to this shape.  Fields not stored in the DB
    are defaulted to safe zero-values so the component still renders cleanly.
    """
    _require_reviewer(user)
    assignments = repo.list_assignments_for_reviewer(user.get("id"), user.get("email"))
    # Only surface open / pending / in_review items in the queue.
    open_statuses = {"pending", "in_review", "open", None, ""}
    items = [
        _assignment_to_queue_item(a)
        for a in assignments
        if (a.get("status") or "pending").lower() in open_statuses
    ]
    return {"items": items, "total": len(items)}


def _assignment_to_queue_item(a: dict) -> dict:
    """Map a reviewer_assignment row to the MockReviewerItem shape the UI expects."""
    import datetime as _dt

    data = a.get("data") or {}
    # SLA: if data.dueAt is stored, use it; else default to 48h from creation
    due_at = data.get("dueAt") or data.get("due_at")
    if not due_at:
        created = a.get("createdAt") or ""
        try:
            dt = _dt.datetime.fromisoformat(created.replace("Z", "+00:00"))
            due_at = (dt + _dt.timedelta(hours=48)).isoformat()
        except Exception:  # noqa: BLE001
            due_at = (_dt.datetime.utcnow() + _dt.timedelta(hours=48)).isoformat()

    # Derive SLA tier from due_at
    try:
        due_ms = (_dt.datetime.fromisoformat(due_at.replace("Z", "+00:00")).timestamp()
                  - _dt.datetime.now(_dt.timezone.utc).timestamp()) * 1000
    except Exception:  # noqa: BLE001
        due_ms = 48 * 3_600_000
    if due_ms < 0:
        sla_tier = "breached"
    elif due_ms < 4 * 3_600_000:
        sla_tier = "critical"
    elif due_ms < 12 * 3_600_000:
        sla_tier = "warning"
    elif due_ms < 24 * 3_600_000:
        sla_tier = "watch"
    else:
        sla_tier = "healthy"

    status = (a.get("status") or "pending").lower()
    state_map = {
        "approved": "decided_accept",
        "completed": "decided_accept",
        "rejected": "decided_reject",
        "in_review": "open",
        "pending": "open",
    }
    state = state_map.get(status, "open")

    submitted_at = data.get("submittedAt") or data.get("submitted_at") or a.get("createdAt") or ""
    mentor_accepted_at = data.get("mentorAcceptedAt") or data.get("mentor_accepted_at") or submitted_at

    # Viewable evidence = the GitHub deliverable + every uploaded file, mirroring
    # what the mentor saw (built here if the handoff didn't pre-build a list).
    github_url = data.get("githubUrl") or data.get("url")
    raw_artifacts = data.get("artifacts") if isinstance(data.get("artifacts"), list) else []
    ref_files = data.get("referenceFiles") if isinstance(data.get("referenceFiles"), list) else []
    evidence = data.get("evidence") or [
        *([{"id": "gh", "name": "GitHub deliverable", "kind": "doc", "sizeBytes": 0, "url": github_url}]
          if github_url else []),
        *[{"id": f"art-{i}", "name": (af.get("name") or "file"), "kind": "doc",
           "sizeBytes": int(af.get("sizeBytes") or 0), "url": af.get("url") or ""}
          for i, af in enumerate(raw_artifacts) if af.get("url")],
        *[{"id": f"ref-{i}", "name": "Task file: " + (rf.get("name") or "file"), "kind": "doc",
           "sizeBytes": int(rf.get("sizeBytes") or 0), "url": rf.get("url") or ""}
          for i, rf in enumerate(ref_files) if rf.get("url")],
    ]

    return {
        "id": a["id"],
        "sowId": data.get("sowId"),
        "taskTitle": a.get("title") or a.get("projectName") or f"Assignment {a['id']}",
        "taskSubtitle": data.get("taskSubtitle") or data.get("subtitle") or "",
        # Role-shared ids + the task brief / acceptance criteria (same as mentor).
        "taskRef": data.get("taskRef") or "",
        "submissionRef": data.get("submissionRef") or "",
        "taskId": data.get("canonicalTaskId") or data.get("taskId") or "",
        "githubUrl": github_url,
        "completionPct": data.get("completionPct"),
        "brief": data.get("description") or data.get("summary") or "",
        "acceptanceCriteria": data.get("acceptanceCriteria") or "",
        # Task's required skills (no commercials) so the reviewer can judge fit/scope.
        "requiredSkills": data.get("requiredSkills") or data.get("skills") or [],
        "project": a.get("projectName") or data.get("projectName") or data.get("project") or "",
        "tenant": data.get("tenant") or data.get("tenantName") or "",
        "contributorName": data.get("contributorName") or data.get("contributor") or "",
        "mentorName": data.get("mentorName") or data.get("mentor") or "",
        "round": int(data.get("round") or 1),
        "totalRounds": int(data.get("totalRounds") or 3),
        "submittedAt": submitted_at,
        "mentorAcceptedAt": mentor_accepted_at,
        "dueAt": due_at,
        "slaTier": sla_tier,
        "state": state,
        "evidence": evidence,
        "criteria": data.get("criteria") or [],
        "mentorOverall": float(data.get("mentorOverall") or 0),
        "mentorNote": data.get("mentorNote") or "",
        "contributorCoverNote": data.get("contributorCoverNote") or "",
        "criteriaValidatedCount": int(data.get("criteriaValidatedCount") or 0),
    }


# ── GET /queue/{id} ───────────────────────────────────────────────────────────

@router.get("/queue/{assignment_id}")
async def reviewer_queue_item(
    assignment_id: str,
    user: Annotated[dict, Depends(get_current_user)],
):
    """Single queue item (assignment) by id — same MockReviewerItem shape."""
    _require_reviewer(user)
    from fastapi import HTTPException as _HTTPException
    a = repo.get_assignment(assignment_id)
    if not a:
        raise _HTTPException(status_code=404, detail="Assignment not found")
    row = repo._assignment_out(a) if not isinstance(a, dict) else a
    # Normalise if raw DB row came back (get_assignment returns raw dict from cursor).
    if "reviewer_id" in row:
        import json as _json
        data = row.get("data")
        if isinstance(data, str):
            try:
                data = _json.loads(data)
            except (ValueError, TypeError):
                data = {}
        row = {
            "id": str(row["id"]),
            "reviewerId": str(row.get("reviewer_id")) if row.get("reviewer_id") else None,
            "reviewerEmail": row.get("reviewer_email"),
            "projectId": row.get("project_id"),
            "projectName": row.get("project_name"),
            "title": row.get("title"),
            "status": row.get("status"),
            "priority": row.get("priority"),
            "data": data or {},
            "createdAt": row["created_at"].isoformat() if row.get("created_at") else None,
            "updatedAt": row["updated_at"].isoformat() if row.get("updated_at") else None,
        }
    item = _assignment_to_queue_item(row)
    return {"review": item}


# ── GET /history ──────────────────────────────────────────────────────────────

@router.get("/history")
async def reviewer_history(user: Annotated[dict, Depends(get_current_user)]):
    """Completed assignments mapped to MockReviewerDecision shape + metrics."""
    _require_reviewer(user)
    assignments = repo.list_assignments_for_reviewer(user.get("id"), user.get("email"))
    done_statuses = {"approved", "completed", "rejected", "decided_accept",
                     "decided_reject", "decided_rework", "rework"}
    done = [a for a in assignments if (a.get("status") or "").lower() in done_statuses]

    decisions = []
    for a in done:
        data = a.get("data") or {}
        status = (a.get("status") or "").lower()
        if status in ("approved", "completed", "decided_accept"):
            decision_kind = "accept"
        elif status in ("rework", "decided_rework"):
            decision_kind = "rework"
        else:
            decision_kind = "reject"
        decisions.append({
            "id": f"rdec-{a['id']}",
            "reviewId": a["id"],
            "taskTitle": a.get("title") or a.get("projectName") or f"Assignment {a['id']}",
            "contributorName": data.get("contributorName") or "",
            "mentorName": data.get("mentorName") or "",
            "project": a.get("projectName") or data.get("projectName") or "",
            "decision": decision_kind,
            "agreedWithMentor": data.get("agreedWithMentor", True),
            "decidedAt": a.get("updatedAt") or a.get("createdAt") or "",
            "comment": data.get("comment") or data.get("reviewerNote") or None,
        })

    # Build metrics from all assignments (last 30 days by default)
    import datetime as _dt
    cutoff = (_dt.datetime.utcnow() - _dt.timedelta(days=30)).isoformat()
    recent_done = [
        d for d in decisions
        if (d.get("decidedAt") or "") >= cutoff
    ]
    review_count = len(recent_done)
    accept_count = sum(1 for d in recent_done if d["decision"] == "accept")
    rework_count = sum(1 for d in recent_done if d["decision"] == "rework")
    reject_count = sum(1 for d in recent_done if d["decision"] == "reject")
    agreed_count = sum(1 for d in recent_done if d.get("agreedWithMentor"))

    metrics = {
        "periodDays": 30,
        "reviewCount": review_count,
        "avgTimeMin": 0,  # not tracked yet
        "slaHitPct": 0,   # not tracked yet
        "acceptPct": round(accept_count / review_count * 100) if review_count else 0,
        "agreementWithMentorPct": round(agreed_count / review_count * 100) if review_count else 0,
        "decisionsByKind": {
            "accept": accept_count,
            "rework": rework_count,
            "reject": reject_count,
        },
    }

    return {"items": decisions, "total": len(decisions), "metrics": metrics}


# ── GET /metrics ──────────────────────────────────────────────────────────────

@router.get("/metrics")
async def reviewer_metrics(user: Annotated[dict, Depends(get_current_user)]):
    """Aggregate metrics for this reviewer (same object as /history metrics field)."""
    _require_reviewer(user)
    assignments = repo.list_assignments_for_reviewer(user.get("id"), user.get("email"))
    done_statuses = {"approved", "completed", "rejected", "decided_accept",
                     "decided_reject", "decided_rework", "rework"}
    import datetime as _dt
    cutoff = (_dt.datetime.utcnow() - _dt.timedelta(days=30)).isoformat()

    recent_done = []
    for a in assignments:
        status = (a.get("status") or "").lower()
        if status in done_statuses:
            updated = a.get("updatedAt") or a.get("createdAt") or ""
            if updated >= cutoff:
                recent_done.append(a)

    review_count = len(recent_done)
    accept_count = sum(
        1 for a in recent_done
        if (a.get("status") or "").lower() in {"approved", "completed", "decided_accept"}
    )
    rework_count = sum(
        1 for a in recent_done
        if (a.get("status") or "").lower() in {"rework", "decided_rework"}
    )
    reject_count = sum(
        1 for a in recent_done
        if (a.get("status") or "").lower() in {"rejected", "decided_reject"}
    )
    agreed_count = sum(
        1 for a in recent_done
        if (a.get("data") or {}).get("agreedWithMentor", True)
    )

    return {
        "periodDays": 30,
        "reviewCount": review_count,
        "avgTimeMin": 0,
        "slaHitPct": 0,
        "acceptPct": round(accept_count / review_count * 100) if review_count else 0,
        "agreementWithMentorPct": round(agreed_count / review_count * 100) if review_count else 0,
        "decisionsByKind": {
            "accept": accept_count,
            "rework": rework_count,
            "reject": reject_count,
        },
    }


# ── POST /evidence/{id}/recommend ─────────────────────────────────────────────

class RecommendRequest(BaseModel):
    recommendation: str | None = None
    score: float | None = None
    comment: str | None = None
    assignmentId: str | None = None
    data: dict[str, Any] | None = None


@router.post("/evidence/{evidence_id}/recommend", status_code=201)
async def recommend_evidence(
    evidence_id: str,
    body: RecommendRequest,
    request: Request,
    user: Annotated[dict, Depends(get_current_user)],
):
    _require_reviewer(user)
    reco = repo.create_recommendation(
        evidence_id=evidence_id,
        assignment_id=body.assignmentId,
        reviewer_id=user.get("id"),
        reviewer_email=user.get("email"),
        recommendation=body.recommendation,
        score=body.score,
        comment=body.comment,
        data=body.data,
    )
    publish_event("reviewer.evidence_recommended",
                  {"evidenceId": evidence_id, "recommendation": body.recommendation,
                   "reviewerId": user.get("id")})
    write_audit(actor_id=user.get("id"), actor_email=user.get("email"), actor_role=user.get("role"),
                action="recommend_evidence", target=evidence_id, target_id=reco.get("id"),
                service="superadmin-service",
                ip_address=request.client.host if request.client else None,
                extra={"recommendation": body.recommendation})
    return {"recommendation": reco}
