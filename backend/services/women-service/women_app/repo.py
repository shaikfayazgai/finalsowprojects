"""
Data-access helpers for the women-team service.

A women's team is a tenant (tenants.kind='women_team'). Members are
login_accounts with role='contributor' + tenant_id set, plus a
contributor_profiles row with segment='women'.

All access goes through shared tables; no new tables are created here.
"""

from __future__ import annotations

import secrets
from typing import Any

from psycopg2.extras import RealDictCursor

from shared.db import ensure_pg_clean, get_pg_connection

WOMEN_TEAM_KIND = "women_team"
WOMEN_SEGMENT = "women"
CONTRIBUTOR_ROLE = "contributor"


def _conn():
    ensure_pg_clean()
    return get_pg_connection()


# ── Tenants (women teams) ────────────────────────────────────────────────────

def _gen_tenant_id(name: str) -> str:
    slug = "".join(c for c in (name or "").lower().replace(" ", "-") if c.isalnum() or c == "-")[:24]
    return f"wt_{slug or 'team'}_{secrets.token_hex(3)}"


def list_teams() -> list[dict[str, Any]]:
    conn = _conn()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """
            SELECT t.id, t.name, t.kind, t.metadata, t.is_active, t.created_at,
                   COALESCE(m.member_count, 0) AS member_count
              FROM tenants t
              LEFT JOIN (
                    SELECT tenant_id, COUNT(*) AS member_count
                      FROM login_accounts
                     WHERE role = %s AND tenant_id IS NOT NULL
                     GROUP BY tenant_id
              ) m ON m.tenant_id = t.id
             WHERE t.kind = %s
             ORDER BY t.created_at DESC
            """,
            (CONTRIBUTOR_ROLE, WOMEN_TEAM_KIND),
        )
        return list(cur.fetchall())


def get_team(tenant_id: str) -> dict[str, Any] | None:
    conn = _conn()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            "SELECT id, name, kind, metadata, is_active, created_at "
            "FROM tenants WHERE id = %s AND kind = %s",
            (tenant_id, WOMEN_TEAM_KIND),
        )
        return cur.fetchone()


def create_team(name: str, metadata: dict[str, Any] | None = None,
                supplied_id: str | None = None) -> dict[str, Any]:
    import json

    conn = _conn()
    tenant_id = supplied_id.strip() if supplied_id and supplied_id.strip() else _gen_tenant_id(name)
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """
            INSERT INTO tenants (id, name, kind, metadata, is_active)
            VALUES (%s, %s, %s, %s::jsonb, TRUE)
            RETURNING id, name, kind, metadata, is_active, created_at
            """,
            (tenant_id, name, WOMEN_TEAM_KIND, json.dumps(metadata or {})),
        )
        row = cur.fetchone()
    conn.commit()
    return row


# ── Members (contributors in the 'women' segment, scoped to a tenant) ────────

_MEMBER_SELECT = """
    SELECT la.id, la.email, la.first_name, la.last_name, la.name, la.role,
           la.phone, la.tenant_id, la.department, la.is_active,
           la.must_change_password, la.last_login_at, la.created_at,
           cp.segment, cp.job_title, cp.linkedin, cp.country,
           cp.primary_skills, cp.career_stage
      FROM login_accounts la
      LEFT JOIN contributor_profiles cp ON cp.account_id = la.id
"""


def list_members(tenant_id: str) -> list[dict[str, Any]]:
    conn = _conn()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            _MEMBER_SELECT + " WHERE la.tenant_id = %s AND la.role = %s ORDER BY la.created_at DESC",
            (tenant_id, CONTRIBUTOR_ROLE),
        )
        return list(cur.fetchall())


def get_member(tenant_id: str, member_id: int) -> dict[str, Any] | None:
    conn = _conn()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            _MEMBER_SELECT + " WHERE la.id = %s AND la.tenant_id = %s AND la.role = %s",
            (member_id, tenant_id, CONTRIBUTOR_ROLE),
        )
        return cur.fetchone()


def find_emails(emails: list[str]) -> set[str]:
    """Return the subset of `emails` that already exist (lower-cased)."""
    if not emails:
        return set()
    conn = _conn()
    lowered = [e.lower() for e in emails]
    with conn.cursor() as cur:
        cur.execute(
            "SELECT LOWER(email) FROM login_accounts WHERE LOWER(email) = ANY(%s)",
            (lowered,),
        )
        return {r[0] for r in cur.fetchall()}


def all_existing_emails() -> set[str]:
    conn = _conn()
    with conn.cursor() as cur:
        cur.execute("SELECT LOWER(email) FROM login_accounts")
        return {r[0] for r in cur.fetchall()}


def create_member(
    *,
    tenant_id: str,
    email: str,
    first_name: str,
    last_name: str,
    password_hash: str | None,
    phone: str | None = None,
    department: str | None = None,
    must_change_password: bool = True,
    profile: dict[str, Any] | None = None,
) -> dict[str, Any] | None:
    """Insert a login_account + women-segment contributor_profile.
    Returns the created member row, or None if the email already existed."""
    conn = _conn()
    name = f"{first_name} {last_name}".strip()
    profile = profile or {}
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """
            INSERT INTO login_accounts
                (email, password_hash, provider, first_name, last_name, name, role,
                 phone, tenant_id, department, is_password_set, must_change_password)
            VALUES (%s,%s,'password',%s,%s,%s,%s,%s,%s,%s,%s,%s)
            ON CONFLICT (email) DO NOTHING
            RETURNING id
            """,
            (
                email.lower(), password_hash, first_name, last_name, name,
                CONTRIBUTOR_ROLE, phone, tenant_id, department,
                password_hash is not None, must_change_password,
            ),
        )
        inserted = cur.fetchone()
        if not inserted:
            conn.rollback()
            return None
        account_id = inserted["id"]
        cur.execute(
            """
            INSERT INTO contributor_profiles
                (account_id, segment, job_title, country, linkedin,
                 primary_skills, career_stage, department_category)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (account_id) DO UPDATE SET segment = EXCLUDED.segment
            """,
            (
                account_id, WOMEN_SEGMENT, profile.get("jobTitle"),
                profile.get("country"), profile.get("linkedin"),
                profile.get("primarySkills") or [], profile.get("careerStage"),
                department,
            ),
        )
    conn.commit()
    return get_member(tenant_id, account_id)


