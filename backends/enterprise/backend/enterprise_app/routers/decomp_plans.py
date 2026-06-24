"""
Decomposition plans — normalised Postgres implementation.

Endpoints:
  GET    /api/v1/enterprise/decomposition/plans
  POST   /api/v1/enterprise/decomposition/plans
  GET    /api/v1/enterprise/decomposition/plans/{plan_id}
  PATCH  /api/v1/enterprise/decomposition/plans/{plan_id}
  POST   /api/v1/enterprise/decomposition/plans/{plan_id}/activate
  POST   /api/v1/enterprise/decomposition/plans/{plan_id}/approve
  POST   /api/v1/enterprise/decomposition/plans/{plan_id}/archive
  POST   /api/v1/enterprise/decomposition/plans/{plan_id}/copy

These match the FE proxy path /api/decomposition/plans → /api/v1/enterprise/decomposition/plans.

Response shapes match the FE lib/decomposition/types.ts:
  - Single plan: { plan: PlanDetail }
  - List:        { items: PlanSummary[], nextCursor: string | null }
"""

from __future__ import annotations

import json
import logging
import re
import uuid
from datetime import datetime, timedelta, timezone
from typing import Annotated, Any

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from psycopg2.extras import Json, RealDictCursor

from shared.audit import write_audit, write_txn_event
from shared.db import ensure_pg_clean, get_pg_connection
from shared.deps import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/enterprise/decomposition",
    tags=["decomposition-plans"],
)


# ── helpers ──────────────────────────────────────────────────────────────────


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _slugify(text: str | None, max_len: int = 28) -> str:
    if not text:
        return ""
    s = re.sub(r"[^a-z0-9]+", "-", str(text).lower()).strip("-")
    return re.sub(r"-{2,}", "-", s)[:max_len].strip("-")


def _slug_from_id(rid: str | None) -> str:
    """Pull the readable middle out of an id like ``sow_acme-login-3f9a2b`` → 'acme-login'
    so a derived plan/task id can reuse the parent's slug. Returns '' for opaque ids."""
    if not rid or "_" not in rid:
        return ""
    rest = rid.split("_", 1)[1]
    rest = re.sub(r"-[0-9a-f]{6}$", "", rest)  # drop the trailing short hex code
    return rest if re.search(r"[a-z]", rest) else ""


def _new_id(prefix: str = "", slug: str | None = None) -> str:
    """Readable id keeping the prefix intact (so cross-table links + startswith
    checks still work): ``tsk_login-ui-8a3f2c``."""
    sl = _slugify(slug)
    if sl:
        return f"{prefix}{sl}-{uuid.uuid4().hex[:6]}"
    base = uuid.uuid4().hex
    return f"{prefix}{base}" if prefix else base


def _conn():
    ensure_pg_clean()
    return get_pg_connection()


def _to_iso(val) -> str | None:
    if val is None:
        return None
    if isinstance(val, datetime):
        return val.isoformat()
    return str(val)


def _norm_attachments(raw) -> list[dict]:
    """Normalise task attachments to a clean [{name, url, sizeBytes?}] list."""
    import json as _json
    if isinstance(raw, str):
        try:
            raw = _json.loads(raw)
        except (ValueError, TypeError):
            raw = []
    out: list[dict] = []
    for a in (raw or []):
        if isinstance(a, dict) and (a.get("url") or a.get("fileUrl")):
            out.append({
                "name": a.get("name") or a.get("fileName") or "Attachment",
                "url": a.get("url") or a.get("fileUrl"),
                "sizeBytes": a.get("sizeBytes") or a.get("fileSize"),
            })
    return out


# ── row → shape mappers ───────────────────────────────────────────────────────


def _plan_summary(row: dict) -> dict:
    return {
        "id": row["id"],
        "sowId": row["sow_id"],
        "version": row["version"],
        "status": row["status"],
        "summary": row["summary"],
        "defaultWorkforceSourcing": row.get("default_workforce_sourcing"),
        "defaultReviewPath": row.get("default_review_path"),
        "twoStageReviewEnabled": bool(row.get("two_stage_review_enabled", False)),
        "approvedAt": _to_iso(row.get("approved_at")),
        "approvedBy": row.get("approved_by"),
        "activatedAt": _to_iso(row.get("activated_at")),
        "archivedAt": _to_iso(row.get("archived_at")),
        "createdBy": row["created_by"],
        "createdAt": _to_iso(row["created_at"]),
        "updatedAt": _to_iso(row["updated_at"]),
        "revisionNote": row.get("revision_note"),
    }


def _milestone_detail(row: dict) -> dict:
    return {
        "id": row["id"],
        "order": row["order"],
        "name": row["name"],
        "description": row.get("description"),
        "startDate": _to_iso(row.get("start_date")),
        "endDate": _to_iso(row.get("end_date")),
        "status": row["status"],
        "createdAt": _to_iso(row["created_at"]),
        "updatedAt": _to_iso(row["updated_at"]),
    }


def _task_detail(row: dict, include_pricing: bool = False) -> dict:
    skills = row.get("required_skills") or []
    if isinstance(skills, str):
        import json as _json
        try:
            skills = _json.loads(skills)
        except Exception:
            skills = []
    out = {
        "id": row["id"],
        "milestoneId": row.get("milestone_id"),
        "externalKey": row.get("external_key"),
        "title": row["title"],
        "description": row.get("description"),
        "requiredSkills": skills,
        "estimatedHours": float(row["estimated_hours"]) if row.get("estimated_hours") is not None else None,
        "acceptanceCriteria": row.get("acceptance_criteria"),
        "complexity": row.get("complexity"),
        "order": row["order"],
        "status": row["status"],
        "aiConfidence": row.get("ai_confidence"),
        "pmoEdited": bool(row.get("pmo_edited", False)),
        "workforceSourcing": row.get("workforce_sourcing"),
        "reviewPath": row.get("review_path"),
        "attachments": _norm_attachments(row.get("attachments")),
        "createdAt": _to_iso(row["created_at"]),
        "updatedAt": _to_iso(row["updated_at"]),
    }
    # Contributor pay is super-admin-only — NEVER returned to enterprise/mentor/
    # reviewer (it would reveal Glimmora's margin). Caller opts in explicitly.
    if include_pricing:
        out["payType"] = row.get("pay_type")
        out["payRateMinor"] = row.get("pay_rate_minor")
        out["contributorAmountMinor"] = row.get("contributor_amount_minor")
        out["payCurrency"] = row.get("pay_currency") or "INR"
        out["pricedAt"] = _to_iso(row.get("priced_at"))
    return out


def _dep_detail(row: dict) -> dict:
    return {
        "id": row["id"],
        "fromTaskId": row["from_task_id"],
        "toTaskId": row["to_task_id"],
        "type": row["type"],
        "createdAt": _to_iso(row["created_at"]),
    }


# ── DB reads ─────────────────────────────────────────────────────────────────


def _get_plan_row(plan_id: str) -> dict | None:
    conn = _conn()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            "SELECT * FROM decomp_plans WHERE id = %s AND deleted_at IS NULL",
            [plan_id],
        )
        row = cur.fetchone()
    return dict(row) if row else None


def _get_plan_detail(plan_id: str, include_pricing: bool = False) -> dict | None:
    plan = _get_plan_row(plan_id)
    if not plan:
        return None
    conn = _conn()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            "SELECT * FROM decomp_milestones WHERE plan_id = %s ORDER BY \"order\" ASC",
            [plan_id],
        )
        milestones = [dict(r) for r in cur.fetchall()]
        cur.execute(
            "SELECT * FROM decomp_tasks WHERE plan_id = %s ORDER BY \"order\" ASC",
            [plan_id],
        )
        tasks = [dict(r) for r in cur.fetchall()]
        task_ids = [t["id"] for t in tasks]
        deps: list[dict] = []
        if task_ids:
            cur.execute(
                "SELECT * FROM decomp_dependencies WHERE from_task_id = ANY(%s)",
                [task_ids],
            )
            deps = [dict(r) for r in cur.fetchall()]
    # Resolve the source SOW title for display.
    sow_title = None
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT data FROM enterprise_sows WHERE id = %s", [plan["sow_id"]])
        srow = cur.fetchone()
    if srow:
        import json as _json
        sd = srow["data"]
        if isinstance(sd, str):
            try:
                sd = _json.loads(sd)
            except (ValueError, TypeError):
                sd = {}
        sd = sd or {}
        sow_title = sd.get("projectTitle") or sd.get("title") or sd.get("fileName")

    return {
        **_plan_summary(plan),
        "sowTitle": sow_title,
        "milestones": [_milestone_detail(m) for m in milestones],
        "tasks": [_task_detail(t, include_pricing=include_pricing) for t in tasks],
        "dependencies": [_dep_detail(d) for d in deps],
    }


def _is_superadmin(user: dict) -> bool:
    return (user.get("role") or "").lower() in ("superadmin", "super_admin")


# ── structure validation ──────────────────────────────────────────────────────


def _validate_structure(structure: dict) -> None:
    """Replicates FE service.ts validateStructure."""
    milestones = structure.get("milestones", [])
    tasks = structure.get("tasks", [])
    deps = structure.get("dependencies", [])

    ms_keys: dict[str, Any] = {}
    ms_orders: set[int] = set()
    for m in milestones:
        name = (m.get("name") or "").strip()
        if not name:
            raise HTTPException(status_code=400, detail="milestone name required")
        order = m.get("order")
        if order in ms_orders:
            raise HTTPException(status_code=400, detail=f"duplicate milestone order: {order}")
        ms_orders.add(order)
        key = m.get("key")
        if key:
            if key in ms_keys:
                raise HTTPException(status_code=400, detail=f"duplicate milestone key: {key}")
            ms_keys[key] = m

    task_keys: dict[str, Any] = {}
    for t in tasks:
        title = (t.get("title") or "").strip()
        if not title:
            raise HTTPException(status_code=400, detail="task title required")
        key = t.get("key")
        if key:
            if key in task_keys:
                raise HTTPException(status_code=400, detail=f"duplicate task key: {key}")
            task_keys[key] = t
        mk = t.get("milestoneKey")
        if mk and mk not in ms_keys:
            raise HTTPException(status_code=400, detail=f"task references unknown milestoneKey: {mk}")

    for d in deps:
        fk = d.get("fromTaskKey", "")
        tk = d.get("toTaskKey", "")
        if fk not in task_keys:
            raise HTTPException(status_code=400, detail=f"dependency fromTaskKey unknown: {fk}")
        if tk not in task_keys:
            raise HTTPException(status_code=400, detail=f"dependency toTaskKey unknown: {tk}")
        if fk == tk:
            raise HTTPException(status_code=400, detail=f"dependency cannot point at itself: {fk}")

    # DAG cycle detection
    adjacency: dict[str, list[str]] = {k: [] for k in task_keys}
    for d in deps:
        adjacency[d["fromTaskKey"]].append(d["toTaskKey"])

    WHITE, GRAY, BLACK = 0, 1, 2
    color = {k: WHITE for k in task_keys}

    def dfs(node: str) -> None:
        color[node] = GRAY
        for nxt in adjacency.get(node, []):
            c = color.get(nxt, WHITE)
            if c == GRAY:
                raise HTTPException(status_code=400, detail=f"dependency cycle detected: {node} -> {nxt}")
            if c == WHITE:
                dfs(nxt)
        color[node] = BLACK

    for node in task_keys:
        if color.get(node, WHITE) == WHITE:
            dfs(node)


def _write_structure(plan_id: str, tenant_id: str, structure: dict, conn) -> None:
    """Insert milestones, tasks, dependencies for a plan (assumes clean slate)."""
    milestones = structure.get("milestones", [])
    tasks = structure.get("tasks", [])
    deps = structure.get("dependencies", [])

    ms_key_to_id: dict[str, str] = {}
    with conn.cursor() as cur:
        for m in milestones:
            mid = _new_id("ms_")
            cur.execute(
                """INSERT INTO decomp_milestones
                    (id, plan_id, tenant_id, "order", name, description,
                     start_date, end_date, status)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                [
                    mid, plan_id, tenant_id,
                    m.get("order", 0), m["name"], m.get("description"),
                    m.get("startDate"), m.get("endDate"),
                    m.get("status") or "pending",
                ],
            )
            if m.get("key"):
                ms_key_to_id[m["key"]] = mid

        task_key_to_id: dict[str, str] = {}
        for t in tasks:
            tid = _new_id("tsk_", t.get("title"))
            milestone_id = ms_key_to_id.get(t["milestoneKey"]) if t.get("milestoneKey") else None
            cur.execute(
                """INSERT INTO decomp_tasks
                    (id, plan_id, milestone_id, tenant_id, external_key,
                     title, description, required_skills, estimated_hours,
                     acceptance_criteria, complexity, "order", status,
                     ai_confidence, pmo_edited, workforce_sourcing, review_path,
                     attachments)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                [
                    tid, plan_id, milestone_id, tenant_id,
                    t.get("externalKey"),
                    t["title"], t.get("description"),
                    Json(t.get("requiredSkills") or []),
                    t.get("estimatedHours"),
                    t.get("acceptanceCriteria"),
                    t.get("complexity"),
                    t.get("order") or 0,
                    "draft",
                    t.get("aiConfidence"),
                    bool(t.get("pmoEdited", False)),
                    t.get("workforceSourcing"),
                    t.get("reviewPath"),
                    Json(_norm_attachments(t.get("attachments"))),
                ],
            )
            if t.get("key"):
                task_key_to_id[t["key"]] = tid

        for d in deps:
            did = _new_id("dep_")
            from_id = task_key_to_id.get(d["fromTaskKey"])
            to_id = task_key_to_id.get(d["toTaskKey"])
            if from_id and to_id:
                cur.execute(
                    """INSERT INTO decomp_dependencies
                        (id, from_task_id, to_task_id, tenant_id, type)
                       VALUES (%s, %s, %s, %s, %s)""",
                    [did, from_id, to_id, tenant_id, d.get("type") or "finish_to_start"],
                )


