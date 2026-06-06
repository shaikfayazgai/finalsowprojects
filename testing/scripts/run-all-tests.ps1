# Master Integration Test Runner
# PowerShell script to orchestrate all test suites

param(
    [string]$Suite = "all",
    [string]$Environment = "local",
    [switch]$Verbose,
    [switch]$FailFast,
    [switch]$NoCache
)

$ErrorActionPreference = "Stop"
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent (Split-Path -Parent $scriptRoot)

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  GlimmoraTeam Integration Test Suite Runner" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Configuration
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$reportDir = "$projectRoot/testing/reports/$timestamp"
$logFile = "$reportDir/test-run.log"

# Ensure report directory exists
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null

# Log function
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $logMsg = "[$((Get-Date).ToString('HH:mm:ss'))] [$Level] $Message"
    Add-Content -Path $logFile -Value $logMsg
    if ($Verbose -or $Level -eq "ERROR" -or $Level -eq "WARNING") {
        Write-Host $logMsg -ForegroundColor $(
            if ($Level -eq "ERROR") { "Red" }
            elseif ($Level -eq "WARNING") { "Yellow" }
            else { "Green" }
        )
    }
}

Write-Log "Starting test suite: $Suite"
Write-Log "Environment: $Environment"
Write-Log "Report directory: $reportDir"

# Check if services are running
function Test-ServiceHealth {
    Write-Host "`nChecking service health..." -ForegroundColor Yellow
    
    $services = @(
        @{ name = "Kong Gateway"; url = "http://localhost:9000/api/health"; port = 9000 }
        @{ name = "Auth Service"; url = "http://localhost:8000/health"; port = 8000 }
        @{ name = "PostgreSQL"; port = 5432 }
        @{ name = "MongoDB"; port = 27017 }
        @{ name = "Redis"; port = 6379 }
    )

    $allHealthy = $true
    foreach ($service in $services) {
        try {
            if ($service.url) {
                $response = Invoke-WebRequest -Uri $service.url -TimeoutSec 5 -SkipHttpErrorCheck
                if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 404) {
                    Write-Host "  ✓ $($service.name) - Ready" -ForegroundColor Green
                    Write-Log "$($service.name) is healthy"
                }
                else {
                    Write-Host "  ✗ $($service.name) - Unhealthy (HTTP $($response.StatusCode))" -ForegroundColor Red
                    Write-Log "$($service.name) returned HTTP $($response.StatusCode)" "WARNING"
                    $allHealthy = $false
                }
            }
            else {
                $connection = Test-NetConnection -ComputerName localhost -Port $service.port -WarningAction SilentlyContinue
                if ($connection.TcpTestSucceeded) {
                    Write-Host "  ✓ $($service.name) - Ready" -ForegroundColor Green
                    Write-Log "$($service.name) is listening on port $($service.port)"
                }
                else {
                    Write-Host "  ✗ $($service.name) - Not responding" -ForegroundColor Red
                    Write-Log "$($service.name) not responding on port $($service.port)" "WARNING"
                    $allHealthy = $false
                }
            }
        }
        catch {
            Write-Host "  ⚠ $($service.name) - Check failed" -ForegroundColor Yellow
            Write-Log "Health check failed for $($service.name): $_" "WARNING"
        }
    }

    return $allHealthy
}

# Run API Tests
function Run-APITests {
    Write-Host "`n📋 Running API Tests..." -ForegroundColor Cyan
    Write-Log "Starting API tests"

    try {
        $apiTestDir = "$projectRoot/testing/api-testing"
        $apiReport = "$reportDir/api-tests.html"
        
        if (-not (Test-Path $apiTestDir)) {
            Write-Log "API test directory not found: $apiTestDir" "ERROR"
            return $false
        }

        $pytestArgs = @(
            $apiTestDir,
            "-v",
            "--tb=short",
            "--html=$apiReport",
            "--self-contained-html",
            "--timeout=30"
        )

        if ($FailFast) { $pytestArgs += "-x" }
        if ($Verbose) { $pytestArgs += "-s" }

        Write-Log "Running: pytest $($pytestArgs -join ' ')"
        $output = & python -m pytest @pytestArgs 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ API Tests passed" -ForegroundColor Green
            Write-Log "API tests passed with exit code 0"
            return $true
        }
        else {
            Write-Host "  ✗ API Tests failed (exit code: $LASTEXITCODE)" -ForegroundColor Red
            Write-Log "API tests failed with exit code $LASTEXITCODE" "ERROR"
            Write-Host $output -ForegroundColor DarkRed
            return $false
        }
    }
    catch {
        Write-Host "  ✗ Error running API tests: $_" -ForegroundColor Red
        Write-Log "Exception during API tests: $_" "ERROR"
        return $false
    }
}

# Run Integration Tests
function Run-IntegrationTests {
    Write-Host "`n🔗 Running Integration Tests..." -ForegroundColor Cyan
    Write-Log "Starting integration tests"

    try {
        $integrationTestDir = "$projectRoot/testing/integration"
        $integrationReport = "$reportDir/integration-tests.html"
        
        if (-not (Test-Path $integrationTestDir)) {
            Write-Log "Integration test directory not found: $integrationTestDir" "ERROR"
            return $false
        }

        $pytestArgs = @(
            $integrationTestDir,
            "-v",
            "--tb=short",
            "--html=$integrationReport",
            "--self-contained-html",
            "--timeout=30",
            "-m", "integration"
        )

        if ($FailFast) { $pytestArgs += "-x" }
        if ($Verbose) { $pytestArgs += "-s" }

        Write-Log "Running: pytest $($pytestArgs -join ' ')"
        $output = & python -m pytest @pytestArgs 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ Integration Tests passed" -ForegroundColor Green
            Write-Log "Integration tests passed with exit code 0"
            return $true
        }
        else {
            Write-Host "  ✗ Integration Tests failed (exit code: $LASTEXITCODE)" -ForegroundColor Red
            Write-Log "Integration tests failed with exit code $LASTEXITCODE" "ERROR"
            Write-Host $output -ForegroundColor DarkRed
            return $false
        }
    }
    catch {
        Write-Host "  ✗ Error running integration tests: $_" -ForegroundColor Red
        Write-Log "Exception during integration tests: $_" "ERROR"
        return $false
    }
}

