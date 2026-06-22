"""AI-generated SOWs — /api/v1/sows/**  (wrapped envelope).

Also exposes a compatibility alias router at /api/v1/sow (singular) so that
the frontend proxy route POST /api/v1/sow/{sowId}/approve resolves correctly.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Body, Depends, HTTPException
from fastapi.responses import PlainTextResponse

from shared.audit import write_audit
from shared.deps import get_current_user

from enterprise_app import db
from enterprise_app.responses import ok
from enterprise_app.seed import ensure_demo_data

router = APIRouter(prefix="/api/v1/sows", tags=["sows"])

# Singular-prefix alias — matches the /api/v1/sow/{sowId}/approve path that
# the Next.js proxy sends after reading the frontend sow/[sowId]/approve route.
sow_alias_router = APIRouter(prefix="/api/v1/sow", tags=["sows"])


def _load(sow_id: str, owner_id: str | None = None) -> dict:
    row = db.get_row("sow", sow_id, owner_id)
    if row is None:
        raise HTTPException(status_code=404, detail="SOW not found")
    return row


@router.get("")
def list_sows(user: Annotated[dict, Depends(get_current_user)]):
    ensure_demo_data(user)
    return ok(db.list_rows("sow", user["id"]))


@router.get("/enterprise/all")
def list_enterprise_sows(user: Annotated[dict, Depends(get_current_user)]):
    """All SOWs visible to the enterprise (scoped to the owner here)."""
    ensure_demo_data(user)
    return ok(db.list_rows("sow", user["id"]))


_ADMIN_ROLES = {"admin", "superadmin", "super_admin", "plat", "platform"}


def _is_admin(user: dict) -> bool:
    return (user.get("role") or "").lower() in _ADMIN_ROLES


@router.get("/admin/all")
def list_all_sows_admin(user: Annotated[dict, Depends(get_current_user)]):
    """ALL SOWs across every owner — Glimmora platform admins only.

    Owner-scoped lists (/api/v1/sows) only show the caller's own SOWs, so the
    Super Admin Commercial gate couldn't see SOWs raised by enterprise tenants.
    This returns the full set (owner_id=None) so the admin queue can pick up any
    SOW that has reached the Commercial stage, regardless of who created it.
    """
    if not _is_admin(user):
        raise HTTPException(status_code=403, detail="Platform admin access required")
    return ok(db.list_rows("sow", None))


@router.get("/{sow_id}")
def get_sow(sow_id: str, user: Annotated[dict, Depends(get_current_user)]):
    ensure_demo_data(user)
    # Platform admins (who sign the Commercial gate) can open ANY SOW by id;
    # owners are scoped to their own. Without this, a Super Admin opening an
    # enterprise-owned SOW from the Commercial gate got "SOW not found".
    owner_scope = None if _is_admin(user) else user["id"]
    return ok(_load(sow_id, owner_scope))


@router.get("/enterprise/{sow_id}")
def get_enterprise_sow(sow_id: str, user: Annotated[dict, Depends(get_current_user)]):
    ensure_demo_data(user)
    return ok(_load(sow_id, user["id"]))


@router.post("/{sow_id}/action")
def sow_action(sow_id: str, user: Annotated[dict, Depends(get_current_user)],
               body: dict = Body(default={})):
    row = _load(sow_id, user["id"])
    action = (body or {}).get("action") or "noop"
    history = row.setdefault("actionHistory", [])
    history.append({"action": action, "at": db.now_iso(), "payload": body})
    status_map = {"approve": "approved", "reject": "rejected", "submit": "submitted",
                  "archive": "archived"}
    if action in status_map:
        row["status"] = status_map[action]
    row["updatedAt"] = db.now_iso()
    saved = db.update_row("sow", sow_id, row, user["id"])
    # Audit every SOW action (approve/reject/submit/archive/…) — consequential
    # state changes belong in the tamper-evident timeline.
    try:
        write_audit(
            actor_id=user.get("id"),
            actor_email=user.get("email"),
            actor_role=user.get("role"),
            action=f"sow.{action}",
            target="sow",
            target_id=sow_id,
            extra={"status": row.get("status"),
                   "note": (body or {}).get("comment") or (body or {}).get("note")},
        )
    except Exception:  # noqa: BLE001 — never block the action on an audit write
        pass
    return ok(saved)


@router.get("/{sow_id}/hallucination-analysis")
def hallucination_analysis(sow_id: str, user: Annotated[dict, Depends(get_current_user)]):
    row = _load(sow_id, user["id"])
    return ok({
        "sowId": sow_id,
        "layers": row.get("hallucinationLayers", []),
        "overallConfidence": 0.9,
    })


@router.get("/{sow_id}/risk-assessment")
def risk_assessment(sow_id: str, user: Annotated[dict, Depends(get_current_user)]):
    row = _load(sow_id, user["id"])
    return ok(row.get("riskAssessment", {"overall": "low", "factors": []}))


@router.get("/{sow_id}/export/{fmt}")
def export_sow(sow_id: str, fmt: str, user: Annotated[dict, Depends(get_current_user)]):
    row = _load(sow_id, user["id"])
    fmt = (fmt or "").lower()
    title = row.get("projectTitle") or "SOW"
    if fmt in ("txt", "text", "md", "markdown"):
        lines = [f"# {title}", ""]
        for sec in row.get("sections", []):
            lines.append(f"## {sec.get('title')}")
            lines.append(str(sec.get("content", "")))
            lines.append("")
        return PlainTextResponse("\n".join(lines), media_type="text/plain")
    # json / pdf / docx fall back to the structured payload in the envelope.
    return ok({"sowId": sow_id, "format": fmt, "document": row})


# ══════════════════════════════════════════════════════════════════════════════
# SINGULAR ALIAS: POST /api/v1/sow/{sow_id}/approve
# The Next.js frontend proxy route sends to /api/v1/sow/{sowId}/approve.
# This endpoint records a full-approval action (all stages approved) and is
# idempotent — repeated calls are safe.
# ══════════════════════════════════════════════════════════════════════════════

_APPROVE_ROLES = {"admin", "superadmin", "super_admin", "enterprise", "plat", "platform"}


@sow_alias_router.post("/{sow_id}/approve")
def approve_sow(
    sow_id: str,
    user: Annotated[dict, Depends(get_current_user)],
    body: dict = Body(default={}),
):
    """
    POST /api/v1/sow/{sow_id}/approve

    Marks the SOW as fully approved (all stages → approved) and sets
    status = 'approved'.  Optionally accepts:
      { stage: str, comment: str }
    to approve a specific stage only.  If no stage is provided, all
    pending stages are approved in one shot.

    Requires the caller to hold one of the enterprise/admin roles.
    """
    role = (user.get("role") or "").lower()
    if role not in _APPROVE_ROLES:
        raise HTTPException(status_code=403, detail="Insufficient role to approve SOW")

    # Admins can approve any SOW; enterprise users are owner-scoped.
    is_admin = role in {"admin", "superadmin", "super_admin", "plat", "platform"}
    owner_scope = None if is_admin else user["id"]
    row = db.get_row("sow", sow_id, owner_scope)
    if row is None:
        raise HTTPException(status_code=404, detail="SOW not found")

    stage_key = (body or {}).get("stage")
    comment = (body or {}).get("comment") or ""
    now = db.now_iso()

    # Normalise to canonical 5-stage shape
    canonical_stages = [s["key"] for s in db.SOW_APPROVAL_STAGES]
    existing = {s.get("key"): s for s in (row.get("approvalStages") or [])}
    stages = []
    for s in db.SOW_APPROVAL_STAGES:
        prev = existing.get(s["key"]) or {}
        stages.append({
            "key": s["key"], "title": s["title"], "owner": s["owner"],
            "status": prev.get("status", "pending"),
            "decidedBy": prev.get("decidedBy"),
            "decidedAt": prev.get("decidedAt"),
            "comment": prev.get("comment"),
        })

    if stage_key:
        # Approve a single stage
        if stage_key not in canonical_stages:
            raise HTTPException(status_code=400, detail=f"Unknown approval stage: {stage_key}")
        for st in stages:
            if st["key"] == stage_key:
                st["status"] = "approved"
                st["decidedBy"] = user.get("email")
                st["decidedAt"] = now
                st["comment"] = comment
                break
    else:
        # Approve all pending stages at once
        for st in stages:
            if st["status"] != "approved":
                st["status"] = "approved"
                st["decidedBy"] = user.get("email")
                st["decidedAt"] = now
                st["comment"] = comment

    row["approvalStages"] = stages

    # Check if all stages are now approved
    approved_keys = {s["key"] for s in stages if s.get("status") == "approved"}
    all_approved = set(canonical_stages).issubset(approved_keys)
    if all_approved:
        row["status"] = "approved"
        row["approvedAt"] = now
        # Auto-create a decomposition plan if not already present
        if not row.get("planId"):
            try:
                plan_id = db.new_id("plan_")
                title = row.get("projectTitle") or row.get("fileName") or "Untitled Plan"
                plan_payload = {
                    "id": plan_id, "title": title, "projectTitle": title,
                    "sowId": sow_id, "clientOrganisation": row.get("clientOrganisation"),
                    "status": "draft", "revision": 1, "locked": False, "confirmed": False,
                    "createdAt": now, "updatedAt": now,
                    "tasks": [], "milestones": [], "criticalPath": [], "checklist": [],
                    "review": {"status": "not_started", "checklist": [], "summary": {}},
                    "revisions": [],
                    "summary": {"taskCount": 0, "milestoneCount": 0, "completion": 0},
                    "checklistStatus": {"complete": False, "items": 0, "done": 0},
                }
                db.create_row(
                    "plan",
                    {"id": owner_scope or user["id"], "email": user.get("email")},
                    plan_payload,
                    row_id=plan_id,
                )
                row["planId"] = plan_id
            except Exception:  # noqa: BLE001
                pass
    else:
        row["status"] = "approval"

    row["updatedAt"] = now
    saved = db.update_row("sow", sow_id, row, owner_scope)

    write_audit(
        actor_id=user.get("id"),
        actor_email=user.get("email"),
        actor_role=user.get("role"),
        action="sow.approved" if all_approved else "sow.stage_approved",
        target="sow",
        target_id=sow_id,
        extra={
            "stage": stage_key,
            "comment": comment,
            "allApproved": all_approved,
            "status": row["status"],
        },
    )

    return ok({
        "sowId": sow_id,
        "status": row["status"],
        "stages": saved.get("approvalStages", []),
        "approvedAt": row.get("approvedAt"),
        "planId": row.get("planId"),
    })