# ── GET /plans ────────────────────────────────────────────────────────────────


@router.get("/plans")
def list_plans(
    user: Annotated[dict, Depends(get_current_user)],
    sow_id: str | None = Query(default=None, alias="sowId"),
    status: list[str] | None = Query(default=None),
    include_archived: bool = Query(default=False, alias="includeArchived"),
    limit: int = Query(default=50, ge=1, le=500),
    cursor: str | None = Query(default=None),
):
    valid_statuses = {"draft", "submitted", "approved", "active", "archived"}
    if status:
        bad = [s for s in status if s not in valid_statuses]
        if bad:
            raise HTTPException(status_code=400, detail=f"Invalid status: {bad[0]}")

    conn = _conn()
    params: list[Any] = []
    clauses = ["deleted_at IS NULL"]

    # Super admin (Glimmora) sees plans across ALL tenants — this is the pricing
    # + approval queue. Enterprise users are scoped to their own tenant.
    if not _is_superadmin(user):
        clauses.append("tenant_id = %s")
        params.append(user.get("tenant_id") or user.get("id"))

    if sow_id:
        clauses.append("sow_id = %s")
        params.append(sow_id)

    if status:
        placeholders = ", ".join(["%s"] * len(status))
        clauses.append(f"status IN ({placeholders})")
        params.extend(status)
    elif not include_archived:
        clauses.append("status != 'archived'")

    if cursor:
        clauses.append("id > %s")
        params.append(cursor)

    where = " AND ".join(clauses)
    params.append(limit + 1)
    sql = f"SELECT * FROM decomp_plans WHERE {where} ORDER BY sow_id ASC, version DESC LIMIT %s"

    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(sql, params)
        rows = [dict(r) for r in cur.fetchall()]

    has_more = len(rows) > limit
    items = rows[:limit]
    next_cursor = rows[limit - 1]["id"] if has_more else None

    # Resolve SOW titles so lists/queues show the SOW name, not just the summary.
    import json as _json
    sow_ids = list({r["sow_id"] for r in items if r.get("sow_id")})
    titles: dict[str, str] = {}
    sow_budget: dict[str, int] = {}   # agreed SOW budget (minor) — enterprise's committed total
    if sow_ids:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT id, data FROM enterprise_sows WHERE id = ANY(%s)", [sow_ids])
            for s in cur.fetchall():
                d = s["data"]
                if isinstance(d, str):
                    try:
                        d = _json.loads(d)
                    except (ValueError, TypeError):
                        d = {}
                d = d or {}
                titles[s["id"]] = d.get("projectTitle") or d.get("title") or d.get("fileName")
                _ba = d.get("budgetAmount")
                try:
                    sow_budget[s["id"]] = int(round(float(_ba) * 100)) if _ba not in (None, "") else 0
                except (TypeError, ValueError):
                    sow_budget[s["id"]] = 0

    # Per-plan delivery + payment rollup (two aggregate queries, not N+1) so the
    # Glimmora pricing list can show a progress bar + payment buckets at a glance.
    plan_ids = [r["id"] for r in items]
    deliv: dict[str, dict] = {}
    pay: dict[str, dict] = {}
    pay_amt: dict[str, dict] = {}
    budget_by_plan: dict[str, int] = {}
    if plan_ids:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "SELECT plan_id, COUNT(*) total, "
                "COUNT(*) FILTER (WHERE status IN ('payment_pending','paid')) delivered, "
                "COUNT(*) FILTER (WHERE status='paid') paid "
                "FROM decomp_tasks WHERE plan_id = ANY(%s) GROUP BY plan_id", [plan_ids])
            for r in cur.fetchall():
                deliv[r["plan_id"]] = {"total": int(r["total"]), "delivered": int(r["delivered"]),
                                       "paid": int(r["paid"])}
            cur.execute(
                "SELECT t.plan_id pid, lp.status st, COUNT(*) n, "
                "COALESCE(SUM(lp.client),0) budget FROM ("
                "  SELECT DISTINCT ON (data->>'canonicalTaskId') data->>'canonicalTaskId' ctid, status, "
                "  (data->>'clientMinor')::bigint client FROM payouts "
                "  WHERE data->>'canonicalTaskId' IN (SELECT id FROM decomp_tasks WHERE plan_id = ANY(%s)) "
                "  ORDER BY data->>'canonicalTaskId', created_at DESC"
                ") lp JOIN decomp_tasks t ON t.id = lp.ctid GROUP BY t.plan_id, lp.status", [plan_ids])
            for r in cur.fetchall():
                pay.setdefault(r["pid"], {})[r["st"]] = int(r["n"])
                pay_amt.setdefault(r["pid"], {})[r["st"]] = int(r["budget"] or 0)
                budget_by_plan[r["pid"]] = budget_by_plan.get(r["pid"], 0) + int(r["budget"] or 0)

    out = []
    for r in items:
        summary = _plan_summary(r)
        summary["sowTitle"] = titles.get(r["sow_id"])
        dv = deliv.get(r["id"], {"total": 0, "delivered": 0, "paid": 0})
        pc = pay.get(r["id"], {})
        pa = pay_amt.get(r["id"], {})
        summary["delivery"] = {
            "total": dv["total"], "delivered": dv["delivered"], "paid": dv["paid"],
            "progressPct": round(100 * dv["delivered"] / dv["total"]) if dv["total"] else 0,
            "paymentPhase": _payment_phase(dv["total"], dv["delivered"], dv["paid"], pc),
            "payoutCounts": pc,
            "sowBudgetMinor": sow_budget.get(r["sow_id"], 0),  # agreed/committed SOW budget (total)
            "budgetMinor": budget_by_plan.get(r["id"], 0),  # delivered client price — enterprise-safe
            # per-status budget amounts (all client price — enterprise-safe)
            "requestedMinor": pa.get("requested", 0),  # awaiting your release
            "releasedMinor": pa.get("released", 0),     # released, Glimmora not yet paid
            "paidMinor": pa.get("paid", 0),             # fully settled
        }
        out.append(summary)
    return {"items": out, "nextCursor": next_cursor}


# ── POST /plans ───────────────────────────────────────────────────────────────


@router.post("/plans", status_code=201)
def create_plan(
    user: Annotated[dict, Depends(get_current_user)],
    body: dict = Body(default={}),
):
    body = body or {}
    sow_id = body.get("sowId") or body.get("sow_id") or ""
    if not sow_id:
        raise HTTPException(status_code=400, detail="sowId is required")

    tenant_id = user.get("tenant_id") or user.get("id")
    created_by = user.get("id") or user.get("email") or "unknown"

    structure = body.get("structure")
    if structure:
        _validate_structure(structure)

    conn = _conn()

    # pick next version per sow_id
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            "SELECT MAX(version) AS v FROM decomp_plans WHERE sow_id = %s AND deleted_at IS NULL",
            [sow_id],
        )
        row = cur.fetchone()
    next_version = (row["v"] or 0) + 1 if row and row["v"] is not None else 1

    plan_id = _new_id("dp_", _slug_from_id(sow_id))
    with conn.cursor() as cur:
        cur.execute(
            """INSERT INTO decomp_plans
                (id, tenant_id, sow_id, version, status, summary,
                 source_agent_invocation_id, created_by)
               VALUES (%s, %s, %s, %s, 'draft', %s, %s, %s)""",
            [
                plan_id, tenant_id, sow_id, next_version,
                body.get("summary"),
                body.get("sourceAgentInvocationId"),
                created_by,
            ],
        )
    if structure:
        _write_structure(plan_id, tenant_id, structure, conn)
    conn.commit()

    plan = _get_plan_detail(plan_id)
    _audit(user, "decomposition.plan.create", plan_id, extra={
        "sowId": sow_id, "version": next_version,
        "milestoneCount": len(plan.get("milestones", [])) if plan else 0,
        "taskCount": len(plan.get("tasks", [])) if plan else 0,
    })
    return {"plan": plan}


# ── GET /plans/{plan_id} ──────────────────────────────────────────────────────


@router.get("/plans/{plan_id}")
def get_plan(
    plan_id: str,
    user: Annotated[dict, Depends(get_current_user)],
):
    # Only the super admin (Glimmora) sees contributor pay — enterprise must not.
    plan = _get_plan_detail(plan_id, include_pricing=_is_superadmin(user))
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return {"plan": plan}


# ── GET /sows/{sow_id}/work-context ───────────────────────────────────────────
# Read-only SOW scope + decomposition task statuses for the people DELIVERING the
# work (mentor + reviewer) so they have context when reviewing a submission.
# Deliberately EXCLUDES all commercial/financial fields (budget, price, margin,
# rate, GST) — delivery reviewers see scope + tasks + statuses, never money.

_WORK_CONTEXT_ROLES = {"enterprise", "mentor", "reviewer", "admin", "superadmin", "super_admin"}
_FINANCIAL_KEY_HINTS = ("price", "budget", "amount", "margin", "cost", "rate", "gst", "fee", "pay", "invoice")


def _is_financial_key(key: str) -> bool:
    k = key.lower()
    return any(h in k for h in _FINANCIAL_KEY_HINTS)


@router.get("/sows/{sow_id}/work-context")
def sow_work_context(
    sow_id: str,
    user: Annotated[dict, Depends(get_current_user)],
):
    if (user.get("role") or "").lower() not in _WORK_CONTEXT_ROLES:
        raise HTTPException(status_code=403, detail="Not allowed")

    conn = _conn()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT id, data FROM enterprise_sows WHERE id = %s", [sow_id])
        sow_row = cur.fetchone()
    if not sow_row:
        raise HTTPException(status_code=404, detail="SOW not found")

    import json as _json
    data = sow_row["data"]
    if isinstance(data, str):
        try:
            data = _json.loads(data)
        except (ValueError, TypeError):
            data = {}
    data = data or {}

    # Files (the uploaded SOW document) — links only, no commercial data.
    files = []
    for f in (data.get("files") or data.get("attachments") or []):
        if isinstance(f, dict):
            files.append({
                "name": f.get("name") or f.get("fileName") or "Document",
                "url": f.get("url") or f.get("fileUrl") or f.get("blobUrl") or f.get("downloadUrl"),
            })
    # single-file fallbacks commonly stored flat on the SOW
    if not files and (data.get("fileUrl") or data.get("blobUrl") or data.get("documentUrl")):
        files.append({
            "name": data.get("fileName") or "SOW document",
            "url": data.get("fileUrl") or data.get("blobUrl") or data.get("documentUrl"),
        })

    sow_status = data.get("status")

    def _s(*vals):
        """First value that's a non-empty string (scope can be a nested object — skip it)."""
        for v in vals:
            if isinstance(v, str) and v.strip():
                return v
        return None

    # Non-financial scope summary only. All scalars coerced to strings so the UI
    # never receives an object to render.
    sow = {
        "id": sow_row["id"],
        "title": _s(data.get("projectTitle"), data.get("title"), data.get("fileName")) or sow_row["id"],
        "status": _s(sow_status),
        "clientOrganisation": _s(data.get("clientOrganisation")),
        "requiredSkills": [s for s in (data.get("requiredSkills") or []) if isinstance(s, str)],
        "startDate": _s(data.get("startDate"), data.get("start_date")),
        "endDate": _s(data.get("endDate"), data.get("end_date")),
        "confidentiality": _s(data.get("confidentiality")),
        "description": _s(data.get("description"), data.get("summary")),
        "mentor": (data.get("mentor") or {}).get("name") if isinstance(data.get("mentor"), dict) else None,
        "reviewer": (data.get("reviewer") or {}).get("name") if isinstance(data.get("reviewer"), dict) else None,
        "files": files,
    }

    # Latest non-archived decomposition plan for this SOW + its tasks/statuses.
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            "SELECT * FROM decomp_plans WHERE sow_id = %s AND deleted_at IS NULL "
            "ORDER BY version DESC LIMIT 1",
            [sow_id],
        )
        plan_row = cur.fetchone()

    # Lifecycle stage the mentor/reviewer can read at a glance:
    #   awaiting_approval -> approved -> awaiting_decomposition -> decomposing -> in_delivery
    s = (sow_status or "").lower()
    if s in ("approved", "active") and plan_row:
        stage = "in_delivery" if plan_row["status"] in ("approved", "active") else "decomposing"
    elif s in ("approved", "active"):
        stage = "awaiting_decomposition"
    elif s in ("rejected", "cancelled"):
        stage = s
    else:
        stage = "awaiting_approval"
    sow["lifecycleStage"] = stage

    plan = None
    if plan_row:
        detail = _get_plan_detail(plan_row["id"]) or {}
        ms_by_id = {m["id"]: m for m in detail.get("milestones", [])}
        # group tasks under their milestone, stripped to scope/status (no money).
        groups: dict[str, dict] = {}
        for m in detail.get("milestones", []):
            groups[m["id"]] = {
                "id": m["id"], "name": m["name"], "status": m["status"],
                "startDate": m.get("startDate"), "endDate": m.get("endDate"), "tasks": [],
            }
        unassigned = {"id": None, "name": "Unassigned", "status": "pending",
                      "startDate": None, "endDate": None, "tasks": []}
        for t in detail.get("tasks", []):
            tgt = groups.get(t.get("milestoneId")) or unassigned
            tgt["tasks"].append({
                "id": t["id"],
                "title": t["title"],
                "description": t.get("description"),
                "status": t["status"],
                "requiredSkills": t.get("requiredSkills") or [],
                "estimatedHours": t.get("estimatedHours"),
                "attachments": t.get("attachments") or [],
            })
        milestones = list(groups.values())
        if unassigned["tasks"]:
            milestones.append(unassigned)
        tasks = detail.get("tasks", [])
        plan = {
            "id": detail.get("id"),
            "version": detail.get("version"),
            "status": detail.get("status"),
            "milestones": milestones,
            "taskCount": len(tasks),
            "statusCounts": {
                s: sum(1 for t in tasks if t.get("status") == s)
                for s in {t.get("status") for t in tasks}
            },
        }

    return {"sow": sow, "plan": plan}


