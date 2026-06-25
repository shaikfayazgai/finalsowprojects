"""
User management — /api/superadmin/users and /api/v1/users**.

Creates login_accounts rows (with a generated temp password when none given),
optionally emails credentials via shared.mailer, audits the action, and supports
reviewer invitation / resend flows the frontend reviewer pages proxy to.
"""

from __future__ import annotations

import json
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from shared.audit import write_audit
from shared.config import settings
from shared.db import get_pg_connection
from shared.deps import get_current_admin, get_current_superadmin, get_current_user
from shared.kafka_bus import publish_event
from shared.mailer import build_credentials_body, send_email
from shared.security import generate_temp_password, hash_password

from superadmin_app import repo

router = APIRouter(tags=["superadmin-users"])


class CreateUserRequest(BaseModel):
    """Flexible create-user payload — only email + role are essential."""
    email: str
    firstName: str | None = None
    lastName: str | None = None
    name: str | None = None
    role: str | None = "member"
    phone: str | None = None
    department: str | None = None
    tenantId: str | None = None
    password: str | None = None
    # Either of these triggers a credentials email.
    sendInvitation: bool | None = None
    sendCredentials: bool | None = None
    # Used by the /api/v1/users reviewer-invite proxy: if the email already
    # exists, behave like a resend rather than 409.
    resendExisting: bool | None = None
    # Inviter-based tenant scoping: the enterprise proxy passes the inviting
    # admin's email so the new member inherits that admin's tenant_id (and thus
    # only appears in that enterprise's tenant registry).
    callerEmail: str | None = None


def _split_name(body: CreateUserRequest) -> tuple[str, str]:
    first = (body.firstName or "").strip()
    last = (body.lastName or "").strip()
    if not first and body.name:
        parts = body.name.strip().split(" ", 1)
        first = parts[0]
        last = parts[1] if len(parts) > 1 else ""
    return first, last


def _wants_credentials(body: CreateUserRequest) -> bool:
    return bool(body.sendCredentials) or bool(body.sendInvitation)


def _login_url(role: str | None) -> str:
    """Per-portal login URL for credential emails (the global /auth/login was
    removed in the per-portal auth redesign). Maps the account's role to its
    portal login so the email tells the user exactly where to sign in."""
    base = settings.frontend_base_url.rstrip("/")
    r = (role or "").lower()
    scope = r.split(".")[0] if "." in r else r
    if scope == "mentor":
        portal = "mentor"
    elif scope == "reviewer":
        portal = "reviewer"
    elif scope in ("enterprise", "ent"):
        # The enterprise portal is a separate app/port — prefer its explicit URL.
        import os as _os
        return _os.environ.get("ENTERPRISE_LOGIN_URL") or f"{base}/enterprise/login"
    elif scope in ("admin", "superadmin", "super_admin", "plat", "university_admin"):
        portal = "admin"
    else:
        portal = "contributor"  # contributor / student / freelancer / women
    return f"{base}/{portal}/login"


def _email_credentials(*, name: str, email: str, temp_password: str, role: str | None) -> bool:
    text, html = build_credentials_body(
        name=name or email, email=email, temp_password=temp_password,
        login_url=_login_url(role), org_name="Glimmora",
    )
    return send_email(
        to_email=email,
        subject="Your Glimmora account credentials",
        body=text, html=html,
    )


def _resend_invite(existing: dict[str, Any], actor: dict, request: Request,
                   tenant_id: str | None = None) -> dict[str, Any]:
    """Regenerate a temp password for an existing account and email it. If a
    tenantId is supplied and the account isn't linked yet, backfill it so the
    tenant's provisioning timeline picks the account up."""
    if tenant_id and not existing.get("tenant_id"):
        repo.link_tenant(str(existing["id"]), tenant_id)
        existing = {**existing, "tenant_id": tenant_id}
    temp = generate_temp_password()
    repo.set_temp_password(str(existing["id"]), hash_password(temp))
    name = existing.get("name") or f"{existing.get('first_name','')} {existing.get('last_name','')}".strip()
    sent = _email_credentials(name=name, email=existing["email"],
                              temp_password=temp, role=existing.get("role"))
    write_audit(actor_id=actor.get("id"), actor_email=actor.get("email"), actor_role=actor.get("role"),
                action="resend_invite", target=existing["email"], target_id=str(existing["id"]),
                service="superadmin-service",
                ip_address=request.client.host if request.client else None,
                extra={"emailSent": sent})
    refreshed = repo.find_account_by_id(str(existing["id"]))
    out = repo.user_out(refreshed or existing)
    out["emailSent"] = sent
    out["resent"] = True
    # Surface the fresh temp password when we couldn't email it, so the admin can
    # copy it from the UI (cloud deploys have no SMTP).
    if not sent:
        out["tempPassword"] = temp
    return out


