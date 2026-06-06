"""
API Contract Tests for OAuth (Contributor Portal)
Tests: /api/v1/auth/oauth and /api/v1/auth/contributor endpoints
"""

import pytest
import httpx


@pytest.mark.auth
class TestOAuthFlow:
    """OAuth flow tests for contributor authentication."""

    def test_oauth_redirect_endpoint(self, client: httpx.Client):
        """Test OAuth redirect endpoint."""
        response = client.get(
            "/api/v1/auth/oauth/redirect",
            params={
                "provider": "microsoft",
                "returnTo": "http://localhost:3000/dashboard",
            },
            follow_redirects=False,
        )
        assert response.status_code in [302, 307, 308]  # Redirect status codes
        assert "location" in response.headers

    def test_oauth_callback(self, client: httpx.Client):
        """Test OAuth callback handling."""
        response = client.get(
            "/api/v1/auth/oauth/callback",
            params={
                "provider": "microsoft",
                "code": "dummy_auth_code",
                "state": "dummy_state",
            },
        )
        # Expected to fail with dummy code, but endpoint should exist
        assert response.status_code in [200, 302, 400, 401]

    def test_oauth_providers_list(self, client: httpx.Client):
        """Test listing available OAuth providers."""
        response = client.get("/api/v1/auth/oauth/providers")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list) or isinstance(data, dict)


@pytest.mark.auth
class TestContributorAuth:
    """Tests for contributor-specific auth endpoints."""

    def test_contributor_login(self, client: httpx.Client, test_users: dict):
        """Test contributor-specific login endpoint."""
        contributor = test_users["contributor"]
        response = client.post(
            "/api/v1/auth/contributor/login",
            json={
                "email": contributor["email"],
                "password": contributor["password"],
            },
        )
        assert response.status_code in [200, 201]
        data = response.json()
        assert "token" in data or "access_token" in data

    def test_contributor_register(self, client: httpx.Client):
        """Test contributor registration endpoint."""
        response = client.post(
            "/api/v1/auth/contributor/register",
            json={
                "email": "newcontributor@example.com",
                "password": "SecurePass123!",
                "full_name": "New Contributor",
            },
        )
        # May fail due to existing email, but endpoint should respond
        assert response.status_code in [200, 201, 400, 409]

    def test_contributor_profile_endpoint(
        self, client: httpx.Client, contributor_headers: dict
    ):
        """Test getting contributor profile."""
        response = client.get(
            "/api/contributor/profile",
            headers=contributor_headers,
        )
        assert response.status_code in [200, 404]  # Depends on if profile exists
        if response.status_code == 200:
            data = response.json()
            assert "id" in data or "contributor_id" in data
            assert "email" in data
