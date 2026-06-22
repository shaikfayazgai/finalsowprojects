"""Current-user resolver — GET /api/v1/me

Returns the signed-in user, their tenant, and their enterprise role grants in
the `{user, tenant, roles}` shape the frontend's useMe()/useEnterpriseAccess()
expect. The enterprise frontend's route RBAC (canAccessEnterprisePath) is driven
entirely by these roles — without this endpoint every enterprise user falls back
to the conservative `sponsor` default and is bounced off Settings.

Roles are derived from `login_accounts`:
  - department `ent.*`  → that scoped role (e.g. ent.finance from the Team page)
  - role `reviewer`     → ent.reviewer
  - role enterprise/admin/super_admin with no department → ent.admin (tenant owner)
"""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from psycopg2.extras import RealDictCursor

from shared.db import ensure_pg_clean, get_pg_connection
from shared.deps import get_current_user

router = APIRouter(prefix="/api/v1", tags=["me"])


def _derive_role_codes(portal_role: str | None, department: str | None) -> list[str]:
    role = (portal_role or "").lower()
    dept = (department or "").strip()
    if dept.startswith("ent."):
        return [dept]
    if role == "reviewer":
        return ["ent.reviewer"]
    if role in ("enterprise", "admin", "super_admin", "superadmin"):
        # The provisioned enterprise login is the tenant owner/admin.
        return ["ent.admin"]
    return []


def _initials(name: str, email: str) -> str:
    src = name.strip() or email
    parts = [p for p in src.replace("@", " ").split() if p]
    if not parts:
        return "?"
    if len(parts) == 1:
        return parts[0][:2].upper()
    return (parts[0][0] + parts[1][0]).upper()


@router.get("/me")
def get_me(user: Annotated[dict, Depends(get_current_user)]):
    user_id = user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")

    ensure_pg_clean()
    conn = get_pg_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """
            SELECT id, email, name, first_name, last_name, role, department, tenant_id
              FROM login_accounts WHERE id = %s
            """,
            (user_id,),
        )
        acct = cur.fetchone()
        if not acct:
            raise HTTPException(status_code=404, detail="Account not found")

        tenant = None
        tenant_id = acct.get("tenant_id")
        if tenant_id:
            try:
                cur.execute(
                    'SELECT id, slug, name, status FROM "Tenant" WHERE id = %s',
                    (tenant_id,),
                )
                t = cur.fetchone()
                if t:
                    tenant = {
                        "id": t["id"],
                        "slug": t.get("slug") or t["id"],
                        "name": t.get("name") or t["id"],
                        "status": t.get("status") or "active",
                        "accessibility": "open",
                    }
            except Exception:  # noqa: BLE001
                tenant = None
            if tenant is None:
                tenant = {
                    "id": tenant_id, "slug": tenant_id, "name": tenant_id,
                    "status": "active", "accessibility": "open",
                }

    name = acct.get("name") or f'{acct.get("first_name") or ""} {acct.get("last_name") or ""}'.strip()
    email = acct.get("email") or ""
    role_codes = _derive_role_codes(acct.get("role"), acct.get("department"))
    roles = [
        {"code": code, "scope": "enterprise", "tenantId": tenant_id, "grantedAt": ""}
        for code in role_codes
    ]

    return {
        "user": {
            "id": str(acct["id"]),
            "email": email,
            "name": name or email,
            "role": acct.get("role") or "enterprise",
            "initials": _initials(name, email),
        },
        "tenant": tenant,
        "roles": roles,
    }
