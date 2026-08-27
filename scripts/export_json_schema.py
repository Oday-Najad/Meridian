"""Exports every Pydantic model in libs/schemas to a standalone JSON Schema
file, using Pydantic's built-in model_json_schema(). This is the single
source of truth that scripts/generate_schemas.sh feeds into quicktype to
produce Go structs and TypeScript interfaces.

Real model imports get added here once the CPO/JPO schemas are designed in
Phase 1 — this is deliberately a no-op placeholder for now so the codegen
pipeline can be proven end-to-end before real schema content exists.
"""

import argparse
import json
from pathlib import Path

# Phase 1 will populate this list, e.g.:
# from libs.schemas.candidate import CandidateProfileObject
# from libs.schemas.job import JobProfileObject
MODELS: list[type] = []


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", required=True, help="Output directory for JSON Schema files")
    args = parser.parse_args()

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    if not MODELS:
        print("No models registered yet in MODELS list — nothing to export. "
              "This is expected until Phase 1 defines the CPO/JPO schemas.")
        return

    for model in MODELS:
        schema = model.model_json_schema()
        out_path = out_dir / f"{model.__name__}.json"
        out_path.write_text(json.dumps(schema, indent=2))
        print(f"Exported {model.__name__} -> {out_path}")


if __name__ == "__main__":
    main()
