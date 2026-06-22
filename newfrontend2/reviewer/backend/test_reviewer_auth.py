"""Verification harness for the reviewer auth + forgot-password conditions.

Exercises the running backend on :8105 (start it with OTP_DEV_ECHO=1 so the OTP
is echoed in the response). Idempotent + additive: it creates a dedicated
forced-reset test account if missing and restores the main test account's
password at the end. Deletes nothing.

Run from backend/:  python test_reviewer_auth.py
"""

from __future__ import annotations

import time
import urllib.request
import urllib.error
import json

from shared.security import hash_password
from auth_app import repo

BASE = "http://127.0.0.1:8105/api/v1"
MAIN_EMAIL = "mychatgptcourse@gmail.com"
MAIN_PW = "Reviewer@123"
FORCED_EMAIL = "reviewer.forced@glimmora.dev"
FORCED_TEMP_PW = "Temp@1234"

results: list[tuple[str, bool, str]] = []


def _post(path: str, body: dict, token: str | None = None) -> tuple[int, dict]:
    data = json.dumps(body).encode()
    req = urllib.request.Request(f"{BASE}{path}", data=data, method="POST")
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


def check(name: str, ok: bool, detail: str = "") -> None:
    results.append((name, ok, detail))
    print(f"  [{'PASS' if ok else 'FAIL'}] {name}" + (f"  — {detail}" if detail else ""))


def ensure_forced_account() -> None:
    if repo.find_account_by_email(FORCED_EMAIL):
        # Reset it to a known forced state for a repeatable run.
        row = repo.find_account_by_email(FORCED_EMAIL)
        repo.set_password(str(row["id"]), hash_password(FORCED_TEMP_PW), clear_must_change=False)
        # Re-arm the must_change flag directly (additive update, no delete).
        from shared.db import get_pg_connection
        conn = get_pg_connection()
        with conn.cursor() as cur:
            cur.execute("UPDATE login_accounts SET must_change_password=TRUE WHERE id=%s", (row["id"],))
        conn.commit()
        return
    repo.create_account(
        email=FORCED_EMAIL, password_hash=hash_password(FORCED_TEMP_PW),
        first_name="Reviewer", last_name="Forced", role="reviewer",
        provider="password", email_verified=True, must_change_password=True,
    )


def main() -> None:
    print("\n=== Forgot-password flow (send → verify → set) ===")
    s, b = _post("/auth/otp/send-email", {"email": MAIN_EMAIL})
    code = b.get("devOtp")
    t0 = time.time()
    s_fast, _ = _post("/auth/otp/send-email", {"email": MAIN_EMAIL})
    send_ms = (time.time() - t0) * 1000
    code = code or _post("/auth/otp/send-email", {"email": MAIN_EMAIL})[1].get("devOtp")
    check("OTP send returns 200", s == 200, f"HTTP {s}")
    check("OTP send is fast", send_ms < 1500, f"{send_ms:.0f} ms")

    # security-neutral: a VALID but non-existent email returns the SAME 200 shape
    # as a real one — no signal about whether the account exists.
    s_unknown, b_unknown = _post("/auth/otp/send-email", {"email": "definitely-not-here-12345@gmail.com"})
    same_shape = (s_unknown == s) and (("ok" in b_unknown) == ("ok" in b))
    check("OTP send security-neutral (no account leak)", same_shape,
          f"unknown HTTP {s_unknown} vs known HTTP {s}")

    # wrong OTP rejected
    sw, _ = _post("/auth/otp/verify-email", {"email": MAIN_EMAIL, "code": "000000"})
    check("Wrong OTP rejected", sw == 400, f"HTTP {sw}")

    # fresh code, correct verify
    code = _post("/auth/otp/send-email", {"email": MAIN_EMAIL})[1].get("devOtp")
    sv, bv = _post("/auth/otp/verify-email", {"email": MAIN_EMAIL, "code": code})
    check("Correct OTP verifies", sv == 200 and bv.get("verified") is True, f"HTTP {sv}")

    # set new password AFTER verify (the bug we fixed: code already consumed)
    new_pw = "Reviewer@777"
    ss, bs = _post("/auth/password/setup-after-otp",
                   {"email": MAIN_EMAIL, "code": code, "new_password": new_pw})
    check("Set new password after verify (send→verify→set)",
          ss == 200 and bool(bs.get("access_token")), f"HTTP {ss}")

    # old password no longer works; new works
    so, _ = _post("/auth/login", {"email": MAIN_EMAIL, "password": MAIN_PW})
    check("Old password does NOT work after reset", so == 401, f"HTTP {so}")
    sn, bn = _post("/auth/login", {"email": MAIN_EMAIL, "password": new_pw})
    check("New password works", sn == 200 and bn.get("user", {}).get("role") == "reviewer", f"HTTP {sn}")

    # new == old rejected (try to set the just-set password again)
    code2 = _post("/auth/otp/send-email", {"email": MAIN_EMAIL})[1].get("devOtp")
    _post("/auth/otp/verify-email", {"email": MAIN_EMAIL, "code": code2})
    sr, br = _post("/auth/password/setup-after-otp",
                   {"email": MAIN_EMAIL, "code": code2, "new_password": new_pw})
    check("New password must differ from old", sr == 400 and "different" in (br.get("detail", "").lower()),
          f"HTTP {sr} '{br.get('detail')}'")

    # restore main password to documented value
    code3 = _post("/auth/otp/send-email", {"email": MAIN_EMAIL})[1].get("devOtp")
    _post("/auth/otp/verify-email", {"email": MAIN_EMAIL, "code": code3})
    _post("/auth/password/setup-after-otp",
          {"email": MAIN_EMAIL, "code": code3, "new_password": MAIN_PW})

    print("\n=== Forced-reset (must_change_password) flow ===")
    ensure_forced_account()
    sf, bf = _post("/auth/login", {"email": FORCED_EMAIL, "password": FORCED_TEMP_PW})
    token = bf.get("access_token")
    flag = bf.get("user", {}).get("requiresPasswordChange")
    check("Forced-reset login → requiresPasswordChange=true", sf == 200 and flag is True,
          f"HTTP {sf} flag={flag}")

    forced_new = "Forced@5678"
    sc, _ = _post("/auth/password/change",
                  {"old_password": FORCED_TEMP_PW, "new_password": forced_new, "confirmPassword": forced_new},
                  token=token)
    check("Change password succeeds", sc == 200, f"HTTP {sc}")

    # old temp no longer works; new works and flag cleared
    sfo, _ = _post("/auth/login", {"email": FORCED_EMAIL, "password": FORCED_TEMP_PW})
    check("Old (temp) password does NOT work after change", sfo == 401, f"HTTP {sfo}")
    sfn, bfn = _post("/auth/login", {"email": FORCED_EMAIL, "password": forced_new})
    cleared = bfn.get("user", {}).get("requiresPasswordChange") in (False, None)
    check("New password works + flag cleared", sfn == 200 and cleared,
          f"HTTP {sfn} flag={bfn.get('user', {}).get('requiresPasswordChange')}")

    print("\n=== OTP expiry ===")
    from shared.otp import OTP_TTL_SECONDS
    check("OTP expires after 5 min (TTL=300)", OTP_TTL_SECONDS == 300, f"TTL={OTP_TTL_SECONDS}s")

    passed = sum(1 for _, ok, _ in results if ok)
    print(f"\n=== {passed}/{len(results)} conditions PASS ===")
    for name, ok, _ in results:
        if not ok:
            print(f"   FAILED: {name}")


if __name__ == "__main__":
    main()
