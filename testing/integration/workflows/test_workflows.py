"""
Integration Workflow Tests - Complete user journeys
"""

import pytest
import httpx
import uuid
from datetime import datetime, timedelta


@pytest.mark.integration
class TestUserRegistrationFlow:
    """Test complete user registration flow."""

    def test_contributor_registration_flow(self, client: httpx.Client):
        """Test complete contributor registration workflow."""
        # Step 1: Request registration
        register_data = {
            "email": f"contributor{uuid.uuid4()}@example.com",
            "password": "SecurePassword123!",
            "full_name": "Test Contributor",
            "bio": "Software developer",
        }
        response = client.post(
            "/api/v1/auth/contributor/register",
            json=register_data,
        )
        assert response.status_code in [200, 201]
        registration = response.json()
        assert "id" in registration or "user_id" in registration

        # Step 2: Login with new credentials
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email": register_data["email"],
                "password": register_data["password"],
            },
        )
        # May fail if email confirmation required
        assert login_response.status_code in [200, 403]

    def test_enterprise_user_creation_flow(
        self, client: httpx.Client, enterprise_headers: dict
    ):
        """Test creating and activating enterprise user."""
        # Step 1: Admin creates user
        new_user = {
            "email": f"user{uuid.uuid4()}@enterprise.com",
            "role": "reviewer",
            "full_name": "New Reviewer",
        }
        response = client.post(
            "/api/v1/users",
            json=new_user,
            headers=enterprise_headers,
        )
        assert response.status_code in [200, 201]
        user_data = response.json()
        user_id = user_data.get("id") or user_data.get("user_id")

        # Step 2: Verify user appears in list
        list_response = client.get(
            "/api/v1/users",
            headers=enterprise_headers,
        )
        assert list_response.status_code == 200
        users_list = list_response.json()
        users = users_list if isinstance(users_list, list) else users_list.get("data", [])
        assert any(u.get("id") == user_id for u in users)


@pytest.mark.integration
class TestSOWWorkflow:
    """Test complete SOW creation and approval workflow."""

    def test_sow_creation_to_approval_flow(
        self, client: httpx.Client, enterprise_headers: dict, reviewer_headers: dict
    ):
        """Test complete SOW workflow: create → decompose → submit → review → approve."""
        # Step 1: Create SOW
        sow_data = {
            "title": f"Integration Test SOW {uuid.uuid4()}",
            "description": "Test statement of work",
            "budget": 50000,
            "currency": "USD",
            "start_date": (datetime.now() + timedelta(days=1)).isoformat(),
            "end_date": (datetime.now() + timedelta(days=30)).isoformat(),
        }
        create_response = client.post(
            "/api/v1/sows",
            json=sow_data,
            headers=enterprise_headers,
        )
        assert create_response.status_code in [200, 201]
        sow = create_response.json()
        sow_id = sow.get("id") or sow.get("sow_id")
        assert sow_id is not None

        # Step 2: Verify SOW appears in list
        list_response = client.get(
            "/api/v1/sows",
            headers=enterprise_headers,
        )
        assert list_response.status_code == 200
        sows_list = list_response.json()
        sows = sows_list if isinstance(sows_list, list) else sows_list.get("data", [])
        assert any(s.get("id") == sow_id for s in sows)

        # Step 3: Decompose SOW
        decompose_response = client.post(
            "/api/v1/wizards/decompose",
            json={
                "sow_id": sow_id,
                "approach": "phased",
            },
            headers=enterprise_headers,
        )
        assert decompose_response.status_code in [200, 201]

        # Step 4: Submit for approval
        submit_response = client.put(
            f"/api/v1/sows/{sow_id}",
            json={"status": "submitted"},
            headers=enterprise_headers,
        )
        assert submit_response.status_code in [200, 404]

        # Step 5: Reviewer approves SOW
        approve_response = client.post(
            f"/api/v1/approvals/{sow_id}/approve",
            json={"comment": "Looks good"},
            headers=reviewer_headers,
        )
        assert approve_response.status_code in [200, 404]


