"""Testing module initialization."""

__version__ = "1.0.0"
__description__ = "Integration Testing Suite for GlimmoraTeam"

# Test discovery markers
MARKERS = [
    "auth",
    "oauth",
    "enterprise",
    "contributor",
    "superadmin",
    "bulk_import",
    "files",
    "email",
    "integration",
    "slow",
    "flaky",
]

# Test user roles
TEST_ROLES = [
    "superadmin",
    "admin",
    "enterprise",
    "contributor",
    "reviewer",
    "mentor",
]

# API services
SERVICES = [
    "auth",
    "contributor",
    "enterprise",
    "superadmin",
    "universities",
    "women",
    "mentor",
    "email",
    "files",
]

# Test configuration
CONFIG = {
    "base_url": "http://localhost:9000",
    "api_version": "v1",
    "timeout": 30,
    "retry_count": 3,
    "retry_delay": 1,
}
