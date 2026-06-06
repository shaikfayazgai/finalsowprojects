# Quick Start Guide for Integration Testing

Complete setup and execution guide for GlimmoraTeam integration tests.

## 📋 Prerequisites

### System Requirements
- **Windows 10+** or **Ubuntu 20.04+**
- **Python 3.11+**
- **Node.js 20+**
- **Docker & Docker Compose**
- **PowerShell 5.1+** (Windows)
- **Git**

### Verify Prerequisites

```bash
# Check Python
python --version
# Expected: Python 3.11.x or higher

# Check Node.js
node --version
npm --version
# Expected: Node v20.x or higher

# Check Docker
docker --version
docker compose --version
```

## 🚀 Setup Steps

### Step 1: Prepare Backend Services

```bash
# Navigate to backend infrastructure
cd backend/infra

# Start services (Kong, Postgres, MongoDB, Redis, Kafka)
docker compose up -d

# Verify services are running
docker compose ps
# You should see 6+ services running

# Wait 30-60 seconds for full initialization
```

### Step 2: Install Python Testing Dependencies

```bash
# From project root
cd testing

# Create and activate virtual environment (optional but recommended)
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (macOS/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Step 3: Install Frontend Testing Dependencies

```bash
# From project root
cd updatedfrontend/frontend

# Install dependencies
npm install

# Download Playwright browsers
npx playwright install
```

### Step 4: Verify Service Health

```bash
# Run health check
bash testing/scripts/health-check.sh  # macOS/Linux
# or
& testing\scripts\health-check.ps1    # Windows PowerShell
```

Expected output:
```
✓ Kong Gateway - Ready
✓ Auth Service - Ready
✓ PostgreSQL - Ready
✓ MongoDB - Ready
✓ Redis - Ready
✓ Kafka - Ready
```

## ✅ Running Tests

### Option 1: Run All Tests (Recommended)

```powershell
# Windows
cd testing
.\scripts\run-all-tests.ps1 -Suite all -Verbose

# Expected output:
# ✓ API Tests passed
# ✓ Integration Tests passed
# ✓ Data Mapping Tests passed
```

### Option 2: Run Specific Test Suites

```bash
# API Tests Only
npm run test:api

# Data Mapping Tests
npm run test:data-mapping

# Workflow Integration Tests
npm run test:workflows

# E2E Tests
npm run test:e2e

# Load Testing
npm run test:load -- --concurrent 5 --duration 60
```

### Option 3: Run Individual Test Files

```bash
# Auth service tests
python -m pytest testing/api-testing/auth/test_auth_service.py -v

# Enterprise service tests
python -m pytest testing/api-testing/enterprise/test_enterprise_service.py -v

# Data schemas
python -m pytest testing/integration/data-mapping/test_data_schemas.py -v

# Workflows
python -m pytest testing/integration/workflows/test_workflows.py -v
```

### Option 4: Run with Filtering

```bash
# Run only auth tests
python -m pytest testing/ -m auth -v

# Run only bulk import tests
python -m pytest testing/ -m bulk_import -v

# Run integration tests only
python -m pytest testing/ -m integration -v

# Run and stop on first failure
python -m pytest testing/ -x

# Run with verbose output and print statements
python -m pytest testing/ -v -s
```

## 📊 View Test Results

After running tests, results are saved to `testing/reports/`:

```bash
# View latest report
testing/reports/<timestamp>/
├── api-tests.html          # API test results
├── integration-tests.html  # Integration test results
├── data-mapping-tests.html # Data mapping results
├── e2e-tests.html          # E2E test results
└── test-run.log            # Detailed logs
```

### Open HTML Reports

```bash
# macOS/Linux
open testing/reports/latest/api-tests.html

# Windows
start testing/reports/latest/api-tests.html
```

## 🔍 Debugging Failed Tests

### Check Service Logs

```bash
# View Kong logs
docker logs backend_infra-kong-1

# View Auth service logs
docker logs backend_infra-auth-service-1

# View PostgreSQL logs
docker logs backend_infra-postgres-1

# View all services
docker compose -f backend/infra/docker-compose.yml logs -f
```

### Run Tests in Debug Mode

```bash
# Verbose output
python -m pytest testing/api-testing/auth/ -v -s

# Stop on first failure
python -m pytest testing/api-testing/auth/ -x

# Show captured output
python -m pytest testing/api-testing/auth/ --capture=no

# Playwright debug mode (E2E tests)
npx playwright test --headed --debug
```

### Check Database State

```bash
# Connect to PostgreSQL
psql -U glimmora -d glimmora_dev

# Check MongoDB
mongosh --connectionString "mongodb+srv://..."

