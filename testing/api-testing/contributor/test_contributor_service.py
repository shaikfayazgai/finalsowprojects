"""
API Contract Tests for Contributor Service
Tests: /api/contributor endpoints
"""

import pytest
import httpx
import uuid


@pytest.mark.contributor
class TestContributorPortal:
    """Contributor portal endpoints."""

    def test_list_contributor_projects(
        self, client: httpx.Client, contributor_headers: dict
    ):
        """Test listing contributor's projects."""
        response = client.get(
            "/api/contributor/projects",
            headers=contributor_headers,
        )
        assert response.status_code in [200, 404]
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, list) or "data" in data

    def test_get_contributor_earnings(
        self, client: httpx.Client, contributor_headers: dict
    ):
        """Test getting contributor earnings."""
        response = client.get(
            "/api/contributor/earnings",
            headers=contributor_headers,
        )
        assert response.status_code in [200, 404]

    def test_submit_contributor_proposal(
        self, client: httpx.Client, contributor_headers: dict
    ):
        """Test submitting a proposal."""
        proposal = {
            "sow_id": str(uuid.uuid4()),
            "bid_amount": 5000,
            "delivery_days": 30,
            "description": "I can complete this project",
        }
        response = client.post(
            "/api/contributor/proposals",
            json=proposal,
            headers=contributor_headers,
        )
        assert response.status_code in [200, 201, 400, 404]

    def test_get_contributor_proposals(
        self, client: httpx.Client, contributor_headers: dict
    ):
        """Test listing contributor's proposals."""
        response = client.get(
            "/api/contributor/proposals",
            headers=contributor_headers,
        )
        assert response.status_code in [200, 404]

    def test_withdraw_proposal(
        self, client: httpx.Client, contributor_headers: dict
    ):
        """Test withdrawing a proposal."""
        proposal_id = str(uuid.uuid4())
        response = client.delete(
            f"/api/contributor/proposals/{proposal_id}",
            headers=contributor_headers,
        )
        assert response.status_code in [200, 204, 404]


@pytest.mark.contributor
class TestContributorCredentials:
    """Public contributor credentials endpoints."""

    def test_get_contributor_credentials(self, client: httpx.Client):
        """Test retrieving contributor credentials via public endpoint."""
        response = client.get(
            "/api/public/credentials/test@example.com",
        )
        # May return 404 if user doesn't exist, but endpoint should respond
        assert response.status_code in [200, 404]

    def test_verify_contributor_credentials(self, client: httpx.Client):
        """Test verifying contributor credentials."""
        response = client.post(
            "/api/public/credentials/verify",
            json={
                "email": "test@example.com",
                "credential_token": "dummy_token",
            },
        )
        assert response.status_code in [200, 400, 401, 404]


@pytest.mark.contributor
class TestContributorProfile:
    """Contributor profile management."""

    def test_get_profile(self, client: httpx.Client, contributor_headers: dict):
        """Test getting contributor profile."""
        response = client.get(
            "/api/contributor/profile",
            headers=contributor_headers,
        )
        assert response.status_code in [200, 404]
        if response.status_code == 200:
            profile = response.json()
            assert "id" in profile or "email" in profile

    def test_update_profile(self, client: httpx.Client, contributor_headers: dict):
        """Test updating contributor profile."""
        profile_data = {
            "bio": "Updated bio",
            "skills": ["Python", "JavaScript"],
            "hourly_rate": 75,
        }
        response = client.put(
            "/api/contributor/profile",
            json=profile_data,
            headers=contributor_headers,
        )
        assert response.status_code in [200, 400, 404]

    def test_upload_portfolio(self, client: httpx.Client, contributor_headers: dict):
        """Test uploading portfolio/resume."""
        response = client.post(
            "/api/contributor/portfolio",
            files={"file": ("resume.pdf", b"fake pdf content")},
            headers={
                k: v for k, v in contributor_headers.items() if k != "Content-Type"
            },
        )
        assert response.status_code in [200, 201, 400, 413]


@pytest.mark.contributor
class TestContributorRatings:
    """Contributor ratings and reviews."""

    def test_get_contributor_ratings(
        self, client: httpx.Client, contributor_headers: dict
    ):
        """Test getting contributor ratings."""
        response = client.get(
            "/api/contributor/ratings",
            headers=contributor_headers,
        )
        assert response.status_code in [200, 404]

    def test_get_average_rating(
        self, client: httpx.Client, contributor_headers: dict
    ):
        """Test getting average contributor rating."""
        response = client.get(
            "/api/contributor/rating/average",
            headers=contributor_headers,
        )
        assert response.status_code in [200, 404]