def _create_user(body: CreateUserRequest, actor: dict, request: Request) -> dict[str, Any]:
    if not body.email or "@" not in body.email:
        raise HTTPException(status_code=422, detail="A valid email is required")

    requested_role = (body.role or "member").lower()
    existing = repo.find_account_by_email(body.email)
    if existing:
        existing_role = (existing.get("role") or "").lower()
        # One email = one role FAMILY. Compare the scope (part before the dot) so
        # tier variants of the same role — mentor / mentor.senior / mentor.lead,
        # or ent.admin / ent.reviewer — are NOT treated as a conflict; only a
        # genuinely different family (e.g. mentor vs enterprise) is blocked.
        def _scope(r: str) -> str:
            return r.split(".")[0] if "." in r else r
        if existing_role and _scope(existing_role) != _scope(requested_role):
            raise HTTPException(
                status_code=409,
                detail=(f"This email already has a {existing_role} account. "
                        f"Use a different email, or manage the existing {existing_role} user."),
            )
        # Same-role re-provision: resend a fresh temp password (and link the
        # tenant if needed). The UI's "Resend credentials" button and the
        # inline resend both land here. resendExisting is kept for older callers.
        if body.resendExisting or _wants_credentials(body):
            return _resend_invite(existing, actor, request, tenant_id=body.tenantId)
        raise HTTPException(
            status_code=409,
            detail=f"This email already has a {existing_role or 'platform'} account — use Resend credentials to email a fresh temporary password.",
        )

    first, last = _split_name(body)
    role = (body.role or "member").lower()

    # Inheriting the inviter's tenant: if no explicit tenantId was given but a
    # callerEmail was, stamp the new account with the inviting admin's tenant_id
    # so it shows up only in that enterprise's member registry.
    tenant_id = body.tenantId
    if not tenant_id and body.callerEmail:
        caller = repo.find_account_by_email(body.callerEmail)
        if caller and caller.get("tenant_id"):
            tenant_id = caller["tenant_id"]

    temp_password = body.password or generate_temp_password()
    password_hash = hash_password(temp_password)
    # If no explicit password was supplied, the user must change it on first login.
    must_change = body.password is None  # forced reset when onboarded with a default password

    row = repo.create_account(
        email=body.email, password_hash=password_hash,
        first_name=first, last_name=last, role=role,
        phone=body.phone, department=body.department, tenant_id=tenant_id,
        must_change_password=must_change,
    )

    email_sent = False
    if _wants_credentials(body):
        email_sent = _email_credentials(
            name=row.get("name") or body.email, email=row["email"],
            temp_password=temp_password, role=role,
        )

    publish_event("user.created", {"userId": str(row["id"]), "email": row["email"], "role": role})
    write_audit(actor_id=actor.get("id"), actor_email=actor.get("email"), actor_role=actor.get("role"),
                action="create_user", target=row["email"], target_id=str(row["id"]),
                service="superadmin-service",
                ip_address=request.client.host if request.client else None,
                extra={"role": role, "emailSent": email_sent})

    out = repo.user_out(row)
    out["emailSent"] = email_sent
    # Surface the temp password only when we are NOT emailing it, so the admin can copy it.
    if not email_sent and body.password is None:
        out["tempPassword"] = temp_password
    return out


# ── POST /api/superadmin/users ────────────────────────────────────────────────

@router.get("/api/superadmin/users/check-email")
async def check_email(
    email: str,
    admin: Annotated[dict, Depends(get_current_admin)],
):
    """Inline duplicate check — does an account already exist for this email
    (across ALL roles, since login_accounts is one table)? Powers real-time
    'already provisioned' validation as the admin enters an email."""
    row = repo.find_account_by_email(email.strip()) if email and "@" in email else None
    return {"exists": bool(row), "role": row.get("role") if row else None}


