#!/usr/bin/env bash
set -euo pipefail

# Push nginx.app.conf to VPS and reload nginx
# Usage: ./scripts/nginx-push.sh

SSH_KEY="$HOME/.ssh/asko_rws_vps_beget"
SSH_TARGET="root@193.42.127.113"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
NGINX_SRC="$ROOT_DIR/deploy/nginx/nginx.app.conf"

echo "=== Pushing nginx config to VPS ==="

scp -i "$SSH_KEY" -o StrictHostKeyChecking=no "$NGINX_SRC" "$SSH_TARGET:/etc/nginx/sites-available/asko-rws.conf"

ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_TARGET" "bash -c '
set -e
ln -sf /etc/nginx/sites-available/asko-rws.conf /etc/nginx/sites-enabled/asko-rws.conf
if nginx -t; then
  systemctl reload nginx
  echo \"  ✓ nginx config updated and reloaded\"
else
  echo \"  ✗ nginx config test failed — NOT reloaded\"
  exit 1
fi
'"
