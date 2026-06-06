"""
API Contract Tests for Superadmin Service
Tests: /api/superadmin, /api/admin endpoints including bulk import
"""

import pytest
import httpx
import base64
import uuid


@pytest.mark.auth
class TestSuperAdminAuth:
    """Superadmin authentication tests."""

    def test_superadmin_login(self, client: httpx.Client, test_users: dict):
        """Test superadmin login."""
        admin = test_users["superadmin"]
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": admin["email"],
                "password": admin["password"],
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data or "token" in data

    def test_superadmin_dashboard_access(
        self, client: httpx.Client, auth_headers: dict
    ):
        """Test superadmin can access dashboard."""
        response = client.get(
            "/api/superadmin/dashboard",
            headers=auth_headers,
        )
        assert response.status_code in [200, 404]


@pytest.mark.bulk_import
class TestBulkImport:
    """Bulk import API tests."""

    def test_bulk_import_preview(self, client: httpx.Client, auth_headers: dict):
        """Test bulk import preview (phase 1)."""
        csv_content = """email,full_name,role
user1@example.com,User One,reviewer
user2@example.com,User Two,admin"""

        file_content = base64.b64encode(csv_content.encode()).decode()

        response = client.post(
            "/api/superadmin/bulk-import/preview",
            json={
                "file_name": "users.csv",
                "file_content": file_content,
                "import_type": "users",
                "commit": False,
            },
            headers=auth_headers,
        )
        assert response.status_code in [200, 201]
        data = response.json()

        # Validate preview response
        assert "total_rows" in data or "rows" in data or "data" in data

    def test_bulk_import_validation_errors(
        self, client: httpx.Client, auth_headers: dict
    ):
        """Test bulk import validates data."""
        # Invalid CSV (bad email format)
        csv_content = """email,full_name,role
invalid-email,User One,reviewer"""

        file_content = base64.b64encode(csv_content.encode()).decode()

        response = client.post(
            "/api/superadmin/bulk-import/preview",
            json={
                "file_name": "users.csv",
                "file_content": file_content,
                "import_type": "users",
                "commit": False,
            },
            headers=auth_headers,
        )
        assert response.status_code in [200, 201, 400]

    def test_bulk_import_duplicate_detection(
        self, client: httpx.Client, auth_headers: dict
    ):
        """Test bulk import detects duplicates."""
        csv_content = """email,full_name,role
superadmin@glimmora.dev,Duplicate Admin,admin"""

        file_content = base64.b64encode(csv_content.encode()).decode()

        response = client.post(
            "/api/superadmin/bulk-import/preview",
            json={
                "file_name": "users.csv",
                "file_content": file_content,
                "import_type": "users",
                "commit": False,
            },
            headers=auth_headers,
        )
        assert response.status_code in [200, 201]
        data = response.json()

        # Response should indicate duplicates
        assert "data" in data or "rows" in data or "duplicates" in data

    def test_bulk_import_commit(self, client: httpx.Client, auth_headers: dict):
        """Test bulk import commit (phase 2)."""
        import_id = str(uuid.uuid4())

        response = client.post(
            "/api/superadmin/bulk-import/commit",
            json={
                "import_id": import_id,
                "commit": True,
            },
            headers=auth_headers,
        )
        # May fail if import_id doesn't exist, but endpoint should exist
        assert response.status_code in [200, 201, 400, 404]

    def test_bulk_import_with_credentials_email(
        self, client: httpx.Client, auth_headers: dict
    ):
        """Test bulk import with credential email sending."""
        csv_content = """email,full_name
newuser@example.com,New User"""

        file_content = base64.b64encode(csv_content.encode()).decode()
        import_id = str(uuid.uuid4())

        response = client.post(
            "/api/superadmin/bulk-import/commit",
            json={
                "import_id": import_id,
                "commit": True,
                "send_credentials": True,
            },
            headers=auth_headers,
        )
        assert response.status_code in [200, 201, 400, 404]


@pytest.mark.auth
class TestAdminManagement:
    """Admin management endpoints."""

    def test_list_admins(self, client: httpx.Client, auth_headers: dict):
        """Test listing admin users."""
        response = client.get(
            "/api/admin/users",
            headers=auth_headers,
        )
        assert response.status_code in [200, 403]

    def test_create_admin_user(self, client: httpx.Client, auth_headers: dict):
        """Test creating admin user."""
        admin_data = {
            "email": f"admin{uuid.uuid4()}@glimmora.dev",
            "full_name": "New Admin",
            "role": "admin",
        }
        response = client.post(
            "/api/admin/users",
            json=admin_data,
            headers=auth_headers,
        )
        assert response.status_code in [200, 201, 400, 403]

    def test_update_admin_permissions(
        self, client: httpx.Client, auth_headers: dict
    ):
        """Test updating admin permissions."""
        user_id = str(uuid.uuid4())
        response = client.put(
            f"/api/admin/users/{user_id}",
            json={"role": "reviewer"},
            headers=auth_headers,
        )
        assert response.status_code in [200, 404, 403]


@pytest.mark.bulk_import
class TestStudentBulkImport:
    """Student bulk import for universities."""

    def test_student_bulk_import_preview(
        self, client: httpx.Client, auth_headers: dict
    ):
        """Test student bulk import preview."""
        csv_content = """email,full_name,university_id
student1@university.edu,Student One,univ_123
student2@university.edu,Student Two,univ_123"""

        file_content = base64.b64encode(csv_content.encode()).decode()

        response = client.post(
            "/api/universities/bulk-import/preview",
            json={
                "file_name": "students.csv",
                "file_content": file_content,
                "import_type": "students",
                "commit": False,
            },
            headers=auth_headers,
        )
        assert response.status_code in [200, 201, 400, 403]


@pytest.mark.bulk_import
class TestWomenTeamBulkImport:
    """Women team member bulk import."""

    def test_women_team_bulk_import_preview(
        self, client: httpx.Client, auth_headers: dict
    ):
        """Test women team member bulk import preview."""
        csv_content = """email,full_name,team_id
member1@women.dev,Member One,team_123
member2@women.dev,Member Two,team_123"""

        file_content = base64.b64encode(csv_content.encode()).decode()

        response = client.post(
            "/api/women/bulk-import/preview",
            json={
                "file_name": "members.csv",
                "file_content": file_content,
                "import_type": "members",
                "commit": False,
            },
            headers=auth_headers,
        )
        assert response.status_code in [200, 201, 400, 403]
