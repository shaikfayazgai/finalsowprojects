"""
Women-team router — /api/women/**

A women's team is a tenant (tenants.kind='women_team'). Members are
contributors (login_accounts role='contributor', tenant_id set) whose
contributor_profiles.segment='women'. Mirrors the universities service but
for team members.

Endpoints
  GET/POST   /api/women/teams
  GET        /api/women/teams/{tenant_id}
  GET/POST   /api/women/teams/{tenant_id}/members
  GET/PATCH/DELETE /api/women/teams/{tenant_id}/members/{id}
  POST       /api/women/teams/{tenant_id}/members/bulk-import   (CSV/Excel)
  GET        /api/women/teams/{tenant_id}/dashboard
  GET        /api/women/teams/{tenant_id}/audit
"""

from __future__ import annotations

import logging
from typing import Annotated, Any

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    Request,
    UploadFile,
)
from psycopg2.extras import RealDictCursor

from shared.audit import query_audit, write_audit
from shared.bulk_import import import_summary, parse_rows, validate_rows
from shared.config import settings
from shared.db import ensure_pg_clean, get_pg_connection
from shared.deps import get_current_admin, get_current_user
from shared.kafka_bus import publish_event
from shared.mailer import build_credentials_body, send_bulk_email
from shared.security import generate_temp_password, hash_password

