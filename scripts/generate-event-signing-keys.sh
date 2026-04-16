#!/usr/bin/env bash
# Generate HMAC-SHA256 secrets for the event-signing groups and emit
# ready-to-paste env lines (including the EVENT_SIGNING_GROUPS JSON).
#
# Usage:
#   ./scripts/generate-event-signing-keys.sh                # default groups (payment, default)
#   ./scripts/generate-event-signing-keys.sh payment repair # custom group list
#   ./scripts/generate-event-signing-keys.sh --help
#
# The output is safe to pipe into `tee -a apps/<svc>/.env.prod` or copy
# into one service manually. Run it on a machine you trust — keys land in
# stdout.
set -euo pipefail

print_usage() {
    cat <<EOF
Usage: $0 [group-name ...]

Generates one 32-byte base64url HMAC secret per event-signing group and
emits:
  - EVENT_SIGNING_KEY_<GROUP> lines (uppercased group name)
  - EVENT_SIGNING_GROUPS JSON describing routing-key patterns + policy

Defaults: payment default

Each generated group uses a prefix-matching routing-key pattern
'<group>.*' except 'default' which matches everything ('*'). Edit the
JSON afterwards if you need custom patterns (e.g. withdraw.* under the
payment group).

Example:
  $0 payment default        # two groups
  $0 payment repair default # three
EOF
}

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
    print_usage
    exit 0
fi

if ! command -v openssl >/dev/null 2>&1; then
    echo "error: openssl is required" >&2
    exit 1
fi

# Default groups if no args.
if [[ $# -eq 0 ]]; then
    groups=(payment default)
else
    groups=("$@")
fi

# openssl rand 32 → base64 → strip /+=\n for url-safe (same encoding we
# use inside SignedEvent.signature / UploadStart.nonce).
gen_key() {
    openssl rand 32 | base64 | tr '+/' '-_' | tr -d '=\n'
}

printf '# ── Cross-service event signing ─────────────────────────────\n'
printf '# Generated %s — keep these keys in sync across every service that\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
printf '# publishes or consumes events in the listed groups.\n\n'

# Emit per-group keys first so the JSON below references them.
declare -A key_map
for g in "${groups[@]}"; do
    upper=$(echo "$g" | tr '[:lower:]' '[:upper:]' | tr -c 'A-Z0-9_\n' '_')
    var="EVENT_SIGNING_KEY_${upper}"
    val=$(gen_key)
    key_map[$g]="$var"
    printf '%s=%s\n' "$var" "$val"
done
printf '\n'

# Build the EVENT_SIGNING_GROUPS JSON (single line, no spaces — same
# shape the config-parser expects at boot).
json='['
first=1
for g in "${groups[@]}"; do
    pattern="${g}.*"
    if [[ "$g" == "default" ]]; then
        pattern='*'
    fi
    signing_key_env=${key_map[$g]}
    group_json=$(cat <<JSON
{"name":"$g","routingKeys":["$pattern"],"signing":{"signOnPublish":true,"enforceOnConsume":false,"secretEnv":"$signing_key_env"}}
JSON
)
    if [[ $first -eq 1 ]]; then
        json+="$group_json"
        first=0
    else
        json+=",$group_json"
    fi
done
json+=']'

printf 'EVENT_SIGNING_GROUPS=%s\n' "$json"
printf '\n'
printf '# After Phase B rollout (all services deployed with keys), flip\n'
printf '# "enforceOnConsume":true per group to reject unsigned events.\n'
