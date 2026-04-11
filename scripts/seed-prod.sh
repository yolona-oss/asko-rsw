#!/usr/bin/env bash
set -euo pipefail

# Runs idempotent prod seeders for core services. Safe to re-run.
#   user-service     — creates SUPER_ADMIN from SEED_ADMIN_* env vars if none exists
#   repair-service   — inserts base device categories if missing
#   content-service  — inserts welcome article if missing
#
# Requires explicit --confirm to prevent accidental runs against prod DB.
#
# Usage: ./scripts/seed-prod.sh --confirm [service...]

if [[ "${1:-}" != "--confirm" ]]; then
    cat <<EOF
ERROR: prod seed requires --confirm flag.

This script runs against .env.prod and will connect to the production database.
Re-run with:

    ./scripts/seed-prod.sh --confirm

Required env vars in apps/user-service/.env.prod:
    SEED_ADMIN_NAME
    SEED_ADMIN_EMAIL
    SEED_ADMIN_PHONE
    SEED_ADMIN_PASSWORD
EOF
    exit 1
fi
shift

if [[ $# -gt 0 ]]; then
    SERVICES=("$@")
else
    SERVICES=(user-service repair-service content-service)
fi

# Pre-flight: every requested service must have .env.prod
for svc in "${SERVICES[@]}"; do
    if [[ ! -f "apps/$svc/.env.prod" ]]; then
        echo "ERROR: apps/$svc/.env.prod not found — pull it first with ./scripts/env-pull.sh"
        exit 1
    fi
done

run_seeder() {
    local service=$1
    local class=$2
    echo ""
    echo "=== [$service] $class (env: apps/$service/.env.prod) ==="
    (cd "apps/$service" && NODE_ENV=prod npx mikro-orm seeder:run --class "$class")
}

echo "=== ASKO prod seeding (idempotent) ==="
echo "Services: ${SERVICES[*]}"

for svc in "${SERVICES[@]}"; do
    run_seeder "$svc" "ProdSeeder"
done

echo ""
echo "=== Prod seed complete ==="
