from shared.security import hash_password
from shared.db import get_pg_connection
from auth_app import repo
EMAIL="reviewer.forced@glimmora.dev"; TEMP="Temp@1234"
r=repo.find_account_by_email(EMAIL)
repo.set_password(str(r["id"]), hash_password(TEMP), clear_must_change=False)
c=get_pg_connection(); cur=c.cursor()
cur.execute("UPDATE login_accounts SET must_change_password=TRUE WHERE id=%s",(r["id"],)); c.commit()
print("armed", EMAIL, "id", r["id"], "temp", TEMP)