# ── PATCH /plans/{plan_id} ────────────────────────────────────────────────────


@router.patch("/plans/{plan_id}")
def update_plan(
    plan_id: str,
    user: Annotated[dict, Depends(get_current_user)],
    body: dict = Body(default={}),
):
    body = body or {}
    if "summary" not in body and "structure" not in body:
        raise HTTPException(
            status_code=400,
            detail="Request body must include summary and/or structure",
        )

    row = _get_plan_row(plan_id)
    if not row:
        raise HTTPException(status_code=404, detail="Plan not found")
    if row["status"] != "draft":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot edit a plan in '{row['status']}' state",
        )

    structure = body.get("structure")
    if structure:
        _validate_structure(structure)

    conn = _conn()
    if structure:
        # atomic replace
        with conn.cursor() as cur:
            # collect task ids first for dep cleanup
            cur.execute("SELECT id FROM decomp_tasks WHERE plan_id = %s", [plan_id])
            task_ids = [r[0] for r in cur.fetchall()]
            if task_ids:
                cur.execute(
                    "DELETE FROM decomp_dependencies WHERE from_task_id = ANY(%s)",
                    [task_ids],
                )
            cur.execute("DELETE FROM decomp_tasks WHERE plan_id = %s", [plan_id])
            cur.execute("DELETE FROM decomp_milestones WHERE plan_id = %s", [plan_id])
        tenant_id = row["tenant_id"]
        _write_structure(plan_id, tenant_id, structure, conn)

    if "summary" in body:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE decomp_plans SET summary = %s, updated_at = now() WHERE id = %s",
                [body["summary"], plan_id],
            )
    else:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE decomp_plans SET updated_at = now() WHERE id = %s",
                [plan_id],
            )
    conn.commit()

    plan = _get_plan_detail(plan_id)
    _audit(user, "decomposition.plan.update", plan_id, extra={
        "summaryChanged": "summary" in body,
        "structureReplaced": structure is not None,
    })
    return {"plan": plan}


# ── GET/POST /plans/{plan_id}/tasks ───────────────────────────────────────────


@router.get("/plans/{plan_id}/tasks")
def list_plan_tasks(
    plan_id: str,
    user: Annotated[dict, Depends(get_current_user)],
):
    if not _get_plan_row(plan_id):
        raise HTTPException(status_code=404, detail="Plan not found")
    conn = _conn()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            'SELECT * FROM decomp_tasks WHERE plan_id = %s ORDER BY "order", created_at',
            [plan_id],
        )
        rows = cur.fetchall()
    return {"items": [dict(r) for r in rows], "total": len(rows)}


@router.post("/plans/{plan_id}/tasks", status_code=201)
def create_plan_task(
    plan_id: str,
    user: Annotated[dict, Depends(get_current_user)],
    body: dict = Body(default={}),
):
    row = _get_plan_row(plan_id)
    if not row:
        raise HTTPException(status_code=404, detail="Plan not found")
    if row["status"] != "draft":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot add tasks to a plan in '{row['status']}' state",
        )
    body = body or {}
    title = body.get("title")
    if not title:
        raise HTTPException(status_code=422, detail="title is required")

    tid = _new_id("tsk_", title)
    conn = _conn()
    with conn.cursor() as cur:
        cur.execute(
            """INSERT INTO decomp_tasks
                (id, plan_id, milestone_id, tenant_id, external_key,
                 title, description, required_skills, estimated_hours,
                 acceptance_criteria, complexity, "order", status,
                 ai_confidence, pmo_edited, workforce_sourcing, review_path)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            [
                tid, plan_id, body.get("milestoneId"), row["tenant_id"],
                body.get("externalKey"),
                title, body.get("description"),
                Json(body.get("requiredSkills") or []),
                body.get("estimatedHours"),
                body.get("acceptanceCriteria"),
                body.get("complexity"),
                body.get("order") or 0,
                "draft",
                body.get("aiConfidence"),
                bool(body.get("pmoEdited", False)),
                body.get("workforceSourcing"),
                body.get("reviewPath"),
            ],
        )
    conn.commit()
    _audit(user, "decomposition.task.create", plan_id, extra={"taskId": tid})
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT * FROM decomp_tasks WHERE id = %s", [tid])
        task = cur.fetchone()
    return {"task": dict(task) if task else {"id": tid}}


# ── Task-interest sourcing — list interested contributors + select one ────────


def _norm_skill(s: Any) -> str:
    """Canonicalise a skill for matching.

    Strips case + punctuation/whitespace, then collapses the common JS-framework
    spelling variants so "React", "React.js", "reactjs" and "react js" all match
    (likewise node/Node.js/node js, next/Next.js, vue/Vue.js, …). Without this,
    a task tagged "react js" found 0 contributors who declared "React".
    """
    n = re.sub(r"[^a-z0-9]", "", str(s or "").lower())
    if len(n) > 2 and n.endswith("js"):
        n = n[:-2]  # reactjs -> react, nodejs -> node, nextjs -> next
    return n


def _as_skill_list(raw: Any) -> list:
    if isinstance(raw, list):
        return raw
    if isinstance(raw, str):
        try:
            return json.loads(raw)
        except (ValueError, TypeError):
            return []
    return []


@router.get("/plans/{plan_id}/tasks/{task_id}/interests")
def list_task_interests(
    plan_id: str,
    task_id: str,
    user: Annotated[dict, Depends(get_current_user)],
):
    """Candidate pool for sourcing this task = every approved contributor who is
    skill-MATCHED OR has expressed INTEREST, enriched with declared skills, how
    many match the required skills, avg mentor rating and completed-task count.
    `status` is 'selected'/'interested' (raised their hand) or 'matched' (skill
    fit, not yet interested); `interested` is a bool. The FE filters this
    (All / Only interested / Top matched) so the modal lines up with the
    "N matched · M interested" badge."""
    conn = _conn()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT required_skills FROM decomp_tasks WHERE id = %s", [task_id])
        trow = cur.fetchone()
    req = _as_skill_list((trow or {}).get("required_skills"))
    req_norm = {_norm_skill(s) for s in req if s}

    # Who raised their hand (interested/selected), keyed by account.
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """SELECT account_id, contributor_name, contributor_email, status, created_at
                 FROM task_interests
                WHERE plan_id = %s AND task_id = %s
                  AND status IN ('interested', 'selected')""",
            [plan_id, task_id],
        )
        interest_by_acct = {r["account_id"]: r for r in cur.fetchall()}

    # Every approved contributor with a profile (so skill-matched but not-yet-
    # interested people are still sourceable).
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """SELECT la.id, la.email, la.first_name, la.last_name,
                      cp.primary_skills, cp.secondary_skills, cp.other_skills
                 FROM login_accounts la JOIN contributor_profiles cp ON cp.account_id = la.id
                WHERE la.role = 'contributor'
                  AND COALESCE(la.approval_status,'approved') = 'approved'""")
        contributors = cur.fetchall()

    # Batched track-record stats (no N+1): tasks taken/completed, mentor rating,
    # and the FINAL (mentor+QA) rating from work_ratings when available.
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT account_id, COUNT(*) AS taken, "
                    "COUNT(*) FILTER (WHERE status='completed') AS completed "
                    "FROM contributor_tasks GROUP BY account_id")
        task_stats = {r["account_id"]: r for r in cur.fetchall()}
        cur.execute("SELECT contributor_id, COALESCE(AVG(NULLIF(score,0)),0) AS avg_score, "
                    "COUNT(*) FILTER (WHERE score>0) AS rated "
                    "FROM mentor_reviews GROUP BY contributor_id")
        rate_stats = {str(r["contributor_id"]): r for r in cur.fetchall()}
    final_stats = {}
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT account_id, AVG(final_rating) AS avg_final, "
                        "COUNT(*) AS rated_works FROM work_ratings GROUP BY account_id")
            final_stats = {r["account_id"]: r for r in cur.fetchall()}
    except Exception:  # noqa: BLE001 — work_ratings created on first QA approval
        conn.rollback()
        final_stats = {}

    items = []
    for r in contributors:
        acct = r["id"]
        declared = ((r.get("primary_skills") or []) + (r.get("secondary_skills") or [])
                    + (r.get("other_skills") or []))
        decl_norm = {_norm_skill(s): s for s in declared if s}
        matched = [orig for n, orig in decl_norm.items() if n in req_norm]
        interest = interest_by_acct.get(acct)
        if not matched and not interest:
            continue  # neither skill-matched nor interested → not a candidate
        ts = task_stats.get(acct) or {}
        rs = rate_stats.get(str(acct)) or {}
        fs = final_stats.get(acct) or {}
        taken = int(ts.get("taken") or 0)
        done = int(ts.get("completed") or 0)
        avg_final = fs.get("avg_final")
        # Prefer the FINAL rating (mentor+QA); fall back to the mentor score.
        eff_rating = round(float(avg_final), 1) if avg_final else round(float(rs.get("avg_score") or 0), 1)
        rated = int(fs.get("rated_works") or 0) or int(rs.get("rated") or 0)
        full_name = f"{r.get('first_name', '') or ''} {r.get('last_name', '') or ''}".strip()
        items.append({
            "accountId": str(acct),
            "name": ((interest or {}).get("contributor_name") or full_name
                     or r.get("email") or f"Contributor {acct}"),
            "email": (interest or {}).get("contributor_email") or r.get("email"),
            "status": interest["status"] if interest else "matched",
            "interested": bool(interest),
            "interestedAt": _to_iso(interest["created_at"]) if interest else None,
            "declaredSkills": list(declared),
            "matchedSkills": matched,
            "matchCount": len(matched),
            "avgRating": eff_rating,
            "avgFinalRating": round(float(avg_final), 1) if avg_final else None,
            "ratingCount": rated,
            "tasksTaken": taken,          # accepted / taken on
            "tasksAccepted": taken,
            "completedTasks": done,       # completed successfully
            "acceptancePct": round(100 * done / taken) if taken else 0,
        })
    # Interested first (they raised their hand), then strongest skill match, then track record.
    items.sort(key=lambda x: (not x["interested"], -x["matchCount"], -x["avgRating"], -x["completedTasks"]))
    return {"items": items, "requiredSkills": list(req)}


@router.get("/plans/{plan_id}/tasks/{task_id}/timeline")
def task_timeline(
    plan_id: str,
    task_id: str,
    user: Annotated[dict, Depends(get_current_user)],
):
    """Lifecycle activity for a task (enterprise view): created → interest → sourced →
    submitted → reviewed → rated → completed. Statuses only — never the contributor's
    pay (the enterprise sees its budget, not contributor amounts)."""
    conn = _conn()
    events: list[dict] = []

    def add(at, kind: str, label: str, meta: dict | None = None) -> None:
        iso = _to_iso(at)
        if not iso:
            return
        events.append({"at": iso, "kind": kind, "label": label, "meta": meta or {}})

    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT created_at FROM decomp_tasks WHERE id=%s", [task_id])
        trow = cur.fetchone()
    if trow:
        add(trow.get("created_at"), "created", "Task created in the delivery plan")

    # Interest + sourcing
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT contributor_name, status, created_at, updated_at FROM task_interests "
                    "WHERE plan_id=%s AND task_id=%s ORDER BY created_at ASC", [plan_id, task_id])
        interests = cur.fetchall()
    raised = [i for i in interests if i.get("status") in ("interested", "selected")]
    if raised:
        first = raised[0]
        label = (f"{len(raised)} contributors expressed interest" if len(raised) > 1
                 else f"{first.get('contributor_name') or 'A contributor'} expressed interest")
        add(first.get("created_at"), "interest", label)
    selected = next((i for i in interests if i.get("status") == "selected"), None)
    if selected:
        add(selected.get("updated_at") or selected.get("created_at"), "assigned",
            f"Sourced to {selected.get('contributor_name') or 'a contributor'}")

    # Submissions (each version + its decision). submissions.task_definition_id can
    # be the contributor_tasks id rather than the canonical task id, so resolve both.
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT id FROM contributor_tasks "
                    "WHERE data->>'taskId'=%s OR data->>'canonicalTaskId'=%s",
                    [str(task_id), str(task_id)])
        refs = [str(task_id)] + [str(r["id"]) for r in cur.fetchall()]
        cur.execute("SELECT version, status, submitted_at, decided_at, decision_rationale "
                    "FROM submissions WHERE task_definition_id = ANY(%s) "
                    "AND status NOT IN ('cancelled','draft') AND submitted_at IS NOT NULL "
                    "ORDER BY version ASC, id ASC", [refs])
        subs = cur.fetchall()
    for s in subs:
        ver = s.get("version", 1)
        add(s.get("submitted_at"), "submitted", f"Contributor submitted v{ver}")
        st = (s.get("status") or "").lower()
        if s.get("decided_at"):
            if st in ("accepted", "approved"):
                add(s.get("decided_at"), "accepted", f"Submission v{ver} accepted")
            elif st == "rejected":
                add(s.get("decided_at"), "rejected", f"Submission v{ver} rejected")
            else:
                add(s.get("decided_at"), "revision", f"Revision requested on v{ver}",
                    {"note": s.get("decision_rationale")})

    # Fallback when no `submissions` rows are linked (common — the QA handoff carries
    # the activity instead): derive submitted / mentor-accepted / QA-decision events
    # from the reviewer_assignments tied to this task (by canonical or contributor id).
    if not subs:
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    "SELECT id, status, updated_at, data FROM reviewer_assignments "
                    "WHERE data->>'canonicalTaskId'=%s OR data->>'taskId'=%s "
                    "OR data->>'taskId' = ANY(%s) ORDER BY created_at ASC",
                    [str(task_id), str(task_id), refs])
                ras = cur.fetchall()
        except Exception:  # noqa: BLE001
            conn.rollback()
            ras = []
        seen_sub: set = set()
        for ra in ras:
            rd = ra.get("data") or {}
            sub_at = rd.get("submittedAt")
            if sub_at and sub_at not in seen_sub:
                seen_sub.add(sub_at)
                add(sub_at, "submitted", "Contributor submitted the deliverable")
            ma = rd.get("mentorAcceptedAt")
            if ma:
                mo = rd.get("mentorOverall")
                add(ma, "accepted", "Mentor accepted" + (f" · score {float(mo):.1f}/5" if mo else ""))
            st = (ra.get("status") or "").lower()
            qa_o = rd.get("qaRatingOverall") or rd.get("qaOverall")
            qa_suffix = f" · score {float(qa_o):.1f}/5" if qa_o else ""
            if st in ("approved", "accepted"):
                add(ra.get("updated_at"), "accepted", "QA accepted — forwarded to enterprise" + qa_suffix)
            elif st in ("rework", "changes_requested", "revision"):
                add(ra.get("updated_at"), "revision", "QA requested rework" + qa_suffix)
            elif st in ("rejected", "reject"):
                add(ra.get("updated_at"), "rejected", "QA rejected the submission" + qa_suffix)

    # Final quality rating (mentor + QA → final). Table created on first QA approval.
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT final_rating, mentor_overall, qa_overall, created_at "
                        "FROM work_ratings WHERE task_id=%s ORDER BY updated_at DESC NULLS LAST LIMIT 1",
                        [str(task_id)])
            wr = cur.fetchone()
    except Exception:  # noqa: BLE001
        conn.rollback()
        wr = None
    if wr and wr.get("final_rating") is not None:
        bits = []
        if wr.get("mentor_overall"):
            bits.append(f"mentor {float(wr['mentor_overall']):.1f}")
        if wr.get("qa_overall"):
            bits.append(f"QA {float(wr['qa_overall']):.1f}")
        suffix = f" ({' · '.join(bits)})" if bits else ""
        add(wr.get("created_at"), "rating",
            f"QA approved · quality rating {float(wr['final_rating']):.1f}/5{suffix}")

    # Payment — STATUS only, no contributor amount (enterprise sees budget, not pay).
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT status, eligible_at, paid_at FROM payouts "
                        "WHERE data->>'canonicalTaskId'=%s ORDER BY created_at DESC LIMIT 1",
                        [str(task_id)])
            po = cur.fetchone()
    except Exception:  # noqa: BLE001
        conn.rollback()
        po = None
    if po:
        add(po.get("eligible_at"), "payment", "Payment eligible · pending release")
        if (po.get("status") or "").lower() in ("paid", "sent", "released"):
            add(po.get("paid_at") or po.get("eligible_at"), "paid", "Payment released — task complete")

    # Latest contributor deliverable — links + cover note + evidence/docs — so the
    # enterprise can open and review the actual work (same package the mentor + QA saw).
    submission = None
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "SELECT status, updated_at, data FROM reviewer_assignments "
                "WHERE data->>'canonicalTaskId'=%s OR data->>'taskId'=%s OR data->>'taskId' = ANY(%s) "
                "ORDER BY created_at DESC LIMIT 1",
                [str(task_id), str(task_id), refs])
            ra = cur.fetchone()
        if ra:
            d = ra.get("data") or {}
            ev = d.get("evidence") or d.get("artifacts") or d.get("referenceFiles") or []
            submission = {
                "url": d.get("url") or d.get("githubUrl"),
                "githubUrl": d.get("githubUrl"),
                "coverNote": d.get("contributorCoverNote") or d.get("summary"),
                "reviewerNote": d.get("reviewerNote") or d.get("mentorNote"),
                "evidence": ev if isinstance(ev, list) else [],
                "submittedAt": d.get("submittedAt"),
                "round": d.get("round"),
                "contributorName": d.get("contributorName"),
            }
    except Exception:  # noqa: BLE001
        conn.rollback()
        submission = None

    events.sort(key=lambda e: e["at"])
    return {"items": events, "submission": submission}


def _ensure_interest_window_cols(cur) -> None:
    cur.execute("ALTER TABLE decomp_tasks ADD COLUMN IF NOT EXISTS interest_open_until TIMESTAMPTZ")
    cur.execute("ALTER TABLE decomp_tasks ADD COLUMN IF NOT EXISTS interest_published_at TIMESTAMPTZ")


def _matched_contributors(cur, req_norm: set) -> list:
    """Approved contributors whose declared skills overlap the task's required set."""
    if not req_norm:
        return []
    cur.execute(
        "SELECT la.id, la.email, la.first_name, la.last_name, "
        "       cp.primary_skills, cp.secondary_skills, cp.other_skills "
        "  FROM login_accounts la JOIN contributor_profiles cp ON cp.account_id = la.id "
        " WHERE la.role = 'contributor' AND COALESCE(la.approval_status,'approved') = 'approved'")
    out = []
    for r in cur.fetchall():
        declared = ((r.get("primary_skills") or []) + (r.get("secondary_skills") or [])
                    + (r.get("other_skills") or []))
        decl_norm = {_norm_skill(s) for s in declared if s}
        if decl_norm & req_norm:
            out.append({
                "account_id": r["id"], "email": r["email"],
                "name": (f"{r.get('first_name','') or ''} {r.get('last_name','') or ''}".strip() or r["email"]),
            })
    return out


@router.post("/plans/{plan_id}/tasks/{task_id}/publish")
def publish_task_for_interest(
    plan_id: str,
    task_id: str,
    user: Annotated[dict, Depends(get_current_user)],
    body: dict = Body(default={}),
):
    """Open a task for interest: notify every skill-matched contributor, set a
    window (durationHours + durationMinutes) after which interest collection
    closes (no auto-assign — the enterprise then picks from whoever's interested
    via Source). Duration can be any hours/minutes; clamped to [5min, 30 days]."""
    def _num(key: str) -> float:
        try:
            return float((body or {}).get(key) or 0)
        except (TypeError, ValueError):
            return 0.0
    hours = _num("durationHours") + _num("durationMinutes") / 60.0
    if hours <= 0:
        hours = 48.0
    hours = max(5.0 / 60.0, min(hours, 720.0))  # 5 minutes … 30 days

    conn = _conn()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT title, required_skills FROM decomp_tasks WHERE id=%s AND plan_id=%s",
                    [task_id, plan_id])
        t = cur.fetchone()
        if not t:
            raise HTTPException(status_code=404, detail="Task not found")
        req = _as_skill_list(t.get("required_skills"))
        req_norm = {_norm_skill(s) for s in req if s}
        _ensure_interest_window_cols(cur)
        closes = datetime.now(timezone.utc) + timedelta(hours=hours)
        cur.execute("UPDATE decomp_tasks SET interest_open_until=%s, interest_published_at=now(), "
                    "updated_at=now() WHERE id=%s", [closes, task_id])
        matched = _matched_contributors(cur, req_norm)
        title_t = t.get("title") or "New task"
        for m in matched:
            cur.execute(
                "INSERT INTO contributor_notifications (account_id, kind, title, body, data) "
                "VALUES (%s,'opportunity',%s,%s,%s)",
                (m["account_id"], "New opportunity matched to your skills",
                 f"{title_t} — show interest before it closes",
                 Json({"taskId": task_id, "planId": plan_id, "closesAt": closes.isoformat(),
                       "requiredSkills": req})))
    conn.commit()
    write_audit(actor_id=user.get("id"), actor_email=user.get("email"), actor_role=user.get("role"),
                action="decomposition.task.publish_interest", service="enterprise-service",
                target="decomp_tasks", target_id=task_id,
                extra={"matched": len(matched), "closesAt": closes.isoformat()})
    return {"matched": len(matched), "notified": len(matched),
            "closesAt": closes.isoformat(), "requiredSkills": list(req)}


