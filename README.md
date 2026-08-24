# Meridian

An AI-agent-driven, two-sided hiring platform. No CV keyword games on the candidate side, no black-box keyword-matching ATS on the company side — both sides are matched through the same explainable, semantic matching core.

This repo is a **monorepo**: multiple independently-deployable services sharing common libraries, so we get microservice independence with monorepo velocity (no cross-repo version juggling while the team is small).

## Repo Layout:

```
meridian/
├── services/                # Independently deployable services, each with its own Dockerfile
│   ├── matching-engine/      # Candidate <-> Job semantic matching + fit-score explainability
│   ├── extraction-agents/    # Free text -> structured CPO/JPO extraction
│   ├── cv-tailoring-agent/   # Tailored CV generation + fact-checking
│   ├── application-agent/    # Stateful application workflow w/ human approval gate
│   └── company-search/       # Recruiter-facing search & ranking
├── libs/
│   └── schemas/               # Shared CPO/JPO Pydantic models — the contract between all services
├── infra/
│   ├── docker/                 # docker-compose for local dev
│   └── k8s/                    # Kubernetes manifests (Phase 8+)
├── docs/
│   └── adr/                     # Architecture Decision Records — one per major design choice
└── .github/
    ├── workflows/                # CI pipelines
    └── pull_request_template.md
```

## Status

🚧 Phase 0 — Engineering foundations. No application code yet. See `docs/adr/` for design decisions made so far.

## Local Development

```bash
cp .env.example .env      # fill in local values
docker compose -f infra/docker/docker-compose.yml up
```

## Contributing (solo-dev-simulating-a-team workflow)

- `main` — always deployable, protected, no direct commits.
- `develop` — integration branch for finished features.
- `feature/<short-description>` — branch off `develop`, PR back into it.
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.
- Every PR uses the template in `.github/pull_request_template.md` and must pass CI before merge.
