#!/usr/bin/env bash
# Append event-signing keys + EVENT_SIGNING_GROUPS to every service's
# .env.<flavor> that consumes or publishes RabbitMQ events. Idempotent —
# skips services that already have the block.
#
# For `prod` and `dev`, mints one shared keyset via
# `generate-event-signing-keys.sh` so every listed service gets identical
# values (publisher and consumer MUST share secrets). For `example`,
# emits placeholder "change-me-..." values so the shape is documented
# without leaking a real key into git.
#
# Usage:
#   ./scripts/inject-event-signing-keys.sh                     # default: --env prod, all 5 services
#   ./scripts/inject-event-signing-keys.sh --env dev           # .env.dev with real keys
#   ./scripts/inject-event-signing-keys.sh --env example       # .env.example with placeholders
#   ./scripts/inject-event-signing-keys.sh --env prod --dry-run
#   ./scripts/inject-event-signing-keys.sh --env dev payment repair
#   ./scripts/inject-event-signing-keys.sh --help
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Services that publish OR consume events; edit if more show up.
DEFAULT_SERVICES=(chat notification payment repair user)

# Event-signing groups — passed through to generate-event-signing-keys.sh.
SIGNING_GROUPS=(payment default)

ENV_FLAVOR="prod"
DRY_RUN=0
declare -a services=()

print_usage() {
    sed -n '2,19p' "$0" | sed 's/^# \?//'
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --help|-h)
            print_usage
            exit 0
            ;;
        --dry-run)
            DRY_RUN=1
            shift
            ;;
        --env)
            ENV_FLAVOR="$2"
            shift 2
            ;;
        --env=*)
            ENV_FLAVOR="${1#--env=}"
            shift
            ;;
        *)
            services+=("$1")
            shift
            ;;
    esac
done

if [[ "$ENV_FLAVOR" != "prod" && "$ENV_FLAVOR" != "dev" && "$ENV_FLAVOR" != "example" ]]; then
    echo "error: --env must be one of: prod, dev, example" >&2
    exit 1
fi

if [[ ${#services[@]} -eq 0 ]]; then
    services=("${DEFAULT_SERVICES[@]}")
fi

# Build the env block: real keys for prod/dev, placeholders for example.
if [[ "$ENV_FLAVOR" == "example" ]]; then
    KEY_BLOCK=$(cat <<'EOF'
# ── Cross-service event signing ─────────────────────────────
# Generate real keys via: ./scripts/generate-event-signing-keys.sh
# Then replace the placeholder values below. Same keys must be set on
# every service that publishes or consumes events in the listed groups.

EVENT_SIGNING_KEY_PAYMENT=change-me-run-generate-event-signing-keys-sh
EVENT_SIGNING_KEY_DEFAULT=change-me-run-generate-event-signing-keys-sh

EVENT_SIGNING_GROUPS=[{"name":"payment","routingKeys":["payment.*","withdraw.*"],"signing":{"signOnPublish":true,"enforceOnConsume":false,"secretEnv":"EVENT_SIGNING_KEY_PAYMENT"}},{"name":"default","routingKeys":["*"],"signing":{"signOnPublish":false,"enforceOnConsume":false,"secretEnv":"EVENT_SIGNING_KEY_DEFAULT"}}]

# After Phase B rollout (all services deployed with keys), flip
# "enforceOnConsume":true per group to reject unsigned events.
EOF
)
else
    KEY_BLOCK=$("$SCRIPT_DIR/generate-event-signing-keys.sh" "${SIGNING_GROUPS[@]}")
fi

inject_into() {
    local env_file="$1"
    if [[ ! -f "$env_file" ]]; then
        echo "  ! $env_file — not found, skipping" >&2
        return
    fi
    if grep -q '^EVENT_SIGNING_GROUPS=' "$env_file"; then
        echo "  · $env_file — already configured, skipping"
        return
    fi
    if [[ $DRY_RUN -eq 1 ]]; then
        echo "  ~ $env_file — would append $(echo "$KEY_BLOCK" | wc -l) lines"
        return
    fi
    # Ensure the file ends with a newline before appending a new block.
    if [[ -s "$env_file" ]] && [[ "$(tail -c1 "$env_file")" != $'\n' ]]; then
        printf '\n' >>"$env_file"
    fi
    printf '\n%s\n' "$KEY_BLOCK" >>"$env_file"
    echo "  ✓ $env_file — appended"
}

echo "=== Injecting event-signing keys into ${#services[@]} services (.env.$ENV_FLAVOR) ==="
for svc in "${services[@]}"; do
    env_file="$ROOT_DIR/apps/${svc}-service/.env.$ENV_FLAVOR"
    inject_into "$env_file"
done

if [[ $DRY_RUN -eq 0 && "$ENV_FLAVOR" == "prod" ]]; then
    echo ""
    echo "Done. Next steps:"
    echo "  1. ./scripts/env-push.sh     # push .env.prod files to the VPS"
    echo "  2. Redeploy affected services so they pick up the new env"
fi
