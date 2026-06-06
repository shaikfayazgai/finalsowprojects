"""
Postgres data-access for the universities service. A university is a tenant
row (tenants.kind='university'); students/faculty are login_accounts scoped by
tenant_id. Optional segment lives in contributor_profiles.segment.

No new tables are created — everything reuses the shared schema.
"""

from __future__ import annotations

import re
from datetime import datetime
from typing import Any

from psycopg2.extras import RealDictCursor

from shared.db import ensure_pg_clean, get_pg_connection

UNIVERSITY_KIND = "university"


def _iso(v: Any) -> str | None:
    if isinstance(v, datetime):
        return v.isoformat()
    return v if v is None else str(v)


def slugify(name: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", (name or "").lower()).strip("-")
    return base or "university"


# ── Tenants (universities) ───────────────────────────────────────────────────

def tenant_row_to_out(row: dict) -> dict:
    return {
        "id": row["id"],
        "name": row["name"],
        "kind": row["kind"],
        "metadata": row.get("metadata") or {},
        "is_active": row["is_active"],
        "created_at": _iso(row.get("created_at")),
    }


def list_universities() -> list[dict]:
    ensure_pg_clean()
    conn = get_pg_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            "SELECT id, name, kind, metadata, is_active, created_at "
            "FROM tenants WHERE kind = %s ORDER BY created_at DESC",
            (UNIVERSITY_KIND,),
        )
        return [tenant_row_to_out(r) for r in cur.fetchall()]


def get_university(tenant_id: str) -> dict | None:
    ensure_pg_clean()
    conn = get_pg_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            "SELECT id, name, kind, metadata, is_active, created_at "
            "FROM tenants WHERE id = %s AND kind = %s",
            (tenant_id, UNIVERSITY_KIND),
        )
        row = cur.fetchone()
    return tenant_row_to_out(row) if row else None


def create_university(*, name: str, tenant_id: str | None, metadata: dict) -> dict:
    import json

    ensure_pg_clean()
    conn = get_pg_connection()
    tid = (tenant_id or slugify(name)).strip()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        # Ensure unique id when auto-slugged.
        cur.execute("SELECT 1 FROM tenants WHERE id = %s", (tid,))
        if cur.fetchone():
            tid = f"{tid}-{int(datetime.utcnow().timestamp())}"
        cur.execute(
            "INSERT INTO tenants (id, name, kind, metadata, is_active) "
            "VALUES (%s, %s, %s, %s::jsonb, TRUE) "
            "RETURNING id, name, kind, metadata, is_active, created_at",
            (tid, name, UNIVERSITY_KIND, json.dumps(metadata or {})),
        )
        row = cur.fetchone()
    conn.commit()
    return tenant_row_to_out(row)


# ── Accounts (students / faculty) ────────────────────────────────────────────

def account_row_to_out(row: dict) -> dict:
    return {
        "id": row["id"],
        "email": row["email"],
        "name": row.get("name") or "",
        "first_name": row.get("first_name") or "",
        "last_name": row.get("last_name") or "",
        "role": row.get("role"),
        "phone": row.get("phone"),
        "tenant_id": row.get("tenant_id"),
        "department": row.get("department"),
        "is_active": row.get("is_active", True),
        "must_change_password": row.get("must_change_password", False),
        "segment": row.get("segment"),
        "created_at": _iso(row.get("created_at")),
    }


_ACCOUNT_SELECT = """
SELECT a.id, a.email, a.name, a.first_name, a.last_name, a.role, a.phone,
       a.tenant_id, a.department, a.is_active, a.must_change_password,
       a.created_at, p.segment
FROM login_accounts a
LEFT JOIN contributor_profiles p ON p.account_id = a.id
"""


def list_accounts(tenant_id: str, role: str) -> list[dict]:
    ensure_pg_clean()
    conn = get_pg_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            _ACCOUNT_SELECT
            + "WHERE a.tenant_id = %s AND a.role = %s ORDER BY a.created_at DESC",
            (tenant_id, role),
        )
        return [account_row_to_out(r) for r in cur.fetchall()]


def get_account(tenant_id: str, account_id: int, role: str | None = None) -> dict | None:
    ensure_pg_clean()
    conn = get_pg_connection()
    sql = _ACCOUNT_SELECT + "WHERE a.id = %s AND a.tenant_id = %s"
    params: list[Any] = [account_id, tenant_id]
    if role is not None:
        sql += " AND a.role = %s"
        params.append(role)
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(sql, params)
        row = cur.fetchone()
    return account_row_to_out(row) if row else None


def email_exists(email: str) -> bool:
    ensure_pg_clean()
    conn = get_pg_connection()
    with conn.cursor() as cur:
        cur.execute("SELECT 1 FROM login_accounts WHERE lower(email) = lower(%s)", (email,))
        return cur.fetchone() is not None


def fetch_existing_emails() -> set[str]:
    ensure_pg_clean()
    conn = get_pg_connection()
    with conn.cursor() as cur:
        cur.execute("SELECT lower(email) FROM login_accounts")
        return {r[0] for r in cur.fetchall()}


