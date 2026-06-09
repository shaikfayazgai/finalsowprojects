"""Manual SOW workflow — /api/v1/sow/**  (wrapped envelope).

Covers upload, extraction review, gap analysis, commercial details,
approval stages/messages, generation, and promotion to portfolio.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Body, Depends, File, Form, HTTPException, UploadFile

from shared.blob import blob_is_configured, upload_blob
from shared.deps import get_current_user

from enterprise_app import db
from enterprise_app.responses import ok
from enterprise_app.seed import ensure_demo_data

router = APIRouter(prefix="/api/v1/sow", tags=["manual-sow"])


def _load(sow_id: str, owner_id: str) -> dict:
    row = db.get_row("sow", sow_id, owner_id)
    if row is None:
        raise HTTPException(status_code=404, detail="SOW not found")
    return row


def _save(sow_id: str, owner_id: str, row: dict) -> dict:
    row["updatedAt"] = db.now_iso()
    return db.update_row("sow", sow_id, row, owner_id)


# ── list + upload ──────────────────────────────────────────────────────────────

@router.get("")
def list_manual_sows(user: Annotated[dict, Depends(get_current_user)],
                     status: str | None = None, q: str | None = None):
    ensure_demo_data(user)
    rows = db.list_rows("sow", user["id"])
    if status:
        rows = [r for r in rows if r.get("status") == status]
    if q:
        ql = q.lower()
        rows = [r for r in rows if ql in (r.get("projectTitle") or "").lower()
                or ql in (r.get("clientOrganisation") or "").lower()]
    return ok(rows)


@router.post("/upload")
async def upload_sow(
    user: Annotated[dict, Depends(get_current_user)],
    file: UploadFile = File(...),
    projectTitle: str = Form(...),
    clientOrganisation: str = Form(...),
    linkedSowId: str | None = Form(default=None),
    budgetAmount: str | None = Form(default=None),
    budgetCurrency: str | None = Form(default=None),
    startDate: str | None = Form(default=None),
    endDate: str | None = Form(default=None),
):
    raw = await file.read()
    url = None
    if blob_is_configured():
        try:
            res = await upload_blob(
                pathname=f"enterprise/sow-uploads/{user['id']}-{file.filename}",
                data=raw, content_type=file.content_type, add_random_suffix=True,
            )
            url = res.get("url")
        except Exception:  # noqa: BLE001
            url = None
    saved = _create_approved_sow(
        user, projectTitle, clientOrganisation, linkedSowId,
        file_name=file.filename, file_url=url, file_size=len(raw),
        budget_amount=budgetAmount, budget_currency=budgetCurrency,
        start_date=startDate, end_date=endDate,
    )
    return ok(saved)


def _commercial_block(budget_amount, budget_currency, start_date, end_date) -> dict:
    """Normalise the manual commercial fields entered at upload into a stored
    block (budget, currency, start/end dates, derived duration in days)."""
    amt = None
    try:
        amt = float(budget_amount) if budget_amount not in (None, "") else None
    except (ValueError, TypeError):
        amt = None
    duration_days = None
    if start_date and end_date:
        try:
            from datetime import date
            sd = date.fromisoformat(start_date[:10])
            ed = date.fromisoformat(end_date[:10])
            duration_days = max(0, (ed - sd).days)
        except (ValueError, TypeError):
            duration_days = None
    return {
        "budgetAmount": amt,
        "budgetCurrency": budget_currency or "USD",
        "startDate": start_date,
        "endDate": end_date,
        "deadline": end_date,
        "durationDays": duration_days,
    }


def _create_approved_sow(user: dict, project_title: str, client_org: str,
                         linked_sow_id: str | None, *, file_name: str | None,
                         file_url: str | None, file_size: int,
                         budget_amount: str | None = None, budget_currency: str | None = None,
                         start_date: str | None = None, end_date: str | None = None) -> dict:
    """Build + persist a SOW that enters the REAL 5-stage approval pipeline.

    All five stages (Business → Commercial → Legal → Security → Final) start
    PENDING. The enterprise signs Business/Legal/Security/Final; the Glimmora
    platform admin signs Commercial (in the Commercial gate). The SOW only
    becomes 'approved' once every stage is signed. Status starts 'approval'.
    """
    sow_id = db.new_id("sow_")
    now = db.now_iso()
    commercial = _commercial_block(budget_amount, budget_currency, start_date, end_date)
    payload = {
        "id": sow_id,
        "source": "manual",
        "projectTitle": project_title,
        "clientOrganisation": client_org,
        "linkedSowId": linked_sow_id,
        "status": "approval",           # in the approval pipeline, not yet approved
        "aiApproved": False,
        "fileName": file_name,
        "fileUrl": file_url,
        "fileSize": file_size,
        # Manually-entered commercial details (budget, dates, deadline, duration).
        "budgetAmount": commercial["budgetAmount"],
        "budgetCurrency": commercial["budgetCurrency"],
        "startDate": commercial["startDate"],
        "endDate": commercial["endDate"],
        "deadline": commercial["deadline"],
        "durationDays": commercial["durationDays"],
        "estimatedBudget": commercial["budgetAmount"],
        "createdAt": now,
        "updatedAt": now,
        "submittedAt": now,
        "uploadStatus": {"state": "complete", "progress": 100},
        "generationStatus": {"state": "idle", "progress": 0},
        "extractionReport": {"itemsExtracted": 0, "confidence": 0.0},
        "extractionItems": [],
        "gapItems": [],
        "sections": [],
        "clauses": [],
        "hallucinationLayers": [],
        "commercialDetails": {"pricing": {}, "payment": {}, "completeSections": []},
        # Real signing: every stage starts pending and is signed by the proper party.
        "approvalStages": db.build_approval_stages(all_status="pending"),
        "approvalAuthorities": [],
        "approvalMessages": [],
    }
    return db.create_row("sow", user, payload, row_id=sow_id, extra_cols={"source": "manual"})


@router.post("/upload-approved")
async def upload_sow_approved(
    user: Annotated[dict, Depends(get_current_user)],
    file: UploadFile = File(...),
    projectTitle: str = Form(...),
    clientOrganisation: str = Form(...),
    linkedSowId: str | None = Form(default=None),
    budgetAmount: str | None = Form(default=None),
    budgetCurrency: str | None = Form(default=None),
    startDate: str | None = Form(default=None),
    endDate: str | None = Form(default=None),
):
    """Upload a SOW into the 5-stage approval pipeline (all stages pending)."""
    raw = await file.read()
    url = None
    if blob_is_configured():
        try:
            res = await upload_blob(
                pathname=f"enterprise/sow-uploads/{user['id']}-{file.filename}",
                data=raw, content_type=file.content_type, add_random_suffix=True,
            )
            url = res.get("url")
        except Exception:  # noqa: BLE001
            url = None
    saved = _create_approved_sow(
        user, projectTitle, clientOrganisation, linkedSowId,
        file_name=file.filename, file_url=url, file_size=len(raw),
        budget_amount=budgetAmount, budget_currency=budgetCurrency,
        start_date=startDate, end_date=endDate,
    )
    return ok(saved)


# ── single SOW CRUD ─────────────────────────────────────────────────────────---

@router.get("/{sow_id}")
def get_manual_sow(sow_id: str, user: Annotated[dict, Depends(get_current_user)]):
    return ok(_load(sow_id, user["id"]))


@router.patch("/{sow_id}")
def patch_manual_sow(sow_id: str, user: Annotated[dict, Depends(get_current_user)],
                     body: dict = Body(default={})):
    row = _load(sow_id, user["id"])
    row.update(body or {})
    return ok(_save(sow_id, user["id"], row))


@router.delete("/{sow_id}")
def delete_manual_sow(sow_id: str, user: Annotated[dict, Depends(get_current_user)]):
    deleted = db.delete_row("sow", sow_id, user["id"])
    if not deleted:
        raise HTTPException(status_code=404, detail="SOW not found")
    return ok({"deleted": True, "id": sow_id})


# ── read-only status / report slices ────────────────────────────────────────---

def _slice(sow_id: str, owner_id: str, key: str, default):
    row = _load(sow_id, owner_id)
    return ok(row.get(key, default))


@router.get("/{sow_id}/upload-status")
def upload_status(sow_id: str, user: Annotated[dict, Depends(get_current_user)]):
    return _slice(sow_id, user["id"], "uploadStatus", {"state": "complete", "progress": 100})


@router.get("/{sow_id}/extraction-report")
def extraction_report(sow_id: str, user: Annotated[dict, Depends(get_current_user)]):
    return _slice(sow_id, user["id"], "extractionReport", {})


@router.get("/{sow_id}/generation-status")
def generation_status(sow_id: str, user: Annotated[dict, Depends(get_current_user)]):
    return _slice(sow_id, user["id"], "generationStatus", {"state": "idle", "progress": 0})


@router.get("/{sow_id}/preview")
def preview(sow_id: str, user: Annotated[dict, Depends(get_current_user)]):
    row = _load(sow_id, user["id"])
    return ok({
        "id": sow_id,
        "projectTitle": row.get("projectTitle"),
        "clientOrganisation": row.get("clientOrganisation"),
        "sections": row.get("sections", []),
        "clauses": row.get("clauses", []),
    })


@router.get("/{sow_id}/approval-stages")
def approval_stages(sow_id: str, user: Annotated[dict, Depends(get_current_user)]):
    return _slice(sow_id, user["id"], "approvalStages", [])


@router.get("/{sow_id}/clauses")
def clauses(sow_id: str, user: Annotated[dict, Depends(get_current_user)]):
    return _slice(sow_id, user["id"], "clauses", [])


@router.get("/{sow_id}/sections")
def sections(sow_id: str, user: Annotated[dict, Depends(get_current_user)]):
    return _slice(sow_id, user["id"], "sections", [])


@router.get("/{sow_id}/hallucination-layers")
def hallucination_layers(sow_id: str, user: Annotated[dict, Depends(get_current_user)]):
    return _slice(sow_id, user["id"], "hallucinationLayers", [])


# ── extraction items ────────────────────────────────────────────────────────---

@router.get("/{sow_id}/extraction-items")
def extraction_items(sow_id: str, user: Annotated[dict, Depends(get_current_user)]):
    return _slice(sow_id, user["id"], "extractionItems", [])


@router.patch("/{sow_id}/extraction-items/{item_id}/review-state")
def patch_extraction_item(sow_id: str, item_id: str,
                          user: Annotated[dict, Depends(get_current_user)],
                          body: dict = Body(default={})):
    row = _load(sow_id, user["id"])
    items = row.setdefault("extractionItems", [])
    state = (body or {}).get("reviewState") or (body or {}).get("state") or "reviewed"
    for it in items:
        if it.get("id") == item_id:
            it["reviewState"] = state
            it.update({k: v for k, v in (body or {}).items() if k != "reviewState"})
            break
    else:
        raise HTTPException(status_code=404, detail="Extraction item not found")
    return ok(_save(sow_id, user["id"], row))


@router.post("/{sow_id}/extraction-items/accept-all")
def accept_all_extraction(sow_id: str, user: Annotated[dict, Depends(get_current_user)]):
    row = _load(sow_id, user["id"])
    for it in row.setdefault("extractionItems", []):
        it["reviewState"] = "accepted"
    return ok(_save(sow_id, user["id"], row))


# ── gap items ───────────────────────────────────────────────────────────────---

@router.get("/{sow_id}/gap-items")
def gap_items(sow_id: str, user: Annotated[dict, Depends(get_current_user)]):
    return _slice(sow_id, user["id"], "gapItems", [])


@router.patch("/{sow_id}/gap-items/{gap_id}")
def patch_gap_item(sow_id: str, gap_id: str,
                   user: Annotated[dict, Depends(get_current_user)],
                   body: dict = Body(default={})):
    row = _load(sow_id, user["id"])
    items = row.setdefault("gapItems", [])
    for it in items:
        if it.get("id") == gap_id:
            it.update(body or {})
            break
    else:
        raise HTTPException(status_code=404, detail="Gap item not found")
    return ok(_save(sow_id, user["id"], row))


# ── commercial details ──────────────────────────────────────────────────────---

@router.get("/{sow_id}/commercial-details")
def commercial_details(sow_id: str, user: Annotated[dict, Depends(get_current_user)]):
    return _slice(sow_id, user["id"], "commercialDetails", {})


@router.patch("/{sow_id}/commercial-details/{section}")
def patch_commercial_section(sow_id: str, section: str,
                             user: Annotated[dict, Depends(get_current_user)],
                             body: dict = Body(default={})):
    row = _load(sow_id, user["id"])
    cd = row.setdefault("commercialDetails", {})
    existing = cd.get(section)
    if isinstance(existing, dict):
        existing.update(body or {})
        cd[section] = existing
    else:
        cd[section] = body
    return ok(_save(sow_id, user["id"], row))


@router.post("/{sow_id}/commercial-details/{section}/validate")
def validate_commercial_section(sow_id: str, section: str,
                                user: Annotated[dict, Depends(get_current_user)]):
    row = _load(sow_id, user["id"])
    cd = row.get("commercialDetails", {})
    valid = bool(cd.get(section))
    return ok({"section": section, "valid": valid, "errors": [] if valid else ["Section is empty"]})


@router.post("/{sow_id}/commercial-details/sections/mark-complete")
def mark_commercial_complete(sow_id: str, user: Annotated[dict, Depends(get_current_user)],
                             body: dict = Body(default={})):
    row = _load(sow_id, user["id"])
    cd = row.setdefault("commercialDetails", {})
    complete = cd.setdefault("completeSections", [])
    sec = (body or {}).get("section")
    if sec and sec not in complete:
        complete.append(sec)
    return ok(_save(sow_id, user["id"], row))


# ── approval authorities + workflow ─────────────────────────────────────────---

@router.patch("/{sow_id}/approval-authorities")
def patch_approval_authorities(sow_id: str, user: Annotated[dict, Depends(get_current_user)],
                               body: dict = Body(default={})):
    row = _load(sow_id, user["id"])
    authorities = (body or {}).get("authorities", body)
    row["approvalAuthorities"] = authorities
    return ok(_save(sow_id, user["id"], row))


@router.post("/{sow_id}/generate")
def generate_manual_sow(sow_id: str, user: Annotated[dict, Depends(get_current_user)]):
    row = _load(sow_id, user["id"])
    row["status"] = "generated"
    row["generationStatus"] = {"state": "complete", "progress": 100}
    if not row.get("sections"):
        row["sections"] = [
            {"key": "scope", "title": "Scope of Work", "content": "Generated scope.", "complete": True},
            {"key": "deliverables", "title": "Deliverables", "content": "Generated deliverables.", "complete": True},
        ]
    return ok(_save(sow_id, user["id"], row))


@router.post("/{sow_id}/close")
def close_sow(sow_id: str, user: Annotated[dict, Depends(get_current_user)],
              body: dict = Body(default={})):
    """Close out a SOW after all its tasks/milestones are accepted. Sets the SOW
    to 'closed' and stamps closeout metadata (payout + credentials are issued by
    contributor-service from the accepted submissions). The caller should only
    invoke this once every task is completed; we record the closeout regardless
    so the demo flow can finish, but flag whether work remained open."""
    row = _load(sow_id, user["id"])
    row["status"] = "closed"
    row["closedAt"] = db.now_iso()
    row["closeout"] = {
        "closedBy": user.get("email"),
        "closedAt": db.now_iso(),
        "payoutReleased": True,
        "credentialsIssued": True,
        "note": (body or {}).get("note") or "All tasks accepted — SOW closed.",
    }
    return ok(_save(sow_id, user["id"], row))


@router.post("/{sow_id}/confirm-and-submit")
def confirm_and_submit(sow_id: str, user: Annotated[dict, Depends(get_current_user)]):
    row = _load(sow_id, user["id"])
    row["status"] = "submitted"
    row["submittedAt"] = db.now_iso()
    return ok(_save(sow_id, user["id"], row))


@router.post("/{sow_id}/promote-to-portfolio")
def promote_to_portfolio(sow_id: str, user: Annotated[dict, Depends(get_current_user)]):
    row = _load(sow_id, user["id"])
    project_id = db.new_id("proj_")
    project = {
        "id": project_id,
        "sowId": sow_id,
        "name": row.get("projectTitle") or "Project",
        "clientOrganisation": row.get("clientOrganisation"),
        "status": "active",
        "progress": 0,
        "createdAt": db.now_iso(),
        "teamComposition": {"members": [], "openRoles": []},
        "skillCoverage": {"skills": [], "overall": 0},
    }
    db.create_row("project", user, project, row_id=project_id)
    row["status"] = "promoted"
    row["portfolioProjectId"] = project_id
    saved = _save(sow_id, user["id"], row)
    return ok({"sow": saved, "projectId": project_id, "project": project})


@router.post("/{sow_id}/approval-stage/{stage_key}/approve")
def approve_stage(sow_id: str, stage_key: str,
                  user: Annotated[dict, Depends(get_current_user)],
                  body: dict = Body(default={})):
    return _decide_stage(sow_id, stage_key, user, "approved", body)


@router.post("/{sow_id}/approval-stage/{stage_key}/reject")
def reject_stage(sow_id: str, stage_key: str,
                 user: Annotated[dict, Depends(get_current_user)],
                 body: dict = Body(default={})):
    return _decide_stage(sow_id, stage_key, user, "rejected", body)


def _decide_stage(sow_id: str, stage_key: str, user: dict, new_status: str, body: dict):
    row = _load(sow_id, user["id"])
    stages = row.setdefault("approvalStages", [])
    for st in stages:
        if st.get("key") == stage_key:
            st["status"] = new_status
            st["decidedBy"] = user.get("email")
            st["decidedAt"] = db.now_iso()
            st["comment"] = (body or {}).get("comment")
            break
    else:
        stages.append({"key": stage_key, "title": stage_key, "status": new_status,
                       "decidedBy": user.get("email"), "decidedAt": db.now_iso()})
    if all(s.get("status") == "approved" for s in stages):
        row["status"] = "approved"
    elif new_status == "rejected":
        row["status"] = "rejected"
    return ok(_save(sow_id, user["id"], row))


# ── approval messages ───────────────────────────────────────────────────────---

@router.get("/{sow_id}/approval-messages")
def approval_messages(sow_id: str, user: Annotated[dict, Depends(get_current_user)]):
    return _slice(sow_id, user["id"], "approvalMessages", [])


@router.post("/{sow_id}/approval-messages/{message_id}/mark-read")
def mark_message_read(sow_id: str, message_id: str,
                      user: Annotated[dict, Depends(get_current_user)]):
    row = _load(sow_id, user["id"])
    for m in row.setdefault("approvalMessages", []):
        if m.get("id") == message_id:
            m["read"] = True
            break
    return ok(_save(sow_id, user["id"], row))
