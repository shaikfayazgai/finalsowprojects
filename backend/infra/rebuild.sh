#!/usr/bin/env bash
# Rebuild one or more backend services AND refresh Kong so the gateway picks up
# the new container IPs (avoids stale-IP 404s). Run from backend/infra.
#
# Usage:
#   ./rebuild.sh                      # rebuild ALL services + restart Kong
#   ./rebuild.sh auth-service         # rebuild one service + restart Kong
#   ./rebuild.sh enterprise-service superadmin-service   # several
set -euo pipefail
cd "$(dirname "$0")"

SERVICES="$*"
if [ -z "$SERVICES" ]; then
  echo "▶ Rebuilding ALL services…"
  docker compose build
  docker compose up -d
else
  echo "▶ Rebuilding: $SERVICES"
  docker compose build $SERVICES
  docker compose up -d $SERVICES
fi

echo "▶ Restarting Kong so it re-resolves service IPs…"
docker compose restart kong

echo "▶ Waiting for Kong to come back…"
for i in $(seq 1 20); do
  code=$(curl -s -m 5 -o /dev/null -w "%{http_code}" http://127.0.0.1:9000/api/v1/auth/email-available?email=x@x.com 2>/dev/null || echo 000)
  if [ "$code" != "000" ] && [ "$code" != "502" ]; then echo "✓ Gateway ready (HTTP $code)"; exit 0; fi
  sleep 2
done
echo "⚠ Kong still warming up — give it a few more seconds."
