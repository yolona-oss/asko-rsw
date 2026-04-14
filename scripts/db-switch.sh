#!/usr/bin/env bash
set -euo pipefail

# Switch DATABASE_HOST and DATABASE_PORT across all service env files.
#
# Usage:
#   ./scripts/db-switch.sh <host> [port]           # update .env.prod only
#   ./scripts/db-switch.sh <host> [port] --all     # update .env.prod, .env.dev, .env
#   ./scripts/db-switch.sh <host> [port] --env prod,dev
#
# Examples:
#   ./scripts/db-switch.sh localhost                # switch prod to localhost:5432
#   ./scripts/db-switch.sh rogufulalu.beget.app     # switch prod back to Beget
#   ./scripts/db-switch.sh 10.0.0.5 5433 --all     # switch all envs to 10.0.0.5:5433

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

NEW_HOST="${1:-}"
NEW_PORT="${2:-5432}"
ENV_FLAG="${3:-}"
ENV_LIST="${4:-}"

if [[ -z "$NEW_HOST" ]]; then
  echo "Usage: $0 <host> [port] [--all | --env prod,dev,...]"
  echo ""
  echo "  host    New DATABASE_HOST value"
  echo "  port    New DATABASE_PORT value (default: 5432)"
  echo "  --all   Update .env.prod, .env.dev, .env"
  echo "  --env   Comma-separated list: prod,dev,base"
  echo ""
  echo "Examples:"
  echo "  $0 localhost"
  echo "  $0 rogufulalu.beget.app 5432 --all"
  echo "  $0 10.0.0.5 5433 --env prod,dev"
  exit 1
fi

# If second arg looks like a flag, shift it
if [[ "$NEW_PORT" == --* ]]; then
  ENV_FLAG="$NEW_PORT"
  ENV_LIST="${3:-}"
  NEW_PORT="5432"
fi

# Determine which env suffixes to update
SUFFIXES=()
case "$ENV_FLAG" in
  --all)
    SUFFIXES=(.env.prod .env.dev .env)
    ;;
  --env)
    if [[ -z "$ENV_LIST" ]]; then
      echo "ERROR: --env requires a comma-separated list (e.g. --env prod,dev)"
      exit 1
    fi
    IFS=',' read -ra PARTS <<< "$ENV_LIST"
    for part in "${PARTS[@]}"; do
      case "$part" in
        prod)  SUFFIXES+=(.env.prod) ;;
        dev)   SUFFIXES+=(.env.dev)  ;;
        base)  SUFFIXES+=(.env)      ;;
        *)     echo "ERROR: unknown env '$part' (use: prod, dev, base)"; exit 1 ;;
      esac
    done
    ;;
  "")
    SUFFIXES=(.env.prod)
    ;;
  *)
    echo "ERROR: unknown flag '$ENV_FLAG' (use: --all or --env)"
    exit 1
    ;;
esac

echo "=== db-switch: DATABASE_HOST=$NEW_HOST DATABASE_PORT=$NEW_PORT ==="
echo "Env files: ${SUFFIXES[*]}"
echo ""

updated=0
skipped=0

for suffix in "${SUFFIXES[@]}"; do
  for env_file in "$ROOT_DIR"/apps/*/"$suffix"; do
    [[ -f "$env_file" ]] || continue

    if ! grep -q "DATABASE_HOST" "$env_file"; then
      continue
    fi

    app=$(basename "$(dirname "$env_file")")

    # Detect format: quoted (KEY = "value") or plain (KEY=value)
    if grep -qP 'DATABASE_HOST\s*=\s*"' "$env_file"; then
      sed -i -E "s|^(DATABASE_HOST\s*=\s*)\"[^\"]*\"|\\1\"$NEW_HOST\"|" "$env_file"
      sed -i -E "s|^(DATABASE_PORT\s*=\s*)\"[^\"]*\"|\\1\"$NEW_PORT\"|" "$env_file"
    else
      sed -i -E "s|^(DATABASE_HOST\s*=\s*).*|\\1$NEW_HOST|" "$env_file"
      sed -i -E "s|^(DATABASE_PORT\s*=\s*).*|\\1$NEW_PORT|" "$env_file"
    fi

    echo "  ✓ $app/$suffix"
    updated=$((updated + 1))
  done
done

echo ""
echo "Done: $updated updated, $skipped skipped"
echo ""
echo "Verify:"
grep -rn "DATABASE_HOST" "$ROOT_DIR"/apps/*/$(printf '%s\n' "${SUFFIXES[@]}" | head -1) 2>/dev/null || true
