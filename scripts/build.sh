#!/usr/bin/env bash
set -euo pipefail

echo "=== Installing dependencies ==="
pnpm install

echo ""
echo "=== Building all packages and services (excluding web) ==="
pnpm dlx turbo run build --filter='!web'

echo ""
echo "=== Build complete ==="
