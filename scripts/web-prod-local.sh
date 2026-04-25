#!/usr/bin/env bash
# Run the web app in production mode (no dev JIT compilation) but pointed at
# the local dev NestJS backend (reads apps/web/.env.dev, proxies /api/* to
# gateways on localhost:4001-4005).
#
# Requires the backend to be running separately: `./scripts/dev.sh`
#
# Usage:
#   ./scripts/web-prod-local.sh            # build + start
#   ./scripts/web-prod-local.sh --no-build # skip rebuild, just start
#
# Port override:
#   PORT=3001 ./scripts/web-prod-local.sh
set -euo pipefail

# Force next.config.ts to register the dev-only /api/* → localhost:400x rewrites
# even though we're running as NODE_ENV=production.
export LOCAL_GATEWAYS=1

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
WEB_DIR="$ROOT_DIR/apps/web"
ENV_FILE="$WEB_DIR/.env.dev"

if [[ ! -f "$ENV_FILE" ]]; then
    echo "Error: $ENV_FILE not found. Create it from .env.example first." >&2
    exit 1
fi

SKIP_BUILD=0
for arg in "$@"; do
    case "$arg" in
        --no-build) SKIP_BUILD=1 ;;
        -h|--help)
            sed -n '2,12p' "$0"
            exit 0
            ;;
    esac
done

# Build deps first if needed (shared/ui/authorization that web consumes directly).
# Fast when nothing has changed.
if [[ $SKIP_BUILD -eq 0 ]]; then
    echo "=== Building workspace deps ==="
    pnpm --filter @asko/shared --filter @asko/ui --filter @asko/authorization run build

    echo "=== Building @asko/web (production) ==="
    # Load .env.dev so build-time NEXT_PUBLIC_* values bake in correctly.
    set -a
    # shellcheck disable=SC1090
    source "$ENV_FILE"
    set +a
    pnpm --filter @asko/web run build
fi

echo "=== Starting @asko/web (standalone production server, dev env) ==="

STANDALONE_DIR="$WEB_DIR/.next/standalone/apps/web"
if [[ ! -f "$STANDALONE_DIR/server.js" ]]; then
    echo "Error: $STANDALONE_DIR/server.js not found. Run without --no-build to rebuild." >&2
    exit 1
fi

# Standalone output doesn't copy .next/static or public/ — symlink them so the
# server can serve CSS/JS/images without 404s.
ln -sfn "$WEB_DIR/.next/static" "$STANDALONE_DIR/.next/static"
if [[ -d "$WEB_DIR/public" ]]; then
    ln -sfn "$WEB_DIR/public" "$STANDALONE_DIR/public"
fi

cd "$STANDALONE_DIR"

# Load dev env for runtime (server-side env vars, e.g. anything non-NEXT_PUBLIC_*).
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

# Port: prefer explicit PORT env, else whatever .env.dev sets, else 3000.
# Bind to localhost only — NEXT_PUBLIC_API_URL is baked in as http://localhost:3000/api,
# so accessing via any other hostname (e.g. machine hostname) would hit CORS.
# Scoped to the exec (not exported) so HOSTNAME doesn't leak into sibling shells
# that might later launch the gateways — a leaked HOSTNAME=localhost forces
# IPv6-only resolution on some setups and breaks the Next.js /api/* proxy.
exec env PORT="${PORT:-3000}" HOSTNAME="${HOSTNAME:-localhost}" node server.js
