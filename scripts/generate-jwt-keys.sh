#!/usr/bin/env bash
# Generate ES256 keypairs for the JWT secrets user-service hands out.
# Each keypair lands as base64-encoded PEM — the shape `.env.prod`
# already uses across auth-gateway, user-service, and every gateway that
# verifies tokens.
#
# Usage:
#   ./scripts/generate-jwt-keys.sh                    # access, refresh, email-confirm
#   ./scripts/generate-jwt-keys.sh access refresh     # custom key list
#   ./scripts/generate-jwt-keys.sh --help
#
# The output is designed to be pasted into user-service's .env.prod and
# (public half only) into every gateway's .env.prod. The script does NOT
# write to files — pipe or copy manually so you control where the
# private key lands.
set -euo pipefail

print_usage() {
    cat <<EOF
Usage: $0 [key-name ...]

Generates one ES256 (prime256v1) keypair per named key and emits
base64-encoded PEM envs:

  JWT_<NAME>_PUBLIC_KEY=base64(-----BEGIN PUBLIC KEY-----...)
  JWT_<NAME>_PRIVATE_KEY=base64(-----BEGIN PRIVATE KEY-----...)

Defaults: access refresh email_confirm

Public keys go in every gateway + user-service .env.prod.
Private keys belong ONLY in user-service's .env.prod.

Example:
  $0                         # access, refresh, email_confirm
  $0 access                  # only the access pair
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

if [[ $# -eq 0 ]]; then
    keys=(access refresh email_confirm)
else
    keys=("$@")
fi

TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

b64() {
    # macOS (BSD base64) has no -w; Linux (GNU) needs -w0 for single-line output.
    if base64 --help 2>&1 | grep -q -- '-w'; then
        base64 -w0 "$1"
    else
        base64 -b0 "$1" 2>/dev/null || base64 "$1" | tr -d '\n'
    fi
}

printf '# ── JWT keypairs (ES256) ──────────────────────────────────\n'
printf '# Generated %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
printf '# PUBLIC halves: paste into every gateway + user-service .env.prod.\n'
printf '# PRIVATE halves: paste into user-service .env.prod ONLY.\n'
printf 'JWT_ALGORITHM=ES256\n\n'

for key in "${keys[@]}"; do
    upper=$(echo "$key" | tr '[:lower:]' '[:upper:]' | tr -c 'A-Z0-9_\n' '_')
    priv="$TMPDIR/$key-private.pem"
    pub="$TMPDIR/$key-public.pem"

    openssl ecparam -name prime256v1 -genkey -noout -out "$priv"
    openssl ec -in "$priv" -pubout -out "$pub" 2>/dev/null
    # Convert to PKCS#8 — what jose/jsonwebtoken expects.
    openssl pkcs8 -topk8 -nocrypt -in "$priv" -out "$priv.p8"
    mv "$priv.p8" "$priv"

    pub_b64=$(b64 "$pub")
    priv_b64=$(b64 "$priv")

    printf 'JWT_%s_PUBLIC_KEY=%s\n' "$upper" "$pub_b64"
    printf 'JWT_%s_PRIVATE_KEY=%s\n' "$upper" "$priv_b64"
    printf 'JWT_%s_EXPIRES_IN=\n' "$upper"
    printf '\n'
done

printf '# Suggested expirations:\n'
printf '#   JWT_ACCESS_EXPIRES_IN=24h\n'
printf '#   JWT_REFRESH_EXPIRES_IN=7d\n'
printf '#   JWT_EMAIL_CONFIRM_EXPIRES_IN=24h\n'
printf '#   JWT_RESET_EXPIRES_IN=10m\n'
