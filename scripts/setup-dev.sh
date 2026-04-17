#!/usr/bin/env bash
set -euo pipefail

echo "=== ASKO Dev Environment Setup ==="
echo ""

# ── 1. Check prerequisites ──

check_cmd() {
  if ! command -v "$1" &>/dev/null; then
    echo "ERROR: $1 is not installed"
    exit 1
  fi
}

check_cmd pnpm
check_cmd node
check_cmd psql

echo "Prerequisites: pnpm, node, psql - OK"

# ── 2. Install dependencies ──

echo ""
echo "=== Installing dependencies ==="
pnpm install

# ── 3. Create PostgreSQL databases ──

echo ""
echo "=== Creating PostgreSQL databases ==="

DB_USER="almagest_root"
DB_PASS="almagest_root"

DATABASES=(
  "asko_rws_users_db"
  "asko_rws_payment_db"
  "asko_rws_files_db"
  "asko_rws_db"
  "asko_rws_notify_db"
  "asko_rws_chat_db"
  "asko_rws_content_db"
)

# Create user if not exists
psql -U postgres -tc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1 || \
  psql -U postgres -c "CREATE ROLE $DB_USER WITH LOGIN PASSWORD '$DB_PASS' CREATEDB;"

echo "  User '$DB_USER' ready"

# Create databases if not exist
for db in "${DATABASES[@]}"; do
  psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname='$db'" | grep -q 1 || \
    psql -U postgres -c "CREATE DATABASE $db OWNER $DB_USER;"
  echo "  Database '$db' ready"
done

# ── 4. Build packages ──

echo ""
echo "=== Building shared packages ==="
pnpm --filter @asko/shared run build
pnpm --filter @asko/observability run build
pnpm --filter @asko/authorization run build
pnpm --filter @asko/gateway-common run build
pnpm --filter @asko/ui run build

# ── 5. Run migrations ──

echo ""
echo "=== Running migrations ==="

run_migration() {
  local service=$1
  echo "  Migrating $service..."
  (cd "apps/$service" && NODE_ENV=dev npx mikro-orm migration:up 2>/dev/null) || echo "    (no pending migrations or migration failed - check manually)"
}

run_migration "user-service"
run_migration "payment-service"
run_migration "file-service"
run_migration "repair-service"
run_migration "notification-service"
run_migration "chat-service"
run_migration "content-service"

echo ""
echo "=== Dev setup complete ==="
echo ""
echo "Services:"
echo "  user-service         -> localhost:5000"
echo "  payment-service      -> localhost:5001"
echo "  file-service         -> localhost:5002"
echo "  repair-service       -> localhost:5003"
echo "  notification-service -> localhost:5004"
echo "  chat-service         -> localhost:5005"
echo "  content-service      -> localhost:5010"
echo "Gateways:"
echo "  auth-gateway         -> localhost:4001"
echo "  repair-gateway       -> localhost:4002"
echo "  media-gateway        -> localhost:4003"
echo "  realtime-gateway     -> localhost:4004"
echo "  content-gateway      -> localhost:4005"
echo "Frontend:"
echo "  web                  -> localhost:3000"
echo ""
echo "Start all services:  ./scripts/dev.sh"
echo "Start web only:      cd apps/web && pnpm run dev"