# Run E2E Tests
function Run-E2ETests {
    Write-Host "`n🎭 Running E2E Tests..." -ForegroundColor Cyan
    Write-Log "Starting E2E tests"

    try {
        $frontendDir = "$projectRoot/updatedfrontend/frontend"
        
        if (-not (Test-Path (Join-Path $frontendDir "package.json"))) {
            Write-Log "Frontend package.json not found" "WARNING"
            return $true
        }

        Push-Location $frontendDir
        
        $e2eReport = "$reportDir/e2e-tests.html"
        Write-Log "Running: npm run test:e2e"
        
        $output = & npm run test:e2e -- --reporter=html --out="$e2eReport" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ E2E Tests passed" -ForegroundColor Green
            Write-Log "E2E tests passed with exit code 0"
            Pop-Location
            return $true
        }
        else {
            Write-Host "  ✗ E2E Tests failed (exit code: $LASTEXITCODE)" -ForegroundColor Red
            Write-Log "E2E tests failed with exit code $LASTEXITCODE" "ERROR"
            Write-Host $output -ForegroundColor DarkRed
            Pop-Location
            return $false
        }
    }
    catch {
        Write-Host "  ✗ Error running E2E tests: $_" -ForegroundColor Red
        Write-Log "Exception during E2E tests: $_" "ERROR"
        Pop-Location
        return $false
    }
}

# Run Data Mapping Tests
function Run-DataMappingTests {
    Write-Host "`n📊 Running Data Mapping Tests..." -ForegroundColor Cyan
    Write-Log "Starting data mapping tests"

    try {
        $testDir = "$projectRoot/testing/integration/data-mapping"
        $report = "$reportDir/data-mapping-tests.html"
        
        if (-not (Test-Path $testDir)) {
            Write-Log "Data mapping test directory not found: $testDir" "ERROR"
            return $false
        }

        $pytestArgs = @(
            $testDir,
            "-v",
            "--tb=short",
            "--html=$report",
            "--self-contained-html",
            "-m", "integration"
        )

        if ($FailFast) { $pytestArgs += "-x" }
        if ($Verbose) { $pytestArgs += "-s" }

        Write-Log "Running: pytest $($pytestArgs -join ' ')"
        $output = & python -m pytest @pytestArgs 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ Data Mapping Tests passed" -ForegroundColor Green
            Write-Log "Data mapping tests passed with exit code 0"
            return $true
        }
        else {
            Write-Host "  ✗ Data Mapping Tests failed (exit code: $LASTEXITCODE)" -ForegroundColor Red
            Write-Log "Data mapping tests failed with exit code $LASTEXITCODE" "ERROR"
            Write-Host $output -ForegroundColor DarkRed
            return $false
        }
    }
    catch {
        Write-Host "  ✗ Error running data mapping tests: $_" -ForegroundColor Red
        Write-Log "Exception during data mapping tests: $_" "ERROR"
        return $false
    }
}

# Main execution
$results = @{}
$allPassed = $true

# Health check
if (-not (Test-ServiceHealth)) {
    Write-Host "`n⚠️  Warning: Some services are not healthy. Tests may fail." -ForegroundColor Yellow
    Write-Log "Service health check indicated issues" "WARNING"
}

# Run test suites based on parameter
switch ($Suite) {
    "all" {
        $results["API"] = Run-APITests
        if (-not $FailFast -or $results["API"]) {
            $results["Integration"] = Run-IntegrationTests
        }
        if (-not $FailFast -or $results["Integration"]) {
            $results["DataMapping"] = Run-DataMappingTests
        }
        if (-not $FailFast) {
            $results["E2E"] = Run-E2ETests
        }
    }
    "api" {
        $results["API"] = Run-APITests
    }
    "integration" {
        $results["Integration"] = Run-IntegrationTests
    }
    "data-mapping" {
        $results["DataMapping"] = Run-DataMappingTests
    }
    "e2e" {
        $results["E2E"] = Run-E2ETests
    }
    default {
        Write-Host "Unknown suite: $Suite" -ForegroundColor Red
        exit 1
    }
}

# Generate summary
Write-Host "`n═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Test Summary" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan

foreach ($test in $results.Keys) {
    $status = if ($results[$test]) { "✓ PASSED" } else { "✗ FAILED" }
    $color = if ($results[$test]) { "Green" } else { "Red" }
    Write-Host "  $test`: $status" -ForegroundColor $color
    Write-Log "$test`: $status"
    $allPassed = $allPassed -and $results[$test]
}

Write-Host "`nReports saved to: $reportDir" -ForegroundColor Cyan
Write-Host "Log file: $logFile" -ForegroundColor Cyan
Write-Host ""

if ($allPassed) {
    Write-Host "✓ All tests passed!" -ForegroundColor Green
    Write-Log "All tests passed"
    exit 0
}
else {
    Write-Host "✗ Some tests failed. Review reports for details." -ForegroundColor Red
    Write-Log "Some tests failed" "ERROR"
    exit 1
}