@router.post("/api/superadmin/users", status_code=201)
async def superadmin_create_user(
    body: CreateUserRequest,
    request: Request,
    admin: Annotated[dict, Depends(get_current_admin)],
):
    return _create_user(body, admin, request)


@router.delete("/api/superadmin/users/{user_id}")
async def superadmin_delete_user(
    user_id: str,
    request: Request,
    admin: Annotated[dict, Depends(get_current_admin)],
):
    """Hard-delete a provisioned account (mentor / reviewer / contributor / etc.).
    Also clears any sow_mentor / sow_reviewer assignment records pointing at it."""
    from shared.db import get_pg_connection
    existing = repo.find_account_by_id(user_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Account not found")
    conn = get_pg_connection()
    with conn.cursor() as cur:
        cur.execute("DELETE FROM login_accounts WHERE id = %s", (user_id,))
        # Best-effort: drop assignment records that reference this account's email.
        email = existing.get("email")
        if email:
            cur.execute(
                "DELETE FROM admin_records WHERE kind IN ('sow_mentor','sow_reviewer') "
                "AND data::text ILIKE %s",
                (f"%{email}%",),
            )
    conn.commit()
    write_audit(actor_id=admin.get("id"), actor_email=admin.get("email"), actor_role=admin.get("role"),
                action="delete_user", target=existing.get("email"), target_id=str(user_id),
                service="superadmin-service",
                ip_address=request.client.host if request.client else None,
                extra={"role": existing.get("role")})
    return {"ok": True, "deletedId": str(user_id)}


# ── Applications approval queue (women freelancers self-apply) ────────────────

@router.get("/api/superadmin/applications")
async def list_applications(
    admin: Annotated[dict, Depends(get_current_admin)],
    status: str = "pending",
):
    return {"applications": [repo.user_out(r) for r in repo.list_applications(status)]}


class ApprovalDecision(BaseModel):
    decision: str  # 'approve' | 'reject'


@router.post("/api/superadmin/applications/{account_id}/decision")
async def decide_application(
    account_id: str,
    body: ApprovalDecision,
    request: Request,
    admin: Annotated[dict, Depends(get_current_admin)],
):
    new_status = "approved" if body.decision == "approve" else "rejected"
    row = repo.set_approval_status(account_id, new_status)
    if not row:
        raise HTTPException(status_code=404, detail="Application not found")
    # Notify the applicant by email, including their portal login URL.
    login_url = f"{settings.frontend_base_url}/contributor/login"
    if new_status == "approved":
        send_email(
            to_email=row["email"],
            subject="Your Glimmora application is approved",
            body=(f"Good news! Your application has been approved.\n\n"
                  f"Sign in here: {login_url}\n\nComplete your profile to access your dashboard."),
            category="application_approved",
        )
    else:
        send_email(
            to_email=row["email"],
            subject="Update on your Glimmora application",
            body="Thank you for applying. Unfortunately your application was not approved at this time.",
            category="application_rejected",
        )
    write_audit(actor_id=str(admin.get("id", "")), actor_email=admin.get("email", ""),
                actor_role=admin.get("role", "superadmin"), action=f"application_{new_status}",
                target="login_account", target_id=str(account_id),
                details=f"Application {new_status} for {row['email']}", service="superadmin-service",
                ip_address=request.client.host if request.client else None)
    return {"ok": True, "account_id": account_id, "approval_status": new_status}


# ── POST /api/v1/users (reviewer/create + reviewers/invitations proxy) ────────

@router.post("/api/v1/users", status_code=201)
async def v1_create_user(
    body: CreateUserRequest,
    request: Request,
    admin: Annotated[dict, Depends(get_current_admin)],
):
    return _create_user(body, admin, request)


# ── POST /api/v1/users/reviewers/resend-invite ────────────────────────────────

class ResendInviteRequest(BaseModel):
    email: str | None = None
    userId: str | None = None


@router.post("/api/v1/users/reviewers/resend-invite")
async def reviewer_resend_invite(
    body: ResendInviteRequest,
    request: Request,
    admin: Annotated[dict, Depends(get_current_admin)],
):
    existing = None
    if body.userId:
        existing = repo.find_account_by_id(body.userId)
    if not existing and body.email:
        existing = repo.find_account_by_email(body.email)
    if not existing:
        raise HTTPException(status_code=404, detail="Reviewer account not found")
    return _resend_invite(existing, admin, request)


# ── GET /api/v1/users/reviewers/list ──────────────────────────────────────────

@router.get("/api/v1/users/reviewers/list")
async def reviewer_list(admin: Annotated[dict, Depends(get_current_admin)]):
    reviewers = repo.list_reviewers()
    return {"reviewers": reviewers, "total": len(reviewers)}


# ── Resend credentials (any provisioned account) ──────────────────────────────

class _ResendCredsRequest(BaseModel):
    userId: str | None = None
    email: str | None = None


@router.post("/api/superadmin/users/resend-credentials")
async def resend_credentials(
    body: _ResendCredsRequest,
    admin: Annotated[dict, Depends(get_current_admin)],
    request: Request,
):
    """Regenerate a default/temp password for a provisioned account, email it,
    and force must_change_password so the user resets it on next login."""
    acct = None
    if body.userId:
        acct = repo.find_account_by_id(body.userId)
    if not acct and body.email:
        acct = repo.find_account_by_email(body.email)
    if not acct:
        raise HTTPException(status_code=404, detail="Account not found")

    temp = generate_temp_password()
    repo.set_temp_password(str(acct["id"]), hash_password(temp))

    name = (f"{acct.get('first_name', '') or ''} {acct.get('last_name', '') or ''}".strip()
            or acct.get("email"))
    # Build the login link from FRONTEND_BASE_URL → the account's portal (no more
    # hardcoded host), reusing the per-portal _login_url helper.
    login_url = _login_url(acct.get("role"))
    text, html = build_credentials_body(
        name=name, email=acct["email"], temp_password=temp,
        login_url=login_url, org_name=None,
    )
    sent = send_email(to_email=acct["email"], subject="Your Glimmora credentials",
                      body=text, html=html)
    try:
        write_audit(
            actor_id=admin.get("id"), actor_email=admin.get("email"),
            actor_role=admin.get("role"), action="resend_credentials",
            target=acct["email"], target_id=str(acct["id"]),
            tenant_id=acct.get("tenant_id"),
        )
    except Exception:  # noqa: BLE001
        pass
    return {"ok": True, "emailSent": bool(sent), "email": acct["email"],
            "mustChangePassword": True}


# ── GET /api/superadmin/mentors/{mentor_id} ───────────────────────────────────

def _mentor_out(row: dict[str, Any]) -> dict[str, Any]:
    """Shape a login_accounts row into the mentor detail the FE mentor-detail-workspace expects."""
    if not row:
        return {}
    name = (row.get("name") or
            f"{row.get('first_name') or ''} {row.get('last_name') or ''}".strip() or
            row.get("email") or "")
    role = row.get("role") or "mentor"
    # Derive status — SAME logic as the mentor list (audit.py) so detail + list
    # agree: rejected→suspended, deactivated→paused, invited-but-not-signed-in→
    # pending, otherwise active.
    approval = (row.get("approval_status") or "").lower()
    is_active = row.get("is_active", True)
    if approval == "rejected":
        status = "suspended"
    elif not is_active:
        status = "paused"
    elif not row.get("last_login_at") and (row.get("must_change_password") or approval in ("", "pending")):
        status = "pending"
    else:
        status = "active"
    # roles[] — the primary role + any stored tier variants from the name column
    roles: list[str] = []
    valid_mentor_roles = {"mentor", "mentor.senior", "mentor.lead"}
    if role.lower() in valid_mentor_roles:
        roles = [role.lower()]
    else:
        roles = ["mentor"]
    return {
        "id": str(row["id"]),
        "email": row.get("email"),
        "name": name,
        "firstName": row.get("first_name") or "",
        "lastName": row.get("last_name") or "",
        "role": role,
        "roles": roles,
        "pools": [],
        "status": status,
        "activeSince": row.get("created_at").isoformat() if row.get("created_at") else None,
        "createdAt": row.get("created_at").isoformat() if row.get("created_at") else None,
        "lastLoginAt": row.get("last_login_at").isoformat() if row.get("last_login_at") else None,
        "phone": row.get("phone"),
        "country": row.get("department") or "",
        "competency": [],
        # 30-day counters — not tracked at account level; default 0
        "reviews30d": 0,
        "sessions30d": 0,
        "escalations30d": 0,
        "avgReviewMin": 0,
        "slaHitPct": 0,
    }


def _list_mentor_competency(mentor_id: str) -> list[dict[str, Any]]:
    """Read mentor competency rows from admin_records (kind='mentor_competency')."""
    conn = get_pg_connection()
    with conn.cursor() as cur:
        from psycopg2.extras import RealDictCursor
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            """
            SELECT data FROM admin_records
             WHERE kind = 'mentor_competency'
               AND status != 'deleted'
               AND data->>'mentorId' = %s
             ORDER BY created_at ASC
            """,
            (str(mentor_id),),
        )
        rows = cur.fetchall()
    result = []
    for r in rows:
        d = r.get("data")
        if isinstance(d, str):
            try:
                d = json.loads(d)
            except (ValueError, TypeError):
                d = {}
        if d:
            result.append(d)
    return result


