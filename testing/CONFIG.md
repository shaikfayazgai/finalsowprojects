# Integration Testing: Environment & Configuration

## API Configuration

### Base URL & Endpoints

```
Production: https://api.glimmora.dev
Staging:    https://staging-api.glimmora.dev
Local:      http://localhost:9000
```

### Service Ports

| Service | Port | Purpose |
|---------|------|---------|
| Kong Gateway | 9000 | API Gateway |
| Kong Admin | 9001 | Kong management |
| Auth Service | 8000 | Authentication |
| Enterprise Service | 8001 | SOW Management |
| Contributor Service | 8002 | Contributor Portal |
| Superadmin Service | 8003 | Admin Panel |
| PostgreSQL | 5432 | Relational DB |
| MongoDB | 27017 | Document DB |
| Redis | 6379 | Cache/Sessions |
| Kafka | 29092 | Event Bus |
| Grafana | 3001 | Dashboards |
| Prometheus | 9090 | Metrics |

## Environment Variables

### Testing Environment (.env.test)

```bash
# API Configuration
GLIMMORA_API_URL=http://localhost:9000
API_VERSION=v1
API_TIMEOUT=30

# Database
DATABASE_URL=postgresql://glimmora:glimmora_dev@localhost:5432/glimmora_dev
MONGODB_URI=mongodb+srv://atlas_user:password@cluster.mongodb.net/glimmora_test

# Redis
REDIS_URL=redis://localhost:6379

# Authentication
AUTH_SECRET=test-secret-key-min-32-chars-required
JWT_EXPIRY=3600

# Email (Mock SMTP)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=test@example.com
SMTP_PASS=test

# File Storage
BLOB_STORE_URL=http://localhost:3004

# Logging
LOG_LEVEL=INFO
VERBOSE_LOGGING=false
```

### Local Development (.env.local)

```bash
GLIMMORA_API_URL=http://localhost:9000
NEXT_PUBLIC_GLIMMORA_API_URL=http://localhost:9000
DATABASE_URL=postgresql://glimmora:glimmora_dev@localhost:5432/glimmora_dev
```

## Test User Accounts

All users are pre-seeded on backend startup with predictable credentials:

| Role | Email | Password | Purpose |
|------|-------|----------|---------|
| Super Admin | superadmin@glimmora.dev | glimmora123 | Full system access |
| Admin | admin@glimmora.dev | admin123 | Admin operations |
| Enterprise | enterprise@glimmora.dev | enterprise123 | SOW management |
| Contributor | contributor@glimmora.dev | contributor123 | Proposals |
| Reviewer | reviewer@glimmora.dev | reviewer123 | Review queue |
| Mentor | mentor@glimmora.dev | mentor123 | Mentorship |

**Note**: Do NOT use these credentials in production. They are test fixtures only.

## Test Data Sets

### Location
`testing/integration/fixtures/`

### Available Fixtures

1. **users.json** - Test user profiles
2. **sows.json** - Sample SOW documents
3. **proposals.json** - Contributor proposals
4. **bulk-imports.json** - Bulk import payloads
5. **responses.json** - Expected API responses

### Using Fixtures in Tests

```python
import pytest
import json

@pytest.fixture
def test_users():
    with open('testing/integration/fixtures/users.json') as f:
        return json.load(f)

def test_example(client, test_users):
    user = test_users['superadmin']
    # Use in test...
```

## Database Seeding

### Automatic Seeding
- Triggered on backend container startup
- Seeds users, roles, permissions
- Creates test organizations
- Populates reference data

### Manual Seeding
```bash
# Connect to database
psql -U glimmora -d glimmora_dev

# Run seed script
\i backend/services/*/seed.sql
```

## Caching & State Management

### Redis Cache Keys

```
# User sessions
session:{userId}

# OTP tokens
otp:{email}

# Rate limits
rate-limit:{ip}:{endpoint}

# Feature flags
feature:{flag_name}
```

### Cache Clearing

```bash
# Connect to Redis
redis-cli

# Clear all
FLUSHALL

# Clear specific pattern
DEL session:*
```

## Logging & Debugging

### Log Levels

- **DEBUG**: Detailed execution flow
- **INFO**: General information
- **WARNING**: Unexpected conditions
- **ERROR**: Error conditions
- **CRITICAL**: System failures

### Enable Debug Logging

```bash
# Set environment variable
export LOG_LEVEL=DEBUG

# Or in pytest
python -m pytest testing/ -v -s --log-cli-level=DEBUG
```

### Log Files

```
testing/reports/latest/test-run.log        # Test execution log
backend/logs/                               # Backend service logs
docker logs <container>                     # Docker container logs
```

## Mocking & Stubbing

### Mock External Services

```python
from unittest.mock import patch, MagicMock

# Mock email service
@patch('services.email_service.send')
def test_email_sending(mock_send):
    mock_send.return_value = {'message_id': '123'}
    # Test code...
```

### Disable External Calls

```python
# In conftest.py
@pytest.fixture(autouse=True)
def mock_external_services():
    with patch('requests.get') as mock_get:
        mock_get.return_value.status_code = 200
        yield
```

## Performance Baselines

### Expected Response Times

| Endpoint | Avg (ms) | P95 (ms) | P99 (ms) |
|----------|----------|----------|----------|
| GET /api/v1/auth/me | 50 | 100 | 150 |
| GET /api/v1/sows | 100 | 200 | 300 |
| POST /api/v1/sows | 200 | 400 | 600 |
| POST /api/v1/auth/login | 150 | 300 | 500 |

### Load Test Targets

- **Throughput**: 100+ requests/second
- **Concurrent Users**: 50+ simultaneous
- **Error Rate**: <1%
- **99th Percentile Latency**: <5000ms

## Security & Compliance

### Test Data Handling

1. ✅ Never commit real credentials
2. ✅ Use `.env.test` for test secrets
3. ✅ Rotate test keys regularly
4. ✅ Mask sensitive data in logs
5. ✅ Clear test data after runs

### GDPR Considerations

- Test data should not contain real PII
- Use faker for generated test data
- Delete test database after runs
- Log minimal personal information

## Troubleshooting

### Port Conflicts

```bash
# Find process using port
lsof -i :9000

# Kill process
kill -9 <PID>

# Or use different port
docker compose up -p 9001:9000
```

### Connection Timeouts

```bash
# Increase timeout in conftest.py
API_TIMEOUT = 60  # seconds

# Or in pytest.ini
timeout = 60
```

### Memory Issues

```bash
# Limit concurrent tests
pytest -n 2  # Max 2 processes

# Or monitor memory
docker stats
```

## CI/CD Integration

### GitHub Actions Setup

```yaml
jobs:
  test:
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: glimmora
          POSTGRES_PASSWORD: glimmora_dev
          POSTGRES_DB: glimmora_dev
      redis:
        image: redis:7
```

### Environment Secrets

Required GitHub secrets:
- `DATABASE_URL`
- `MONGODB_URI`
- `AUTH_SECRET`
- `JWT_SECRET`

---

**Last Updated**: December 2024  
**Version**: 1.0
