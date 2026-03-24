#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== Starting infrastructure (RabbitMQ + Redis) ==="
docker compose -f "$ROOT_DIR/docker-compose.dev.yml" up -d
echo ""

echo "=== Starting all services in dev mode (excluding web) ==="
echo "  user-service         -> localhost:5000"
echo "  payment-service      -> localhost:5001"
echo "  file-service         -> localhost:5002"
echo "  repair-service       -> localhost:5003"
echo "  notification-service -> localhost:5004"
echo "  api                  -> localhost:4000"
echo "  redis                -> localhost:6379"
echo "  rabbitmq             -> localhost:5672 (management: localhost:15672)"
echo ""

pnpm dlx turbo run start:dev --filter='!@asko/web' --filter='!@asko/ui' --filter='!@asko/shared' --filter='!@asko/proto'