@router.get("/api/superadmin/mentors/{mentor_id}")
async def get_mentor_detail(
    mentor_id: str,
    admin: Annotated[dict, Depends(get_current_admin)],
):
    """Single mentor detail — login_accounts row WHERE role LIKE 'mentor%'."""
    conn = get_pg_connection()
    from psycopg2.extras import RealDictCursor
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        # NOTE: escape the LIKE wildcard as %% — psycopg2 treats a bare % as a
        # parameter placeholder (a single % here caused IndexError).
        cur.execute(
            "SELECT * FROM login_accounts WHERE id = %s AND LOWER(role) LIKE 'mentor%%'",
            (mentor_id,),
        )
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Mentor not found")
    mentor = _mentor_out(row)
    competency = _list_mentor_competency(mentor_id)
    mentor["competency"] = competency
    return {"mentor": mentor, "competency": competency}


# ── POST /api/superadmin/mentors — invite/create a mentor ─────────────────────

_VALID_MENTOR_ROLES = {"mentor", "mentor.senior", "mentor.lead"}


class InviteMentorRequest(BaseModel):
    email: str
    name: str | None = None
    firstName: str | None = None
    lastName: str | None = None
    country: str | None = None
    role: str | None = None            # mentor | mentor.senior | mentor.lead
    roles: list[str] | None = None     # FE sends roles[]; first is the tier
    pools: list[str] | None = None


