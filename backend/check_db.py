from shared.db import get_pg_connection, get_mongo_db
from shared.config import settings

print("=" * 60)
print("NEON POSTGRES — glimmora DB")
print("=" * 60)
conn = get_pg_connection()
with conn.cursor() as cur:
    cur.execute("""
        SELECT tablename,
               (SELECT COUNT(*) FROM information_schema.columns
                WHERE table_name=t.tablename AND table_schema='public') AS cols,
               pg_total_relation_size(quote_ident(tablename)) AS size_bytes
        FROM pg_tables t
        WHERE schemaname='public'
        ORDER BY tablename
    """)
    rows = cur.fetchall()

print(f"Total tables: {len(rows)}")
print(f"{'Table':<45} {'Cols':>4} {'Size':>12}")
print("-" * 64)
for r in rows:
    print(f"{r[0]:<45} {r[1]:>4} {r[2]:>12,}")

# Row counts for key tables
key_tables = [
    "login_accounts", "contributor_profiles", "enterprise_profiles",
    "tenants", "auth_sessions", "platform_settings", "contributor_pricing",
    "email_templates",
]
print()
print("ROW COUNTS (key tables)")
print("-" * 40)
with conn.cursor() as cur:
    for t in key_tables:
        try:
            cur.execute(f"SELECT COUNT(*) FROM {t}")
            count = cur.fetchone()[0]
            print(f"  {t:<38} {count:>6} rows")
        except Exception as e:
            print(f"  {t:<38} ERROR: {e}")
        conn.rollback()

print()
print("=" * 60)
print("MONGODB — glimmora DB")
print("=" * 60)
db = get_mongo_db()
if db is not None:
    colls = db.list_collection_names()
    print(f"Total collections: {len(colls)}")
    for c in sorted(colls):
        count = db[c].count_documents({})
        print(f"  {c:<38} {count:>6} docs")
else:
    print("  MongoDB not connected")
