"""Enterprise tenant team — Settings → Tenant & roles → Team.

Members are login_accounts scoped to the inviting admin's tenant. Inviting
creates the account with a default password (emailed, role-based login link) +
forced first-login reset. Supports resend + status (activate/suspend). Email
must be globally unique across all users.
"""

from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Body, Depends, HTTPException, Request
from pydantic import BaseModel
from psycopg2.extras import RealDictCursor

from shared.audit import write_audit
from shared.db import get_pg_connection
from shared.deps import get_current_user
from shared.security import generate_temp_password, hash_password
from auth_app import repo as auth_repo
# Reuse the credential-email + role→login-URL helpers from the users router.
from superadmin_app.routers.users import _email_credentials, _login_url

router = APIRouter(prefix="/api/v1/enterprise/team", tags=["enterprise-team"])

_ENT_ROLE_LABELS = {
    "ent.admin": "Admin", "ent.sponsor": "Sponsor", "ent.pmo": "PMO",
    "ent.finance": "Finance", "ent.legal": "Legal & compliance",
    "ent.compliance": "Legal & compliance", "ent.reviewer": "Reviewer",
    "ent.it": "Security & IT",
}


def _caller_tenant(user: dict) -> tuple[str, str | None]:
    row = auth_repo.find_account_by_id(user["id"])
    if not row:
        raise HTTPException(status_code=401, detail="Account not found")
    tid = row.get("tenant_id")
    if not tid:
        raise HTTPException(status_code=403, detail="No tenant is associated with this account")
    return tid, row.get("email")


def _ent_code(code: str) -> str:
    """Normalise a role code to its `ent.*` form (reviewer → ent.reviewer)."""
    c = (code or "").strip().lower()
    return c if c.startswith("ent.") else (f"ent.{c}" if c else "")


def _member_out(r: dict[str, Any]) -> dict[str, Any]:
    role = (r.get("role") or "").lower()
    if role.startswith("ent."):
        role_code = role
    elif role.startswith("reviewer"):
        role_code = "ent.reviewer"
    elif role == "enterprise":
        role_code = "ent.admin"   # super-admin-provisioned tenant admin
    else:
        role_code = None
    # All role codes this member holds: the primary plus any extra grants
    # (e.g. a PMO who also reviews) — surfaced as ent.* codes for the Team UI.
    role_codes: list[str] = []
    if role_code:
        role_codes.append(role_code)
    for er in (r.get("extra_roles") or []):
        ec = _ent_code(er)
        if ec and ec not in role_codes:
            role_codes.append(ec)
    must = bool(r.get("must_change_password"))
    last = r.get("last_login_at")
    if not r.get("is_active", True):
        status = "inactive"
    elif must and not last:
        status = "pending_first_login"
    else:
        status = "active"
    return {
        "id": str(r["id"]),
        "email": r.get("email"),
        "name": (f"{r.get('first_name','') or ''} {r.get('last_name','') or ''}".strip() or r.get("email")),
        "portalRole": role.split(".")[0] if "." in role else role,
        "roleCode": role_code,
        "roleCodes": role_codes,
        "roleLabels": [_ENT_ROLE_LABELS.get(c, c) for c in role_codes],
        "roleLabel": _ENT_ROLE_LABELS.get(role_code or ""),
        "department": r.get("department"),
        "active": bool(r.get("is_active", True)),
        "mustChangePassword": must,
        "firstLoginComplete": bool(last),
        "lastLoginAt": last.isoformat() if last else None,
        "status": status,
        "createdAt": r.get("created_at").isoformat() if r.get("created_at") else None,
    }


@router.get("")
async def list_team(user: Annotated[dict, Depends(get_current_user)]):
    """Invited team members of the caller's tenant.

    Excludes tombstoned/offboarded accounts AND the super-admin-provisioned
    tenant **owner** (login role exactly 'enterprise') — the owner is set at
    workspace provisioning, not a manageable team member, so it isn't listed.
    Members invited via this page carry an 'ent.*' role and DO appear.
    """
    tid, _ = _caller_tenant(user)
    conn = get_pg_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            "SELECT * FROM login_accounts WHERE tenant_id = %s "
            "AND email NOT LIKE '%%.deleted.%%' "
            "AND LOWER(role) <> 'enterprise' "
            "ORDER BY created_at ASC",
            (tid,))
        rows = cur.fetchall()
    members = [_member_out(r) for r in rows]
    return {"items": members, "members": members, "total": len(members)}


