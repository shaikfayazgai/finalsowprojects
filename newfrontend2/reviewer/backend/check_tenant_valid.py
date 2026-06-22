"""Read-only: confirm tnt-fayaz-test-tenant exists and that a reviewer login
token carries tenant_id. Deletes nothing."""
from shared.db import get_pg_connection
from psycopg2.extras import RealDictCursor
from shared.security import decode_token
from auth_app import repo

TID = "tnt-fayaz-test-tenant"
conn = get_pg_connection()
with conn.cursor(cursor_factory=RealDictCursor) as cur:
    for tbl in ("tenants", '"Tenant"'):
        try:
            cur.execute(f"SELECT * FROM {tbl} WHERE id=%s OR id::text=%s LIMIT 1", (TID, TID))
            row = cur.fetchone()
            print(f"=== {tbl}: {'FOUND' if row else 'not found'} ===")
            if row:
                # show a few identifying columns if present
                for k in ("id", "name", "slug", "status", "subscription_tier", "tier"):
                    if k in row:
                        print(f"   {k} = {row[k]!r}")
        except Exception as e:
            conn.rollback()
            print(f"=== {tbl}: query error: {str(e).splitlines()[0]} ===")

# Does the reviewer login token carry tenant_id?
print("\n=== reviewer login token claims ===")
from shared.security import create_access_token
row = repo.find_account_by_email("mychatgptcourse@gmail.com")
# Reproduce the login claim shape the auth router uses.
try:
    from auth_app.routers.auth import _claims
    claims = _claims(row)
except Exception:
    claims = {"sub": str(row["id"]), "email": row["email"], "role": row["role"],
              "tenant_id": row.get("tenant_id")}
tok = create_access_token(claims)
decoded = decode_token(tok)
print(f"   role       = {decoded.get('role')!r}")
print(f"   tenant_id  = {decoded.get('tenant_id')!r}")
print(f"   email      = {decoded.get('email')!r}")
