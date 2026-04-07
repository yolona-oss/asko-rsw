#!/usr/bin/env bash
set -euo pipefail

# Pull .env.prod files from VPS to local apps/
# Usage: ./scripts/env-pull.sh

SSH_KEY="$HOME/.ssh/asko_rws_vps_deploy_user"
SSH_TARGET="asko-rws@193.42.127.113"
REMOTE_DIR="~/apps/asko"

APPS=(
  auth-gateway
  repair-gateway
  media-gateway
  realtime-gateway
  content-gateway
  user-service
  payment-service
  file-service
  repair-service
  notification-service
  chat-service
  content-service
  web
)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== Pulling .env.prod from VPS ==="

pulled=0
skipped=0

for app in "${APPS[@]}"; do
  remote_path="$REMOTE_DIR/apps/$app/.env.prod"
  local_path="$ROOT_DIR/apps/$app/.env.prod"

  if ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_TARGET" "test -f $remote_path" 2>/dev/null; then
    scp -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_TARGET:$remote_path" "$local_path"
    echo "  ✓ $app"
    pulled=$((pulled + 1))
  else
    echo "  - $app (no .env.prod on VPS)"
    skipped=$((skipped + 1))
  fi
done

echo ""
echo "Done: $pulled pulled, $skipped skipped"