@router.get("/plans/{plan_id}/tasks/{task_id}/interest-status")
def task_interest_status(
    plan_id: str,
    task_id: str,
    user: Annotated[dict, Depends(get_current_user)],
):
    """Live status for the publish-for-interest tile: how many contributors match
    by skill, how many have shown interest, and when the window closes."""
    conn = _conn()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        _ensure_interest_window_cols(cur)
        cur.execute("SELECT required_skills, interest_open_until FROM decomp_tasks "
                    "WHERE id=%s AND plan_id=%s", [task_id, plan_id])
        t = cur.fetchone()
        if not t:
            raise HTTPException(status_code=404, detail="Task not found")
        req = _as_skill_list(t.get("required_skills"))
        req_norm = {_norm_skill(s) for s in req if s}
        matched = len(_matched_contributors(cur, req_norm))
        cur.execute("SELECT COUNT(*) AS n FROM task_interests WHERE plan_id=%s AND task_id=%s "
                    "AND status IN ('interested','selected')", [plan_id, task_id])
        interested = int((cur.fetchone() or {}).get("n") or 0)
    closes = t.get("interest_open_until")
    open_now = bool(closes) and closes > datetime.now(timezone.utc)
    return {"matched": matched, "interested": interested,
            "closesAt": _to_iso(closes), "published": closes is not None, "open": open_now}


@router.post("/plans/{plan_id}/tasks/{task_id}/select")
def select_task_contributor(
    plan_id: str,
    task_id: str,
    user: Annotated[dict, Depends(get_current_user)],
    body: dict = Body(default={}),
):
    """Pick ONE interested contributor → create the contributor assignment
    (priced reward + deadline + required skills), mark the others not-selected,
    and close the task. Mirrors the direct-assign path but sourced from interest."""
    from shared.deadlines import compute_due_at

    raw = (body or {}).get("accountId") or (body or {}).get("contributorId")
    try:
        acct = int(raw)
    except (TypeError, ValueError):
        raise HTTPException(status_code=422, detail="accountId is required")

    conn = _conn()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            "SELECT title, description, acceptance_criteria, required_skills, estimated_hours, "
            "contributor_amount_minor, pay_currency, status, attachments FROM decomp_tasks WHERE id = %s AND plan_id = %s",
            [task_id, plan_id])
        t = cur.fetchone()
    if not t:
        raise HTTPException(status_code=404, detail="Task not found")
    cur_status = (t.get("status") or "").lower()
    # 'declined' is sourceable again (re-assign after a contributor decline).
    if cur_status not in ("ready", "available", "priced", "approved", "declined"):
        raise HTTPException(status_code=400, detail=f"Task is '{cur_status}', not open for sourcing")

    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT sow_id FROM decomp_plans WHERE id = %s", [plan_id])
        sow_id = (cur.fetchone() or {}).get("sow_id")
        cur.execute("SELECT email FROM login_accounts WHERE id = %s", [acct])
        acc_email = (cur.fetchone() or {}).get("email")

    req = _as_skill_list(t.get("required_skills"))
    reward = (float(t["contributor_amount_minor"]) / 100.0) if t.get("contributor_amount_minor") else None
    currency = t.get("pay_currency") or "INR"
    est = t.get("estimated_hours")
    due_at = compute_due_at(estimated_hours=est, override=(body or {}).get("dueAt"))

    with conn.cursor() as cur:
        cur.execute(
            """INSERT INTO contributor_tasks
                 (account_id, title, status, priority, category, reward, currency, due_at, data)
               VALUES (%s,%s,'assigned','normal','delivery',%s,%s,%s,%s)""",
            [acct, t.get("title") or "Task", reward, currency, due_at,
             Json({"taskId": task_id, "planId": plan_id, "sowId": sow_id,
                   "dueAt": due_at.isoformat(),
                   "estimatedHours": float(est) if est else None,
                   "skills_required": list(req), "sourcedFromInterest": True,
                   # Carry the brief so the contributor knows what to build.
                   "description": t.get("description"),
                   "acceptanceCriteria": t.get("acceptance_criteria"),
                   # Enterprise's reference files so the contributor can download them.
                   "referenceFiles": t.get("attachments") or []})])
        cur.execute("UPDATE decomp_tasks SET status='assigned', updated_at=now() WHERE id = %s", [task_id])
        cur.execute(
            "UPDATE task_interests SET status='selected', updated_at=now() "
            "WHERE plan_id=%s AND task_id=%s AND account_id=%s", [plan_id, task_id, acct])
        cur.execute(
            "UPDATE task_interests SET status='rejected', updated_at=now() "
            "WHERE plan_id=%s AND task_id=%s AND account_id<>%s AND status='interested'",
            [plan_id, task_id, acct])
    conn.commit()
    try:
        from shared.notify import create_notification
        create_notification(
            acct, category="action", kind="task.assigned", severity="important",
            title="New task assigned to you",
            body=f"You've been sourced for “{t.get('title') or 'a task'}”. Accept it to start.",
            resource_type="task", resource_id=task_id,
            action_url="/contributor/tasks", action_label="View task")
    except Exception:  # noqa: BLE001
        pass
    _audit(user, "decomposition.task.select", plan_id,
           extra={"taskId": task_id, "accountId": str(acct)})
    return {"ok": True, "taskId": task_id, "accountId": str(acct), "email": acc_email,
            "reward": reward, "currency": currency, "dueAt": due_at.isoformat()}


