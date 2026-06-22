"""Approvals — /api/v1/approvals/**  (wrapped envelope)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Body, Depends, HTTPException

from shared.deps import get_current_user

from enterprise_app import db
from enterprise_app.responses import ok

router = APIRouter(prefix="/api/v1/approvals", tags=["approvals"])


_ADMIN_ROLES = {"admin", "superadmin", "super_admin", "plat"}


def _is_admin(user: dict) -> bool:
    return (user.get("role") or "").lower() in _ADMIN_ROLES


def _load(sow_id: str, user: dict) -> dict:
    # Owner sees their own SOW; platform admins (who sign the Commercial stage)
    # can load ANY SOW by id.
    owner_id = None if _is_admin(user) else user["id"]
    row = db.get_row("sow", sow_id, owner_id)
    if row is None:
        raise HTTPException(status_code=404, detail="SOW not found")
    return row


@router.get("/{sow_id}")
def get_approvals(sow_id: str, user: Annotated[dict, Depends(get_current_user)]):
    row = _load(sow_id, user)
    owner_id = None if _is_admin(user) else user["id"]
    stages = row.get("approvalStages") or []
    # Backfill the canonical 5 stages for any legacy SOW that still has the old
    # 3-stage (legal/finance/exec) shape, so the approval UI always shows 5.
    canonical_keys = {s["key"] for s in db.SOW_APPROVAL_STAGES}
    if not stages or not canonical_keys.issubset({s.get("key") for s in stages}):
        prior_approved = bool(stages) and all(s.get("status") == "approved" for s in stages)
        stages = db.build_approval_stages(all_status="approved" if prior_approved else "pending",
                                          decided_by="ai")
        row["approvalStages"] = stages
        db.update_row("sow", sow_id, row, owner_id)
    return ok({
        "sowId": sow_id,
        "stages": stages,
        "authorities": row.get("approvalAuthorities", []),
        "messages": row.get("approvalMessages", []),
    })


@router.post("/{sow_id}/stage/{stage}/decide")
def decide_stage(sow_id: str, stage: str, user: Annotated[dict, Depends(get_current_user)],
                 body: dict = Body(default={})):
    row = _load(sow_id, user)
    owner_id = None if _is_admin(user) else user["id"]
    decision = (body or {}).get("decision") or (body or {}).get("action") or "approve"
    comment = (body or {}).get("comment")
    # Approver's typed name — the signature on the final Admin approval gate.
    signature = (body or {}).get("signature")
    # A hard Reject ends the pipeline (status → 'rejected'); a Send-back (terminal
    # falsy) returns the SOW to draft for revision. Both record the gate as rejected.
    terminal = bool((body or {}).get("terminal"))
    # Validate the decision — reject unknown values (e.g. a typo) with 422 rather
    # than silently treating them as a rejection.
    _valid = {"approve", "approved", "reject", "rejected"}
    if decision not in _valid:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid decision '{decision}'. Must be one of: approve, reject.",
        )
    new_status = "approved" if decision in ("approve", "approved") else "rejected"

    # Always normalise to the canonical 5 stages first, so a legacy SOW (old
    # 3-stage shape, or one polluted with stray numeric keys) is repaired before
    # we record the decision.
    canonical = [s["key"] for s in db.SOW_APPROVAL_STAGES]
    existing = {s.get("key"): s for s in (row.get("approvalStages") or [])}
    stages = []
    for s in db.SOW_APPROVAL_STAGES:
        prev = existing.get(s["key"]) or {}
        stages.append({
            "key": s["key"], "title": s["title"], "owner": s["owner"],
            "status": prev.get("status", "pending"),
            "decidedBy": prev.get("decidedBy"), "decidedAt": prev.get("decidedAt"),
            "comment": prev.get("comment"),
        })
    row["approvalStages"] = stages

    # Resolve the target stage: accept either a canonical key ("business") OR a
    # 1-based position ("1".."5") that the UI sends.
    target_key = None
    if stage in canonical:
        target_key = stage
    else:
        try:
            idx = int(stage) - 1
            if 0 <= idx < len(canonical):
                target_key = canonical[idx]
        except (ValueError, TypeError):
            target_key = None
    if not target_key:
        raise HTTPException(status_code=400, detail=f"Unknown approval stage: {stage}")

    for st in stages:
        if st["key"] == target_key:
            st["status"] = new_status
            st["decidedBy"] = user.get("email")
            st["decidedAt"] = db.now_iso()
            st["comment"] = comment
            if signature:
                st["signedBy"] = signature  # approver's signature (typed name)
            break
    # The `final` stage is now a real gate — the enterprise Tenant-admin sign-off
    # (signed), decided before the Super admin (commercial) gate. It is NOT
    # auto-granted; the tenant admin must sign it explicitly.
    # SOW is fully approved only when ALL 5 canonical stages are approved.
    canonical_keys = {s["key"] for s in db.SOW_APPROVAL_STAGES}
    approved_keys = {s.get("key") for s in stages if s.get("status") == "approved"}
    if canonical_keys.issubset(approved_keys):
        row["status"] = "approved"
        row["approvedAt"] = db.now_iso()
        # Decomposition is a real, separate step now: the enterprise builds a plan
        # in the normalized decomp_plans tables (manual builder today, AI later)
        # AFTER the SOW is approved. We deliberately do NOT auto-create a legacy
        # "plan" JSONB row here — that would orphan a record the FE never reads and
        # falsely mark the SOW as already-decomposed. The SOW simply stays in the
        # decomposition queue until a real decomp_plans plan exists for it.
    elif new_status == "rejected":
        # Hard Reject → terminal 'rejected'; Send-back → 'draft' for revision.
        if terminal:
            row["status"] = "rejected"
            row["rejectedAt"] = db.now_iso()
        else:
            row["status"] = "draft"
    else:
        row["status"] = "approval"
    row["updatedAt"] = db.now_iso()
    saved = db.update_row("sow", sow_id, row, owner_id)
    return ok({"sowId": sow_id, "stage": stage, "decision": new_status,
               "status": row["status"], "stages": saved.get("approvalStages", [])})
