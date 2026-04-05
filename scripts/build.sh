#!/usr/bin/env bash
set -euo pipefail

# Parse arguments
SKIP_INSTALL=false
for arg in "$@"; do
  case $arg in
    --skip-install)
      SKIP_INSTALL=true
      shift
      ;;
  esac
done

if [ "$SKIP_INSTALL" = false ]; then
  echo "=== Installing dependencies ==="
  pnpm install
else
  echo "=== Skipping package installation (--skip-install) ==="
fi

# Build order:
#   1. @asko/shared    (standalone, used by everything)
#   2. @asko/proto     (standalone, used by services + api)
#   3. @asko/ui        (standalone, used by web)
#   4. services + api  (depend on shared + proto)

echo ""
echo "=== 1/6 Building @asko/shared ==="
pnpm --filter @asko/shared run build

echo ""
echo "=== 2/6 Building @asko/proto ==="
pnpm --filter @asko/proto run build

echo ""
echo "=== 3/6 Building @asko/observability ==="
pnpm --filter @asko/observability run build

echo ""
echo "=== 4/6 Building @asko/gateway-common ==="
pnpm --filter @asko/gateway-common run build

echo ""
echo "=== 5/6 Building @asko/ui ==="
pnpm --filter @asko/ui run build

echo ""
echo "=== 6/6 Building services + gateways ==="
pnpm --filter user-service run build
pnpm --filter payment-service run build
pnpm --filter file-service run build
pnpm --filter repair-service run build
pnpm --filter notification-service run build
pnpm --filter chat-service run build
pnpm --filter api run build
pnpm --filter auth-gateway run build

echo ""
echo "=== Build complete ==="
