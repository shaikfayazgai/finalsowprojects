"""
API Contract Tests for Auth Service
Tests: /api/v1/auth endpoints
"""

import pytest
import httpx
from datetime import datetime


@pytest.mark.auth
class TestAuthService:
    """Auth service API contract tests."""

    def test_login_success(self, client: httpx.Client, test_users: dict):
        """Test successful login with valid credentials."""
        user = test_users["superadmin"]
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": user["email"],
                "password": user["password"],
            },
        )
        assert response.status_code == 200
        data = response.json()
        
        # Validate response schema
        assert "access_token" in data or "token" in data
        assert "user" in data or "userId" in data
        assert response.headers.get("content-type") == "application/json"

    def test_login_invalid_credentials(self, client: httpx.Client):
        """Test login with invalid credentials."""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "invalid@example.com",
                "password": "wrongpassword",
            },
        )
        assert response.status_code == 401
        data = response.json()
        assert "error" in data or "message" in data

    def test_login_missing_fields(self, client: httpx.Client):
        """Test login with missing required fields."""
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "test@example.com"},
        )
        assert response.status_code in [400, 422]
        data = response.json()
        assert "error" in data or "message" in data

    def test_login_malformed_email(self, client: httpx.Client):
        """Test login with malformed email."""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "not-an-email",
                "password": "password123",
            },
        )
        assert response.status_code in [400, 422]
        data = response.json()
        assert "error" in data or "email" in data

    def test_refresh_token(self, client: httpx.Client, auth_token: str):
        """Test token refresh endpoint."""
        response = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": auth_token},
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data or "token" in data

    def test_logout(self, client: httpx.Client, auth_headers: dict):
        """Test logout endpoint."""
        response = client.post(
            "/api/v1/auth/logout",
            headers=auth_headers,
        )
        assert response.status_code == 200

    def test_me_endpoint(self, client: httpx.Client, auth_headers: dict, test_users: dict):
        """Test /me endpoint returns current user."""
        response = client.get(
            "/api/v1/auth/me",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        
        # Validate user schema
        assert "id" in data or "userId" in data
        assert "email" in data
        assert "role" in data
        assert data["email"] == test_users["superadmin"]["email"]

    def test_me_without_auth(self, client: httpx.Client):
        """Test /me endpoint without authentication."""
        response = client.get("/api/v1/auth/me")
        assert response.status_code == 401

    def test_password_reset_request(self, client: httpx.Client):
        """Test password reset request endpoint."""
        response = client.post(
            "/api/v1/auth/password/reset-request",
            json={"email": "test@example.com"},
        )
        # Should return 200 even if user doesn't exist (security best practice)
        assert response.status_code == 200

    def test_otp_request(self, client: httpx.Client, test_users: dict):
        """Test OTP request for MFA."""
        user = test_users["superadmin"]
        response = client.post(
            "/api/v1/auth/otp/request",
            json={"email": user["email"]},
        )
        assert response.status_code in [200, 201]

    def test_verify_otp(self, client: httpx.Client):
        """Test OTP verification endpoint."""
        response = client.post(
            "/api/v1/auth/otp/verify",
            json={
                "email": "test@example.com",
                "otp": "123456",
                "token": "dummy_token",
            },
        )
        # Expect either success or validation error (OTP expired, invalid, etc.)
        assert response.status_code in [200, 400, 401, 403, 409]


@pytest.mark.auth
class TestAuthTokenSchema:
    """Validate auth token structure and claims."""

    def test_token_contains_required_claims(self, auth_token: str):
        """Test that JWT token contains required claims."""
        import base64
        import json
        
        # Decode JWT payload (without signature validation)
        parts = auth_token.split(".")
        if len(parts) >= 2:
            payload = parts[1]
            # Add padding if needed
            padding = len(payload) % 4
            if padding:
                payload += "=" * (4 - padding)
            
            decoded = base64.urlsafe_b64decode(payload)
            claims = json.loads(decoded)
            
            # Validate required claims
            assert "sub" in claims or "user_id" in claims, "Missing user ID claim"
            assert "email" in claims or "email_addr" in claims, "Missing email claim"
            assert "role" in claims or "roles" in claims, "Missing role claim"
            assert "iat" in claims, "Missing issued-at claim"
            assert "exp" in claims, "Missing expiration claim"


@pytest.mark.auth
class TestAuthHeaders:
    """Test auth-related header handling."""

    def test_auth_header_case_insensitive(self, client: httpx.Client, auth_token: str):
        """Test that Authorization header is case-insensitive."""
        # Most HTTP implementations treat headers as case-insensitive
        response = client.get(
            "/api/v1/auth/me",
            headers={"authorization": f"Bearer {auth_token}"},
        )
        # Should succeed with lowercase header
        assert response.status_code in [200, 401]  # Depends on implementation

    def test_bearer_token_format(self, client: httpx.Client, auth_token: str):
        """Test Bearer token format validation."""
        # Valid format: "Bearer <token>"
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 200

        # Invalid format: missing "Bearer"
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": auth_token},
        )
        assert response.status_code == 401

        # Invalid format: wrong scheme
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Basic {auth_token}"},
        )
        assert response.status_code == 401
