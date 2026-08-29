"""Exports every Pydantic model in libs/schemas to a standalone JSON Schema
file, using Pydantic's built-in model_json_schema(). This is the single
source of truth that scripts/generate_schemas.sh feeds into quicktype to
produce Go structs and TypeScript interfaces.
"""

import argparse
import json
from pathlib import Path

from libs.schemas.candidate import CandidateProfileObject
from libs.schemas.job import JobProfileObject

MODELS: list[type] = [CandidateProfileObject, JobProfileObject]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", required=True, help="Output directory for JSON Schema files")
    args = parser.parse_args()

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    for model in MODELS:
        schema = model.model_json_schema()
        out_path = out_dir / f"{model.__name__}.json"
        out_path.write_text(json.dumps(schema, indent=2))
        print(f"Exported {model.__name__} -> {out_path}")


if __name__ == "__main__":
    main()