# ── POST /plans/{plan_id}/approve ─────────────────────────────────────────────


@router.post("/plans/{plan_id}/submit")
def submit_plan(
    plan_id: str,
    user: Annotated[dict, Depends(get_current_user)],
):
    """Enterprise submits a draft plan to Glimmora (super admin) for pricing +
    approval. draft → submitted. Submitting IS the enterprise sign-off."""
    row = _get_plan_row(plan_id)
    if not row:
        raise HTTPException(status_code=404, detail="Plan not found")
    if row["status"] != "draft":
        raise HTTPException(status_code=400, detail=f"Cannot submit a plan in '{row['status']}' state")
    conn = _conn()
    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM decomp_tasks WHERE plan_id = %s", [plan_id])
        if cur.fetchone()[0] == 0:
            raise HTTPException(status_code=400, detail="Cannot submit an empty plan — add at least one task")
        cur.execute(
            "UPDATE decomp_plans SET status='submitted', revision_note=NULL, updated_at=now() WHERE id=%s",
            [plan_id],
        )
    conn.commit()
    # Notify Glimmora (super-admins) that a decomposition is ready to price.
    try:
        from shared.notify import notify_role
        notify_role(
            ["superadmin", "super_admin", "admin"],
            category="action", kind="decomposition.submitted", severity="important",
            title="Decomposition ready to price",
            body="An enterprise submitted a task decomposition and is waiting for Glimmora pricing.",
            resource_type="plan", resource_id=plan_id,
            action_url="/admin/decomposition", action_label="Price it")
    except Exception:  # noqa: BLE001
        pass
    _audit(user, "decomposition.plan.submit", plan_id, extra={"sowId": row["sow_id"]})
    return {"plan": _get_plan_detail(plan_id)}


# ── POST /plans/{plan_id}/send-back ───────────────────────────────────────────


@router.post("/plans/{plan_id}/send-back")
def send_back_plan(
    plan_id: str,
    user: Annotated[dict, Depends(get_current_user)],
    body: dict = Body(default={}),
):
    """Super admin returns a submitted plan to the enterprise/PMO for revision
    (with feedback). submitted → draft (+ revision_note)."""
    if not _is_superadmin(user):
        raise HTTPException(status_code=403, detail="Only the super admin can send a plan back")
    row = _get_plan_row(plan_id)
    if not row:
        raise HTTPException(status_code=404, detail="Plan not found")
    if row["status"] not in ("submitted", "approved", "active"):
        raise HTTPException(status_code=400, detail=f"Cannot send back a plan in '{row['status']}' state")
    note = (body.get("comment") or body.get("note") or "").strip() or None
    conn = _conn()
    with conn.cursor() as cur:
        cur.execute(
            "UPDATE decomp_plans SET status='draft', revision_note=%s, updated_at=now() WHERE id=%s",
            [note, plan_id],
        )
    conn.commit()
    _audit(user, "decomposition.plan.send_back", plan_id, extra={"sowId": row["sow_id"], "note": note})
    return {"plan": _get_plan_detail(plan_id)}


# ── POST /plans/{plan_id}/approve ─────────────────────────────────────────────


# Once a contributor is ASSIGNED, the contributor pay is LOCKED — Glimmora can no
# longer change it (fair-contract rule). A re-price that tries to change a task in
# any of these states is rejected.
_PRICE_LOCKED_STATUSES = {
    "assigned", "in_progress", "submitted", "req_check_pending", "req_check_failed",
    "qa_review_pending", "qa_review_failed", "payment_pending", "paid",
}


def _apply_pricing(conn, plan_id: str, pricing: list, currency: str, priced_by: str) -> None:
    """Apply per-task contributor pay (fixed or hourly) to a plan's tasks. Validates
    that every task is priced. Shared by approve + reprice. Caller commits.
    Once a task is ASSIGNED its price is locked — a re-price that changes it is rejected."""
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT id, estimated_hours, status, contributor_amount_minor FROM decomp_tasks WHERE plan_id=%s", [plan_id])
        task_rows = {r["id"]: r for r in cur.fetchall()}
    if not task_rows:
        raise HTTPException(status_code=400, detail="Cannot price an empty plan — add at least one task")
    priced_ids = {p.get("taskId") for p in (pricing or [])}
    missing = [tid for tid in task_rows if tid not in priced_ids]
    if missing:
        raise HTTPException(status_code=400, detail=f"All tasks must be priced ({len(missing)} unpriced)")
    with conn.cursor() as cur:
        for p in (pricing or []):
            tid = p.get("taskId")
            if tid not in task_rows:
                continue
            _tr = task_rows[tid]
            # Proposed new contributor amount (both pay modes) for the lock check.
            if (p.get("payType") or "fixed").lower() == "hourly":
                _new_amt = int(round(int(p.get("rateMinor") or 0) * float(_tr.get("estimated_hours") or 0)))
            else:
                _new_amt = int(p.get("amountMinor") or 0)
            # Price LOCKS once a contributor is assigned — Glimmora can no longer
            # change it. Reject an actual change; an unchanged resubmit is a no-op.
            if (_tr.get("status") or "").lower() in _PRICE_LOCKED_STATUSES:
                if _new_amt != (_tr.get("contributor_amount_minor") or 0):
                    raise HTTPException(
                        status_code=409,
                        detail="This task is already assigned to a contributor — its price is locked and can no longer be changed.",
                    )
                continue
            if (p.get("payType") or "fixed").lower() == "hourly":
                rate = int(p.get("rateMinor") or 0)
                hours = float(task_rows[tid].get("estimated_hours") or 0)
                cur.execute(
                    """UPDATE decomp_tasks SET pay_type='hourly', pay_rate_minor=%s,
                       contributor_amount_minor=%s, pay_currency=%s, priced_at=now(), priced_by=%s,
                       updated_at=now() WHERE id=%s AND plan_id=%s""",
                    [rate, int(round(rate * hours)), currency, priced_by, tid, plan_id],
                )
            else:
                cur.execute(
                    """UPDATE decomp_tasks SET pay_type='fixed', pay_rate_minor=NULL,
                       contributor_amount_minor=%s, pay_currency=%s, priced_at=now(), priced_by=%s,
                       updated_at=now() WHERE id=%s AND plan_id=%s""",
                    [int(p.get("amountMinor") or 0), currency, priced_by, tid, plan_id],
                )


@router.post("/plans/{plan_id}/approve")
def approve_plan(
    plan_id: str,
    user: Annotated[dict, Depends(get_current_user)],
    body: dict = Body(default={}),
):
    """Super admin prices the contributor work per task and approves — provisioning
    delivery. submitted → active (tasks → ready). ONLY the super admin may price;
    the amounts are never exposed to the enterprise/mentor/reviewer."""
    if not _is_superadmin(user):
        raise HTTPException(status_code=403, detail="Only the super admin (Glimmora) can price + approve a plan")
    row = _get_plan_row(plan_id)
    if not row:
        raise HTTPException(status_code=404, detail="Plan not found")
    if row["status"] != "submitted":
        raise HTTPException(status_code=400, detail=f"Plan must be submitted for approval (is '{row['status']}')")

    conn = _conn()
    priced_by = user.get("id") or user.get("email") or "superadmin"
    _apply_pricing(conn, plan_id, body.get("pricing") or [], (body.get("currency") or "INR").upper(), priced_by)
    with conn.cursor() as cur:
        cur.execute(
            """UPDATE decomp_plans SET status='active', approved_at=now(), approved_by=%s,
               activated_at=now(), revision_note=NULL, updated_at=now() WHERE id=%s""",
            [priced_by, plan_id],
        )
        cur.execute(
            "UPDATE decomp_tasks SET status='ready', updated_at=now() WHERE plan_id=%s AND status='draft'",
            [plan_id],
        )
    conn.commit()

    plan = _get_plan_detail(plan_id, include_pricing=True)
    _audit(user, "decomposition.plan.approve", plan_id, extra={
        "sowId": row["sow_id"],
        "taskCount": len(plan.get("tasks", [])) if plan else 0,
        "totalContributorMinor": sum((t.get("contributorAmountMinor") or 0) for t in (plan.get("tasks") or [])),
    })
    return {"plan": plan}


# ══════════════════════════════════════════════════════════════════════════════
# 3-PARTY PAYOUT (Enterprise → Glimmora → Contributor), tracked per delivered task
# under the SOW. The payouts row status carries the lifecycle:
#   eligible (QA-accepted) → requested (Glimmora asks enterprise)
#   → released (enterprise sends budget) → paid (Glimmora disburses to contributor).
# All state persists in the shared `payouts` table — no mock.
# ══════════════════════════════════════════════════════════════════════════════

def _plan_task_ids(cur, plan_id: str) -> list[str]:
    cur.execute("SELECT id FROM decomp_tasks WHERE plan_id=%s", [plan_id])
    # Works for both tuple and RealDict cursors.
    return [(r["id"] if isinstance(r, dict) else r[0]) for r in cur.fetchall()]


def _payment_phase(total: int, delivered: int, paid: int, pay_counts: dict) -> str:
    """SOW-level payment phase from task delivery + payout statuses."""
    if total and paid >= total and pay_counts and pay_counts.get("paid", 0) >= sum(pay_counts.values()):
        return "payment_completed"
    if pay_counts.get("released") or pay_counts.get("requested") or pay_counts.get("eligible"):
        return "pending_payment"
    if total and delivered >= total:
        return "completed_sow"
    return "in_progress"


@router.get("/plans/{plan_id}/payout-status")
def plan_payout_status(plan_id: str, user: Annotated[dict, Depends(get_current_user)]):
    """Delivery progress + payment status for a plan/SOW. Read by Glimmora pricing
    (progress bar + buckets) AND the enterprise billing page. The enterprise caller
    only ever gets the budget (clientMinor) totals — never contributor pay/margin."""
    row = _get_plan_row(plan_id)
    if not row:
        raise HTTPException(status_code=404, detail="Plan not found")
    is_sa = _is_superadmin(user)
    conn = _conn()
    from psycopg2.extras import RealDictCursor as _RDC
    task_rows: list = []
    payout_by_task: dict = {}
    with conn.cursor(cursor_factory=_RDC) as cur:
        # per-task delivery status (the canonical source for the Glimmora task list).
        cur.execute('SELECT id, title, status FROM decomp_tasks WHERE plan_id=%s ORDER BY "order" ASC', [plan_id])
        task_rows = cur.fetchall()
        by_status: dict = {}
        for t in task_rows:
            by_status[t["status"]] = by_status.get(t["status"], 0) + 1
        total = len(task_rows)
        delivered = by_status.get("payment_pending", 0) + by_status.get("paid", 0)
        paid_tasks = by_status.get("paid", 0)
        ids = [t["id"] for t in task_rows]
        pay_counts, client_total, net_total = {}, 0, 0
        if ids:
            # The LATEST payout per task drives everything — the per-task row AND the
            # rollups (counts / budget). Counting every payout row would let stale or
            # reversed rows inflate the phase denominator and double-count the budget.
            cur.execute(
                "SELECT DISTINCT ON (data->>'canonicalTaskId') data->>'canonicalTaskId' ctid, status, "
                "(data->>'clientMinor')::bigint client, (data->>'netMinor')::bigint net "
                "FROM payouts WHERE data->>'canonicalTaskId' = ANY(%s) "
                "ORDER BY data->>'canonicalTaskId', created_at DESC", [ids])
            for r in cur.fetchall():
                payout_by_task[r["ctid"]] = r
                pay_counts[r["status"]] = pay_counts.get(r["status"], 0) + 1
                client_total += int(r["client"] or 0); net_total += int(r["net"] or 0)
    phase = _payment_phase(total, delivered, paid_tasks, pay_counts)
    # Per-task rows — delivery status + payout status + (Glimmora-only) net amount.
    tasks = []
    for t in task_rows:
        po = payout_by_task.get(t["id"])
        item = {
            "taskId": t["id"], "title": t.get("title"),
            "deliveryStatus": t["status"],                 # ready/assigned/.../payment_pending/paid
            "delivered": t["status"] in ("payment_pending", "paid"),
            "payoutStatus": (po or {}).get("status"),       # eligible/requested/released/paid/None
            "budgetMinor": int((po or {}).get("client") or 0),
        }
        if is_sa:
            item["netMinor"] = int((po or {}).get("net") or 0)
        tasks.append(item)
    # The SOW's agreed/default budget the enterprise committed at creation — the
    # reference the enterprise bills against (its own number, enterprise-safe).
    sow_budget_minor = 0
    _sid = row.get("sow_id")
    if _sid:
        with conn.cursor(cursor_factory=_RDC) as cur2:
            cur2.execute("SELECT data->>'budgetAmount' ba FROM enterprise_sows WHERE id=%s", [_sid])
            _br = cur2.fetchone()
            if _br and _br.get("ba"):
                try:
                    sow_budget_minor = int(round(float(_br["ba"]) * 100))
                except (TypeError, ValueError):
                    sow_budget_minor = 0
    out = {
        "planId": plan_id, "sowId": row.get("sow_id"),
        "totalTasks": total, "deliveredTasks": delivered, "paidTasks": paid_tasks,
        "progressPct": round(100 * delivered / total) if total else 0,
        "paymentPhase": phase,
        "payoutCounts": pay_counts,
        "sowBudgetMinor": sow_budget_minor,  # agreed SOW budget (enterprise's own figure)
        "budgetMinor": client_total,   # billed/actual (client price) — safe to show enterprise
        "tasks": tasks,
    }
    # SOW escrow — budget the enterprise pre-funded/released into Glimmora and how
    # much has been drawn down to pay contributors (enterprise-safe — its own budget).
    with conn.cursor(cursor_factory=_RDC) as cur_e:
        out["escrow"] = _escrow_balance(cur_e, plan_id)
        # Remaining payable = released by enterprise − already paid (escrow remaining
        # + per-task 'released' budgets). The ceiling on what Glimmora may disburse;
        # surfaced so the UI can show it + gate the per-task Pay buttons.
        out["payableMinor"] = _payable_minor(cur_e, plan_id, ids)
    if is_sa:
        out["contributorNetMinor"] = net_total   # Glimmora-only
    return out


