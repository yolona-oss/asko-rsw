#!/usr/bin/env bash
set -euo pipefail

# Generate EC256 signing keypair for repair-service certificate signatures.
# Outputs base64-encoded PEM for .env files.
#
# Usage: ./scripts/generate-signing-keys.sh

TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

b64() {
    if base64 --help 2>&1 | grep -q -- '-w'; then
        base64 -w0 "$1"
    else
        base64 -b0 "$1" 2>/dev/null || base64 "$1" | tr -d '\n'
    fi
}

openssl ecparam -name prime256v1 -genkey -noout -out "$TMPDIR/ec-private.pem"
openssl ec -in "$TMPDIR/ec-private.pem" -pubout -out "$TMPDIR/ec-public.pem" 2>/dev/null

echo ""
echo "# Add these to apps/repair-service/.env.dev (or .env.prod)"
echo "SIGNATURE_PRIVATE_KEY=$(b64 "$TMPDIR/ec-private.pem")"
echo "SIGNATURE_PUBLIC_KEY=$(b64 "$TMPDIR/ec-public.pem")"
echo ""
