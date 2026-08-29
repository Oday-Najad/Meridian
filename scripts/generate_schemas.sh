#!/usr/bin/env bash
# Regenerates Go structs and TypeScript interfaces from the canonical Pydantic
# schemas in libs/schemas. Run this after any change to libs/schemas, and
# commit the regenerated output. CI re-runs this and fails the build if the
# committed generated files don't match -- see .github/workflows/ci.yml,
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
# PYTHONPATH must include the repo root explicitly -- running a script by
# path only adds the script's OWN directory (scripts/) to Python's import
# path, not the repo root, so `from libs.schemas...` would otherwise fail
# regardless of the caller's shell environment (this bit us in CI: local
# manual testing had PYTHONPATH set in the shell already, masking the gap).
PYTHONPATH="$REPO_ROOT" python "$REPO_ROOT/scripts/export_json_schema.py" --out "$JSON_SCHEMA_DIR"

# Guard: until Phase 1 defines real CPO/JPO models, MODELS in
# export_json_schema.py is intentionally empty, so no *.json files exist yet.
# Treat that as a valid, expected state rather than a failure -- quicktype
# has nothing to generate from an empty schema set.
if ! compgen -G "$JSON_SCHEMA_DIR"/*.json > /dev/null; then
  echo "==> No JSON Schema files found yet (expected until Phase 1 defines real models). Skipping codegen."
  exit 0
fi

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