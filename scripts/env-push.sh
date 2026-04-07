#!/usr/bin/env bash
set -euo pipefail

# Push local .env.prod files to VPS
# Usage: ./scripts/env-push.sh [app-name...]
#   No args = push all, or specify apps: ./scripts/env-push.sh auth-gateway web

SSH_KEY="$HOME/.ssh/asko_rws_vps_deploy_user"
SSH_TARGET="asko-rws@193.42.127.113"
REMOTE_DIR="~/apps/asko"

ALL_APPS=(
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

# Use args if provided, otherwise all apps
if [ $# -gt 0 ]; then
  APPS=("$@")
else
  APPS=("${ALL_APPS[@]}")
fi

echo "=== Pushing .env.prod to VPS ==="

pushed=0
skipped=0

for app in "${APPS[@]}"; do
  local_path="$ROOT_DIR/apps/$app/.env.prod"

  if [ -f "$local_path" ]; then
    remote_path="$REMOTE_DIR/apps/$app/.env.prod"
    scp -i "$SSH_KEY" -o StrictHostKeyChecking=no "$local_path" "$SSH_TARGET:$remote_path"
    echo "  ✓ $app"
    pushed=$((pushed + 1))
  else
    echo "  - $app (no local .env.prod)"
    skipped=$((skipped + 1))
  fi
done

echo ""
echo "Done: $pushed pushed, $skipped skipped"
