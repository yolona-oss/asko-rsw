#!/usr/bin/env bash
set -euo pipefail

# Generates unified OpenAPI types from all 5 gateways.
# Gateways must be running locally (or override URLs via env vars).
#
# Usage:
#   ./scripts/openapi.sh                    # fetch from localhost (default ports)
#   AUTH_GATEWAY_URL=https://... ./scripts/openapi.sh   # custom URLs

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
WEB_DIR="$ROOT_DIR/apps/web"
MERGED_SPEC="$WEB_DIR/openapi.json"

# Gateway endpoints (override with env vars)
AUTH_URL="${AUTH_GATEWAY_URL:-http://localhost:4001}"
REPAIR_URL="${REPAIR_GATEWAY_URL:-http://localhost:4002}"
MEDIA_URL="${MEDIA_GATEWAY_URL:-http://localhost:4003}"
REALTIME_URL="${REALTIME_GATEWAY_URL:-http://localhost:4004}"
CONTENT_URL="${CONTENT_GATEWAY_URL:-http://localhost:4005}"

GATEWAYS="auth:$AUTH_URL repair:$REPAIR_URL media:$MEDIA_URL realtime:$REALTIME_URL content:$CONTENT_URL"

TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

echo "=== 1/3 Fetching OpenAPI specs ==="

FETCHED=0
for gw in $GATEWAYS; do
  NAME="${gw%%:*}"
  URL="${gw#*:}"
  SPEC_URL="$URL/doc/openapi.json"
  OUT="$TEMP_DIR/$NAME.json"

  if curl -sf "$SPEC_URL" -o "$OUT" 2>/dev/null; then
    PATHS=$(node -e "const s=require('$OUT');console.log(Object.keys(s.paths||{}).length)")
    SCHEMAS=$(node -e "const s=require('$OUT');console.log(Object.keys(s.components?.schemas||{}).length)")
    echo "  ✓ $NAME — $PATHS paths, $SCHEMAS schemas"
    FETCHED=$((FETCHED + 1))
  else
    echo "  ✗ $NAME ($SPEC_URL) — skipped"
  fi
done

if [ "$FETCHED" -eq 0 ]; then
  echo "ERROR: No gateways reachable. Start them: ./scripts/dev.sh"
  exit 1
fi

echo ""
echo "=== 2/3 Merging $FETCHED specs ==="

node -e "
const fs = require('fs');
const dir = '$TEMP_DIR';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

const merged = {
  openapi: '3.0.0',
  info: { title: 'ASKO API', version: '1.0.0' },
  paths: {},
  components: { schemas: {}, securitySchemes: {} },
};

for (const file of files) {
  const spec = JSON.parse(fs.readFileSync(dir + '/' + file, 'utf-8'));

  for (const [path, methods] of Object.entries(spec.paths || {})) {
    if (merged.paths[path]) {
      Object.assign(merged.paths[path], methods);
    } else {
      merged.paths[path] = methods;
    }
  }

  for (const [name, schema] of Object.entries(spec.components?.schemas || {})) {
    merged.components.schemas[name] = schema;
  }

  Object.assign(merged.components.securitySchemes, spec.components?.securitySchemes || {});
}

console.log('  Paths: ' + Object.keys(merged.paths).length + ', Schemas: ' + Object.keys(merged.components.schemas).length);
fs.writeFileSync('$MERGED_SPEC', JSON.stringify(merged, null, 2));
"

echo ""
echo "=== 3/3 Generating TypeScript types ==="
cd "$WEB_DIR"
pnpm run api:generate

LINES=$(wc -l < "src/lib/api/api.gen.d.ts")
echo "  -> api.gen.d.ts ($LINES lines)"
echo ""
echo "=== Done ==="