def _mentor_role_from(body: InviteMentorRequest) -> str:
    candidate = (body.role or (body.roles[0] if body.roles else None) or "mentor").lower()
    return candidate if candidate in _VALID_MENTOR_ROLES else "mentor"


@router.post("/api/superadmin/mentors", status_code=201)
async def invite_mentor(
    body: InviteMentorRequest,
    request: Request,
    admin: Annotated[dict, Depends(get_current_admin)],
):
    """Invite a mentor: create the login_accounts row (role mentor[.tier]),
    email a temp password, force reset on first login. Email must be UNIQUE
    across ALL users (any role/tenant) — reject duplicates."""
    email = (body.email or "").strip().lower()
    if "@" not in email:
        raise HTTPException(status_code=422, detail="A valid email is required")
    if repo.find_account_by_email(email):
        raise HTTPException(
            status_code=409,
            detail="That email is already in use by another user. Emails must be unique across all users — use a different email.",
        )
    role = _mentor_role_from(body)
    first = body.firstName
    last = body.lastName
    if not first and body.name:
        parts = body.name.strip().split(" ", 1)
        first = parts[0]
        last = parts[1] if len(parts) > 1 else ""

    temp = generate_temp_password()
    row = repo.create_account(
        email=email, password_hash=hash_password(temp),
        first_name=first or "", last_name=last or "", role=role,
        department=body.country or None, must_change_password=True,  # forced reset on first login
    )
    email_sent = _email_credentials(name=row.get("name") or email, email=email,
                                    temp_password=temp, role=role)
    publish_event("mentor.invited", {"userId": str(row["id"]), "email": email, "role": role})
    write_audit(actor_id=admin.get("id"), actor_email=admin.get("email"), actor_role=admin.get("role"),
                action="invite_mentor", target=email, target_id=str(row["id"]),
                service="superadmin-service",
                ip_address=request.client.host if request.client else None,
                extra={"role": role, "emailSent": email_sent})
    out = _mentor_out(row)
    out["emailSent"] = email_sent
    if not email_sent:
        out["tempPassword"] = temp  # surface when SMTP unavailable so admin can copy
    return {"mentor": out, **out}


