#!/bin/bash

# Service Health Check Script
# Verifies all required services are running and responsive

set -e

API_BASE_URL="${GLIMMORA_API_URL:-http://localhost:9000}"
TIMEOUT=5
RETRIES=3

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  GlimmoraTeam Service Health Check${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Function to check HTTP endpoint
check_http_service() {
    local name=$1
    local url=$2
    local max_retries=${3:-$RETRIES}
    
    for ((i=1; i<=max_retries; i++)); do
        if curl -s --max-time $TIMEOUT "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✓${NC} $name - Ready"
            return 0
        fi
        if [ $i -lt $max_retries ]; then
            sleep 2
        fi
    done
    echo -e "${RED}✗${NC} $name - Not responding"
    return 1
}

# Function to check TCP port
check_tcp_service() {
    local name=$1
    local host=$2
    local port=$3
    local max_retries=${4:-$RETRIES}
    
    for ((i=1; i<=max_retries; i++)); do
        if timeout $TIMEOUT bash -c "echo >/dev/tcp/$host/$port" > /dev/null 2>&1; then
            echo -e "${GREEN}✓${NC} $name - Ready (port $port)"
            return 0
        fi
        if [ $i -lt $max_retries ]; then
            sleep 2
        fi
    done
    echo -e "${YELLOW}⚠${NC} $name - Not responding on port $port"
    return 1
}

echo "Checking services..."
echo ""

all_healthy=true

# Check Kong Gateway
if ! check_http_service "Kong Gateway" "$API_BASE_URL/api/health"; then
    all_healthy=false
fi

# Check Auth Service
if ! check_http_service "Auth Service" "http://localhost:8000/health"; then
    all_healthy=false
fi

# Check PostgreSQL
if ! check_tcp_service "PostgreSQL" "localhost" 5432 2; then
    all_healthy=false
fi

# Check MongoDB
if ! check_tcp_service "MongoDB" "localhost" 27017 2; then
    all_healthy=false
fi

# Check Redis
if ! check_tcp_service "Redis" "localhost" 6379 2; then
    all_healthy=false
fi

# Check Kafka
if ! check_tcp_service "Kafka" "localhost" 29092 2; then
    all_healthy=false
fi

echo ""

if [ "$all_healthy" = true ]; then
    echo -e "${GREEN}✓ All services are healthy${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠ Some services are not responding${NC}"
    echo -e "${YELLOW}Start services with: cd backend/infra && docker compose up -d${NC}"
    exit 1
fi