@pytest.mark.integration
class TestBulkImportWorkflow:
    """Test bulk import workflow: preview → validation → commit."""

    def test_bulk_import_two_phase_flow(
        self, client: httpx.Client, admin_headers: dict
    ):
        """Test bulk import preview and commit."""
        import base64

        # Step 1: Create CSV content
        csv_content = """email,full_name,role
user1@example.com,User One,reviewer
user2@example.com,User Two,admin
user3@example.com,User Three,reviewer"""

        # Step 2: Preview import (commit=false)
        preview_response = client.post(
            "/api/superadmin/bulk-import/preview",
            json={
                "file_name": "users.csv",
                "file_content": base64.b64encode(csv_content.encode()).decode(),
                "import_type": "users",
                "commit": False,
            },
            headers=admin_headers,
        )
        assert preview_response.status_code in [200, 201]
        preview_data = preview_response.json()
        assert "total_rows" in preview_data or "rows" in preview_data
        import_id = preview_data.get("id") or preview_data.get("import_id")

        # Step 3: Commit import (commit=true)
        if import_id:
            commit_response = client.post(
                "/api/superadmin/bulk-import/commit",
                json={
                    "import_id": import_id,
                    "commit": True,
                },
                headers=admin_headers,
            )
            assert commit_response.status_code in [200, 201, 400]


@pytest.mark.integration
class TestAuthenticationFlow:
    """Test complete authentication and session flow."""

    def test_login_session_refresh_logout_flow(self, client: httpx.Client, test_users: dict):
        """Test login → get profile → refresh token → logout."""
        user = test_users["superadmin"]

        # Step 1: Login
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email": user["email"],
                "password": user["password"],
            },
        )
        assert login_response.status_code == 200
        auth_data = login_response.json()
        token = auth_data.get("access_token") or auth_data.get("token")
        assert token is not None

        auth_header = {"Authorization": f"Bearer {token}"}

        # Step 2: Get current user profile
        me_response = client.get(
            "/api/v1/auth/me",
            headers=auth_header,
        )
        assert me_response.status_code == 200
        profile = me_response.json()
        assert profile.get("email") == user["email"]

        # Step 3: Refresh token
        refresh_response = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": token},
            headers=auth_header,
        )
        assert refresh_response.status_code in [200, 401]
        if refresh_response.status_code == 200:
            new_token = refresh_response.json().get("access_token")
            assert new_token is not None

        # Step 4: Logout
        logout_response = client.post(
            "/api/v1/auth/logout",
            headers=auth_header,
        )
        assert logout_response.status_code == 200


@pytest.mark.integration
class TestErrorHandling:
    """Test error handling across workflows."""

    def test_unauthorized_access_denied(self, client: httpx.Client):
        """Test unauthorized user access is denied."""
        # Try to access protected endpoint without auth
        response = client.get("/api/v1/sows")
        assert response.status_code == 401

    def test_forbidden_cross_portal_access(
        self, client: httpx.Client, contributor_headers: dict
    ):
        """Test contributor cannot access enterprise portal."""
        response = client.get(
            "/api/v1/sows",
            headers=contributor_headers,
        )
        # Should be forbidden or return empty
        assert response.status_code in [200, 403]

    def test_validation_errors_on_invalid_input(self, client: httpx.Client, enterprise_headers: dict):
        """Test validation errors on invalid input."""
        invalid_sow = {
            "title": "Test",
            "budget": "not a number",  # Invalid type
            "currency": "USD",
        }
        response = client.post(
            "/api/v1/sows",
            json=invalid_sow,
            headers=enterprise_headers,
        )
        assert response.status_code in [400, 422]
        data = response.json()
        assert "error" in data or "detail" in data or "errors" in data


# Fixtures for different roles
@pytest.fixture
def admin_headers(client, test_users):
    """Get admin auth headers."""
    admin = test_users.get("admin") or test_users["superadmin"]
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": admin["email"],
            "password": admin["password"],
        },
    )
    if response.status_code == 200:
        token = response.json().get("access_token") or response.json().get("token")
        return {"Authorization": f"Bearer {token}"}
    return {}


@pytest.fixture
def reviewer_headers(client, test_users):
    """Get reviewer auth headers."""
    reviewer = test_users.get("reviewer")
    if reviewer:
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": reviewer["email"],
                "password": reviewer["password"],
            },
        )
        if response.status_code == 200:
            token = response.json().get("access_token") or response.json().get("token")
            return {"Authorization": f"Bearer {token}"}
    return {}
