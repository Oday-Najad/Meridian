#!/usr/bin/env bash
# Regenerates Go structs and TypeScript interfaces from the canonical Pydantic
# schemas in libs/schemas. Run this after any change to libs/schemas, and
# commit the regenerated output. CI re-runs this and fails the build if the
# committed generated files don't match — see .github/workflows/ci.yml,
# job `schema-drift-check`.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
JSON_SCHEMA_DIR="$REPO_ROOT/libs/schemas-json"
GO_OUT="$REPO_ROOT/services/gateway/internal/schemas/generated.go"
TS_OUT="$REPO_ROOT/libs/schemas-ts/index.ts"

mkdir -p "$JSON_SCHEMA_DIR"
mkdir -p "$(dirname "$GO_OUT")"
mkdir -p "$(dirname "$TS_OUT")"

echo "==> Exporting Pydantic models to JSON Schema..."
python "$REPO_ROOT/scripts/export_json_schema.py" --out "$JSON_SCHEMA_DIR"

echo "==> Generating Go structs via quicktype..."
npx --yes quicktype \
  --src "$JSON_SCHEMA_DIR"/*.json \
  --src-lang schema \
  --lang go \
  --package schemas \
  --out "$GO_OUT"

echo "==> Generating TypeScript interfaces via quicktype..."
npx --yes quicktype \
  --src "$JSON_SCHEMA_DIR"/*.json \
  --src-lang schema \
  --lang typescript \
  --out "$TS_OUT"

echo "==> Done. Review the diff, then commit generated files alongside your schema change."
