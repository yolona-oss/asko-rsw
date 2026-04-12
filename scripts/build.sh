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
#   1. @asko/shared         (standalone, used by everything)
#   2. @asko/observability   (standalone, used by services)
#   3. @asko/gateway-common  (depends on shared)
#   4. @asko/ui              (standalone, used by web)
#   5. services + gateways   (depend on shared + proto + observability + gateway-common)

echo ""
echo "=== 1/5 Building @asko/shared ==="
pnpm --filter @asko/shared run build

echo ""
echo "=== 2/5 Building @asko/observability ==="
pnpm --filter @asko/observability run build

echo ""
echo "=== 3/5 Building @asko/gateway-common ==="
pnpm --filter @asko/gateway-common run build

echo ""
echo "=== 4/5 Building @asko/ui ==="
pnpm --filter @asko/ui run build

echo ""
echo "=== 5/5 Building services + gateways ==="
pnpm --filter @asko/user-service run build
pnpm --filter @asko/payment-service run build
pnpm --filter @asko/file-service run build
pnpm --filter @asko/repair-service run build
pnpm --filter @asko/notification-service run build
pnpm --filter @asko/chat-service run build
pnpm --filter @asko/content-service run build
pnpm --filter @asko/auth-gateway run build
pnpm --filter @asko/repair-gateway run build
pnpm --filter @asko/media-gateway run build
pnpm --filter @asko/realtime-gateway run build
pnpm --filter @asko/content-gateway run build

echo ""
echo "=== Build complete ==="