@router.get("/plans/{plan_id}/payment-transactions")
def plan_payment_transactions(plan_id: str, user: Annotated[dict, Depends(get_current_user)]):
    """Enterprise payment history for a SOW — one transaction per budget release the
    enterprise made (reconstructed from the released payouts, grouped by release time).
    Amounts are the enterprise's own budget (client price) — never contributor pay."""
    import hashlib
    row = _get_plan_row(plan_id)
    if not row:
        raise HTTPException(status_code=404, detail="Plan not found")
    is_sa = _is_superadmin(user)
    conn = _conn()
    from psycopg2.extras import RealDictCursor as _RDC
    txns: list = []
    with conn.cursor(cursor_factory=_RDC) as cur:
        cur.execute("SELECT id FROM decomp_tasks WHERE plan_id=%s", [plan_id])
        ids = [r["id"] for r in cur.fetchall()]
        if ids:
            cur.execute(
                "SELECT data->>'releasedAt' rel, max(data->>'releasedBy') relby, "
                "max(data->>'releaseComment') cmt, COUNT(*) n, "
                "COALESCE(SUM((data->>'clientMinor')::bigint),0) amt, bool_or(status='paid') paid, "
                "json_agg(json_build_object('title', task_title, "
                "  'amountMinor', COALESCE((data->>'clientMinor')::bigint,0))) tasks "
                "FROM payouts WHERE data->>'canonicalTaskId' = ANY(%s) AND data->>'releasedAt' IS NOT NULL "
                "GROUP BY data->>'releasedAt' ORDER BY data->>'releasedAt' DESC", [ids])
            for r in cur.fetchall():
                rel = r["rel"] or ""
                txns.append({
                    "ref": "TXN-" + hashlib.md5(rel.encode()).hexdigest()[:8].upper(),
                    "at": rel,
                    "amountMinor": int(r["amt"] or 0),
                    "taskCount": int(r["n"]),
                    "tasks": (r["tasks"] or []) if is_sa else [],  # per-task breakdown is Glimmora-only
                    "by": r["relby"],
                    "comment": r["cmt"],
                    "status": "settled" if r["paid"] else "released",
                    "method": "Budget release · simulated",
                })
    return {"planId": plan_id, "sowId": row.get("sow_id"), "transactions": txns,
            "totalMinor": sum(t["amountMinor"] for t in txns)}


@router.post("/plans/{plan_id}/request-payout")
def request_payout(plan_id: str, user: Annotated[dict, Depends(get_current_user)],
                   body: dict = Body(default={})):
    """Glimmora asks the enterprise to release the budget for DELIVERED tasks:
    eligible → requested.

    Scope options (body):
      - {taskId}        → just that task
      - {} (no body)    → every eligible task (the full completed amount)
      - {amountMinor}   → a custom/partial amount: requests whole eligible tasks
                          (oldest first) up to that amount — a task's budget is atomic.
    Used by the presets (completed tasks / remaining / total / custom)."""
    if not _is_superadmin(user):
        raise HTTPException(status_code=403, detail="Only Glimmora (super admin) can request payout")
    row = _get_plan_row(plan_id)
    if not row:
        raise HTTPException(status_code=404, detail="Plan not found")
    task_id = (body or {}).get("taskId")
    cap_raw = (body or {}).get("amountMinor")
    try:
        amount_cap = int(cap_raw) if cap_raw is not None else None
    except (TypeError, ValueError):
        amount_cap = None
    conn = _conn()
    from psycopg2.extras import RealDictCursor as _RDC
    n = 0
    with conn.cursor(cursor_factory=_RDC) as cur:
        ids = [task_id] if task_id else _plan_task_ids(cur, plan_id)
        target_ids: list = []
        if ids and amount_cap is None:
            # All eligible (optionally scoped to a single task).
            cur.execute("SELECT id FROM payouts WHERE data->>'canonicalTaskId' = ANY(%s) AND status='eligible'", [ids])
            target_ids = [r["id"] for r in cur.fetchall()]
        elif ids:
            # Custom/partial — fill whole eligible tasks (oldest first) up to the cap.
            cur.execute("SELECT id, COALESCE((data->>'clientMinor')::bigint,0) cm FROM payouts "
                        "WHERE data->>'canonicalTaskId' = ANY(%s) AND status='eligible' ORDER BY created_at ASC", [ids])
            running = 0
            for r in cur.fetchall():
                cm = int(r["cm"] or 0)
                if running + cm <= amount_cap:
                    target_ids.append(r["id"]); running += cm
        if target_ids:
            cur.execute(
                "UPDATE payouts SET status='requested', "
                "data = data || jsonb_build_object('requestedAt', now()::text), updated_at=now() "
                "WHERE id = ANY(%s) RETURNING id", [target_ids])
            n = cur.rowcount
    conn.commit()
    # Notify the enterprise (plan owner) that Glimmora requested a budget release.
    if n > 0:
        try:
            from shared.notify import create_notification
            create_notification(
                row.get("created_by"), category="payment", kind="payout.requested", severity="important",
                title="Payment requested by Glimmora",
                body=f"Glimmora requested a budget release for {n} delivered task{'s' if n != 1 else ''}. "
                     "Review and release on the Billing page.",
                resource_type="plan", resource_id=plan_id,
                action_url="/enterprise/billing", action_label="Review & release")
        except Exception:  # noqa: BLE001
            pass
    _audit(user, "payout.request", plan_id,
           extra={"sowId": row.get("sow_id"), "requested": n, "taskId": task_id, "amountMinor": amount_cap})
    return {"requested": n, "status": plan_payout_status(plan_id, user)}


@router.post("/plans/{plan_id}/release-payment")
def release_payment(plan_id: str, user: Annotated[dict, Depends(get_current_user)],
                    body: dict = Body(default={})):
    """Enterprise releases (sends) the budget to Glimmora for requested tasks:
    requested → released. The enterprise never sees contributor pay — only its budget.

    Pay the whole SOW (no body) OR a partial/manual amount ({amountMinor}). A partial
    release pays whole delivered tasks (oldest first) up to the amount — a task's
    budget is atomic (Glimmora can't pay a contributor a fraction of a task)."""
    if _is_superadmin(user):
        raise HTTPException(status_code=403, detail="The enterprise releases the budget, not Glimmora")
    row = _get_plan_row(plan_id)
    if not row:
        raise HTTPException(status_code=404, detail="Plan not found")
    cap_raw = (body or {}).get("amountMinor")
    try:
        amount_cap = int(cap_raw) if cap_raw is not None else None
    except (TypeError, ValueError):
        amount_cap = None
    comment = (body or {}).get("comment") or None
    actor = str(user.get("email") or user.get("id"))
    conn = _conn()
    from psycopg2.extras import RealDictCursor as _RDC
    n, released_minor = 0, 0
    with conn.cursor(cursor_factory=_RDC) as cur:
        ids = _plan_task_ids(cur, plan_id)
        target_ids: list = []
        if ids and amount_cap is None:
            # Full SOW — every requested task.
            cur.execute("SELECT id FROM payouts WHERE data->>'canonicalTaskId' = ANY(%s) AND status='requested'", [ids])
            target_ids = [r["id"] for r in cur.fetchall()]
        elif ids:
            # Partial — fill whole tasks (oldest first) up to the cap.
            cur.execute("SELECT id, COALESCE((data->>'clientMinor')::bigint,0) cm FROM payouts "
                        "WHERE data->>'canonicalTaskId' = ANY(%s) AND status='requested' ORDER BY created_at ASC", [ids])
            running = 0
            for r in cur.fetchall():
                cm = int(r["cm"] or 0)
                if running + cm <= amount_cap:
                    target_ids.append(r["id"]); running += cm
        if target_ids:
            cur.execute(
                "UPDATE payouts SET status='released', "
                "data = data || jsonb_build_object('releasedAt', now()::text, 'releasedBy', %s, "
                "'releaseComment', %s::text), updated_at=now() "
                "WHERE id = ANY(%s) RETURNING COALESCE((data->>'clientMinor')::bigint,0) cm", [actor, comment, target_ids])
            rows = cur.fetchall(); n = len(rows)
            released_minor = sum(int(r["cm"] or 0) for r in rows)
    conn.commit()
    _audit(user, "payout.release", plan_id, extra={"sowId": row.get("sow_id"), "released": n,
                                                   "budgetMinor": released_minor, "amountCap": amount_cap})
    return {"released": n, "budgetMinor": released_minor, "status": plan_payout_status(plan_id, user)}


# ─────────────────────── SOW pre-funding / escrow ───────────────────────
# The enterprise can release its SOW budget to Glimmora UP FRONT — full or a
# partial amount — once the work is priced, WITHOUT waiting for task delivery.
# The released money sits in a SOW escrow; Glimmora draws contributor payouts
# from it as work completes (see payout_contributors). Enterprise only ever
# sees its own budget — never contributor pay.

_escrow_ready = False


def _ensure_escrow_schema() -> None:
    global _escrow_ready
    if _escrow_ready:
        return
    conn = _conn()
    with conn.cursor() as cur:
        cur.execute(
            """CREATE TABLE IF NOT EXISTS sow_escrows (
                 plan_id      TEXT PRIMARY KEY,
                 sow_id       TEXT,
                 currency     TEXT   NOT NULL DEFAULT 'INR',
                 funded_minor BIGINT NOT NULL DEFAULT 0,
                 spent_minor  BIGINT NOT NULL DEFAULT 0,
                 data         JSONB  NOT NULL DEFAULT '{}',
                 created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
                 updated_at   TIMESTAMPTZ NOT NULL DEFAULT now())""")
    conn.commit()
    _escrow_ready = True


def _sow_budget_minor_for(cur, sow_id: str | None) -> int:
    if not sow_id:
        return 0
    cur.execute("SELECT data->>'budgetAmount' ba FROM enterprise_sows WHERE id=%s", [sow_id])
    r = cur.fetchone()
    if r and (r.get("ba") if isinstance(r, dict) else r[0]):
        try:
            return int(round(float(r["ba"] if isinstance(r, dict) else r[0]) * 100))
        except (TypeError, ValueError):
            return 0
    return 0


def _escrow_balance(cur, plan_id: str) -> dict:
    try:
        cur.execute("SELECT funded_minor, spent_minor, currency FROM sow_escrows WHERE plan_id=%s", [plan_id])
        r = cur.fetchone()
    except Exception:  # noqa: BLE001 — table not created yet
        r = None
    if not r:
        return {"fundedMinor": 0, "spentMinor": 0, "remainingMinor": 0, "currency": "INR"}
    f = int(r["funded_minor"] or 0)
    s = int(r["spent_minor"] or 0)
    return {"fundedMinor": f, "spentMinor": s, "remainingMinor": f - s, "currency": r.get("currency") or "INR"}


# ── Disbursal: TEST (simulated) vs real RazorpayX + fund-released gating ───────
# TEST mode (no RAZORPAY_KEY_ID env) runs the REAL state machine + transaction
# links but moves no real money (external_ref='SIM-<id>'). `_razorpay_live()` is
# the single toggle a future RazorpayX integration flips.

def _razorpay_live() -> bool:
    import os as _os
    return bool(_os.environ.get("RAZORPAY_KEY_ID", "").strip())


def _payable_minor(cur, plan_id: str, task_ids: list[str]) -> int:
    """How much Glimmora may STILL disburse to contributors for this SOW =
    what the enterprise has released MINUS what's already been paid out. NEVER
    let a disburse exceed this — we can't pay out more than the enterprise funded.

    payable = escrow.remaining (pre-funded, undrawn)
            + Σ client price of per-task 'released' (sent, not yet paid) payouts.
    Both sources are budget the enterprise has committed; paid rows are excluded
    (their escrow draw is already counted in spent_minor)."""
    bal = _escrow_balance(cur, plan_id)
    payable = int(bal["remainingMinor"] or 0)
    if task_ids:
        cur.execute(
            "SELECT COALESCE(SUM(COALESCE((data->>'clientMinor')::bigint,0)),0) rel "
            "FROM payouts WHERE data->>'canonicalTaskId' = ANY(%s) AND status='released'",
            [task_ids])
        r = cur.fetchone()
        payable += int((r["rel"] if isinstance(r, dict) else r[0]) or 0)
    return max(0, payable)


