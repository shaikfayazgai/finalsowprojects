"""Enterprise Team — /api/v1/enterprise/team

Lets an enterprise admin provision team members (reviewer, PMO, finance,
IT/security, compliance/legal, sponsor) UNDER THEIR OWN TENANT. Mirrors the
super-admin user-creation pattern but is tenant-scoped:

  - writes a `login_accounts` row with a temp password + must_change_password
    so the member is forced through the existing reset flow on first login
  - emails the credentials (best-effort) and returns the temp password to the
    admin when email is unavailable
  - the member then signs in via the existing login flow → onboarding
    (this module builds NO login of its own)

Mentor creation is intentionally NOT offered here — mentors are provisioned by
the super-admin (platform), per the SOW delivery flow.
"""

from __future__ import annotations

import logging
from typing import Annotated, Any

from fastapi import APIRouter, Body, Depends, HTTPException
from psycopg2.extras import RealDictCursor

from shared.audit import write_audit
from shared.config import settings
from shared.db import ensure_pg_clean, get_pg_connection
from shared.deps import get_current_user
from shared.kafka_bus import publish_event
from shared.mailer import build_credentials_body, send_email
from shared.security import generate_temp_password, hash_password

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/enterprise/team", tags=["enterprise-team"])


def _login_url() -> str:
    """Absolute enterprise-login URL for emails. A relative path renders as a
    broken link and trips spam filters (which is why HTML credential emails were
    landing in spam while plain-text OTPs reached the inbox)."""
    import os
    base = (os.getenv("FRONTEND_BASE_URL") or settings.frontend_base_url or "http://localhost:3000").rstrip("/")
    return f"{base}/enterprise/login"


def _is_owner_admin(row: dict) -> bool:
    """True for the tenant owner / enterprise admin accounts — they manage the
    team and shouldn't appear in the member directory they administer."""
    dept = (row.get("department") or "").strip()
    role = (row.get("role") or "").lower()
    return role in ("enterprise", "admin", "super_admin") and dept in ("", "ent.admin")

# Roles an enterprise admin may create, mapped to the legacy portal `role` the
# existing login + middleware understand. The scoped `ent.*` code is stored on
# `department` so the Team list can show the member's function (and it can later
# drive richer RBAC). Reviewers get their own sub-portal; everyone else lands in
# the enterprise portal.
CREATABLE_ROLES: dict[str, dict[str, str]] = {
    "ent.reviewer":    {"portal": "reviewer",   "label": "Reviewer"},
    "ent.pmo":         {"portal": "enterprise",  "label": "PMO / Project Manager"},
    "ent.finance":     {"portal": "enterprise",  "label": "Finance"},
    "ent.it":          {"portal": "enterprise",  "label": "IT / Security"},
    "ent.compliance":  {"portal": "enterprise",  "label": "Compliance / Legal"},
    "ent.sponsor":     {"portal": "enterprise",  "label": "Business Sponsor"},
    "ent.procurement": {"portal": "enterprise",  "label": "Procurement"},
    "ent.admin":       {"portal": "enterprise",  "label": "Enterprise Admin"},
}

_ADMIN_ROLES = {"enterprise", "admin", "super_admin", "ent.admin"}


def _email_taken(cur, email: str) -> str | None:
    """Return a human label if `email` already belongs to ANY user anywhere on
    the platform — across all tenants and roles (contributor, mentor, reviewer,
    enterprise, super-admin) and the parallel user/workforce/invite tables —
    so a member's email is globally unique. Case-insensitive. Missing tables are
    ignored so this is safe across environments."""
    checks = [
        ("login_accounts", "an existing account"),          # all roles, all tenants
        ('"User"', "an existing user"),                       # Prisma user table
        ("enterprise_workforce_members", "a workforce member"),
        ("reviewer_invites", "a pending reviewer invite"),
    ]
    for table, label in checks:
        try:
            cur.execute(f"SELECT 1 FROM {table} WHERE lower(email) = lower(%s) LIMIT 1", (email,))
            if cur.fetchone():
                return label
        except Exception:  # noqa: BLE001 — table may not exist in this env
            cur.connection.rollback()
    return None


def _require_enterprise_admin(user: dict) -> str:
    """Return the caller's tenant_id, or 403 if they can't manage a tenant."""
    role = (user.get("role") or "").lower()
    if role not in _ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Only an enterprise admin can manage team members.")
    tenant_id = user.get("tenant_id")
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Your account is not linked to a tenant.")
    return tenant_id


