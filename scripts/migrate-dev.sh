#!/usr/bin/env bash
set -euo pipefail

# Runs mikro-orm migration:up against dev databases for every service.
#
# Uses NODE_ENV=dev so mikro-orm.config.ts loads apps/<svc>/.env.dev via
# getEnvFilePath() — never .env.prod.
#
# Usage: ./scripts/migrate-dev.sh [service...]
#   No args  — migrate all 7 services
#   service  — migrate only the listed services

ALL_SERVICES=(
    user-service
    payment-service
    file-service
    repair-service
    notification-service
    chat-service
    content-service
)

if [[ $# -gt 0 ]]; then
    SERVICES=("$@")
else
    SERVICES=("${ALL_SERVICES[@]}")
fi

# Pre-flight: every requested service must have .env.dev
for svc in "${SERVICES[@]}"; do
    if [[ ! -f "apps/$svc/.env.dev" ]]; then
        echo "ERROR: apps/$svc/.env.dev not found"
        exit 1
    fi
done

run_migration() {
    local service=$1
    echo ""
    echo "=== [$service] migration:up (env: apps/$service/.env.dev) ==="
    (cd "apps/$service" && NODE_ENV=dev npx mikro-orm migration:up)
}

echo "=== ASKO dev migration ==="
echo "Services: ${SERVICES[*]}"

for svc in "${SERVICES[@]}"; do
    run_migration "$svc"
done

echo ""
echo "=== Dev migration complete ==="
