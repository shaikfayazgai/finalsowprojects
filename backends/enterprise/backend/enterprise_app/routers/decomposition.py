"""Decomposition plans — /api/v1/enterprise/decomposition/**  (wrapped envelope).

A plan is a single JSONB document. Sub-resource GETs slice it; mutations merge
back into the document and persist. There is also a tiny internal router for the
revision-complete callback.
"""

from __future__ import annotations

import re
from typing import Annotated

from fastapi import APIRouter, Body, Depends, HTTPException

from shared.audit import write_audit
from shared.deps import get_current_user

from enterprise_app import db
from enterprise_app.responses import ok
from enterprise_app.seed import ensure_demo_data

router = APIRouter(prefix="/api/v1/enterprise/decomposition", tags=["decomposition"])
internal_router = APIRouter(prefix="/api/v1/internal/decomposition", tags=["decomposition-internal"])


def _load(plan_id: str, owner_id: str) -> dict:
    row = db.get_row("plan", plan_id, owner_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Plan not found")
    return row


def _save(plan_id: str, owner_id: str, row: dict) -> dict:
    row["updatedAt"] = db.now_iso()
    return db.update_row("plan", plan_id, row, owner_id)


def _slice(plan_id: str, owner_id: str, key: str, default):
    return ok(_load(plan_id, owner_id).get(key, default))


def _find_task(row: dict, task_id: str) -> dict | None:
    for t in row.get("tasks", []):
        if t.get("id") == task_id:
            return t
    return None


# ── plans collection ────────────────────────────────────────────────────────---

@router.get("/plans")
def list_plans(user: Annotated[dict, Depends(get_current_user)]):
    ensure_demo_data(user)
    return ok(db.list_rows("plan", user["id"]))


@router.post("/plans")
def create_plan(user: Annotated[dict, Depends(get_current_user)],
                body: dict = Body(default={})):
    plan_id = db.new_id("plan_")
    payload = {
        "id": plan_id,
        "title": (body or {}).get("title") or "Untitled Plan",
        "sowId": (body or {}).get("sowId"),
        "status": "draft",
        "revision": 1,
        "locked": False,
        "confirmed": False,
        "createdAt": db.now_iso(),
        "updatedAt": db.now_iso(),
        "tasks": [],
        "milestones": [],
        "criticalPath": [],
        "checklist": [],
        "review": {"status": "not_started", "checklist": [], "summary": {}},
        "revisions": [],
        "summary": {"taskCount": 0, "milestoneCount": 0, "completion": 0},
        "checklistStatus": {"complete": False, "items": 0, "done": 0},
        "data": dict(body or {}),
    }
    saved = db.create_row("plan", user, payload, row_id=plan_id)
    return ok(saved)


@router.get("/plans/{plan_id}")
def get_plan(plan_id: str, user: Annotated[dict, Depends(get_current_user)]):
    ensure_demo_data(user)
    return ok(_load(plan_id, user["id"]))


# ── revision ────────────────────────────────────────────────────────────────---

@router.get("/plans/{plan_id}/revision")
def get_revision(plan_id: str, user: Annotated[dict, Depends(get_current_user)]):
    row = _load(plan_id, user["id"])
    return ok({"revision": row.get("revision", 1), "revisions": row.get("revisions", [])})


@router.post("/plans/{plan_id}/revision")
@router.post("/plans/{plan_id}/revisions")  # plural alias — same handler
def create_revision(plan_id: str, user: Annotated[dict, Depends(get_current_user)],
                    body: dict = Body(default={})):
    row = _load(plan_id, user["id"])
    rev_no = row.get("revision", 1) + 1
    row["revision"] = rev_no
    rid = db.new_id("rev_")
    row.setdefault("revisions", []).append({
        "id": rid, "number": rev_no, "createdAt": db.now_iso(),
        "by": user.get("email"), "notes": (body or {}).get("notes"), "data": body,
    })
    return ok(_save(plan_id, user["id"], row))


@router.get("/plans/{plan_id}/summary")
def plan_summary(plan_id: str, user: Annotated[dict, Depends(get_current_user)]):
    row = _load(plan_id, user["id"])
    tasks = row.get("tasks", [])
    done = len([t for t in tasks if t.get("status") in ("done", "complete")])
    summary = {
        "taskCount": len(tasks),
        "milestoneCount": len(row.get("milestones", [])),
        "completion": round(done / len(tasks), 2) if tasks else 0,
        "status": row.get("status"),
    }
    return ok(summary)


@router.get("/plans/{plan_id}/checklist-status")
def checklist_status(plan_id: str, user: Annotated[dict, Depends(get_current_user)]):
    row = _load(plan_id, user["id"])
    items = row.get("checklist", [])
    done = len([c for c in items if c.get("done")])
    return ok({"items": len(items), "done": done, "complete": len(items) > 0 and done == len(items)})


@router.get("/plans/{plan_id}/status")
def plan_status(plan_id: str, user: Annotated[dict, Depends(get_current_user)]):
    row = _load(plan_id, user["id"])
    return ok({"status": row.get("status"), "locked": row.get("locked", False),
               "confirmed": row.get("confirmed", False)})


@router.post("/plans/{plan_id}/lock")
def lock_plan(plan_id: str, user: Annotated[dict, Depends(get_current_user)]):
    row = _load(plan_id, user["id"])
    row["locked"] = True
    return ok(_save(plan_id, user["id"], row))


@router.post("/plans/{plan_id}/confirm")
def confirm_plan(plan_id: str, user: Annotated[dict, Depends(get_current_user)]):
    row = _load(plan_id, user["id"])
    row["confirmed"] = True
    row["status"] = "confirmed"
    return ok(_save(plan_id, user["id"], row))


@router.post("/plans/{plan_id}/request-revision")
def request_revision(plan_id: str, user: Annotated[dict, Depends(get_current_user)],
                     body: dict = Body(default={})):
    row = _load(plan_id, user["id"])
    row["status"] = "revision_requested"
    row["revisionRequest"] = {"by": user.get("email"), "at": db.now_iso(),
                              "reason": (body or {}).get("reason"), "payload": body}
    return ok(_save(plan_id, user["id"], row))


@router.get("/plans/{plan_id}/revision-modal")
def revision_modal(plan_id: str, user: Annotated[dict, Depends(get_current_user)]):
    row = _load(plan_id, user["id"])
    return ok({"revision": row.get("revision", 1),
               "revisionRequest": row.get("revisionRequest"),
               "revisions": row.get("revisions", [])})


@router.get("/plans/{plan_id}/revised")
def revised(plan_id: str, user: Annotated[dict, Depends(get_current_user)]):
    row = _load(plan_id, user["id"])
    return ok({"revision": row.get("revision", 1), "data": row})


@router.get("/plans/{plan_id}/revisions/{rid}")
def get_revision_by_id(plan_id: str, rid: str, user: Annotated[dict, Depends(get_current_user)]):
    row = _load(plan_id, user["id"])
    for r in row.get("revisions", []):
        if r.get("id") == rid:
            return ok(r)
    raise HTTPException(status_code=404, detail="Revision not found")


# ── review ──────────────────────────────────────────────────────────────────---

@router.get("/plans/{plan_id}/review")
def get_review(plan_id: str, user: Annotated[dict, Depends(get_current_user)]):
    return _slice(plan_id, user["id"], "review", {"status": "not_started", "checklist": [], "summary": {}})


@router.get("/plans/{plan_id}/review/checklist")
def get_review_checklist(plan_id: str, user: Annotated[dict, Depends(get_current_user)]):
    row = _load(plan_id, user["id"])
    return ok(row.get("review", {}).get("checklist", []))


@router.patch("/plans/{plan_id}/review/checklist")
def patch_review_checklist(plan_id: str, user: Annotated[dict, Depends(get_current_user)],
                           body: dict = Body(default={})):
    row = _load(plan_id, user["id"])
    review = row.setdefault("review", {"status": "in_progress", "checklist": [], "summary": {}})
    item_id = (body or {}).get("id")
    checklist = review.setdefault("checklist", [])
    if item_id:
        for c in checklist:
            if c.get("id") == item_id:
                c.update(body)
                break
        else:
            checklist.append(body)
    elif isinstance((body or {}).get("checklist"), list):
        review["checklist"] = body["checklist"]
    return ok(_save(plan_id, user["id"], row).get("review"))


@router.get("/plans/{plan_id}/review/summary")
def review_summary(plan_id: str, user: Annotated[dict, Depends(get_current_user)]):
    row = _load(plan_id, user["id"])
    review = row.get("review", {})
    checklist = review.get("checklist", [])
    done = len([c for c in checklist if c.get("done")])
    return ok({"status": review.get("status"), "items": len(checklist), "done": done,
               "summary": review.get("summary", {})})


# ── tasks ───────────────────────────────────────────────────────────────────---

@router.get("/plans/{plan_id}/tasks")
def list_tasks(plan_id: str, user: Annotated[dict, Depends(get_current_user)]):
    return _slice(plan_id, user["id"], "tasks", [])


@router.post("/plans/{plan_id}/tasks/query")
def query_tasks(plan_id: str, user: Annotated[dict, Depends(get_current_user)],
                body: dict = Body(default={})):
    row = _load(plan_id, user["id"])
    tasks = row.get("tasks", [])
    status = (body or {}).get("status")
    flagged = (body or {}).get("flagged")
    if status is not None:
        tasks = [t for t in tasks if t.get("status") == status]
    if flagged is not None:
        tasks = [t for t in tasks if bool(t.get("flagged")) == bool(flagged)]
    return ok(tasks)


@router.get("/plans/{plan_id}/tasks/{task_id}")
def get_task(plan_id: str, task_id: str, user: Annotated[dict, Depends(get_current_user)]):
    row = _load(plan_id, user["id"])
    task = _find_task(row, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return ok(task)


@router.post("/plans/{plan_id}/tasks")
def create_task(plan_id: str, user: Annotated[dict, Depends(get_current_user)],
                body: dict = Body(default={})):
    row = _load(plan_id, user["id"])
    tid = (body or {}).get("id") or db.new_id("task_")
    task = {
        "id": tid,
        "title": (body or {}).get("title") or "New Task",
        "status": (body or {}).get("status") or "todo",
        "owner": (body or {}).get("owner"),
        "flagged": False,
        "subtasks": (body or {}).get("subtasks", []),
        "detail": (body or {}).get("detail", {}),
    }
    task.update({k: v for k, v in (body or {}).items() if k not in task})
    row.setdefault("tasks", []).append(task)
    _save(plan_id, user["id"], row)
    return ok(task)


def _contributor_code(account_id: int, name: str) -> str:
    """Readable, stable display id for a contributor — the integer PK stays the real
    key, this is only for display. e.g. account 66 'Rahul Mehta' → 'CTR-rahul-mehta-1u'."""
    slug = re.sub(r"[^a-z0-9]+", "-", (name or "").lower()).strip("-")[:24].strip("-") or "user"
    n = int(account_id)
    digits = "0123456789abcdefghijklmnopqrstuvwxyz"
    code = ""
    while n > 0:
        n, rem = divmod(n, 36)
        code = digits[rem] + code
    return f"CTR-{slug}-{code or '0'}"


@router.get("/contributors")
def list_assignable_contributors(user: Annotated[dict, Depends(get_current_user)]):
    """Approved contributors the enterprise can assign tasks to, enriched with a
    lightweight track record (tasks taken/completed, acceptance %, avg mentor
    rating) so the assign dialog can show the contributor's profile before
    confirming. Stats are batched (3 GROUP BY queries — no N+1)."""
    from shared.db import get_pg_connection
    from psycopg2.extras import RealDictCursor
    conn = get_pg_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            "SELECT id, email, first_name, last_name FROM login_accounts "
            "WHERE role = 'contributor' AND COALESCE(approval_status,'approved') = 'approved' "
            "ORDER BY created_at DESC LIMIT 100")
        rows = cur.fetchall()
        cur.execute(
            "SELECT account_id, COUNT(*) AS taken, "
            "COUNT(*) FILTER (WHERE status = 'completed') AS completed "
            "FROM contributor_tasks GROUP BY account_id")
        task_stats = {str(r["account_id"]): r for r in cur.fetchall()}
        cur.execute(
            "SELECT contributor_id, COALESCE(AVG(NULLIF(score,0)),0) AS avg_score, "
            "COUNT(*) FILTER (WHERE score > 0) AS rated "
            "FROM mentor_reviews GROUP BY contributor_id")
        rate_stats = {str(r["contributor_id"]): r for r in cur.fetchall()}
    # Final work ratings (avg of mentor + QA, per completed work) — the real track
    # record shown when sourcing. Guarded: the table is created lazily on the first
    # QA approval, so it may not exist yet.
    final_stats = {}
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur2:
            cur2.execute("SELECT account_id, AVG(final_rating) AS avg_final, "
                         "COUNT(*) AS rated_works FROM work_ratings GROUP BY account_id")
            final_stats = {str(r["account_id"]): r for r in cur2.fetchall()}
    except Exception:  # noqa: BLE001 — table not created until first QA approval
        conn.rollback()
        final_stats = {}
    out = []
    for r in rows:
        aid = str(r["id"])
        ts = task_stats.get(aid) or {}
        rs = rate_stats.get(aid) or {}
        fs = final_stats.get(aid) or {}
        taken = int(ts.get("taken") or 0)
        completed = int(ts.get("completed") or 0)
        name = (f"{r.get('first_name','') or ''} {r.get('last_name','') or ''}".strip() or r["email"])
        avg_final = fs.get("avg_final")
        rated_works = int(fs.get("rated_works") or 0)
        # Prefer the FINAL rating (mentor+QA) as the headline track record; fall back
        # to the mentor's quality score when no QA-approved work exists yet.
        eff_rating = round(float(avg_final), 1) if avg_final else round(float(rs.get("avg_score") or 0), 1)
        out.append({
            "id": aid,
            "code": _contributor_code(r["id"], name),  # readable display id (PK stays int)
            "email": r["email"],
            "name": name,
            "tasksTaken": taken,
            "tasksCompleted": completed,
            "acceptancePct": round(100 * completed / taken) if taken else 0,
            "avgRating": eff_rating,
            "avgFinalRating": round(float(avg_final), 1) if avg_final else None,
            "ratingCount": rated_works or int(rs.get("rated") or 0),
            "ratedWorks": rated_works,
        })
    return ok(out)


@router.post("/plans/{plan_id}/tasks/{task_id}/assign")
def assign_task(plan_id: str, task_id: str, user: Annotated[dict, Depends(get_current_user)],
                body: dict = Body(default={})):
    """Assign a plan task to a contributor. Creates a contributor_tasks row so it
    appears in that contributor's task list.

    Plans live in two stores: the live DB-backed system (decomp_plans/decomp_tasks
    with dp_/tsk_ ids, used by the current UI) and a legacy JSON document store.
    Handle the real table first; only fall back to the JSON store for old plans.
    """
    account_id = (body or {}).get("contributorId") or (body or {}).get("accountId")
    account_email = (body or {}).get("contributorEmail")

    from shared.db import get_pg_connection
    from psycopg2.extras import Json, RealDictCursor

    conn = get_pg_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            "SELECT title, description, acceptance_criteria, required_skills, estimated_hours, "
            "contributor_amount_minor, pay_currency, status, attachments FROM decomp_tasks WHERE id=%s AND plan_id=%s",
            (task_id, plan_id))
        dt = cur.fetchone()
    if dt is not None:
        if not account_id:
            raise HTTPException(status_code=422, detail="contributorId is required")
        st = (dt.get("status") or "").lower()
        # 'declined' is assignable again — re-assigning a declined task is how the
        # enterprise reacts to a contributor decline (declined → assigned).
        if st not in ("ready", "available", "priced", "approved", "declined"):
            raise HTTPException(status_code=400, detail=f"Task is '{st}', not open for assignment")
        from shared.deadlines import compute_due_at
        with conn.cursor() as cur:
            cur.execute("SELECT sow_id FROM decomp_plans WHERE id=%s", (plan_id,))
            srow = cur.fetchone()
        sow_id = srow[0] if srow else None
        reward = (float(dt["contributor_amount_minor"]) / 100.0) if dt.get("contributor_amount_minor") else None
        currency = dt.get("pay_currency") or "INR"
        est = dt.get("estimated_hours")
        req = (body or {}).get("skills") or dt.get("required_skills") or []
        due_at = compute_due_at(estimated_hours=est,
                                override=(body or {}).get("dueAt") or (body or {}).get("deadline"))
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO contributor_tasks (account_id, title, status, priority, category, reward, currency, due_at, data) "
                "VALUES (%s,%s,'assigned','normal','delivery',%s,%s,%s,%s) RETURNING id",
                (int(account_id), dt.get("title") or "Task", reward, currency, due_at,
                 Json({"taskId": task_id, "planId": plan_id, "sowId": sow_id,
                       "dueAt": due_at.isoformat(),
                       "estimatedHours": float(est) if est else None,
                       "skills_required": list(req),
                       # Carry the brief so the contributor knows what to build.
                       "description": dt.get("description"),
                       "acceptanceCriteria": dt.get("acceptance_criteria"),
                       # Enterprise's reference files so the contributor can download them.
                       "referenceFiles": dt.get("attachments") or []})))
            ctid = cur.fetchone()[0]
            cur.execute("UPDATE decomp_tasks SET status='assigned', updated_at=now() WHERE id=%s", (task_id,))
            cur.execute("UPDATE task_interests SET status='selected', updated_at=now() "
                        "WHERE plan_id=%s AND task_id=%s AND account_id=%s",
                        (plan_id, task_id, int(account_id)))
            cur.execute("UPDATE task_interests SET status='rejected', updated_at=now() "
                        "WHERE plan_id=%s AND task_id=%s AND account_id<>%s AND status='interested'",
                        (plan_id, task_id, int(account_id)))
        conn.commit()
        try:
            write_audit(
                actor_id=user.get("id"),
                actor_email=user.get("email"),
                actor_role=user.get("role"),
                action="decomposition.task.assign",
                target="decomp_task",
                target_id=task_id,
                details=f"Assigned '{dt.get('title') or task_id}' to contributor {account_id}"
                        f"{f' ({account_email})' if account_email else ''}",
                service="enterprise-service",
                tenant_id=user.get("tenant_id"),
            )
        except Exception:  # noqa: BLE001 — audit must never block the assignment
            pass
        return ok({"id": task_id, "status": "assigned",
                   "assigneeId": str(account_id), "assigneeEmail": account_email,
                   "contributorTaskId": ctid, "dueAt": due_at.isoformat(),
                   "reward": reward, "currency": currency})

    # ── Legacy JSON-document plan ─────────────────────────────────────────────
    row = _load(plan_id, user["id"])
    task = _find_task(row, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    account_id = (body or {}).get("contributorId") or (body or {}).get("accountId")
    account_email = (body or {}).get("contributorEmail")
    sow_id = row.get("sowId")

    from shared.db import get_pg_connection
    from psycopg2.extras import Json
    conn = get_pg_connection()
    with conn.cursor() as cur:
        # Mark the plan task assigned.
        task["status"] = "assigned"
        task["assigneeId"] = str(account_id) if account_id else None
        task["assigneeEmail"] = account_email
        # Create the contributor-facing task (status assigned → shows in their list).
        if account_id:
            # Carry the Glimmora-set price (decomp_tasks.contributor_amount_minor) onto
            # the contributor task so they see their pay and the payout uses the right
            # amount. reward is stored in major units; minor/100.
            cur.execute(
                "SELECT contributor_amount_minor, pay_currency, estimated_hours FROM decomp_tasks WHERE id=%s",
                (task_id,),
            )
            pr = cur.fetchone()
            reward = (float(pr[0]) / 100.0) if (pr and pr[0]) else None
            currency = (pr[1] if (pr and pr[1]) else None) or "INR"
            est_hours = pr[2] if (pr and len(pr) > 2) else None
            # Delivery deadline so on-time tracking works — explicit override
            # from the assigner, else derived from the task's estimated effort.
            from shared.deadlines import compute_due_at
            due_at = compute_due_at(
                estimated_hours=est_hours,
                override=(body or {}).get("dueAt") or (body or {}).get("deadline"),
            )
            task["dueAt"] = due_at.isoformat()
            cur.execute(
                "INSERT INTO contributor_tasks (account_id, title, status, priority, category, reward, currency, due_at, data) "
                "VALUES (%s,%s,'assigned',%s,%s,%s,%s,%s,%s) RETURNING id",
                (int(account_id), task.get("title") or "Task", "normal", "delivery", reward, currency, due_at,
                 Json({"planId": plan_id, "planTaskId": task_id, "sowId": sow_id,
                       "dueAt": due_at.isoformat(), "estimatedHours": float(est_hours) if est_hours else None,
                       "description": (task.get("detail") or {}).get("description") or "",
                       "skills_required": (body or {}).get("skills") or []})))
            ctid = cur.fetchone()[0]
            task["contributorTaskId"] = ctid
        conn.commit()
    _save(plan_id, user["id"], row)
    return ok(task)


@router.patch("/plans/{plan_id}/tasks/{task_id}")
def patch_task(plan_id: str, task_id: str, user: Annotated[dict, Depends(get_current_user)],
               body: dict = Body(default={})):
    row = _load(plan_id, user["id"])
    task = _find_task(row, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    task.update(body or {})
    _save(plan_id, user["id"], row)
    return ok(task)


@router.delete("/plans/{plan_id}/tasks/{task_id}")
def delete_task(plan_id: str, task_id: str, user: Annotated[dict, Depends(get_current_user)]):
    row = _load(plan_id, user["id"])
    before = len(row.get("tasks", []))
    row["tasks"] = [t for t in row.get("tasks", []) if t.get("id") != task_id]
    if len(row["tasks"]) == before:
        raise HTTPException(status_code=404, detail="Task not found")
    _save(plan_id, user["id"], row)
    return ok({"deleted": True, "id": task_id})


@router.get("/plans/{plan_id}/tasks/{task_id}/detail")
def task_detail(plan_id: str, task_id: str, user: Annotated[dict, Depends(get_current_user)]):
    row = _load(plan_id, user["id"])
    task = _find_task(row, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return ok({**task, "detail": task.get("detail", {})})


@router.post("/plans/{plan_id}/tasks/{task_id}/flag")
def flag_task(plan_id: str, task_id: str, user: Annotated[dict, Depends(get_current_user)],
              body: dict = Body(default={})):
    row = _load(plan_id, user["id"])
    task = _find_task(row, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    task["flagged"] = (body or {}).get("flagged", True)
    task["flagReason"] = (body or {}).get("reason")
    _save(plan_id, user["id"], row)
    return ok(task)


@router.post("/plans/{plan_id}/tasks/{task_id}/subtasks")
def add_subtask(plan_id: str, task_id: str, user: Annotated[dict, Depends(get_current_user)],
                body: dict = Body(default={})):
    row = _load(plan_id, user["id"])
    task = _find_task(row, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    sid = (body or {}).get("id") or db.new_id("sub_")
    sub = {"id": sid, "title": (body or {}).get("title") or "Subtask",
           "status": (body or {}).get("status") or "todo"}
    sub.update({k: v for k, v in (body or {}).items() if k not in sub})
    task.setdefault("subtasks", []).append(sub)
    _save(plan_id, user["id"], row)
    return ok(sub)


@router.patch("/plans/{plan_id}/tasks/{task_id}/subtasks/{subtask_id}")
def patch_subtask(plan_id: str, task_id: str, subtask_id: str,
                  user: Annotated[dict, Depends(get_current_user)],
                  body: dict = Body(default={})):
    row = _load(plan_id, user["id"])
    task = _find_task(row, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    for s in task.get("subtasks", []):
        if s.get("id") == subtask_id:
            s.update(body or {})
            _save(plan_id, user["id"], row)
            return ok(s)
    raise HTTPException(status_code=404, detail="Subtask not found")


@router.delete("/plans/{plan_id}/tasks/{task_id}/subtasks/{subtask_id}")
def delete_subtask(plan_id: str, task_id: str, subtask_id: str,
                   user: Annotated[dict, Depends(get_current_user)]):
    row = _load(plan_id, user["id"])
    task = _find_task(row, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    before = len(task.get("subtasks", []))
    task["subtasks"] = [s for s in task.get("subtasks", []) if s.get("id") != subtask_id]
    if len(task["subtasks"]) == before:
        raise HTTPException(status_code=404, detail="Subtask not found")
    _save(plan_id, user["id"], row)
    return ok({"deleted": True, "id": subtask_id})


# ── milestones / critical path ──────────────────────────────────────────────---

@router.get("/plans/{plan_id}/milestones")
def milestones(plan_id: str, user: Annotated[dict, Depends(get_current_user)]):
    return _slice(plan_id, user["id"], "milestones", [])


@router.get("/plans/{plan_id}/critical-path")
def critical_path(plan_id: str, user: Annotated[dict, Depends(get_current_user)]):
    return _slice(plan_id, user["id"], "criticalPath", [])


# ── checklist ───────────────────────────────────────────────────────────────---

@router.get("/plans/{plan_id}/checklist")
def get_checklist(plan_id: str, user: Annotated[dict, Depends(get_current_user)]):
    return _slice(plan_id, user["id"], "checklist", [])


@router.post("/plans/{plan_id}/checklist")
def add_checklist_item(plan_id: str, user: Annotated[dict, Depends(get_current_user)],
                       body: dict = Body(default={})):
    row = _load(plan_id, user["id"])
    cid = (body or {}).get("id") or db.new_id("ck_")
    item = {"id": cid, "label": (body or {}).get("label") or "Item",
            "done": (body or {}).get("done", False)}
    row.setdefault("checklist", []).append(item)
    _save(plan_id, user["id"], row)
    return ok(item)


@router.post("/plans/{plan_id}/checklist/validate")
def validate_checklist(plan_id: str, user: Annotated[dict, Depends(get_current_user)]):
    row = _load(plan_id, user["id"])
    items = row.get("checklist", [])
    incomplete = [c for c in items if not c.get("done")]
    return ok({"valid": len(incomplete) == 0, "incomplete": incomplete})


@router.post("/plans/{plan_id}/checklist/date-validation")
def checklist_date_validation(plan_id: str, user: Annotated[dict, Depends(get_current_user)],
                              body: dict = Body(default={})):
    row = _load(plan_id, user["id"])
    issues = []
    for m in row.get("milestones", []):
        if not m.get("date"):
            issues.append({"milestoneId": m.get("id"), "issue": "missing date"})
    return ok({"valid": len(issues) == 0, "issues": issues})


@router.get("/plans/{plan_id}/summary-panel")
def summary_panel(plan_id: str, user: Annotated[dict, Depends(get_current_user)]):
    row = _load(plan_id, user["id"])
    tasks = row.get("tasks", [])
    done = len([t for t in tasks if t.get("status") in ("done", "complete")])
    return ok({
        "title": row.get("title"),
        "status": row.get("status"),
        "taskCount": len(tasks),
        "completedTasks": done,
        "milestoneCount": len(row.get("milestones", [])),
        "locked": row.get("locked", False),
        "confirmed": row.get("confirmed", False),
        "revision": row.get("revision", 1),
    })


@router.get("/plans/{plan_id}/configure-legacy")
def configure_legacy(plan_id: str, user: Annotated[dict, Depends(get_current_user)]):
    row = _load(plan_id, user["id"])
    return ok({"planId": plan_id, "legacy": True, "config": row.get("data", {})})


# ── plan actions (query-param style) ────────────────────────────────────────---

@router.post("/plans/actions/kickoff")
def kickoff(plan_id: str, user: Annotated[dict, Depends(get_current_user)]):
    row = _load(plan_id, user["id"])
    row["status"] = "kickoff_requested"
    row["kickoff"] = {"requestedBy": user.get("email"), "at": db.now_iso(), "approved": False}
    return ok(_save(plan_id, user["id"], row))


@router.post("/plans/actions/approve-kickoff")
def approve_kickoff(plan_id: str, user: Annotated[dict, Depends(get_current_user)]):
    row = _load(plan_id, user["id"])
    row["status"] = "kickoff_approved"
    kickoff = row.setdefault("kickoff", {})
    kickoff["approved"] = True
    kickoff["approvedBy"] = user.get("email")
    kickoff["approvedAt"] = db.now_iso()
    return ok(_save(plan_id, user["id"], row))


@router.delete("/plans/actions/{plan_id}/withdraw")
def withdraw(plan_id: str, user: Annotated[dict, Depends(get_current_user)]):
    row = _load(plan_id, user["id"])
    row["status"] = "withdrawn"
    return ok(_save(plan_id, user["id"], row))


@router.post("/plans/{plan_id}/submit-for-review")
def submit_for_review(plan_id: str, user: Annotated[dict, Depends(get_current_user)]):
    row = _load(plan_id, user["id"])
    row["status"] = "in_review"
    review = row.setdefault("review", {"checklist": [], "summary": {}})
    review["status"] = "in_progress"
    review["submittedAt"] = db.now_iso()
    return ok(_save(plan_id, user["id"], row))


# ── internal revision-complete callback ─────────────────────────────────────---

@internal_router.post("/plans/{plan_id}/revision/complete")
def revision_complete(plan_id: str, user: Annotated[dict, Depends(get_current_user)],
                      body: dict = Body(default={})):
    row = db.get_row("plan", plan_id, user["id"])
    if row is None:
        raise HTTPException(status_code=404, detail="Plan not found")
    row["status"] = "revised"
    revs = row.get("revisions", [])
    if revs:
        revs[-1]["completedAt"] = db.now_iso()
        revs[-1]["result"] = body
    row["updatedAt"] = db.now_iso()
    saved = db.update_row("plan", plan_id, row, user["id"])
    return ok(saved)
