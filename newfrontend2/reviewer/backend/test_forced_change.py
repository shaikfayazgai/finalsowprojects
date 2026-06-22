"""Verify forced password change WITHOUT re-entering the temp password.
Uses reviewer.forced@glimmora.dev. Additive; resets the account each run."""
import json, urllib.request, urllib.error
from shared.security import hash_password
from shared.db import get_pg_connection
from auth_app import repo

BASE = "http://127.0.0.1:8105/api/v1"
EMAIL = "reviewer.forced@glimmora.dev"
TEMP = "Temp@1234"
NEW = "BrandNew@2026"


def post(path, body, token=None):
    req = urllib.request.Request(f"{BASE}{path}", data=json.dumps(body).encode(), method="POST")
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req, timeout=25) as r:
            return r.status, json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read() or b"{}")
        except Exception:
            return e.code, {}


# Arm the account: temp password + must_change_password=true
row = repo.find_account_by_email(EMAIL)
repo.set_password(str(row["id"]), hash_password(TEMP), clear_must_change=False)
conn = get_pg_connection()
with conn.cursor() as cur:
    cur.execute("UPDATE login_accounts SET must_change_password=TRUE WHERE id=%s", (row["id"],))
conn.commit()

p = 0; f = 0
def chk(n, c, d=""):
    global p, f
    p += 1 if c else 0; f += 0 if c else 1
    print(f"  [{'PASS' if c else 'FAIL'}] {n}  {d}")

# 1. login with temp -> requiresPasswordChange
s, b = post("/auth/login", {"email": EMAIL, "password": TEMP})
token = b.get("access_token")
chk("login(temp) -> requiresPasswordChange", s == 200 and b.get("user", {}).get("requiresPasswordChange") is True, f"HTTP {s}")

# 2. change password WITHOUT old_password (only new + confirm) using the session token
sc, bc = post("/auth/password/change", {"new_password": NEW, "confirmPassword": NEW}, token=token)
chk("change WITHOUT temp password", sc == 200, f"HTTP {sc} {bc.get('detail','')}")

# 3. new==current rejected (try changing to the SAME new pw again)
s2 = post("/auth/login", {"email": EMAIL, "password": NEW})
tok2 = s2[1].get("access_token")
sr, br = post("/auth/password/change", {"new_password": NEW, "confirmPassword": NEW}, token=tok2)
chk("new==current rejected", sr == 400 and "different" in (br.get("detail", "").lower()), f"HTTP {sr} '{br.get('detail')}'")

# 4. temp no longer works; new works + flag cleared
chk("old temp password fails", post("/auth/login", {"email": EMAIL, "password": TEMP})[0] == 401)
sn, bn = post("/auth/login", {"email": EMAIL, "password": NEW})
chk("new works + flag cleared", sn == 200 and not bn.get("user", {}).get("requiresPasswordChange"), f"HTTP {sn}")

print(f"\n=== {p} PASSED, {f} FAILED ===")
