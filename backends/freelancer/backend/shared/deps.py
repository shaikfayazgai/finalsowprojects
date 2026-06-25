"""
Shared FastAPI auth dependencies. Decode the Bearer access token and expose
the current user; role guards for admin/superadmin/enterprise/etc.
"""

from __future__ import annotations

import logging
from typing import Annotated

import jwt
from fastapi import Depends, Header, HTTPException, status

from shared.security import decode_token

logger = logging.getLogger(__name__)

# Marker the frontend's auto-logout treats as "your session is no longer valid".
# The API proxy emits a top-level {"error": "AUTH_TOKEN_UNAVAILABLE"} when it has
# no usable backend token; we reuse the SAME marker here (inside `detail`) so a
# tombstoned / deactivated account's next call trips the existing client-side
# auto-logout (token-expiry.ts → signOut → portal login) instead of a stuck UI.
AUTH_TOKEN_UNAVAILABLE = "AUTH_TOKEN_UNAVAILABLE"


def _unauthorised(msg: str = "Not authenticated"):
    return HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=msg)


def _account_revoked():
    """401 a *tombstoned / deactivated* account: the JWT is still cryptographically
    valid but the underlying login_accounts row has been soft-deleted (is_active
    FALSE) or its email suffixed with '.deleted.<epoch>'. We return a 401 (NOT a
    403) carrying the proxy's AUTH_TOKEN_UNAVAILABLE marker so the frontend signs
    the user out cleanly to their portal login."""
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={
            "error": AUTH_TOKEN_UNAVAILABLE,
            "reason": "account_deactivated",
            "message": "Your account is no longer active. Please sign in again.",
        },
    )


def get_bearer_token(authorization: Annotated[str | None, Header()] = None) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise _unauthorised("Missing bearer token")
    return authorization.split(" ", 1)[1].strip()


def _account_is_revoked(account_id: str | None) -> bool:
    """True iff the login_accounts row is tombstoned/deactivated (soft-deleted):
    is_active = FALSE OR email LIKE '%.deleted.%'. A single primary-key lookup
    (id is the PK) of two tiny columns — kept cheap so per-request auth stays fast.
    Fail-OPEN on any DB error / missing id: a transient DB blip must never lock out
    a legitimately-active user. (A missing row is treated as revoked — the account
    truly no longer exists for this token.)"""
    if not account_id:
        return False
    try:
        # Imported lazily so this module stays import-light (and avoids any
        # import cycle with the DB layer at module load).
        from shared.db import ensure_pg_clean, get_pg_connection

        ensure_pg_clean()
        conn = get_pg_connection()
        with conn.cursor() as cur:
            cur.execute(
                "SELECT is_active, email FROM login_accounts WHERE id = %s",
                (account_id,),
            )
            row = cur.fetchone()
        if row is None:
            return True  # token references an account that no longer exists
        is_active, email = row[0], row[1] or ""
        return (is_active is False) or (".deleted." in email)
    except Exception as exc:  # noqa: BLE001 — fail-open, never block a valid user
        logger.warning("account-revoked check skipped (DB error): %s", exc)
        return False


def get_current_user(token: Annotated[str, Depends(get_bearer_token)]) -> dict:
    """Decode an *access* token → user claims {sub, email, role, ...}.

    Also rejects tombstoned/deactivated accounts: if a super-admin soft-deletes a
    contributor (is_active FALSE + email '.deleted.<epoch>') while they're logged
    in, their still-valid JWT must stop working so the frontend auto-logs them out.
    """
    try:
        payload = decode_token(token)
    except jwt.ExpiredSignatureError:
        raise _unauthorised("Token expired")
    except jwt.PyJWTError:
        raise _unauthorised("Invalid token")
    if payload.get("purpose") not in (None, "access"):
        raise _unauthorised("Wrong token type")
    if _account_is_revoked(payload.get("sub")):
        raise _account_revoked()
    return {
        "id": payload.get("sub"),
        "email": payload.get("email"),
        "role": payload.get("role"),
        "tenant_id": payload.get("tenant_id"),
        "claims": payload,
    }


def require_roles(*roles: str):
    """Dependency factory enforcing the user's role is in `roles`."""
    allowed = {r.lower() for r in roles}

    def _guard(user: Annotated[dict, Depends(get_current_user)]) -> dict:
        if (user.get("role") or "").lower() not in allowed:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user

    return _guard


def get_current_admin(user: Annotated[dict, Depends(get_current_user)]) -> dict:
    if (user.get("role") or "").lower() not in {"admin", "superadmin", "super_admin"}:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


def get_current_superadmin(user: Annotated[dict, Depends(get_current_user)]) -> dict:
    if (user.get("role") or "").lower() not in {"superadmin", "super_admin"}:
        raise HTTPException(status_code=403, detail="Super-admin access required")
    return user