# ── PATCH /api/superadmin/mentors/{id} — status (pause/resume) + role ─────────

class UpdateMentorRequest(BaseModel):
    status: str | None = None          # active | paused
    role: str | None = None            # mentor | mentor.senior | mentor.lead
    roles: list[str] | None = None
    country: str | None = None


@router.patch("/api/superadmin/mentors/{mentor_id}")
async def update_mentor(
    mentor_id: str,
    body: UpdateMentorRequest,
    request: Request,
    admin: Annotated[dict, Depends(get_current_admin)],
):
    """Update a mentor's status (pause/resume → is_active) and/or role tier."""
    from psycopg2.extras import RealDictCursor
    conn = get_pg_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT * FROM login_accounts WHERE id = %s AND LOWER(role) LIKE 'mentor%%'", (mentor_id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Mentor not found")
        sets, params = [], []
        if body.status is not None:
            sets.append("is_active = %s")
            params.append(body.status.lower() not in ("paused", "suspended", "inactive", "closed"))
        if body.role or body.roles:
            new_role = (body.role or (body.roles[0] if body.roles else "mentor")).lower()
            if new_role not in _VALID_MENTOR_ROLES:
                new_role = "mentor"
            sets.append("role = %s")
            params.append(new_role)
        if body.country is not None:
            sets.append("department = %s")
            params.append(body.country)
        if sets:
            sets.append("updated_at = now()")
            params.append(mentor_id)
            cur.execute(f"UPDATE login_accounts SET {', '.join(sets)} WHERE id = %s RETURNING *", tuple(params))
            row = cur.fetchone()
    conn.commit()
    write_audit(actor_id=admin.get("id"), actor_email=admin.get("email"), actor_role=admin.get("role"),
                action="update_mentor", target=row.get("email"), target_id=str(mentor_id),
                service="superadmin-service",
                ip_address=request.client.host if request.client else None,
                extra={"status": body.status, "role": body.role})
    out = _mentor_out(row)
    return {"mentor": out, **out}


# ── PUT /api/superadmin/mentors/{id}/competency — save competency matrix ──────

class SaveCompetencyRequest(BaseModel):
    rows: list[dict[str, Any]]         # MockCompetencyRow[]: {role, skillId, skillName, levels}


@router.put("/api/superadmin/mentors/{mentor_id}/competency")
async def save_mentor_competency(
    mentor_id: str,
    body: SaveCompetencyRequest,
    request: Request,
    admin: Annotated[dict, Depends(get_current_admin)],
):
    """Replace a mentor's competency matrix. Rows are stored in admin_records
    (kind='mentor_competency', data carries mentorId + the row). The previous
    rows are marked deleted (soft) before the new set is written."""
    conn = get_pg_connection()
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM login_accounts WHERE id = %s AND LOWER(role) LIKE 'mentor%%'", (mentor_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Mentor not found")
        # Soft-retire the existing rows, then insert the new set.
        cur.execute(
            "UPDATE admin_records SET status = 'deleted', updated_at = now() "
            "WHERE kind = 'mentor_competency' AND status != 'deleted' AND data->>'mentorId' = %s",
            (str(mentor_id),))
        import uuid as _uuid
        for r in body.rows:
            data = {**r, "mentorId": str(mentor_id)}
            rid = f"mentor_competency_{_uuid.uuid4().hex[:12]}"
            cur.execute(
                "INSERT INTO admin_records (id, kind, status, data, created_at, updated_at) "
                "VALUES (%s, 'mentor_competency', 'active', %s, now(), now())",
                (rid, json.dumps(data)))
    conn.commit()
    write_audit(actor_id=admin.get("id"), actor_email=admin.get("email"), actor_role=admin.get("role"),
                action="save_mentor_competency", target_id=str(mentor_id),
                service="superadmin-service",
                ip_address=request.client.host if request.client else None,
                extra={"rowCount": len(body.rows)})
    return {"competency": _list_mentor_competency(mentor_id)}