# Connect to Redis
redis-cli
```

## 🔄 Common Issues & Solutions

### Issue: "Connection refused" or "Service not ready"

**Solution:**
```bash
# Restart services
docker compose -f backend/infra/docker-compose.yml restart

# Or full restart
docker compose -f backend/infra/docker-compose.yml down
docker compose -f backend/infra/docker-compose.yml up -d

# Wait 60 seconds
```

### Issue: "Authentication failed" or "Invalid token"

**Solution:**
```bash
# Check test user credentials match backend seed
cat testing/api-testing/conftest.py  # Verify TEST_USERS

# Re-seed the database
docker exec backend_infra-postgres-1 psql -U glimmora glimmora_dev < backend/services/auth-service/seed.py
```

### Issue: "Port already in use"

**Solution:**
```bash
# Find process using port 9000 (Kong)
netstat -ano | findstr :9000  # Windows
lsof -i :9000                  # macOS/Linux

# Kill the process or use different port
docker compose -f backend/infra/docker-compose.yml up -d -p 9001:9000
```

### Issue: "pytest: command not found"

**Solution:**
```bash
# Install in virtual environment
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r testing/requirements.txt

# Or install globally (not recommended)
pip install pytest --user
```

### Issue: "ModuleNotFoundError: No module named 'httpx'"

**Solution:**
```bash
# Verify dependencies installed
pip list | grep httpx

# Reinstall dependencies
pip install --upgrade -r testing/requirements.txt
```

## 📈 Monitoring Test Execution

### Real-time Test Progress

```bash
# Watch test output
python -m pytest testing/ -v --tb=short --color=yes

# With timing
python -m pytest testing/ -v --durations=10
```

### Generate Coverage Reports

```bash
# Run with coverage
python -m pytest testing/ --cov=testing --cov-report=html

# View coverage
open htmlcov/index.html
```

## 🎯 Typical Test Scenarios

### Scenario 1: New Feature Testing

```bash
# Run only new tests for feature
python -m pytest testing/api-testing/auth/test_oauth.py -v

# Then run integration tests
python -m pytest testing/integration/workflows/test_workflows.py -v
```

### Scenario 2: Regression Testing

```bash
# Run all tests
npm run test:all

# Check for failures
# Review reports/html
```

### Scenario 3: Load Testing

```bash
# Low load
npm run test:load -- --concurrent 1 --duration 30

# Medium load
npm run test:load -- --concurrent 5 --duration 60

# High load
npm run test:load -- --concurrent 20 --duration 120
```

### Scenario 4: Data Validation

```bash
# Run only data schema tests
python -m pytest testing/integration/data-mapping/ -v

# Verify request/response contracts
python -m pytest testing/api-testing/ -m auth -v
```

## 📝 Continuous Integration (CI)

To add testing to your CI/CD pipeline:

```yaml
# .github/workflows/test.yml
name: Integration Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Start services
        run: docker compose -f backend/infra/docker-compose.yml up -d
        
      - name: Wait for services
        run: sleep 60
        
      - name: Run tests
        run: npm run test:all
        
      - name: Upload reports
        if: always()
        uses: actions/upload-artifact@v2
        with:
          name: test-reports
          path: testing/reports/
```

## 🎓 Learning Resources

### Understanding the Tests

- **API Tests**: `testing/api-testing/` - Contract validation
- **Data Mapping**: `testing/integration/data-mapping/` - Schema alignment
- **Workflows**: `testing/integration/workflows/` - End-to-end flows
- **E2E**: `updatedfrontend/e2e/` - UI interactions

### Key Concepts

1. **Fixtures** - Reusable test setup (see `conftest.py`)
2. **Markers** - Group tests (@pytest.mark.auth, etc.)
3. **Schemas** - Pydantic models validate data
4. **Mocking** - Simulate external services
5. **Load Testing** - Stress test endpoints

## ✨ Best Practices

1. ✅ Always run health check before tests
2. ✅ Use virtual environment for Python
3. ✅ Review test reports for failures
4. ✅ Run tests before committing code
5. ✅ Keep test data in `testing/integration/fixtures/`
6. ✅ Update schemas when API changes
7. ✅ Run E2E tests in headed mode for debugging
8. ✅ Use markers to organize tests

## 📞 Support & Troubleshooting

For help:

1. Check logs in `testing/reports/*/test-run.log`
2. Review service logs: `docker compose logs`
3. Run health check: `npm run test:health`
4. Try with `-v -s` flags for verbose output
5. Check `README.md` in `testing/`

---

**Last Updated**: December 2024  
**Version**: 1.0  
**Status**: ✓ Ready for Integration Testing
