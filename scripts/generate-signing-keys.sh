#!/usr/bin/env bash
# Generate ECDSA P-256 key pair for digital signatures (repair-service)
set -euo pipefail

TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

openssl ecparam -name prime256v1 -genkey -noout -out "$TMPDIR/ec-private.pem"
openssl ec -in "$TMPDIR/ec-private.pem" -pubout -out "$TMPDIR/ec-public.pem" 2>/dev/null

echo ""
echo "# Add these to apps/repair-service/.env.dev (or .env.prod)"
echo "SIGNATURE_PRIVATE_KEY=$(base64 -w0 "$TMPDIR/ec-private.pem")"
echo "SIGNATURE_PUBLIC_KEY=$(base64 -w0 "$TMPDIR/ec-public.pem")"
echo ""