def bulk_insert_member(
    cur,
    *,
    tenant_id: str,
    email: str,
    first_name: str,
    last_name: str,
    password_hash: str,
    phone: str | None,
    department: str | None,
) -> int | None:
    """Insert one member using an existing cursor (caller manages the transaction).
    ON CONFLICT DO NOTHING + must_change_password=TRUE. Returns account_id or None."""
    name = f"{first_name} {last_name}".strip()
    cur.execute(
        """
        INSERT INTO login_accounts
            (email, password_hash, provider, first_name, last_name, name, role,
             phone, tenant_id, department, is_password_set, must_change_password)
        VALUES (%s,%s,'password',%s,%s,%s,%s,%s,%s,%s,TRUE,TRUE)
        ON CONFLICT (email) DO NOTHING
        RETURNING id
        """,
        (email.lower(), password_hash, first_name, last_name, name,
         CONTRIBUTOR_ROLE, phone, tenant_id, department),
    )
    row = cur.fetchone()
    if not row:
        return None
    account_id = row["id"] if isinstance(row, dict) else row[0]
    cur.execute(
        """
        INSERT INTO contributor_profiles (account_id, segment, department_category)
        VALUES (%s, %s, %s)
        ON CONFLICT (account_id) DO UPDATE SET segment = EXCLUDED.segment
        """,
        (account_id, WOMEN_SEGMENT, department),
    )
    return account_id


def update_member(tenant_id: str, member_id: int, fields: dict[str, Any]) -> dict[str, Any] | None:
    """Patch allowed login_account columns; returns the updated member or None."""
    column_map = {
        "firstName": "first_name",
        "lastName": "last_name",
        "phone": "phone",
        "department": "department",
        "isActive": "is_active",
    }
    sets: list[str] = []
    values: list[Any] = []
    for key, col in column_map.items():
        if key in fields and fields[key] is not None:
            sets.append(f"{col} = %s")
            values.append(fields[key])
    if "firstName" in fields or "lastName" in fields:
        sets.append("name = TRIM(CONCAT(first_name, ' ', last_name))")

    conn = _conn()
    if sets:
        with conn.cursor() as cur:
            sets.append("updated_at = now()")
            cur.execute(
                f"UPDATE login_accounts SET {', '.join(sets)} "
                "WHERE id = %s AND tenant_id = %s AND role = %s",
                (*values, member_id, tenant_id, CONTRIBUTOR_ROLE),
            )
        conn.commit()

    # contributor_profiles patch
    profile_map = {"jobTitle": "job_title", "linkedin": "linkedin",
                   "country": "country", "careerStage": "career_stage"}
    psets: list[str] = []
    pvalues: list[Any] = []
    for key, col in profile_map.items():
        if key in fields and fields[key] is not None:
            psets.append(f"{col} = %s")
            pvalues.append(fields[key])
    if psets:
        with conn.cursor() as cur:
            psets.append("updated_at = now()")
            cur.execute(
                f"UPDATE contributor_profiles SET {', '.join(psets)} WHERE account_id = %s",
                (*pvalues, member_id),
            )
        conn.commit()

    return get_member(tenant_id, member_id)


def delete_member(tenant_id: str, member_id: int) -> bool:
    conn = _conn()
    with conn.cursor() as cur:
        cur.execute(
            "DELETE FROM login_accounts WHERE id = %s AND tenant_id = %s AND role = %s",
            (member_id, tenant_id, CONTRIBUTOR_ROLE),
        )
        deleted = cur.rowcount
    conn.commit()
    return deleted > 0


def dashboard_counts(tenant_id: str) -> dict[str, Any]:
    conn = _conn()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """
            SELECT
                COUNT(*)                                                   AS total_members,
                COUNT(*) FILTER (WHERE is_active)                          AS active_members,
                COUNT(*) FILTER (WHERE last_login_at IS NOT NULL)          AS logged_in_members,
                COUNT(*) FILTER (WHERE must_change_password)               AS pending_first_login,
                COUNT(*) FILTER (WHERE created_at > now() - interval '7 days')  AS onboarded_last_7d,
                COUNT(*) FILTER (WHERE created_at > now() - interval '30 days') AS onboarded_last_30d
              FROM login_accounts
             WHERE tenant_id = %s AND role = %s
            """,
            (tenant_id, CONTRIBUTOR_ROLE),
        )
        return dict(cur.fetchone() or {})


def recent_members(tenant_id: str, limit: int = 10) -> list[dict[str, Any]]:
    conn = _conn()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            "SELECT id, email, name, created_at, must_change_password, last_login_at "
            "FROM login_accounts WHERE tenant_id = %s AND role = %s "
            "ORDER BY created_at DESC LIMIT %s",
            (tenant_id, CONTRIBUTOR_ROLE, limit),
        )
        return list(cur.fetchall())