# ── POST /api/superadmin/mentors/{id}/resend — re-invite (fresh temp password) ─

@router.post("/api/superadmin/mentors/{mentor_id}/resend")
async def resend_mentor_invite(
    mentor_id: str,
    request: Request,
    admin: Annotated[dict, Depends(get_current_admin)],
):
    """Re-invite a mentor: regenerate a temp password, force reset on next login,
    and email fresh credentials (to the mentor portal). Use when the original
    invite was missed/expired. Returns emailSent (+ tempPassword if SMTP is down)."""
    existing = repo.find_account_by_id(mentor_id)
    if not existing or not str(existing.get("role") or "").lower().startswith("mentor"):
        raise HTTPException(status_code=404, detail="Mentor not found")
    if str(existing.get("email") or "").find(".deleted.") != -1:
        raise HTTPException(status_code=404, detail="Mentor not found")
    return _resend_invite(existing, admin, request)


# ── DELETE /api/superadmin/mentors/{id} — soft offboard (additive-only) ───────

@router.delete("/api/superadmin/mentors/{mentor_id}")
async def delete_mentor(
    mentor_id: str,
    request: Request,
    admin: Annotated[dict, Depends(get_current_admin)],
):
    """Remove a mentor — SOFT delete (never a hard DELETE, per the additive-only
    DB rule). Deactivates the account + tombstones the email
    ('a@b.com' → 'a@b.com.deleted.<ts>') so it leaves the mentor list AND its
    email frees up for reuse. The row is retained (auditable; recoverable by
    stripping the suffix). Also clears any sow_mentor assignment records."""
    from psycopg2.extras import RealDictCursor
    conn = get_pg_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            "SELECT id, email FROM login_accounts "
            "WHERE id = %s AND LOWER(role) LIKE 'mentor%%' AND email NOT LIKE '%%.deleted.%%'",
            (mentor_id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail={"error": "mentor_not_found_or_already_deleted", "mentorId": mentor_id})
        cur.execute(
            "UPDATE login_accounts "
            "   SET is_active = FALSE, "
            "       email = email || '.deleted.' || extract(epoch FROM now())::bigint, "
            "       updated_at = now() "
            " WHERE id = %s",
            (mentor_id,))
        # Best-effort: drop assignment records that reference this mentor's email.
        if row.get("email"):
            cur.execute(
                "DELETE FROM admin_records WHERE kind = 'sow_mentor' AND data::text ILIKE %s",
                (f"%{row['email']}%",))
    conn.commit()
    write_audit(actor_id=admin.get("id"), actor_email=admin.get("email"), actor_role=admin.get("role"),
                action="delete_mentor", target=row.get("email"), target_id=str(mentor_id),
                service="superadmin-service",
                ip_address=request.client.host if request.client else None)
    return {"ok": True, "deleted": True, "id": str(mentor_id)}


# ── GET /api/superadmin/mentors ───────────────────────────────────────────────
# (The list endpoint GET /api/superadmin/mentors lives in audit.py, which returns
# both `mentors` and `items`. Only the detail endpoint above is owned here.)


# ── GET /api/v1/users/search?q= ──────────────────────────────────────────────

@router.get("/api/v1/users/search")
async def search_users(
    q: str = "",
    limit: int = 50,
    admin: Annotated[dict, Depends(get_current_admin)] = None,  # type: ignore[assignment]
):
    """Search login_accounts by email or name (case-insensitive ILIKE)."""
    conn = get_pg_connection()
    from psycopg2.extras import RealDictCursor
    pattern = f"%{q.strip()}%"
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """
            SELECT * FROM login_accounts
             WHERE (email ILIKE %s OR name ILIKE %s
                    OR first_name ILIKE %s OR last_name ILIKE %s)
             ORDER BY created_at DESC
             LIMIT %s
            """,
            (pattern, pattern, pattern, pattern, limit),
        )
        rows = cur.fetchall()
    return {"query": q, "results": [repo.user_out(r) for r in rows], "total": len(rows)}


