"""Read-only check: are the reviewer accounts connected to a tenant? Lists
reviewer rows, tenant distribution, and any tenant tables. Deletes nothing."""
from shared.db import get_pg_connection
from psycopg2.extras import RealDictCursor

conn = get_pg_connection()
with conn.cursor(cursor_factory=RealDictCursor) as cur:
    print("=== reviewer accounts (login_accounts) ===")
    cur.execute(
        "SELECT id, email, role, tenant_id, approval_status, is_active "
        "FROM login_accounts WHERE role='reviewer' ORDER BY id"
    )
    for r in cur.fetchall():
        print(f"  id={r['id']} {r['email']:35} tenant_id={r['tenant_id']!r} "
              f"approval={r['approval_status']} active={r['is_active']}")

    print("\n=== tenant_id distribution across all accounts ===")
    cur.execute("SELECT tenant_id, count(*) n FROM login_accounts GROUP BY tenant_id ORDER BY n DESC")
    for r in cur.fetchall():
        print(f"  tenant_id={r['tenant_id']!r}  accounts={r['n']}")

    print("\n=== tenant-related tables in DB ===")
    cur.execute(
        "SELECT table_name FROM information_schema.tables "
        "WHERE table_schema='public' AND table_name ILIKE '%tenant%' ORDER BY table_name"
    )
    print("  ", [r["table_name"] for r in cur.fetchall()])

    print("\n=== reviewer_assignments (tenant in JSONB data?) ===")
    cur.execute(
        "SELECT id, reviewer_id, reviewer_email, status, "
        "data->>'tenant' AS tenant, data->>'tenantName' AS tenant_name "
        "FROM reviewer_assignments ORDER BY id DESC LIMIT 10"
    )
    rows = cur.fetchall()
    if not rows:
        print("   (no reviewer_assignments rows yet)")
    for r in rows:
        print(f"   id={r['id']} reviewer_id={r['reviewer_id']} {r['reviewer_email']} "
              f"status={r['status']} tenant={r['tenant']!r}/{r['tenant_name']!r}")