def _resolve_payout_method(cur, account_id) -> dict | None:
    """Contributor's default (or first) saved bank/UPI method — read at disburse so
    the (future) real RazorpayX call has a destination. None if they saved none."""
    if account_id in (None, ""):
        return None
    try:
        cur.execute(
            "SELECT id, type, label, is_default FROM payout_methods WHERE account_id=%s "
            "ORDER BY is_default DESC, verified_at DESC NULLS LAST, created_at ASC LIMIT 1",
            [account_id])
        r = cur.fetchone()
        return dict(r) if r else None
    except Exception:  # noqa: BLE001 — table not created in this env
        return None


def _contributor_contact(cur, account_id) -> dict:
    """Email + display name for a contributor account (for the payout email)."""
    try:
        cur.execute("SELECT email, first_name, last_name FROM login_accounts WHERE id=%s", [account_id])
        r = cur.fetchone()
        if not r:
            return {}
        r = dict(r)
        name = f"{r.get('first_name') or ''} {r.get('last_name') or ''}".strip()
        return {"email": r.get("email"), "name": name or r.get("email")}
    except Exception:  # noqa: BLE001
        return {}


@router.post("/plans/{plan_id}/fund-escrow")
def fund_escrow(plan_id: str, user: Annotated[dict, Depends(get_current_user)],
                body: dict = Body(default={})):
    """Enterprise pre-funds (releases) its SOW budget to Glimmora — full SOW
    (no amount) OR a partial amount ({amountMinor}) — once the work is priced.
    The released amount is held in the SOW escrow; Glimmora pays contributors
    from it as tasks complete. Can't over-fund past the agreed SOW budget."""
    if _is_superadmin(user):
        raise HTTPException(status_code=403, detail="The enterprise releases the budget, not Glimmora")
    row = _get_plan_row(plan_id)
    if not row:
        raise HTTPException(status_code=404, detail="Plan not found")
    _ensure_escrow_schema()
    from psycopg2.extras import RealDictCursor as _RDC, Json as _Json
    cap_raw = (body or {}).get("amountMinor")
    comment = (body or {}).get("comment") or None
    actor = str(user.get("email") or user.get("id"))
    conn = _conn()
    with conn.cursor(cursor_factory=_RDC) as cur:
        sow_id = row.get("sow_id")
        budget = _sow_budget_minor_for(cur, sow_id)
        bal = _escrow_balance(cur, plan_id)
        remaining_to_fund = max(0, budget - bal["fundedMinor"])
        try:
            amt = int(cap_raw) if cap_raw is not None else remaining_to_fund
        except (TypeError, ValueError):
            amt = remaining_to_fund
        amt = max(0, min(amt, remaining_to_fund))
        if amt <= 0:
            raise HTTPException(status_code=400,
                                detail="Nothing left to release — the SOW budget is already fully funded.")
        cur.execute(
            "INSERT INTO sow_escrows (plan_id, sow_id, funded_minor, data) VALUES (%s,%s,%s,%s) "
            "ON CONFLICT (plan_id) DO UPDATE SET "
            "  funded_minor = sow_escrows.funded_minor + EXCLUDED.funded_minor, "
            "  sow_id = COALESCE(sow_escrows.sow_id, EXCLUDED.sow_id), updated_at=now()",
            [plan_id, sow_id, amt, _Json({"lastReleaseBy": actor, "lastReleaseComment": comment})])
        conn.commit()
        bal_after = _escrow_balance(cur, plan_id)
    try:  # tell Glimmora funds are available to disburse
        from shared.notify import notify_role
        notify_role("superadmin", category="payment", kind="escrow.funded", severity="important",
                    title="SOW funds released",
                    body=f"The enterprise released ₹{amt/100:,.0f} into the SOW escrow. "
                         "Available to pay contributors as work completes.",
                    resource_type="plan", resource_id=plan_id,
                    action_url="/admin/decomposition", action_label="View funds")
    except Exception:  # noqa: BLE001
        pass
    _audit(user, "escrow.fund", plan_id,
           extra={"sowId": row.get("sow_id"), "amountMinor": amt, "comment": comment})
    return {"fundedMinor": amt, "escrow": bal_after, "status": plan_payout_status(plan_id, user)}


@router.post("/plans/{plan_id}/request-topup")
def request_topup(plan_id: str, user: Annotated[dict, Depends(get_current_user)],
                  body: dict = Body(default={})):
    """Glimmora asks the enterprise to top up the SOW escrow (release more budget)
    when the pre-funded balance is running low and there's delivered work to pay."""
    if not _is_superadmin(user):
        raise HTTPException(status_code=403, detail="Only Glimmora (super admin) can request a top-up")
    row = _get_plan_row(plan_id)
    if not row:
        raise HTTPException(status_code=404, detail="Plan not found")
    amt_raw = (body or {}).get("amountMinor")
    try:
        amt = int(amt_raw) if amt_raw is not None else None
    except (TypeError, ValueError):
        amt = None
    note = str((body or {}).get("comment") or (body or {}).get("note") or "").strip()[:500]
    try:
        from shared.notify import create_notification
        msg = ("Glimmora requested a top-up" + (f" of ₹{amt/100:,.0f}" if amt else "") +
               " for the SOW escrow to keep paying delivered work. Release more budget on the Billing page."
               + (f"\nNote: {note}" if note else ""))
        create_notification(
            row.get("created_by"), category="payment", kind="escrow.topup_requested", severity="important",
            title="Top-up requested by Glimmora", body=msg,
            resource_type="plan", resource_id=plan_id,
            action_url="/enterprise/billing", action_label="Release funds")
    except Exception:  # noqa: BLE001
        pass
    _audit(user, "escrow.topup_request", plan_id, extra={"sowId": row.get("sow_id"), "amountMinor": amt, "comment": note})
    return {"ok": True, "amountMinor": amt, "comment": note}


@router.post("/plans/{plan_id}/payout-contributors")
def payout_contributors(plan_id: str, user: Annotated[dict, Depends(get_current_user)],
                        body: dict = Body(default={})):
    """Glimmora disburses to contributors for tasks the enterprise has FUNDED:
    released → processing → paid; decomp_tasks → 'paid'; contributor_tasks → 'completed'.

    Scope (body):
      - {taskId}  → just that ONE task (per-task "Pay" button). Only allowed when the
                    task is delivered (QA-accepted, payout eligible/released) AND its
                    amount ≤ the remaining payable.
      - {} or {payAll: true} → "Pay all delivered tasks": every delivered-unpaid task,
                    capped at the remaining payable (skips any task that would exceed it).

    FUND GATING: payable = released_by_enterprise − already_paid (escrow remaining +
    per-task 'released' budgets). A disburse NEVER exceeds payable. Each paid row moves
    released→processing→paid, carries the task_id + plan_id transaction link + an
    external_ref. TEST mode (no RAZORPAY_KEY_ID) is simulated — real state machine, no
    real money; the real RazorpayX call slots in behind `_razorpay_live()`."""
    if not _is_superadmin(user):
        raise HTTPException(status_code=403, detail="Only Glimmora (super admin) can pay out contributors")
    row = _get_plan_row(plan_id)
    if not row:
        raise HTTPException(status_code=404, detail="Plan not found")
    task_id = (body or {}).get("taskId")
    sow_id = row.get("sow_id")
    conn = _conn()
    from psycopg2.extras import RealDictCursor as _RDC
    paid = 0
    done: list = []
    skipped: list = []  # tasks delivered but over the remaining payable
    sim = not _razorpay_live()
    try:
      with conn.cursor(cursor_factory=_RDC) as cur:
        ids = [task_id] if task_id else _plan_task_ids(cur, plan_id)
        # Fund-released gate: never disburse more than the enterprise has funded.
        payable = _payable_minor(cur, plan_id, ids)

        def _disburse_row(pid: str, acct, num_task, ctid, cm: int, from_escrow: bool) -> None:
            """released|eligible|requested → processing → paid (transaction-linked).
            Idempotent: guarded on status so a task is never paid twice."""
            method = _resolve_payout_method(cur, acct)
            method_id = (method or {}).get("id")
            ext_ref = "SIM-" + str(pid)[:8]
            if _razorpay_live():
                # ── REAL RazorpayX branch (placeholder) ──────────────────────
                # A real RazorpayX payout call wires in here using `method` (bank/UPI);
                # on success set ext_ref to the RazorpayX payout id. Simulated for now.
                ext_ref = "SIM-" + str(pid)[:8]
            # released → processing (in-flight), then → paid. Both guarded on status<>'paid'.
            cur.execute("UPDATE payouts SET status='processing', "
                        "method_id=COALESCE(%s, method_id), updated_at=now() "
                        "WHERE id=%s AND status<>'paid'", [method_id, pid])
            cur.execute(
                "UPDATE payouts SET status='paid', paid_at=now(), "
                "external_ref=COALESCE(external_ref,%s), "
                "data = data || jsonb_build_object('planId', %s, 'sowId', %s, "
                "  'disbursedBy', %s, 'simulated', %s, 'paidFromEscrow', %s), updated_at=now() "
                "WHERE id=%s AND status='processing'",
                [ext_ref, plan_id, sow_id, str(user.get("email") or user.get("id")), sim,
                 bool(from_escrow), pid])
            done.append({"payout_id": pid, "account_id": acct, "task_id": num_task,
                         "ctid": ctid, "amountMinor": cm, "title": None})

        if ids:
            # 1) Per-task 'released' payouts (enterprise sent that task's budget) — pay
            #    them oldest first, but only while the remaining payable covers them.
            cur.execute(
                "SELECT id, account_id, task_id, data->>'canonicalTaskId' ctid, task_title tt, "
                "COALESCE((data->>'clientMinor')::bigint,0) cm FROM payouts "
                "WHERE data->>'canonicalTaskId' = ANY(%s) AND status='released' "
                "ORDER BY created_at ASC", [ids])
            for r in cur.fetchall():
                cm = int(r["cm"] or 0)
                if cm <= payable:
                    _disburse_row(r["id"], r["account_id"], r["task_id"], r["ctid"], cm, False)
                    payable -= cm
                    done[-1]["title"] = r.get("tt")
                else:
                    skipped.append(r["ctid"])
            # 2) Pre-funded escrow: also pay DELIVERED tasks the enterprise pre-funded
            #    (payout still 'eligible'/'requested') straight from the SOW escrow —
            #    oldest first, only while the escrow balance (already inside payable) covers them.
            bal = _escrow_balance(cur, plan_id)
            esc_remaining = bal["remainingMinor"]
            if esc_remaining > 0:
                cur.execute(
                    "SELECT id, account_id, task_id, data->>'canonicalTaskId' ctid, task_title tt, "
                    "COALESCE((data->>'clientMinor')::bigint,0) cm FROM payouts "
                    "WHERE data->>'canonicalTaskId' = ANY(%s) AND status IN ('eligible','requested') "
                    "ORDER BY created_at ASC", [ids])
                drawn = 0
                for r in cur.fetchall():
                    cm = int(r["cm"] or 0)
                    if cm > 0 and cm <= esc_remaining:
                        _disburse_row(r["id"], r["account_id"], r["task_id"], r["ctid"], cm, True)
                        esc_remaining -= cm; drawn += cm
                        done[-1]["title"] = r.get("tt")
                    elif cm > 0:
                        skipped.append(r["ctid"])
                if drawn > 0:
                    cur.execute("UPDATE sow_escrows SET spent_minor = spent_minor + %s, "
                                "updated_at=now() WHERE plan_id=%s", [drawn, plan_id])
            paid = len(done)
            for d in done:
                ctid = d.get("ctid")
                if ctid:
                    cur.execute("UPDATE decomp_tasks SET status='paid', updated_at=now() WHERE id=%s", [ctid])
                # complete the contributor task (numeric id or canonical tsk_ id)
                tid = d.get("task_id")
                if tid and str(tid).isdigit():
                    cur.execute("UPDATE contributor_tasks SET status='completed', updated_at=now() "
                                "WHERE id=%s AND account_id=%s", [int(tid), d.get("account_id")])
                elif ctid:
                    cur.execute("UPDATE contributor_tasks SET status='completed', updated_at=now() "
                                "WHERE account_id=%s AND data->>'taskId'=%s", [d.get("account_id"), ctid])
      conn.commit()
    except Exception as exc:  # noqa: BLE001
        # FAILED disburse: roll back the in-flight batch, then (best-effort, in a
        # FRESH transaction) mark every payout left mid-disbursal ('processing') for
        # this plan's tasks as 'failed' with the error reason saved into its data
        # JSONB, and log the raw error to Mongo. Re-raise so the caller sees it.
        err = str(exc)
        try:
            conn.rollback()
        except Exception:  # noqa: BLE001
            pass
        try:
            ids2 = [task_id] if task_id else None
            with conn.cursor(cursor_factory=_RDC) as cur2:
                if ids2 is None:
                    ids2 = _plan_task_ids(cur2, plan_id)
                if ids2:
                    cur2.execute(
                        "UPDATE payouts SET status='failed', failure_reason=%s, "
                        "data = data || jsonb_build_object('error', %s, 'errorCode', %s, "
                        "  'failedAt', %s, 'planId', %s, 'sowId', %s), updated_at=now() "
                        "WHERE data->>'canonicalTaskId' = ANY(%s) AND status='processing' "
                        "RETURNING id, account_id, task_id, "
                        "COALESCE((data->>'clientMinor')::bigint,0) cm",
                        [err[:500], err[:1000], type(exc).__name__,
                         datetime.now(timezone.utc).isoformat(), plan_id, sow_id, ids2])
                    failed_rows = cur2.fetchall()
                else:
                    failed_rows = []
            conn.commit()
        except Exception:  # noqa: BLE001
            try:
                conn.rollback()
            except Exception:  # noqa: BLE001
                pass
            failed_rows = []
        for fr in failed_rows:
            write_txn_event(
                direction="out", status="failed", payout_id=str(fr.get("id")),
                task_id=str(fr.get("task_id")) if fr.get("task_id") is not None else None,
                plan_id=plan_id, amount_minor=int(fr.get("cm") or 0),
                error=err, error_code=type(exc).__name__, verified=False, service="enterprise")
        if not failed_rows:  # still record the failed attempt even if no row flipped
            write_txn_event(
                direction="out", status="failed", plan_id=plan_id, task_id=task_id,
                error=err, error_code=type(exc).__name__, verified=False, service="enterprise")
        raise
    # SUCCESS: record each disbursed payout (full ledger of successful transactions).
    for d in done:
        write_txn_event(
            direction="out", status="success", payout_id=str(d.get("payout_id")),
            task_id=str(d.get("task_id")) if d.get("task_id") is not None else None,
            plan_id=plan_id, amount_minor=int(d.get("amountMinor") or 0),
            verified=True, service="enterprise")
    _notify_and_email_payouts(conn, done, plan_id, sow_id, row)
    _audit(user, "payout.disburse", plan_id,
           extra={"sowId": sow_id, "paid": paid, "skipped": len(skipped), "simulated": sim})
    return {"paid": paid, "skipped": len(skipped), "status": plan_payout_status(plan_id, user)}


