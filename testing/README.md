# Integration Testing Suite for GlimmoraTeam

Complete testing infrastructure for validating frontend-backend integration, API contracts, and data mapping.

## Structure

```
testing/
├── README.md (this file)
├── integration/           # End-to-end and integration tests
│   ├── api-contracts/     # API contract validation
│   ├── data-mapping/      # Frontend↔Backend data mapping tests
│   ├── workflows/         # Complete user workflow tests
│   └── fixtures/          # Test data and mocks
├── api-testing/           # API-only tests (no UI)
│   ├── auth/              # Authentication service tests
│   ├── services/          # Individual service tests
│   └── configs/           # API test configurations
├── data-validation/       # Data transformation and validation
│   ├── schemas/           # JSON schema definitions
│   ├── validators/        # Validation rules
│   └── test-data/         # Sample datasets
└── scripts/               # Test automation and utilities
    ├── run-all-tests.ps1  # Master test runner
    ├── health-check.sh    # Service health validation
    └── load-test.js       # Basic load testing
```

## Getting Started

### Prerequisites

- Python 3.11+ (backend testing)
- Node.js 20+ (frontend testing)
- Docker (for running services locally)
- PowerShell 5.1+ (Windows test runner)

### Setup

```bash
# Install Python dependencies for API testing
pip install -r testing/requirements.txt

# Install Node dependencies for E2E testing
cd updatedfrontend/frontend
npm install

# Start backend services
cd backend/infra
docker compose up -d

# Wait for services to be ready (Kong, Postgres, MongoDB, Redis, Kafka)
```

### Running Tests

```powershell
# Run all tests
.\testing\scripts\run-all-tests.ps1

# Run specific test suites
.\testing\scripts\run-all-tests.ps1 -Suite "api" -Verbose
.\testing\scripts\run-all-tests.ps1 -Suite "integration" -Verbose
.\testing\scripts\run-all-tests.ps1 -Suite "data-mapping" -Verbose

# Health check
.\testing\scripts\health-check.sh

# Load testing
node testing/scripts/load-test.js --concurrent 5 --duration 60
```

## Test Suites

### 1. API Contract Testing (`api-testing/`)
- **Purpose**: Validate that backend APIs match documented contracts
- **Tools**: pytest, httpx, Pydantic
- **Coverage**: All 9 microservices, request/response schemas, error codes

### 2. Data Mapping Tests (`integration/data-mapping/`)
- **Purpose**: Ensure frontend data structures match backend responses
- **Scope**: 
  - Auth token mapping
  - User profile schema alignment
  - SOW decomposition data flow
  - Bulk import data transformation
  - Error response consistency

### 3. Integration Workflows (`integration/workflows/`)
- **Purpose**: Test complete user journeys
- **Scenarios**:
  - User registration → login → profile creation
  - Contributor creates SOW → enterprise reviews → approval
  - Bulk import preview → validation → commit
  - Dashboard data load & aggregation

### 4. Playwright E2E Tests (`updatedfrontend/e2e/`)
- **Purpose**: UI interaction and behavior validation
- **Scope**: Forms, navigation, real-time updates, error handling

## Test Data Management

Test data lives in `testing/data-validation/test-data/`:
- **users.json** - Test user credentials (superadmin, enterprise, contributor)
- **sows.json** - Sample SOW documents
- **bulk-imports.json** - Bulk import payloads for validation

**Important**: Test data is seeded from `backend/services/*/seed.py` on Docker startup. No manual fixture setup required.

## CI/CD Integration

To integrate into your CI pipeline:

```yaml
# GitHub Actions example (.github/workflows/test.yml)
- name: Run API Tests
  run: |
    cd backend
    python -m pytest tests/ -v --cov
    
- name: Run Integration Tests
  run: |
    cd updatedfrontend/frontend
    npm run test:integration -- --reporter=html
    
- name: Run E2E Tests
  run: |
    cd updatedfrontend/frontend
    npm run test:e2e -- --reporter=html
```

## Debugging Failed Tests

### API Tests
```bash
# Verbose output with request/response logs
python -m pytest testing/api-testing/ -v -s --log-cli-level=DEBUG

# Stop on first failure
python -m pytest testing/api-testing/ -x
```

### Integration Tests
```bash
# Run with retry on network flakes
python -m pytest testing/integration/ -v --tb=short -r fE

# Check service health first
curl http://localhost:9000/api/health
curl http://localhost:9001/status
```

### E2E Tests
```bash
# Debug mode with headed browser
npx playwright test --headed --debug

# Generate HTML report
npm run test:e2e:report
```

## Data Validation Rules

All frontend requests are validated against:

1. **Request Schema** - POST/PUT body structure and types
2. **Response Schema** - Expected API response format
3. **Error Schema** - Standard error response format
4. **Data Types** - Enums (roles, statuses), date formats (ISO 8601), UUIDs

See `testing/data-validation/schemas/` for full definitions.

## Monitoring & Reporting

After each test run, check:

1. **Test Report** - `testing/reports/latest.html`
2. **Coverage Report** - `testing/reports/coverage/index.html`
3. **Performance Metrics** - `testing/reports/performance.json`

```bash
# Generate full report
npm run test:report
```

## Troubleshooting

### Services Not Ready
```bash
# Check Kong gateway status
curl -s http://localhost:9000/api/v1/health | jq

# Check individual service
curl http://localhost:8000/health  # auth-service
curl http://localhost:8001/health  # contributor-service
```

### Database Connection Issues
```bash
# Verify Postgres is running
psql -U glimmora -d glimmora_dev -c "SELECT 1"

# Check MongoDB connection
mongosh --connectionString "mongodb+srv://..."
```

### Redis/Kafka Issues
```bash
# Check Redis
redis-cli ping

# Check Kafka
kafka-consumer-groups.sh --bootstrap-server localhost:29092 --list
```

## Test Metrics & KPIs

| Metric | Target | Status |
|--------|--------|--------|
| API Coverage | >90% | ⏳ In Progress |
| Data Mapping Pass Rate | 100% | ⏳ In Progress |
| Integration Test Duration | <5min | ⏳ In Progress |
| E2E Test Flakiness | <5% | ⏳ In Progress |

## Contributing to Tests

When adding new tests:

1. Follow the structure in `testing/api-testing/` or `testing/integration/`
2. Use fixtures from `testing/integration/fixtures/`
3. Document test purpose in docstrings
4. Update this README with new test coverage
5. Ensure tests are deterministic and don't depend on test order

## Resources

- Backend architecture: `backend/README.md`
- API contracts: `updatedfrontend/docs/backend-handoff/`
- Data models: `updatedfrontend/docs/architecture/`
- Frontend specs: `updatedfrontend/docs/portal-specs/`