def _upsert_segment(cur, account_id: int, segment: str | None) -> None:
    if not segment:
        return
    cur.execute(
        "INSERT INTO contributor_profiles (account_id, segment) VALUES (%s, %s) "
        "ON CONFLICT (account_id) DO UPDATE SET segment = EXCLUDED.segment, "
        "updated_at = now()",
        (account_id, segment),
    )


def create_account(
    *,
    email: str,
    name: str,
    first_name: str,
    last_name: str,
    phone: str | None,
    department: str | None,
    role: str,
    tenant_id: str,
    password_hash: str,
    segment: str | None = None,
) -> dict | None:
    """Insert a login account. Returns the created row, or None on conflict."""
    ensure_pg_clean()
    conn = get_pg_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """
            INSERT INTO login_accounts
                (email, password_hash, provider, first_name, last_name, name,
                 role, phone, tenant_id, department, is_password_set,
                 must_change_password, is_active)
            VALUES (%s, %s, 'password', %s, %s, %s, %s, %s, %s, %s, TRUE, TRUE, TRUE)
            ON CONFLICT (email) DO NOTHING
            RETURNING id
            """,
            (email.lower(), password_hash, first_name, last_name, name,
             role, phone, tenant_id, department),
        )
        row = cur.fetchone()
        if row is None:
            conn.rollback()
            return None
        account_id = row["id"]
        _upsert_segment(cur, account_id, segment)
    conn.commit()
    return get_account(tenant_id, account_id, role)


def update_account(tenant_id: str, account_id: int, fields: dict, segment: str | None) -> dict | None:
    ensure_pg_clean()
    conn = get_pg_connection()
    sets: list[str] = []
    params: list[Any] = []
    for col, val in fields.items():
        sets.append(f"{col} = %s")
        params.append(val)
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        if sets:
            sets.append("updated_at = now()")
            params.extend([account_id, tenant_id])
            cur.execute(
                f"UPDATE login_accounts SET {', '.join(sets)} "
                "WHERE id = %s AND tenant_id = %s RETURNING id",
                params,
            )
            if cur.fetchone() is None:
                conn.rollback()
                return None
        else:
            cur.execute(
                "SELECT 1 FROM login_accounts WHERE id = %s AND tenant_id = %s",
                (account_id, tenant_id),
            )
            if cur.fetchone() is None:
                return None
        if segment is not None:
            _upsert_segment(cur, account_id, segment)
    conn.commit()
    return get_account(tenant_id, account_id)


def delete_account(tenant_id: str, account_id: int) -> bool:
    ensure_pg_clean()
    conn = get_pg_connection()
    with conn.cursor() as cur:
        cur.execute(
            "DELETE FROM login_accounts WHERE id = %s AND tenant_id = %s",
            (account_id, tenant_id),
        )
        deleted = cur.rowcount
    conn.commit()
    return deleted > 0


# ── Dashboard counts ─────────────────────────────────────────────────────────

def dashboard_counts(tenant_id: str, recent_days: int = 30) -> dict:
    ensure_pg_clean()
    conn = get_pg_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """
            SELECT
                count(*) FILTER (WHERE role = 'student')                            AS students,
                count(*) FILTER (WHERE role = 'faculty')                            AS faculty,
                count(*) FILTER (WHERE created_at >= now() - (%s || ' days')::interval) AS recently_onboarded
            FROM login_accounts
            WHERE tenant_id = %s
            """,
            (recent_days, tenant_id),
        )
        row = cur.fetchone() or {}
        cur.execute(
            _ACCOUNT_SELECT
            + "WHERE a.tenant_id = %s ORDER BY a.created_at DESC LIMIT 10",
            (tenant_id,),
        )
        recent = [account_row_to_out(r) for r in cur.fetchall()]
    return {
        "students": int(row.get("students") or 0),
        "faculty": int(row.get("faculty") or 0),
        "recentlyOnboarded": int(row.get("recently_onboarded") or 0),
        "recentAccounts": recent,
    }


def insert_bulk_students(
    *,
    tenant_id: str,
    accounts: list[dict],
) -> tuple[int, list[dict]]:
    """Insert many student accounts (ON CONFLICT DO NOTHING). `accounts` carry
    email, name, first_name, last_name, phone, department, password_hash, segment.
    Returns (inserted_count, inserted_rows[{id,email,name,...}])."""
    ensure_pg_clean()
    conn = get_pg_connection()
    inserted = 0
    inserted_rows: list[dict] = []
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        for a in accounts:
            cur.execute(
                """
                INSERT INTO login_accounts
                    (email, password_hash, provider, first_name, last_name, name,
                     role, phone, tenant_id, department, is_password_set,
                     must_change_password, is_active)
                VALUES (%s, %s, 'password', %s, %s, %s, 'student', %s, %s, %s,
                        TRUE, TRUE, TRUE)
                ON CONFLICT (email) DO NOTHING
                RETURNING id
                """,
                (a["email"].lower(), a["password_hash"], a["first_name"],
                 a["last_name"], a["name"], a.get("phone"), tenant_id,
                 a.get("department")),
            )
            row = cur.fetchone()
            if row is None:
                continue
            inserted += 1
            account_id = row["id"]
            _upsert_segment(cur, account_id, a.get("segment"))
            inserted_rows.append({
                "id": account_id,
                "email": a["email"],
                "name": a["name"],
            })
    conn.commit()
    return inserted, inserted_rows