def _notify_and_email_payouts(conn, done: list, plan_id: str, sow_id, plan_row: dict) -> None:
    """In-app notification + email to BOTH (a) each paid contributor and (b)
    Glimmora/super-admin, for every disbursed payout. Best-effort + fast — a notify
    or email failure never affects the disburse (already committed)."""
    if not done:
        return
    from psycopg2.extras import RealDictCursor as _RDC
    sow_name = None
    try:
        with conn.cursor(cursor_factory=_RDC) as cur:
            if sow_id:
                cur.execute("SELECT data->>'projectTitle' a, data->>'title' b, data->>'fileName' c "
                            "FROM enterprise_sows WHERE id=%s", [sow_id])
                sr = cur.fetchone()
                if sr:
                    sow_name = sr.get("a") or sr.get("b") or sr.get("c")
    except Exception:  # noqa: BLE001
        sow_name = None
    sow_name = sow_name or (plan_row.get("summary") if plan_row else None) or "SOW"

    try:
        from shared.notify import create_notification, notify_role
    except Exception:  # noqa: BLE001
        create_notification = notify_role = None  # type: ignore
    try:
        from shared.mailer import send_email, email_is_configured
    except Exception:  # noqa: BLE001
        send_email = None  # type: ignore
        email_is_configured = lambda: False  # type: ignore  # noqa: E731

    def _inr(m) -> str:
        return f"₹{(int(m or 0) / 100):,.0f}"

    for d in done:
        acct = d.get("account_id")
        amount = d.get("amountMinor") or 0
        title = d.get("title") or "your task"
        ctid = d.get("ctid")
        # (a) contributor — in-app + email
        if create_notification:
            try:
                create_notification(
                    acct, category="payment", kind="payout.paid", severity="important",
                    title="You've been paid",
                    body=f"You've been paid {_inr(amount)} for “{title}”. The payment is on its way to your account.",
                    resource_type="task", resource_id=ctid,
                    action_url="/contributor/earnings", action_label="View earnings")
            except Exception:  # noqa: BLE001
                pass
        if send_email and email_is_configured():
            contact = {}
            try:
                with conn.cursor(cursor_factory=_RDC) as cur:
                    contact = _contributor_contact(cur, acct)
            except Exception:  # noqa: BLE001
                contact = {}
            to_email = contact.get("email")
            if to_email:
                try:
                    send_email(
                        to_email=to_email, category="payment",
                        subject=f"You've been paid {_inr(amount)}",
                        body=(f"Hi {contact.get('name') or 'there'},\n\n"
                              f"You've been paid {_inr(amount)} for “{title}”.\n"
                              "The payment is on its way to your saved payout account.\n\n"
                              "— The Glimmora Team"))
                except Exception:  # noqa: BLE001
                    pass

    # (b) Glimmora / super-admin — one in-app + email summary line per task.
    total = sum(int(d.get("amountMinor") or 0) for d in done)
    if notify_role:
        try:
            notify_role("superadmin", category="payment", kind="payout.disbursed", severity="informational",
                        title="Contributor payout disbursed",
                        body=(f"{len(done)} payout(s) totalling {_inr(total)} disbursed for SOW “{sow_name}”."),
                        resource_type="plan", resource_id=plan_id,
                        action_url=f"/admin/decomposition/{plan_id}", action_label="View SOW")
        except Exception:  # noqa: BLE001
            pass
    if send_email and email_is_configured():
        try:
            with conn.cursor(cursor_factory=_RDC) as cur:
                cur.execute("SELECT email FROM login_accounts WHERE LOWER(role) IN ('superadmin','super_admin')")
                sa_emails = [r["email"] for r in cur.fetchall() if r.get("email")]
            lines = "\n".join(
                f"  • {_inr(d.get('amountMinor'))} — {d.get('title') or 'task'}" for d in done)
            for em in sa_emails:
                try:
                    send_email(
                        to_email=em, category="payment",
                        subject=f"Payout {_inr(total)} disbursed — SOW {sow_name}",
                        body=(f"{len(done)} contributor payout(s) disbursed for SOW “{sow_name}” "
                              f"(plan {plan_id}):\n\n{lines}\n\nTotal: {_inr(total)}\n\n— Glimmora platform"))
                except Exception:  # noqa: BLE001
                    pass
        except Exception:  # noqa: BLE001
            pass


@router.post("/plans/{plan_id}/reprice")
def reprice_plan(
    plan_id: str,
    user: Annotated[dict, Depends(get_current_user)],
    body: dict = Body(default={}),
):
    """Super admin edits the contributor pay on an already-priced plan WITHOUT
    changing its status. New amounts apply to future assignments."""
    if not _is_superadmin(user):
        raise HTTPException(status_code=403, detail="Only the super admin (Glimmora) can edit pricing")
    row = _get_plan_row(plan_id)
    if not row:
        raise HTTPException(status_code=404, detail="Plan not found")
    if row["status"] not in ("submitted", "approved", "active"):
        raise HTTPException(status_code=400, detail=f"Cannot edit pricing of a plan in '{row['status']}' state")

    conn = _conn()
    priced_by = user.get("id") or user.get("email") or "superadmin"
    _apply_pricing(conn, plan_id, body.get("pricing") or [], (body.get("currency") or "INR").upper(), priced_by)
    with conn.cursor() as cur:
        cur.execute("UPDATE decomp_plans SET updated_at=now() WHERE id=%s", [plan_id])
    conn.commit()

    plan = _get_plan_detail(plan_id, include_pricing=True)
    _audit(user, "decomposition.plan.reprice", plan_id, extra={
        "sowId": row["sow_id"],
        "totalContributorMinor": sum((t.get("contributorAmountMinor") or 0) for t in (plan.get("tasks") or [])),
    })
    return {"plan": plan}


# ── POST /plans/{plan_id}/activate ────────────────────────────────────────────


@router.post("/plans/{plan_id}/activate")
def activate_plan(
    plan_id: str,
    user: Annotated[dict, Depends(get_current_user)],
):
    row = _get_plan_row(plan_id)
    if not row:
        raise HTTPException(status_code=404, detail="Plan not found")
    if row["status"] != "approved":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot activate a plan in '{row['status']}' state — approve it first",
        )

    conn = _conn()
    with conn.cursor() as cur:
        cur.execute(
            """UPDATE decomp_plans
               SET status = 'active', activated_at = now(), updated_at = now()
               WHERE id = %s""",
            [plan_id],
        )
        # flip draft tasks to ready
        cur.execute(
            """UPDATE decomp_tasks
               SET status = 'ready', updated_at = now()
               WHERE plan_id = %s AND status = 'draft'""",
            [plan_id],
        )
    conn.commit()

    plan = _get_plan_detail(plan_id)
    readied = len([t for t in (plan.get("tasks") or []) if t["status"] == "ready"]) if plan else 0
    _audit(user, "decomposition.plan.activate", plan_id, extra={
        "sowId": row["sow_id"],
        "tasksReadied": readied,
    })
    return {"plan": plan}


# ── POST /plans/{plan_id}/archive ─────────────────────────────────────────────


@router.post("/plans/{plan_id}/archive")
def archive_plan(
    plan_id: str,
    user: Annotated[dict, Depends(get_current_user)],
):
    row = _get_plan_row(plan_id)
    if not row:
        raise HTTPException(status_code=404, detail="Plan not found")
    if row["status"] == "archived":
        raise HTTPException(status_code=400, detail="Plan is already archived")

    conn = _conn()
    with conn.cursor() as cur:
        cur.execute(
            """UPDATE decomp_plans
               SET status = 'archived', archived_at = now(), updated_at = now()
               WHERE id = %s""",
            [plan_id],
        )
    conn.commit()

    plan = _get_plan_detail(plan_id)
    _audit(user, "decomposition.plan.archive", plan_id, extra={"sowId": row["sow_id"]})
    return {"plan": plan}


# ── POST /plans/{plan_id}/copy ────────────────────────────────────────────────


@router.post("/plans/{plan_id}/copy", status_code=201)
def copy_plan(
    plan_id: str,
    user: Annotated[dict, Depends(get_current_user)],
):
    source = _get_plan_detail(plan_id)
    if not source:
        raise HTTPException(status_code=404, detail="Plan not found")

    tenant_id = user.get("tenant_id") or user.get("id")
    created_by = user.get("id") or user.get("email") or "unknown"
    sow_id = source["sowId"]

    conn = _conn()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            "SELECT MAX(version) AS v FROM decomp_plans WHERE sow_id = %s AND deleted_at IS NULL",
            [sow_id],
        )
        row = cur.fetchone()
    next_version = (row["v"] or 0) + 1 if row and row["v"] is not None else 1

    new_plan_id = _new_id("dp_", _slug_from_id(sow_id))
    with conn.cursor() as cur:
        cur.execute(
            """INSERT INTO decomp_plans
                (id, tenant_id, sow_id, version, status, summary, created_by)
               VALUES (%s, %s, %s, %s, 'draft', %s, %s)""",
            [new_plan_id, tenant_id, sow_id, next_version, source.get("summary"), created_by],
        )

    # rebuild structure from source detail
    ms_id_to_key: dict[str, str] = {}
    milestones_in = []
    for m in source.get("milestones", []):
        key = f"m-{m['id']}"
        ms_id_to_key[m["id"]] = key
        milestones_in.append({
            "key": key, "order": m["order"], "name": m["name"],
            "description": m.get("description"), "startDate": m.get("startDate"),
            "endDate": m.get("endDate"), "status": m.get("status", "pending"),
        })

    task_id_to_key: dict[str, str] = {}
    tasks_in = []
    for t in source.get("tasks", []):
        key = f"t-{t['id']}"
        task_id_to_key[t["id"]] = key
        tasks_in.append({
            "key": key,
            "milestoneKey": ms_id_to_key.get(t["milestoneId"]) if t.get("milestoneId") else None,
            "externalKey": t.get("externalKey"),
            "title": t["title"],
            "description": t.get("description"),
            "requiredSkills": t.get("requiredSkills", []),
            "estimatedHours": t.get("estimatedHours"),
            "acceptanceCriteria": t.get("acceptanceCriteria"),
            "complexity": t.get("complexity"),
            "order": t.get("order", 0),
            "aiConfidence": t.get("aiConfidence"),
            "pmoEdited": bool(t.get("pmoEdited", False)),
            "workforceSourcing": t.get("workforceSourcing"),
            "reviewPath": t.get("reviewPath"),
        })

    deps_in = [
        {
            "fromTaskKey": task_id_to_key[d["fromTaskId"]],
            "toTaskKey": task_id_to_key[d["toTaskId"]],
            "type": d.get("type", "finish_to_start"),
        }
        for d in source.get("dependencies", [])
        if d["fromTaskId"] in task_id_to_key and d["toTaskId"] in task_id_to_key
    ]

    _write_structure(new_plan_id, tenant_id, {
        "milestones": milestones_in,
        "tasks": tasks_in,
        "dependencies": deps_in,
    }, conn)
    conn.commit()

    plan = _get_plan_detail(new_plan_id)
    _audit(user, "decomposition.plan.copy", new_plan_id, extra={
        "sourcePlanId": plan_id,
        "sowId": sow_id,
        "newVersion": next_version,
        "milestoneCount": len(plan.get("milestones", [])) if plan else 0,
        "taskCount": len(plan.get("tasks", [])) if plan else 0,
    })
    return {"plan": plan}


# ── audit helper ──────────────────────────────────────────────────────────────


def _audit(user: dict, action: str, target_id: str, extra: dict | None = None) -> None:
    try:
        write_audit(
            actor_id=user.get("id"),
            actor_email=user.get("email"),
            actor_role=user.get("role"),
            action=action,
            target="decomposition_plan",
            target_id=target_id,
            service="enterprise",
            tenant_id=user.get("tenant_id"),
            extra=extra,
        )
    except Exception:  # noqa: BLE001
        pass