# ── /api/v1/users/me/profile (GET / PATCH / POST picture) ────────────────────

class UpdateProfileRequest(BaseModel):
    firstName: str | None = None
    lastName: str | None = None
    phone: str | None = None


class ProfilePictureRequest(BaseModel):
    url: str | None = None
    blobRef: str | None = None


@router.get("/api/v1/users/me/profile")
async def get_my_profile(
    user: Annotated[dict, Depends(get_current_user)],
):
    """Return the current user's profile from login_accounts."""
    account_id = user.get("id")
    if not account_id:
        raise HTTPException(status_code=401, detail="Cannot resolve user identity")
    row = repo.find_account_by_id(str(account_id))
    if not row:
        raise HTTPException(status_code=404, detail="Profile not found")
    out = repo.user_out(row)
    # Expose picture_url if present on the row
    out["pictureUrl"] = row.get("picture_url") or row.get("profile_picture_url") or None
    return out


@router.patch("/api/v1/users/me/profile")
async def update_my_profile(
    body: UpdateProfileRequest,
    request: Request,
    user: Annotated[dict, Depends(get_current_user)],
):
    """Update first/last name and phone for the current user."""
    account_id = user.get("id")
    if not account_id:
        raise HTTPException(status_code=401, detail="Cannot resolve user identity")
    row = repo.find_account_by_id(str(account_id))
    if not row:
        raise HTTPException(status_code=404, detail="Profile not found")

    first = body.firstName if body.firstName is not None else row.get("first_name") or ""
    last = body.lastName if body.lastName is not None else row.get("last_name") or ""
    phone = body.phone if body.phone is not None else row.get("phone")
    name = f"{first} {last}".strip() or row.get("email")

    conn = get_pg_connection()
    from psycopg2.extras import RealDictCursor
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """
            UPDATE login_accounts
               SET first_name = %s, last_name = %s, name = %s,
                   phone = %s, updated_at = now()
             WHERE id = %s
             RETURNING *
            """,
            (first, last, name, phone, account_id),
        )
        updated = cur.fetchone()
    conn.commit()

    write_audit(
        actor_id=user.get("id"), actor_email=user.get("email"), actor_role=user.get("role"),
        action="update_profile", target="login_accounts", target_id=str(account_id),
        service="superadmin-service",
        ip_address=request.client.host if request.client else None,
    )
    out = repo.user_out(updated or row)
    out["pictureUrl"] = (updated or row).get("picture_url") or None
    return out


@router.post("/api/v1/users/me/profile-picture")
async def update_profile_picture(
    body: ProfilePictureRequest,
    request: Request,
    user: Annotated[dict, Depends(get_current_user)],
):
    """Store a profile picture URL / blob reference on the current user's account."""
    account_id = user.get("id")
    if not account_id:
        raise HTTPException(status_code=401, detail="Cannot resolve user identity")
    pic_url = body.url or body.blobRef or ""
    if not pic_url:
        raise HTTPException(status_code=422, detail="url or blobRef is required")

    conn = get_pg_connection()
    # picture_url column may not exist yet — use a best-effort UPDATE that adds it
    # via a JSONB merge into the existing data column, or just update if column exists.
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                ALTER TABLE login_accounts
                ADD COLUMN IF NOT EXISTS picture_url TEXT
                """,
            )
        conn.commit()
    except Exception:  # noqa: BLE001
        conn.rollback()

    from psycopg2.extras import RealDictCursor
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """
            UPDATE login_accounts
               SET picture_url = %s, updated_at = now()
             WHERE id = %s
             RETURNING id, email, picture_url
            """,
            (pic_url, account_id),
        )
        updated = cur.fetchone()
    conn.commit()

    write_audit(
        actor_id=user.get("id"), actor_email=user.get("email"), actor_role=user.get("role"),
        action="update_profile_picture", target="login_accounts", target_id=str(account_id),
        service="superadmin-service",
        ip_address=request.client.host if request.client else None,
    )
    return {
        "ok": True,
        "pictureUrl": pic_url,
        "id": str((updated or {}).get("id") or account_id),
    }