from women_app import repo
from women_app.schemas import (
    MemberCreate,
    MemberUpdate,
    TeamCreate,
    member_out,
    team_out,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/women", tags=["women-team"])

SERVICE = "women-service"


def _require_team(tenant_id: str) -> dict[str, Any]:
    team = repo.get_team(tenant_id)
    if not team:
        raise HTTPException(status_code=404, detail="Women team not found")
    return team


def _ip(request: Request) -> str | None:
    return request.client.host if request.client else None


# ── Teams ────────────────────────────────────────────────────────────────────

@router.get("/teams")
async def list_teams(user: Annotated[dict, Depends(get_current_user)]):
    return [team_out(t) for t in repo.list_teams()]


@router.post("/teams", status_code=201)
async def create_team(
    body: TeamCreate,
    request: Request,
    admin: Annotated[dict, Depends(get_current_admin)],
):
    team = repo.create_team(body.name, body.metadata, supplied_id=body.id)
    write_audit(
        actor_id=admin["id"], actor_email=admin["email"], actor_role=admin["role"],
        action="women_team.create", target=body.name, target_id=team["id"],
        service=SERVICE, tenant_id=team["id"], ip_address=_ip(request),
    )
    publish_event("women_team.created", {"tenantId": team["id"], "name": body.name})
    return team_out(team)


@router.get("/teams/{tenant_id}")
async def get_team(tenant_id: str, user: Annotated[dict, Depends(get_current_user)]):
    team = _require_team(tenant_id)
    members = repo.list_members(tenant_id)
    out = team_out({**team, "member_count": len(members)})
    return out


# ── Members ──────────────────────────────────────────────────────────────────

@router.get("/teams/{tenant_id}/members")
async def list_members(tenant_id: str, user: Annotated[dict, Depends(get_current_user)]):
    _require_team(tenant_id)
    return [member_out(m) for m in repo.list_members(tenant_id)]


@router.post("/teams/{tenant_id}/members", status_code=201)
async def add_member(
    tenant_id: str,
    body: MemberCreate,
    request: Request,
    admin: Annotated[dict, Depends(get_current_admin)],
):
    team = _require_team(tenant_id)
    if repo.find_emails([body.email]):
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    first = body.firstName or (body.name.split(" ")[0] if body.name else "")
    last = body.lastName or (" ".join(body.name.split(" ")[1:]) if body.name and " " in body.name else "")
    temp_password = generate_temp_password(12)

    member = repo.create_member(
        tenant_id=tenant_id,
        email=str(body.email),
        first_name=first,
        last_name=last,
        password_hash=hash_password(temp_password),
        phone=body.phone,
        department=body.department,
        must_change_password=True,
        profile={
            "jobTitle": body.jobTitle, "linkedin": body.linkedin,
            "country": body.country, "careerStage": body.careerStage,
            "primarySkills": body.primarySkills,
        },
    )
    if member is None:
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    email_sent = False
    if body.sendCredentials:
        text, html = build_credentials_body(
            name=member["name"] or str(body.email), email=str(body.email),
            temp_password=temp_password,
            login_url=f"{settings.frontend_base_url}/auth/login",
            org_name=team["name"],
        )
        results = send_bulk_email(
            [{"to_email": str(body.email), "subject": f"Welcome to {team['name']}",
              "body": text, "html": html}]
        )
        email_sent = bool(results and results[0].get("sent"))

    write_audit(
        actor_id=admin["id"], actor_email=admin["email"], actor_role=admin["role"],
        action="women_team.member.add", target=str(body.email), target_id=str(member["id"]),
        service=SERVICE, tenant_id=tenant_id, ip_address=_ip(request),
        extra={"emailSent": email_sent},
    )
    publish_event("women_team.member_added", {"tenantId": tenant_id, "email": str(body.email)})
    return {**member_out(member), "credentialEmailSent": email_sent}


@router.get("/teams/{tenant_id}/members/{member_id}")
async def get_member(
    tenant_id: str,
    member_id: int,
    user: Annotated[dict, Depends(get_current_user)],
):
    _require_team(tenant_id)
    member = repo.get_member(tenant_id, member_id)
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    return member_out(member)


@router.patch("/teams/{tenant_id}/members/{member_id}")
async def update_member(
    tenant_id: str,
    member_id: int,
    body: MemberUpdate,
    request: Request,
    admin: Annotated[dict, Depends(get_current_admin)],
):
    _require_team(tenant_id)
    if not repo.get_member(tenant_id, member_id):
        raise HTTPException(status_code=404, detail="Member not found")
    updated = repo.update_member(tenant_id, member_id, body.model_dump(exclude_unset=True))
    write_audit(
        actor_id=admin["id"], actor_email=admin["email"], actor_role=admin["role"],
        action="women_team.member.update", target_id=str(member_id),
        service=SERVICE, tenant_id=tenant_id, ip_address=_ip(request),
    )
    return member_out(updated)


@router.delete("/teams/{tenant_id}/members/{member_id}")
async def delete_member(
    tenant_id: str,
    member_id: int,
    request: Request,
    admin: Annotated[dict, Depends(get_current_admin)],
):
    _require_team(tenant_id)
    if not repo.delete_member(tenant_id, member_id):
        raise HTTPException(status_code=404, detail="Member not found")
    write_audit(
        actor_id=admin["id"], actor_email=admin["email"], actor_role=admin["role"],
        action="women_team.member.delete", target_id=str(member_id),
        service=SERVICE, tenant_id=tenant_id, ip_address=_ip(request),
    )
    return {"ok": True, "deleted": member_id}


# ── Bulk import (CSV / Excel) — the key feature ──────────────────────────────

@router.post("/teams/{tenant_id}/members/bulk-import")
async def bulk_import_members(
    tenant_id: str,
    request: Request,
    admin: Annotated[dict, Depends(get_current_admin)],
    file: UploadFile = File(...),
    commit: bool = Form(False),
    sendCredentials: bool = Form(True),
    selectedRows: str | None = Form(None),
):
    """
    Two-phase CSV/Excel onboarding of women-team members.

      Phase 1 (commit=False): parse + validate, return a preview with per-row
        errors, duplicate flags, and `selectable` — NO database writes.
      Phase 2 (commit=True): insert the selected (or all valid) rows as
        contributors (segment='women', tenant_id from path) with a temp
        password + must_change_password=TRUE (ON CONFLICT DO NOTHING), email
        credentials, and write an audit entry.
    """
    team = _require_team(tenant_id)

    raw = await file.read()
    try:
        rows, headers = parse_rows(file.filename or "", raw)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    # Prefetch existing emails so duplicates are flagged in the preview.
    existing_emails = repo.all_existing_emails()
    validation = validate_rows(
        rows, headers=headers, existing_emails=existing_emails,
        allowed_roles={repo.CONTRIBUTOR_ROLE},
    )
    if validation.get("missing_columns"):
        raise HTTPException(
            status_code=400,
            detail=f"Missing required columns: {', '.join(validation['missing_columns'])}. "
                   "An 'email' column is required.",
        )

    valid_rows = validation["valid_rows"]
    error_rows = validation["error_rows"]

    # ── Phase 1: preview only ────────────────────────────────────────────────
    if not commit:
        return import_summary(valid_rows, error_rows, committed=False, inserted=0)

    # ── Phase 2: commit ──────────────────────────────────────────────────────
    selected: set[int] | None = None
    if selectedRows:
        try:
            import json

            selected = {int(x) for x in json.loads(selectedRows)}
        except Exception:
            selected = {int(x) for x in selectedRows.split(",") if x.strip().isdigit()}

    to_insert = [r for r in valid_rows if selected is None or r["rowNumber"] in selected]

    inserted = 0
    credential_messages: list[dict[str, Any]] = []
    pending_emails: list[str] = []

    ensure_pg_clean()
    conn = get_pg_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        for r in to_insert:
            temp_password = r.get("_password") or generate_temp_password(12)
            account_id = repo.bulk_insert_member(
                cur,
                tenant_id=tenant_id,
                email=r["email"],
                first_name=r.get("firstName") or "",
                last_name=r.get("lastName") or "",
                password_hash=hash_password(temp_password),
                phone=r.get("phone"),
                department=r.get("department"),
            )
            if account_id is None:
                continue  # ON CONFLICT DO NOTHING — already existed
            inserted += 1
            pending_emails.append(r["email"])
            if sendCredentials:
                text, html = build_credentials_body(
                    name=r.get("name") or r["email"], email=r["email"],
                    temp_password=temp_password,
                    login_url=f"{settings.frontend_base_url}/auth/login",
                    org_name=team["name"],
                )
                credential_messages.append({
                    "to_email": r["email"],
                    "subject": f"Welcome to {team['name']}",
                    "body": text, "html": html,
                })
    conn.commit()

    email_results: list[dict[str, Any]] = []
    if sendCredentials and credential_messages:
        email_results = send_bulk_email(credential_messages)

    write_audit(
        actor_id=admin["id"], actor_email=admin["email"], actor_role=admin["role"],
        action="women_team.member.bulk_import", target=file.filename,
        service=SERVICE, tenant_id=tenant_id, ip_address=_ip(request),
        details=f"inserted={inserted}",
        extra={"inserted": inserted, "sendCredentials": sendCredentials},
    )
    for email in pending_emails:
        publish_event("women_team.member_added",
                      {"tenantId": tenant_id, "email": email, "source": "bulk_import"})

    return import_summary(
        valid_rows, error_rows, committed=True, inserted=inserted,
        email_results=email_results,
    )


# ── Dashboard ────────────────────────────────────────────────────────────────

@router.get("/teams/{tenant_id}/dashboard")
async def team_dashboard(tenant_id: str, user: Annotated[dict, Depends(get_current_user)]):
    team = _require_team(tenant_id)
    counts = repo.dashboard_counts(tenant_id)
    recent = repo.recent_members(tenant_id, limit=10)

    def _recent_out(m: dict[str, Any]) -> dict[str, Any]:
        created = m.get("created_at")
        last_login = m.get("last_login_at")
        return {
            "id": m["id"], "email": m["email"], "name": m.get("name"),
            "createdAt": created.isoformat() if hasattr(created, "isoformat") else created,
            "lastLoginAt": last_login.isoformat() if hasattr(last_login, "isoformat") else last_login,
            "mustChangePassword": m.get("must_change_password", False),
        }

    return {
        "tenantId": tenant_id,
        "name": team["name"],
        "counts": {
            "totalMembers": int(counts.get("total_members", 0) or 0),
            "activeMembers": int(counts.get("active_members", 0) or 0),
            "loggedInMembers": int(counts.get("logged_in_members", 0) or 0),
            "pendingFirstLogin": int(counts.get("pending_first_login", 0) or 0),
            "onboardedLast7d": int(counts.get("onboarded_last_7d", 0) or 0),
            "onboardedLast30d": int(counts.get("onboarded_last_30d", 0) or 0),
        },
        "recentlyOnboarded": [_recent_out(m) for m in recent],
    }


# ── Audit ────────────────────────────────────────────────────────────────────

@router.get("/teams/{tenant_id}/audit")
async def team_audit(
    tenant_id: str,
    admin: Annotated[dict, Depends(get_current_admin)],
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
):
    _require_team(tenant_id)
    return query_audit(filters={"tenantId": tenant_id}, page=page, page_size=page_size)
