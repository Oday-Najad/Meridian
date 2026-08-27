# ADR-0002: Polyglot Stack — Go, Python, TypeScript, Supabase, Vercel

**Status:** Accepted

## Context
Initial Phase 0 scaffold assumed an all-Python backend with a generic Postgres
container. We've since decided to adopt Go, TypeScript, Supabase, and Vercel
as explicit product requirements. Needed to decide how these coexist without
undermining the ML/agent work (fine-tuning, LangGraph, CrewAI, AutoGen) that
depends on Python's ecosystem.

## Options Considered

**Backend language**
1. Go only — fast, concurrent, but no serious ecosystem for QLoRA fine-tuning,
   Hugging Face transformers, or the agent frameworks (LangGraph/CrewAI/AutoGen)
   already planned for later phases.
2. Python only — full ML ecosystem access, but weaker as a high-concurrency
   API gateway compared to Go.
3. **Polyglot**: Go as API gateway/orchestration layer, Python for all
   ML/agent services. Go routes, authenticates, and coordinates; it does not
   own business logic that depends on Python-only libraries (e.g. the
   application-agent's LangGraph workflow stays in Python — Go calls it, does
   not reimplement it).

**Frontend hosting**
1. Vercel for everything, including backend — rejected: serverless execution
   limits and no persistent-process support make it unsuitable for Ollama,
   fine-tuning jobs, or long-running LangGraph workflows with human-in-the-loop
   waits.
2. **Vercel for the Next.js/TypeScript frontend only**; backend (Go + Python)
   stays on the Docker -> Kubernetes path already established in ADR-0001.

**Database / Auth / Storage**
1. Self-managed Postgres (original Phase 0 choice) + a separate vector DB +
   a separate auth solution — more moving parts to operate ourselves.
2. **Supabase**: managed Postgres (with pgvector for embeddings, consolidating
   the matching engine's vector store into the same database), built-in Auth,
   and Storage (resumes, generated CVs) in one managed service. Local dev via
   the Supabase CLI (`supabase start`), which itself runs Postgres/Auth/Storage
   in Docker — replacing our standalone `postgres` container from ADR-0001.

**Cross-language schema contract**
1. Hand-maintain the CPO/JPO schema separately in Pydantic, Go structs, and
   TS interfaces — rejected: guaranteed to drift silently.
2. Protobuf as the single source of truth, with gRPC between services —
   rejected for now: our actual traffic pattern is REST/JSON everywhere
   (frontend -> Go, Go -> Python services); adding the protoc toolchain and
   gRPC infrastructure is complexity without a matching current need.
3. **JSON Schema as the single source of truth**, authored via Pydantic's
   `model_json_schema()` export (Python remains the most natural place to
   define the schema, given the ML services' validation needs), then
   `quicktype` generates Go structs and TypeScript interfaces from that JSON
   Schema. A CI job re-runs generation and fails the build on drift between
   committed and freshly-generated output.

## Decision
Polyglot monorepo: Go API gateway (`services/gateway`), Python ML/agent
services (unchanged from ADR-0001), Next.js/TypeScript frontend (`apps/web`)
deployed to Vercel, Supabase for Postgres+pgvector+Auth+Storage. Schema
contract defined once in Pydantic, JSON-Schema-exported, and code-generated
into Go and TypeScript with CI drift detection.

## Consequences
- Easier now: managed auth/storage/vector-store removes significant
  undifferentiated infrastructure work; Go gateway gives a fast, typed
  entry point without sacrificing Python's ML ecosystem.
- Harder now: three languages in one repo means three sets of lint/type/test
  tooling in CI instead of one; the schema-codegen step is one more thing
  that must stay green.
- Deferred: gRPC/Protobuf remains a legitimate future upgrade if
  inter-service latency between Go and Python ever becomes a real bottleneck
  — the JSON Schema source of truth can be migrated to Protobuf later without
  changing where the schema is authored, only how it's compiled.
- Local dev changes: the standalone `postgres` container from ADR-0001 is
  replaced by `supabase start` (Supabase CLI); `docker-compose.yml` now only
  needs to own what Supabase doesn't provide (Ollama, and later each custom
  service).