class InviteMemberRequest(BaseModel):
    email: str
    firstName: str | None = None
    lastName: str | None = None
    name: str | None = None
    roleCode: str | None = None   # ent.admin / ent.sponsor / ent.reviewer / ...


@router.post("", status_code=201)
async def invite_member(
    body: InviteMemberRequest,
    request: Request,
    user: Annotated[dict, Depends(get_current_user)],
):
    """Invite a teammate into the caller's tenant: create the account, email the
    default credentials with the **role-based login link**, force first-login reset.
    Email must be unique across ALL users (409 otherwise)."""
    tid, actor_email = _caller_tenant(user)
    email = (body.email or "").strip().lower()
    if "@" not in email:
        raise HTTPException(status_code=422, detail="A valid email is required")
    if auth_repo.find_account_by_email(email):
        raise HTTPException(
            status_code=409,
            detail="That email is already in use by another user. Emails must be unique across all users.",
        )
    role_code = (body.roleCode or "ent.sponsor").strip().lower()
    if not role_code.startswith("ent.") and not role_code.startswith("reviewer"):
        role_code = f"ent.{role_code}"

    first = body.firstName
    last = body.lastName
    if not first and body.name:
        parts = body.name.strip().split(" ", 1)
        first = parts[0]
        last = parts[1] if len(parts) > 1 else ""

    temp = generate_temp_password()
    row = auth_repo.create_account(
        email=email, password_hash=hash_password(temp),
        first_name=first or "", last_name=last or "", role=role_code,
        provider="password", email_verified=True,
        tenant_id=tid, must_change_password=True,
    )
    # Role-based login link in the email (ent.* → enterprise portal; reviewer →
    # reviewer portal) via _login_url(role).
    email_sent = _email_credentials(name=row.get("name") or email, email=email,
                                    temp_password=temp, role=role_code)
    write_audit(actor_id=user.get("id"), actor_email=actor_email, actor_role="enterprise",
                action="invite_team_member", target=email, target_id=str(row["id"]),
                service="superadmin-service",
                ip_address=request.client.host if request.client else None,
                extra={"roleCode": role_code, "emailSent": email_sent})
    out = _member_out(row)
    out["emailSent"] = email_sent
    if not email_sent:
        out["tempPassword"] = temp
    return out


@router.post("/{member_id}/resend")
async def resend_member(
    member_id: str,
    request: Request,
    user: Annotated[dict, Depends(get_current_user)],
):
    """Regenerate a temp password for a member + re-email role-based credentials."""
    tid, actor_email = _caller_tenant(user)
    m = auth_repo.find_account_by_id(member_id)
    if not m or m.get("tenant_id") != tid:
        raise HTTPException(status_code=404, detail="Member not found")
    temp = generate_temp_password()
    auth_repo.set_temp_password(str(m["id"]), hash_password(temp))
    sent = _email_credentials(name=m.get("name") or m.get("email"), email=m["email"],
                              temp_password=temp, role=m.get("role"))
    write_audit(actor_id=user.get("id"), actor_email=actor_email, actor_role="enterprise",
                action="resend_team_member", target=m.get("email"), target_id=str(member_id),
                service="superadmin-service",
                ip_address=request.client.host if request.client else None,
                extra={"emailSent": sent})
    out = _member_out(auth_repo.find_account_by_id(member_id) or m)
    out["emailSent"] = sent
    if not sent:
        out["tempPassword"] = temp
    return out


class StatusRequest(BaseModel):
    status: str | None = None     # active | inactive | suspended
    active: bool | None = None


