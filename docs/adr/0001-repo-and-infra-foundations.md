# ADR-0001: Monorepo Structure, Branching Model, and K8s Deployment Target

**Status:** Accepted

## Context
Solo developer, pre-revenue, simulating real team engineering practices for
long-term skill-building and future collaborator onboarding. Needed to decide
repo structure, branching model, and eventual Kubernetes deployment target
before any application code is written.

## Options Considered

**Repo structure**
1. **Monorepo** — one repo, services + shared libs as separate top-level dirs.
2. **Polyrepo** — one repo per service.

Polyrepo makes sense when independent teams need independent release cadences.
At this stage, the CPO/JPO schema in `libs/schemas` is a shared contract every
service depends on — polyrepo would mean bumping a published package version
across N repos for every schema change, pure overhead with no current benefit.

**K8s deployment target**
1. Managed hyperscaler k8s (EKS/GKE/AKS) from day one.
2. Local (`kind`/`k3d`) for dev, cheap managed k8s (DigitalOcean/Hetzner/Linode)
   for first production deploy, graduate to a hyperscaler only when a concrete
   scaling/compliance need justifies the fixed cost.

**Branching model**
1. Trunk-based (small changes straight to `main` behind flags).
2. `main` + `develop` + feature branches.

Trunk-based is arguably leaner for a solo dev. `main`+`develop` was chosen
specifically because the release-cut discipline (develop -> main) is the
practice most worth building muscle memory for, per project goals.

## Decision
- Monorepo, structured so each `services/*` directory is independently
  Dockerizable/deployable despite living in one repo.
- Local `kind`/`k3d` for dev and CI, cheap managed k8s for first prod deploy,
  hyperscaler deferred until justified.
- `main` (protected) + `develop` + `feature/*`, Conventional Commits, PR
  template required, CI must pass before merge.

## Consequences
- Easy now: schema changes propagate to all services in one commit/PR.
- Deferred: if/when a service outgrows shared CI or needs an independent
  release cadence, it can be extracted to its own repo — the directory
  boundaries were chosen to make that extraction mechanical, not a rewrite.
- Slight process overhead (two long-lived branches) accepted deliberately for
  the learning goal, not because it's strictly required at team-of-one.
