"""Pytest configuration and fixtures for API testing."""

import os
from typing import AsyncGenerator, Generator
import pytest
import httpx
from dotenv import load_dotenv
from urllib.parse import urljoin

# Load environment variables
load_dotenv()

# API Configuration
API_BASE_URL = os.getenv("GLIMMORA_API_URL", "http://localhost:9000")
API_VERSION = "v1"
API_TIMEOUT = 30

# Test User Credentials (from backend seeding)
TEST_USERS = {
    "superadmin": {
        "email": "superadmin@glimmora.dev",
        "password": "glimmora123",
        "role": "super_admin",
    },
    "enterprise": {
        "email": "enterprise@glimmora.dev",
        "password": "enterprise123",
        "role": "enterprise",
    },
    "contributor": {
        "email": "contributor@glimmora.dev",
        "password": "contributor123",
        "role": "contributor",
    },
    "reviewer": {
        "email": "reviewer@glimmora.dev",
        "password": "reviewer123",
        "role": "reviewer",
    },
}


@pytest.fixture(scope="session")
def api_base_url() -> str:
    """Session-scoped API base URL."""
    return API_BASE_URL


@pytest.fixture(scope="session")
def test_users() -> dict:
    """Session-scoped test user credentials."""
    return TEST_USERS


@pytest.fixture
def client() -> Generator[httpx.Client, None, None]:
    """Synchronous HTTP client for API testing."""
    with httpx.Client(base_url=API_BASE_URL, timeout=API_TIMEOUT) as http_client:
        yield http_client


@pytest.fixture
async def async_client() -> AsyncGenerator[httpx.AsyncClient, None]:
    """Asynchronous HTTP client for API testing."""
    async with httpx.AsyncClient(base_url=API_BASE_URL, timeout=API_TIMEOUT) as http_client:
        yield http_client


@pytest.fixture
def auth_token(client, test_users):
    """Fixture to obtain valid auth token for superadmin."""
    superadmin = test_users["superadmin"]
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": superadmin["email"],
            "password": superadmin["password"],
        },
    )
    assert response.status_code == 200, f"Login failed: {response.text}"
    data = response.json()
    return data.get("access_token") or data.get("token")


@pytest.fixture
def auth_headers(auth_token: str) -> dict:
    """Headers with authorization token."""
    return {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json",
    }


@pytest.fixture
def enterprise_token(client, test_users):
    """Fixture to obtain valid auth token for enterprise user."""
    enterprise = test_users["enterprise"]
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": enterprise["email"],
            "password": enterprise["password"],
        },
    )
    assert response.status_code == 200, f"Enterprise login failed: {response.text}"
    data = response.json()
    return data.get("access_token") or data.get("token")


@pytest.fixture
def enterprise_headers(enterprise_token: str) -> dict:
    """Headers with enterprise authorization token."""
    return {
        "Authorization": f"Bearer {enterprise_token}",
        "Content-Type": "application/json",
    }


@pytest.fixture
def contributor_token(client, test_users):
    """Fixture to obtain valid auth token for contributor."""
    contributor = test_users["contributor"]
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": contributor["email"],
            "password": contributor["password"],
        },
    )
    assert response.status_code == 200, f"Contributor login failed: {response.text}"
    data = response.json()
    return data.get("access_token") or data.get("token")


@pytest.fixture
def contributor_headers(contributor_token: str) -> dict:
    """Headers with contributor authorization token."""
    return {
        "Authorization": f"Bearer {contributor_token}",
        "Content-Type": "application/json",
    }


@pytest.fixture
def api_client_factory(client):
    """Factory fixture for creating configured API clients."""
    def create_client(base_url: str = None, headers: dict = None):
        new_client = httpx.Client(
            base_url=base_url or API_BASE_URL,
            timeout=API_TIMEOUT,
            headers=headers or {},
        )
        return new_client
    return create_client


# Pytest configuration
def pytest_collection_modifyitems(config, items):
    """Add markers to tests based on file location."""
    for item in items:
        if "auth" in str(item.fspath):
            item.add_marker(pytest.mark.auth)
        elif "enterprise" in str(item.fspath):
            item.add_marker(pytest.mark.enterprise)
        elif "contributor" in str(item.fspath):
            item.add_marker(pytest.mark.contributor)
        elif "bulk_import" in str(item.fspath):
            item.add_marker(pytest.mark.bulk_import)


# Pytest markers
def pytest_configure(config):
    """Register custom markers."""
    config.addinivalue_line("markers", "auth: authentication service tests")
    config.addinivalue_line("markers", "enterprise: enterprise service tests")
    config.addinivalue_line("markers", "contributor: contributor service tests")
    config.addinivalue_line("markers", "bulk_import: bulk import tests")
    config.addinivalue_line("markers", "slow: slow running tests")
    config.addinivalue_line("markers", "integration: integration tests")
