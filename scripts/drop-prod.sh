#!/usr/bin/env bash
set -euo pipefail

# Drops all tables + the migrations table from PROD databases for every
# service. Catastrophically destructive — wipes every row of production
# data. Requires --confirm AND an interactive typed confirmation.
#
# Usage: ./scripts/drop-prod.sh --confirm [service...]

if [[ "${1:-}" != "--confirm" ]]; then
    cat <<EOF
ERROR: prod drop requires --confirm flag.

**THIS WILL DESTROY ALL PRODUCTION DATA!!

This script runs mikro-orm schema:drop with NODE_ENV=prod against every
service's production database. Tables, migrations history, and all rows
will be deleted. There is no undo.

Re-run with:

    ./scripts/drop-prod.sh --confirm
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

PROCEED_PASS="IM DUMB"

# Interactive typed confirmation — no way to bypass accidentally.
echo ""
echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
echo "!!  YOU ARE ABOUT TO DROP PRODUCTION TABLES               !!"
echo "!!  Services: ${SERVICES[*]}"
echo "!!  This will delete ALL data in the listed services.     !!"
echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
echo ""
read -r -p "Type exactly \"${PROCEED_PASS}\" to continue: " reply
if [[ "$reply" != ${PROCEED_PASS} ]]; then
    echo "Aborted."
    exit 1
fi

run_drop() {
    local service=$1
    echo ""
    echo "=== [$service] schema:drop (env: apps/$service/.env.prod) ==="
    (cd "apps/$service" && NODE_ENV=prod npx mikro-orm schema:drop --run --drop-migrations-table)
}

echo "=== ASKO PROD drop (destructive) ==="

for svc in "${SERVICES[@]}"; do
    run_drop "$svc"
done

echo ""
echo "=== Prod drop complete ==="
echo ""
echo "Next steps (if you intend to rebuild):"
echo "  ./scripts/migrate-prod.sh --confirm   # recreate schema"
echo "  ./scripts/seed-prod.sh --confirm      # seed baseline rows"