def _row_out(row: dict) -> dict[str, Any]:
    dept = row.get("department")
    must_change = row.get("must_change_password", False)
    last_login = row.get("last_login_at")
    is_active = row.get("is_active", True)
    # First-login status: a member still flagged must_change_password hasn't set
    # their own password yet → "invited / pending first login". Once they reset
    # it (flag cleared, login recorded) they're "active".
    if not is_active:
        status = "inactive"
    elif must_change:
        status = "pending_first_login"
    else:
        status = "active"
    return {
        "id": str(row["id"]),
        "email": row["email"],
        "name": row.get("name") or f'{row.get("first_name") or ""} {row.get("last_name") or ""}'.strip(),
        "firstName": row.get("first_name"),
        "lastName": row.get("last_name"),
        "portalRole": row.get("role"),
        "roleCode": dept if dept in CREATABLE_ROLES else None,
        "roleLabel": CREATABLE_ROLES.get(dept, {}).get("label") if dept else None,
        "department": dept,
        "tenantId": row.get("tenant_id"),
        "active": is_active,
        "mustChangePassword": must_change,
        "firstLoginComplete": (not must_change) and last_login is not None,
        "lastLoginAt": last_login.isoformat() if last_login else None,
        "status": status,
        "approvalStatus": row.get("approval_status"),
        "createdAt": row.get("created_at").isoformat() if row.get("created_at") else None,
    }


@router.get("")
def list_team(user: Annotated[dict, Depends(get_current_user)]):
    """List all team members provisioned under the caller's tenant."""
    tenant_id = _require_enterprise_admin(user)
    ensure_pg_clean()
    conn = get_pg_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """
            SELECT id, email, name, first_name, last_name, role, department,
                   tenant_id, is_active, must_change_password, approval_status,
                   last_login_at, created_at
              FROM login_accounts
             WHERE tenant_id = %s
             ORDER BY created_at DESC
            """,
            (tenant_id,),
        )
        rows = cur.fetchall()
    # Hide the tenant owner / admin accounts — the admin manages the team and
    # isn't a "managed" member of it.
    members = [r for r in rows if not _is_owner_admin(r)]
    return {"items": [_row_out(r) for r in members], "total": len(members)}


@router.post("")
def create_member(
    user: Annotated[dict, Depends(get_current_user)],
    body: dict = Body(...),
):
    """Create a team member under the caller's tenant with a temp password +
    forced reset. Emails the credentials (best-effort)."""
    tenant_id = _require_enterprise_admin(user)

    email = (body.get("email") or "").strip().lower()
    first = (body.get("firstName") or "").strip()
    last = (body.get("lastName") or "").strip()
    role_code = (body.get("roleCode") or "").strip()

    if not email or "@" not in email:
        raise HTTPException(status_code=422, detail="A valid email is required.")
    if role_code not in CREATABLE_ROLES:
        raise HTTPException(status_code=422, detail=f"Role must be one of: {', '.join(CREATABLE_ROLES)}")
    if not first:
        raise HTTPException(status_code=422, detail="First name is required.")

    portal_role = CREATABLE_ROLES[role_code]["portal"]
    name = f"{first} {last}".strip()
    temp_password = generate_temp_password()
    password_hash = hash_password(temp_password)

    ensure_pg_clean()
    conn = get_pg_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        taken = _email_taken(cur, email)
        if taken:
            raise HTTPException(
                status_code=409,
                detail=f"That email is already in use by {taken}. Emails must be unique across all users.",
            )
        cur.execute(
            """
            INSERT INTO login_accounts
                (email, password_hash, provider, first_name, last_name, name, role,
                 department, tenant_id, email_verified, is_password_set,
                 must_change_password, approval_status)
            VALUES (%s,%s,'password',%s,%s,%s,%s,%s,%s,TRUE,TRUE,TRUE,'approved')
            RETURNING id, email, name, first_name, last_name, role, department,
                      tenant_id, is_active, must_change_password, approval_status, created_at
            """,
            (email, password_hash, first, last, name, portal_role, role_code, tenant_id),
        )
        row = cur.fetchone()
    conn.commit()

    # Email the credentials SYNCHRONOUSLY so the admin gets a real sent/failed
    # result (background tasks failed silently). ~SMTP latency is acceptable for
    # a one-off invite.
    text, html = build_credentials_body(
        name=name or email, email=email, temp_password=temp_password,
        login_url=_login_url(), org_name="Glimmora",
    )
    email_sent = False
    try:
        email_sent = bool(send_email(
            to_email=email,
            subject="Your Glimmora enterprise account credentials",
            body=text, html=html,
        ))
    except Exception as exc:  # noqa: BLE001
        logger.warning("[team] credentials email failed for %s: %s", email, exc)
        email_sent = False

    publish_event("enterprise.team_member.created",
                  {"userId": str(row["id"]), "email": email, "roleCode": role_code, "tenantId": tenant_id})
    write_audit(actor_id=user.get("id"), actor_email=user.get("email"), actor_role=user.get("role"),
                action="create_team_member", target=email, target_id=str(row["id"]),
                service="enterprise-service",
                extra={"roleCode": role_code, "portalRole": portal_role, "tenantId": tenant_id, "emailSent": email_sent})

    out = _row_out(row)
    out["tempPassword"] = temp_password
    out["emailSent"] = email_sent
    return out


