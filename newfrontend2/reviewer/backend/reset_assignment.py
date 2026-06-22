from shared.db import get_pg_connection
c = get_pg_connection()
cur = c.cursor()
cur.execute("UPDATE reviewer_assignments SET status='pending', updated_at=now() WHERE id=1")
c.commit()
print("reset assignment id=1 to pending; rows affected:", cur.rowcount)
