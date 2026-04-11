#!/usr/bin/env bash
set -euo pipefail

# Runs destructive dev seeders for core services. Wipes seeded tables and
# reinserts a deterministic fixture set (10 users, devices, dealers, etc).
#
# Uses NODE_ENV=dev so mikro-orm.config.ts loads apps/<svc>/.env.dev via
# getEnvFilePath() — never .env.prod.
#
# Usage: ./scripts/seed-dev.sh [service...]
#   No args  — seed user-service, repair-service, content-service (in order)
#   service  — seed only the listed services

if [[ $# -gt 0 ]]; then
    SERVICES=("$@")
else
    SERVICES=(user-service repair-service content-service)
fi

# Pre-flight: every requested service must have .env.dev
for svc in "${SERVICES[@]}"; do
    if [[ ! -f "apps/$svc/.env.dev" ]]; then
        echo "ERROR: apps/$svc/.env.dev not found"
        exit 1
    fi
done

run_seeder() {
    local service=$1
    local class=$2
    echo ""
    echo "=== [$service] $class (env: apps/$service/.env.dev) ==="
    (cd "apps/$service" && NODE_ENV=dev npx mikro-orm seeder:run --class "$class")
}

echo "=== ASKO dev seeding ==="
echo "Services: ${SERVICES[*]}"

# Order matters: user-service first (so the referenced user IDs exist
# conceptually), then repair-service, then content-service.
for svc in "${SERVICES[@]}"; do
    run_seeder "$svc" "DevSeeder"
done

echo ""
echo "=== Dev seed complete ==="
echo ""
echo "Dev users (password: password123):"
echo "  superadmin@asko.dev  — SUPER_ADMIN"
echo "  admin@asko.dev       — ADMIN"
echo "  dealer1@asko.dev     — DEALER"
echo "  dealer2@asko.dev     — DEALER"
echo "  manager1@asko.dev    — MANAGER"
echo "  manager2@asko.dev    — MANAGER"
echo "  repairer1@asko.dev   — REPAIRER"
echo "  repairer2@asko.dev   — REPAIRER"
echo "  user1@asko.dev       — USER"
echo "  user2@asko.dev       — USER"
