#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== Starting infrastructure (RabbitMQ + Redis) ==="
docker compose -f "$ROOT_DIR/deploy/docker/docker-compose.dev.yml" --profile data up -d
echo ""

echo "=== Starting all services in dev mode (excluding web) ==="
echo "  Services:"
echo "    user-service         -> localhost:5000"
echo "    payment-service      -> localhost:5001"
echo "    file-service         -> localhost:5002"
echo "    repair-service       -> localhost:5003"
echo "    notification-service -> localhost:5004"
echo "    chat-service         -> localhost:5005"
echo "    content-service      -> localhost:5010"
echo "  Gateways:"
echo "    auth-gateway         -> localhost:4001"
echo "    repair-gateway       -> localhost:4002"
echo "    media-gateway        -> localhost:4003"
echo "    realtime-gateway     -> localhost:4004"
echo "    content-gateway      -> localhost:4005"
echo "  Infrastructure:"
echo "    redis                -> localhost:6379"
echo "    rabbitmq             -> localhost:5672 (management: localhost:15672)"
echo ""

pnpm turbo run start:dev --concurrency 12 --filter='!@asko/web' --filter='!@asko/ui' --filter='!@asko/shared' --filter='!@asko/proto' --filter='!@asko/gateway-common' --filter='!@asko/observability' --filter='!@asko/authorization'
