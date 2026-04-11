#!/usr/bin/env bash
set -euo pipefail

# Drops all tables + the migrations table from dev databases for every
# service. Destructive but reversible: ./scripts/migrate-dev.sh recreates
# the schema from migrations, and ./scripts/seed-dev.sh re-inserts fixtures.
#
# Uses NODE_ENV=dev so mikro-orm.config.ts loads apps/<svc>/.env.dev via
# getEnvFilePath() — never .env.prod.
#
# Usage: ./scripts/drop-dev.sh [service...]
#   No args  — drop all 7 services
#   service  — drop only the listed services

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

run_drop() {
    local service=$1
    echo ""
    echo "=== [$service] schema:drop (env: apps/$service/.env.dev) ==="
    (cd "apps/$service" && NODE_ENV=dev npx mikro-orm schema:drop --run --drop-migrations-table)
}

echo "=== ASKO dev drop (destructive) ==="
echo "Services: ${SERVICES[*]}"

for svc in "${SERVICES[@]}"; do
    run_drop "$svc"
done

echo ""
echo "=== Dev drop complete ==="
echo ""
echo "Next steps:"
echo "  ./scripts/migrate-dev.sh   # recreate schema"
echo "  ./scripts/seed-dev.sh      # reseed fixtures"
