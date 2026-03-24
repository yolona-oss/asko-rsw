#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
API_DIR="$ROOT_DIR/apps/api"
WEB_DIR="$ROOT_DIR/apps/web"
SPEC_FILE="openapi.json"

echo "=== 1/4 Building API (with Swagger plugin) ==="
pnpm --filter api run build

echo ""
echo "=== 2/4 Generating OpenAPI spec ==="
cd "$API_DIR"
pnpm run openapi:generate
echo "  -> $API_DIR/$SPEC_FILE"

echo ""
echo "=== 3/4 Copying spec to web app ==="
cp "$API_DIR/$SPEC_FILE" "$WEB_DIR/$SPEC_FILE"
echo "  -> $WEB_DIR/$SPEC_FILE"

echo ""
echo "=== 4/4 Generating TypeScript types ==="
cd "$WEB_DIR"
pnpm run api:generate

SCHEMAS=$(node -e "const s=require('./$SPEC_FILE');console.log(Object.keys(s.components?.schemas||{}).length)")
PATHS=$(node -e "const s=require('./$SPEC_FILE');console.log(Object.keys(s.paths).length)")
LINES=$(wc -l < "src/lib/api/api.gen.d.ts")

echo ""
echo "=== Done ==="
echo "  Paths:   $PATHS"
echo "  Schemas: $SCHEMAS"
echo "  Generated: src/lib/api/api.gen.d.ts ($LINES lines)"
