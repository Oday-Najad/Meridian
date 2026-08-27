# Meridian

An AI-agent-driven, two-sided hiring platform. No CV keyword games on the candidate side, no black-box keyword-matching ATS on the company side — both sides are matched through the same explainable, semantic matching core.

This repo is a **polyglot monorepo** (see `docs/adr/0002-polyglot-stack.md`): Go for the API gateway, Python for ML/agent services, TypeScript/Next.js for the frontend, sharing common schemas.

## Repo Layout

```
meridian/
├── apps/
│   └── web/                    # Next.js + TypeScript frontend (deployed to Vercel)
├── services/                   # Independently deployable services, each with its own Dockerfile
│   ├── gateway/                  # Go API gateway — routing, auth, service coordination
│   ├── matching-engine/          # Python — CPO<->JPO semantic matching + explainable fit-score
│   ├── extraction-agents/        # Python — free text -> structured CPO/JPO
│   ├── cv-tailoring-agent/       # Python — tailored CV generation + fact-checking
│   ├── application-agent/        # Python — LangGraph stateful workflow w/ human approval gate
│   └── company-search/           # Python — recruiter-facing search & ranking
├── libs/
│   ├── schemas/                  # Canonical Pydantic models — the single source of truth
│   ├── schemas-json/             # Generated: JSON Schema exported from Pydantic (committed)
│   └── schemas-ts/               # Generated: TypeScript interfaces (committed)
├── scripts/
│   ├── export_json_schema.py     # Pydantic -> JSON Schema
│   └── generate_schemas.sh       # JSON Schema -> Go structs + TS interfaces (via quicktype)
├── infra/
│   ├── docker/                   # docker-compose for local dev (Ollama; Supabase run separately)
│   └── k8s/                      # Kubernetes manifests (later phase)
├── docs/
│   └── adr/                      # Architecture Decision Records
└── .github/
    ├── workflows/                # CI pipelines
    └── pull_request_template.md
```

## Status

🚧 Restructured for the polyglot stack (Go + Python + TypeScript + Supabase + Vercel). No application code yet — see `docs/adr/` for design decisions made so far. Next up: Phase 1, the CPO/JPO schema design.

## Local Development

```bash
cp .env.example .env              # fill in local values
supabase start                    # Postgres+pgvector, Auth, Storage (separate CLI, own Docker containers)
docker compose -f infra/docker/docker-compose.yml up   # Ollama (+ services as they're added)
```

## Schema changes

The CPO/JPO schema is authored **once**, in Pydantic (`libs/schemas/`). After any change:
```bash
bash scripts/generate_schemas.sh
```
This regenerates the JSON Schema, Go structs, and TypeScript interfaces. Commit the regenerated files alongside your schema change — CI's `schema-drift-check` job fails the build if you forget.

## Contributing (solo-dev-simulating-a-team workflow)

- `main` — always deployable, protected, no direct commits.
- `develop` — integration branch for finished features.
- `feature/<short-description>` — branch off `develop`, PR back into it.
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.
- Every PR uses the template in `.github/pull_request_template.md` and must pass CI before merge.