@router.post("/{member_id}/resend")
def resend_credentials(
    member_id: str,
    user: Annotated[dict, Depends(get_current_user)],
):
    """Regenerate a temp password for an existing team member and re-email the
    credentials. Forces another password reset on next login. Tenant-scoped."""
    tenant_id = _require_enterprise_admin(user)

    new_temp = generate_temp_password()
    new_hash = hash_password(new_temp)

    ensure_pg_clean()
    conn = get_pg_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        # Only allow resetting members of the caller's own tenant.
        cur.execute(
            "SELECT id, email, name, first_name, last_name, role, department, tenant_id "
            "FROM login_accounts WHERE id = %s AND tenant_id = %s",
            (member_id, tenant_id),
        )
        acct = cur.fetchone()
        if not acct:
            raise HTTPException(status_code=404, detail="Member not found in your tenant.")
        cur.execute(
            "UPDATE login_accounts SET password_hash = %s, is_password_set = TRUE, "
            "must_change_password = TRUE, updated_at = now() WHERE id = %s",
            (new_hash, member_id),
        )
    conn.commit()

    name = acct.get("name") or acct.get("email")
    email = acct["email"]
    text, html = build_credentials_body(
        name=name or email, email=email, temp_password=new_temp,
        login_url=_login_url(), org_name="Glimmora",
    )
    email_sent = False
    try:
        email_sent = bool(send_email(
            to_email=email,
            subject="Your Glimmora enterprise credentials (reset)",
            body=text, html=html,
        ))
    except Exception as exc:  # noqa: BLE001
        logger.warning("[team] resend email failed for %s: %s", email, exc)
        email_sent = False

    write_audit(actor_id=user.get("id"), actor_email=user.get("email"), actor_role=user.get("role"),
                action="resend_team_credentials", target=email, target_id=str(member_id),
                service="enterprise-service", extra={"tenantId": tenant_id, "emailSent": email_sent})

    return {"id": str(member_id), "email": email, "tempPassword": new_temp, "emailSent": email_sent}


@router.delete("/{member_id}")
def delete_member(
    member_id: str,
    user: Annotated[dict, Depends(get_current_user)],
):
    """Permanently delete a team member's login account (HARD delete).
    Tenant-scoped; an admin cannot delete their own account."""
    tenant_id = _require_enterprise_admin(user)
    if str(user.get("id")) == str(member_id):
        raise HTTPException(status_code=400, detail="You can't delete your own account.")

    ensure_pg_clean()
    conn = get_pg_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            "SELECT id, email FROM login_accounts WHERE id = %s AND tenant_id = %s",
            (member_id, tenant_id),
        )
        acct = cur.fetchone()
        if not acct:
            raise HTTPException(status_code=404, detail="Member not found in your tenant.")
        cur.execute(
            "DELETE FROM login_accounts WHERE id = %s AND tenant_id = %s",
            (member_id, tenant_id),
        )
    conn.commit()

    write_audit(actor_id=user.get("id"), actor_email=user.get("email"), actor_role=user.get("role"),
                action="delete_team_member", target=acct["email"], target_id=str(member_id),
                service="enterprise-service", extra={"tenantId": tenant_id})

    return {"id": str(member_id), "email": acct["email"], "deleted": True}


@router.post("/{member_id}/status")
def set_member_status(
    member_id: str,
    user: Annotated[dict, Depends(get_current_user)],
    body: dict = Body(...),
):
    """Activate / deactivate a team member. Deactivating only flips is_active
    (no row is deleted) so the member can be re-enabled later. Tenant-scoped."""
    tenant_id = _require_enterprise_admin(user)
    active = bool(body.get("active", True))

    ensure_pg_clean()
    conn = get_pg_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            "UPDATE login_accounts SET is_active = %s, updated_at = now() "
            "WHERE id = %s AND tenant_id = %s "
            "RETURNING id, email, name, first_name, last_name, role, department, "
            "tenant_id, is_active, must_change_password, approval_status, "
            "last_login_at, created_at",
            (active, member_id, tenant_id),
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Member not found in your tenant.")
    conn.commit()

    write_audit(actor_id=user.get("id"), actor_email=user.get("email"), actor_role=user.get("role"),
                action="set_team_member_status", target=row["email"], target_id=str(member_id),
                service="enterprise-service", extra={"active": active, "tenantId": tenant_id})

    return _row_out(row)
