# gateway

Go API gateway. Owns: HTTP routing, auth verification (Supabase JWTs),
request/response coordination between the frontend and internal Python
ML/agent services, rate limiting.

Explicitly does **not** own: any business logic that depends on a Python-only
library. E.g. the application-agent's workflow (LangGraph, human-approval
interrupts) lives in `services/application-agent` — this gateway calls it
over HTTP, it does not reimplement it.

Status: not yet implemented — scaffolded in the polyglot-stack revision
(ADR-0002), first real code lands alongside Phase 1/2 services.
