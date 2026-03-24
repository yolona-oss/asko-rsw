#!/usr/bin/env bash
set -euo pipefail

echo "=== Starting all services in dev mode (excluding web) ==="
echo "  user-service     -> localhost:5000"
echo "  payment-service  -> localhost:5001"
echo "  file-service     -> localhost:5002"
echo "  repair-service   -> localhost:5003"
echo "  api              -> localhost:4000"
echo ""

pnpm dlx turbo run start:dev --filter='!web' --parallel
