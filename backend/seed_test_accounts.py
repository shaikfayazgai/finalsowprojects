"""One-off: seed test login accounts for every portal role (idempotent).

Run with the auth-service on PYTHONPATH so `shared` + `auth_app` resolve:
    $env:PYTHONPATH = "backend;backend/services/auth-service"
    python backend/seed_test_accounts.py
"""

from __future__ import annotations

from shared.security import hash_password
from auth_app import repo

# email, password, first, last, backend-role
ACCOUNTS = [
    ("contributor@glimmora.dev", "glimmora123", "Test", "Contributor", "contributor"),
    ("mentor@glimmora.dev",      "glimmora123", "Test", "Mentor",      "mentor"),
    ("reviewer@glimmora.dev",    "glimmora123", "Test", "Reviewer",    "reviewer"),
    ("enterprise@glimmora.dev",  "glimmora123", "Test", "Enterprise",  "enterprise"),
]


def main() -> None:
    for email, password, first, last, role in ACCOUNTS:
        existing = repo.find_account_by_email(email)
        if existing:
            print(f"  exists  {email} ({existing.get('role')})")
            continue
        repo.create_account(
            email=email,
            password_hash=hash_password(password),
            first_name=first,
            last_name=last,
            role=role,
            provider="password",
            email_verified=True,
            approval_status="approved",
        )
        print(f"  seeded  {email} ({role})")


if __name__ == "__main__":
    main()