@router.post("/{member_id}/status")
async def member_status(
    member_id: str,
    user: Annotated[dict, Depends(get_current_user)],
    body: StatusRequest = Body(...),
):
    """Activate / suspend a member."""
    tid, _ = _caller_tenant(user)
    m = auth_repo.find_account_by_id(member_id)
    if not m or m.get("tenant_id") != tid:
        raise HTTPException(status_code=404, detail="Member not found")
    if body.active is not None:
        active = body.active
    else:
        active = (body.status or "").lower() not in ("inactive", "suspended", "paused")
    conn = get_pg_connection()
    with conn.cursor() as cur:
        cur.execute("UPDATE login_accounts SET is_active = %s, updated_at = now() WHERE id = %s",
                    (active, member_id))
    conn.commit()
    return _member_out(auth_repo.find_account_by_id(member_id) or m)


class SetRolesRequest(BaseModel):
    roleCodes: list[str] = []


@router.post("/{member_id}/roles")
async def set_member_roles(
    member_id: str,
    request: Request,
    user: Annotated[dict, Depends(get_current_user)],
    body: SetRolesRequest = Body(...),
):
    """Set a member's roles. A person can hold several (e.g. PMO + Reviewer):
    one enterprise role stays PRIMARY (drives portal routing → dashboard) and the
    rest are stored as extra grants, both surfaced via /me + the Team list."""
    tid, actor_email = _caller_tenant(user)
    m = auth_repo.find_account_by_id(member_id)
    if (not m or m.get("tenant_id") != tid
            or (m.get("role") or "").lower() == "enterprise"   # owner isn't editable here
            or ".deleted." in str(m.get("email") or "")):
        raise HTTPException(status_code=404, detail="Member not found")
    # Normalise selected codes to short form (strip 'ent.'), de-duped.
    shorts: list[str] = []
    for c in body.roleCodes:
        s = (c or "").strip().lower()
        s = s[4:] if s.startswith("ent.") else s
        if s and s not in shorts:
            shorts.append(s)
    if not shorts:
        raise HTTPException(status_code=422, detail="Select at least one role")
    # Keep an enterprise-area role PRIMARY so the member still lands on the
    # dashboard; reviewer (and any others) ride along as extra grants.
    if "admin" in shorts:
        primary = "admin"
    else:
        non_reviewer = [s for s in shorts if s != "reviewer"]
        primary = non_reviewer[0] if non_reviewer else "reviewer"
    extras = [s for s in shorts if s != primary]
    primary_role = f"ent.{primary}"
    conn = get_pg_connection()
    with conn.cursor() as cur:
        cur.execute(
            "UPDATE login_accounts SET role = %s, extra_roles = %s::text[], updated_at = now() "
            "WHERE id = %s",
            (primary_role, extras, member_id))
    conn.commit()
    write_audit(actor_id=user.get("id"), actor_email=actor_email, actor_role="enterprise",
                action="set_member_roles", target=m.get("email"), target_id=member_id,
                tenant_id=tid, service="superadmin-service",
                ip_address=request.client.host if request.client else None,
                extra={"roleCodes": shorts, "primary": primary_role, "extra": extras})
    return _member_out(auth_repo.find_account_by_id(member_id) or m)


@router.delete("/{member_id}")
async def delete_member(
    member_id: str,
    request: Request,
    user: Annotated[dict, Depends(get_current_user)],
):
    """Remove a team member — SOFT delete (additive-only rule): deactivate +
    tombstone the email so they leave the roster AND their email frees up for
    reuse. The row is retained (auditable; recoverable by stripping the suffix)."""
    tid, actor_email = _caller_tenant(user)
    m = auth_repo.find_account_by_id(member_id)
    if not m or m.get("tenant_id") != tid or ".deleted." in str(m.get("email") or ""):
        raise HTTPException(status_code=404, detail="Member not found")
    conn = get_pg_connection()
    with conn.cursor() as cur:
        cur.execute(
            "UPDATE login_accounts "
            "   SET is_active = FALSE, "
            "       email = email || '.deleted.' || extract(epoch FROM now())::bigint, "
            "       updated_at = now() "
            " WHERE id = %s",
            (member_id,))
    conn.commit()
    write_audit(actor_id=user.get("id"), actor_email=actor_email, actor_role="enterprise",
                action="delete_team_member", target=m.get("email"), target_id=str(member_id),
                service="superadmin-service",
                ip_address=request.client.host if request.client else None)
    return {"ok": True, "deleted": True, "id": str(member_id)}
