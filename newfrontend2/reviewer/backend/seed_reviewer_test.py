"""One-off: seed a REVIEWER test account so the /reviewer/login flow can be
exercised end-to-end. Idempotent and additive — only inserts when the email is
absent; never deletes or overwrites an existing row.

Run from backend/:  python seed_reviewer_test.py
"""

from __future__ import annotations

from shared.security import hash_password
from auth_app import repo

# Reviewer test accounts (additive, idempotent). Add entries here as needed;
# existing rows are never overwritten or deleted.
TEST_ACCOUNTS = [
    {"email": "reviewer.test@glimmora.dev", "password": "Reviewer@123",
     "first": "Reviewer", "last": "Test"},
    {"email": "mychatgptcourse@gmail.com", "password": "Reviewer@123",
     "first": "Reviewer", "last": "Two"},
]


def _ensure(email: str, password: str, first: str, last: str) -> None:
    existing = repo.find_account_by_email(email)
    if existing:
        print(f"[seed] already exists: {email} "
              f"(id={existing['id']}, role={existing.get('role')}) — left untouched")
        return
    row = repo.create_account(
        email=email,
        password_hash=hash_password(password),
        first_name=first,
        last_name=last,
        role="reviewer",
        provider="password",
        email_verified=True,
        approval_status="approved",
    )
    print(f"[seed] created: {email} / {password} (id={row['id']}, role={row.get('role')})")


def main() -> None:
    for a in TEST_ACCOUNTS:
        _ensure(a["email"], a["password"], a["first"], a["last"])


if __name__ == "__main__":
    main()
