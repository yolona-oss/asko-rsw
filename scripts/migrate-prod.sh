#!/usr/bin/env bash
set -euo pipefail

# Runs mikro-orm migration:up against PROD databases for every service.
# Requires explicit --confirm to prevent accidents, and checks that each
# service has a .env.prod file present before touching anything.
#
# Usage: ./scripts/migrate-prod.sh --confirm [service...]

if [[ "${1:-}" != "--confirm" ]]; then
    cat <<EOF
ERROR: prod migration requires --confirm flag.

This script runs mikro-orm migration:up with NODE_ENV=prod and will
connect to the production database(s). Re-run with:

    ./scripts/migrate-prod.sh --confirm
EOF
    exit 1
fi
shift

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

# Pre-flight: every requested service must have .env.prod
for svc in "${SERVICES[@]}"; do
    if [[ ! -f "apps/$svc/.env.prod" ]]; then
        echo "ERROR: apps/$svc/.env.prod not found — pull it first with ./scripts/env-pull.sh"
        exit 1
    fi
done

run_migration() {
    local service=$1
    echo ""
    echo "=== [$service] migration:up (env: apps/$service/.env.prod) ==="
    (cd "apps/$service" && NODE_ENV=prod npx mikro-orm migration:up)
}

echo "=== ASKO PROD migration ==="
echo "Services: ${SERVICES[*]}"

for svc in "${SERVICES[@]}"; do
    run_migration "$svc"
done

echo ""
echo "=== Prod migration complete ==="
