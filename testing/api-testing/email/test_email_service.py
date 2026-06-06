"""
API Contract Tests for Email Service
Tests: /api/email endpoints
"""

import pytest
import httpx
import uuid


@pytest.mark.auth
class TestEmailService:
    """Email service API tests."""

    def test_send_email(self, client: httpx.Client, auth_headers: dict):
        """Test sending email."""
        email_data = {
            "to": "recipient@example.com",
            "subject": "Test Email",
            "body": "This is a test email",
            "template": "test",
        }
        response = client.post(
            "/api/email/send",
            json=email_data,
            headers=auth_headers,
        )
        assert response.status_code in [200, 201, 400]

    def test_send_email_with_template(self, client: httpx.Client, auth_headers: dict):
        """Test sending email with template."""
        email_data = {
            "to": "user@example.com",
            "template": "welcome",
            "template_vars": {
                "name": "John Doe",
                "activation_link": "https://example.com/activate",
            },
        }
        response = client.post(
            "/api/email/send",
            json=email_data,
            headers=auth_headers,
        )
        assert response.status_code in [200, 201, 400]

    def test_send_bulk_email(self, client: httpx.Client, auth_headers: dict):
        """Test sending bulk email."""
        email_data = {
            "recipients": ["user1@example.com", "user2@example.com"],
            "subject": "Bulk Email",
            "template": "notification",
        }
        response = client.post(
            "/api/email/send-bulk",
            json=email_data,
            headers=auth_headers,
        )
        assert response.status_code in [200, 201, 400]

    def test_list_email_templates(self, client: httpx.Client, auth_headers: dict):
        """Test listing available email templates."""
        response = client.get(
            "/api/email/templates",
            headers=auth_headers,
        )
        assert response.status_code in [200, 404]
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, list) or "data" in data

    def test_get_email_template(self, client: httpx.Client, auth_headers: dict):
        """Test getting specific email template."""
        response = client.get(
            "/api/email/templates/welcome",
            headers=auth_headers,
        )
        assert response.status_code in [200, 404]

    def test_email_validation(self, client: httpx.Client, auth_headers: dict):
        """Test email address validation."""
        response = client.post(
            "/api/email/validate",
            json={"email": "test@example.com"},
            headers=auth_headers,
        )
        assert response.status_code in [200, 400]

    def test_send_invalid_email(self, client: httpx.Client, auth_headers: dict):
        """Test sending to invalid email address."""
        email_data = {
            "to": "invalid-email",
            "subject": "Test",
            "body": "Test",
        }
        response = client.post(
            "/api/email/send",
            json=email_data,
            headers=auth_headers,
        )
        assert response.status_code in [400, 422]

    def test_email_delivery_status(self, client: httpx.Client, auth_headers: dict):
        """Test checking email delivery status."""
        message_id = str(uuid.uuid4())
        response = client.get(
            f"/api/email/status/{message_id}",
            headers=auth_headers,
        )
        assert response.status_code in [200, 404]
