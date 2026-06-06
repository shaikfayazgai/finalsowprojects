"""
API Contract Tests for Enterprise Service
Tests: /api/v1/sow, /api/v1/sows, /api/v1/wizards, /api/v1/approvals endpoints
"""

import pytest
import httpx
from datetime import datetime, timedelta
import uuid


@pytest.mark.enterprise
class TestSOWService:
    """SOW (Statement of Work) API tests."""

    def test_list_sows(self, client: httpx.Client, enterprise_headers: dict):
        """Test listing SOWs for enterprise."""
        response = client.get(
            "/api/v1/sows",
            headers=enterprise_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list) or "data" in data

    def test_get_sow_detail(self, client: httpx.Client, enterprise_headers: dict):
        """Test getting a specific SOW."""
        sow_id = str(uuid.uuid4())
        response = client.get(
            f"/api/v1/sows/{sow_id}",
            headers=enterprise_headers,
        )
        assert response.status_code in [200, 404]

    def test_create_sow(self, client: httpx.Client, enterprise_headers: dict):
        """Test creating a new SOW."""
        sow_data = {
            "title": "Test SOW",
            "description": "Test Description",
            "budget": 10000,
            "currency": "USD",
            "start_date": (datetime.now() + timedelta(days=1)).isoformat(),
            "end_date": (datetime.now() + timedelta(days=30)).isoformat(),
        }
        response = client.post(
            "/api/v1/sows",
            json=sow_data,
            headers=enterprise_headers,
        )
        assert response.status_code in [200, 201, 400]
        if response.status_code in [200, 201]:
            data = response.json()
            assert "id" in data or "sow_id" in data

    def test_update_sow(self, client: httpx.Client, enterprise_headers: dict):
        """Test updating a SOW."""
        sow_id = str(uuid.uuid4())
        update_data = {
            "title": "Updated Title",
            "budget": 15000,
        }
        response = client.put(
            f"/api/v1/sows/{sow_id}",
            json=update_data,
            headers=enterprise_headers,
        )
        assert response.status_code in [200, 404, 400]

    def test_delete_sow(self, client: httpx.Client, enterprise_headers: dict):
        """Test deleting a SOW."""
        sow_id = str(uuid.uuid4())
        response = client.delete(
            f"/api/v1/sows/{sow_id}",
            headers=enterprise_headers,
        )
        assert response.status_code in [200, 204, 404]


@pytest.mark.enterprise
class TestSOWDecomposition:
    """SOW decomposition and wizard tests."""

    def test_decompose_sow(self, client: httpx.Client, enterprise_headers: dict):
        """Test SOW decomposition endpoint."""
        decompose_data = {
            "sow_id": str(uuid.uuid4()),
            "approach": "phased",
        }
        response = client.post(
            "/api/v1/wizards/decompose",
            json=decompose_data,
            headers=enterprise_headers,
        )
        assert response.status_code in [200, 201, 400, 404]

    def test_wizard_next_step(self, client: httpx.Client, enterprise_headers: dict):
        """Test wizard navigation."""
        response = client.post(
            "/api/v1/wizards/next",
            json={
                "current_step": 1,
                "data": {"title": "Test SOW"},
            },
            headers=enterprise_headers,
        )
        assert response.status_code in [200, 400]


@pytest.mark.enterprise
class TestSOWApprovals:
    """SOW approval workflow tests."""

    def test_list_pending_approvals(
        self, client: httpx.Client, enterprise_headers: dict
    ):
        """Test listing SOWs pending approval."""
        response = client.get(
            "/api/v1/approvals",
            headers=enterprise_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list) or "data" in data

    def test_approve_sow(self, client: httpx.Client, enterprise_headers: dict):
        """Test approving a SOW."""
        sow_id = str(uuid.uuid4())
        response = client.post(
            f"/api/v1/approvals/{sow_id}/approve",
            json={"comment": "Approved"},
            headers=enterprise_headers,
        )
        assert response.status_code in [200, 404, 400]

    def test_reject_sow(self, client: httpx.Client, enterprise_headers: dict):
        """Test rejecting a SOW."""
        sow_id = str(uuid.uuid4())
        response = client.post(
            f"/api/v1/approvals/{sow_id}/reject",
            json={"reason": "Missing details"},
            headers=enterprise_headers,
        )
        assert response.status_code in [200, 404, 400]


@pytest.mark.enterprise
class TestEnterpriseUsers:
    """Enterprise user management tests."""

    def test_list_enterprise_users(
        self, client: httpx.Client, enterprise_headers: dict
    ):
        """Test listing users in enterprise."""
        response = client.get(
            "/api/v1/users",
            headers=enterprise_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list) or "data" in data

    def test_add_enterprise_user(self, client: httpx.Client, enterprise_headers: dict):
        """Test adding a user to enterprise."""
        user_data = {
            "email": f"user{uuid.uuid4()}@example.com",
            "role": "manager",
            "full_name": "Test User",
        }
        response = client.post(
            "/api/v1/users",
            json=user_data,
            headers=enterprise_headers,
        )
        assert response.status_code in [200, 201, 400]

    def test_update_user_role(self, client: httpx.Client, enterprise_headers: dict):
        """Test updating user role."""
        user_id = str(uuid.uuid4())
        response = client.put(
            f"/api/v1/users/{user_id}",
            json={"role": "admin"},
            headers=enterprise_headers,
        )
        assert response.status_code in [200, 404, 400]

    def test_remove_enterprise_user(
        self, client: httpx.Client, enterprise_headers: dict
    ):
        """Test removing a user from enterprise."""
        user_id = str(uuid.uuid4())
        response = client.delete(
            f"/api/v1/users/{user_id}",
            headers=enterprise_headers,
        )
        assert response.status_code in [200, 204, 404]
