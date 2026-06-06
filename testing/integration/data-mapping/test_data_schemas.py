"""
Data Mapping Tests - Frontend ↔ Backend Schema Validation
"""

import pytest
from pydantic import BaseModel, ValidationError
from typing import Optional, List, Dict, Any
from datetime import datetime


# ──────────────────────────────────── Response Schemas ────────────────────────────────────

class UserResponse(BaseModel):
    """User response schema from backend."""

    id: str
    email: str
    role: str
    full_name: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        extra = "allow"  # Allow extra fields from backend


class AuthTokenResponse(BaseModel):
    """Auth token response schema."""

    access_token: str
    token_type: str = "Bearer"
    expires_in: Optional[int] = None
    user: Optional[UserResponse] = None

    class Config:
        extra = "allow"


class SOWResponse(BaseModel):
    """Statement of Work response schema."""

    id: str
    title: str
    description: Optional[str] = None
    budget: float
    currency: str = "USD"
    status: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    created_by: Optional[str] = None

    class Config:
        extra = "allow"


class BulkImportResponse(BaseModel):
    """Bulk import response schema."""

    id: str
    file_name: str
    status: str  # preview, processing, completed, failed
    total_rows: int
    valid_rows: int
    invalid_rows: int
    error_count: int
    created_at: Optional[datetime] = None

    class Config:
        extra = "allow"


class ErrorResponse(BaseModel):
    """Standard error response schema."""

    error: str
    message: str
    status_code: int
    timestamp: Optional[datetime] = None
    details: Optional[Dict[str, Any]] = None

    class Config:
        extra = "allow"


# ──────────────────────────────────── Request Schemas ────────────────────────────────────

class LoginRequest(BaseModel):
    """Login request schema."""

    email: str
    password: str

    class Config:
        extra = "forbid"  # Don't allow extra fields in request


class CreateSOWRequest(BaseModel):
    """Create SOW request schema."""

    title: str
    description: Optional[str] = None
    budget: float
    currency: str = "USD"
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

    class Config:
        extra = "forbid"


class BulkImportRequest(BaseModel):
    """Bulk import request schema."""

    file_name: str
    file_content: str  # Base64 encoded
    import_type: str  # users, students, members
    commit: bool = False
    selected_rows: Optional[List[int]] = None

    class Config:
        extra = "forbid"


# ──────────────────────────────────── Data Mapping Tests ────────────────────────────────────

@pytest.mark.integration
class TestAuthDataMapping:
    """Test auth-related data mapping."""

    def test_login_response_schema(self, client, auth_headers):
        """Validate login response matches expected schema."""
        response = client.get(
            "/api/v1/auth/me",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()

        # Should parse without validation errors
        user = UserResponse(**data)
        assert user.id is not None
        assert user.email is not None
        assert user.role is not None

    def test_token_response_schema(self, client, test_users):
        """Validate token response schema."""
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

        # Should parse as AuthTokenResponse
        token_resp = AuthTokenResponse(**data)
        assert token_resp.access_token is not None
        assert token_resp.token_type == "Bearer"


@pytest.mark.integration
class TestSOWDataMapping:
    """Test SOW data mapping between frontend and backend."""

    def test_sow_response_schema(self, client, enterprise_headers):
        """Validate SOW response schema."""
        response = client.get(
            "/api/v1/sows",
            headers=enterprise_headers,
        )
        assert response.status_code == 200
        data = response.json()

        # Handle both list and paginated responses
        items = data if isinstance(data, list) else data.get("data", [])
        
        if items:
            # Validate first SOW against schema
            sow = SOWResponse(**items[0])
            assert sow.id is not None
            assert sow.title is not None
            assert sow.status is not None

    def test_create_sow_request_validation(self):
        """Test SOW creation request schema."""
        valid_request = {
            "title": "Test SOW",
            "budget": 10000,
            "currency": "USD",
        }
        req = CreateSOWRequest(**valid_request)
        assert req.title == "Test SOW"
        assert req.budget == 10000

    def test_sow_request_missing_required_fields(self):
        """Test SOW request with missing required fields."""
        invalid_request = {
            "description": "Missing title and budget",
        }
        with pytest.raises(ValidationError) as exc_info:
            CreateSOWRequest(**invalid_request)
        
        errors = exc_info.value.errors()
        assert any(e["loc"][0] == "title" for e in errors)
        assert any(e["loc"][0] == "budget" for e in errors)


@pytest.mark.integration
class TestErrorDataMapping:
    """Test error response data mapping."""

    def test_error_response_schema(self, client):
        """Validate error response schema."""
        response = client.get(
            "/api/v1/auth/me",
        )
        # Should get 401 without auth
        assert response.status_code == 401
        data = response.json()

        # Should have error fields
        assert "error" in data or "message" in data

    def test_validation_error_schema(self, client):
        """Test validation error response schema."""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "invalid-email",
                # Missing password
            },
        )
        assert response.status_code in [400, 422]
        data = response.json()

        # Should have error information
        assert "error" in data or "message" in data or "detail" in data


@pytest.mark.integration
class TestBulkImportDataMapping:
    """Test bulk import data structure mapping."""

    def test_bulk_import_response_schema(self):
        """Validate bulk import response schema."""
        sample_response = {
            "id": "import_123",
            "file_name": "users.csv",
            "status": "preview",
            "total_rows": 100,
            "valid_rows": 95,
            "invalid_rows": 5,
            "error_count": 5,
        }
        import_resp = BulkImportResponse(**sample_response)
        assert import_resp.file_name == "users.csv"
        assert import_resp.status == "preview"

    def test_bulk_import_request_schema(self):
        """Validate bulk import request schema."""
        valid_request = {
            "file_name": "users.csv",
            "file_content": "dGVzdCBjb250ZW50",  # Base64 encoded
            "import_type": "users",
        }
        req = BulkImportRequest(**valid_request)
        assert req.import_type == "users"
        assert req.commit is False  # Default value


@pytest.mark.integration
class TestDateTimeMapping:
    """Test datetime format consistency."""

    def test_iso8601_datetime_parsing(self):
        """Test ISO 8601 datetime parsing."""
        iso_date = "2024-12-31T23:59:59Z"
        sow_data = {
            "id": "sow_123",
            "title": "Test",
            "budget": 1000,
            "status": "active",
            "start_date": iso_date,
            "end_date": iso_date,
        }
        sow = SOWResponse(**sow_data)
        assert sow.start_date is not None
        assert isinstance(sow.start_date, datetime)

    def test_datetime_without_timezone(self):
        """Test datetime without timezone info."""
        local_date = "2024-12-31T23:59:59"
        sow_data = {
            "id": "sow_123",
            "title": "Test",
            "budget": 1000,
            "status": "active",
            "created_at": local_date,
        }
        sow = SOWResponse(**sow_data)
        assert sow.created_at is not None
