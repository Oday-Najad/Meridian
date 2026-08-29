# ADR-0003: CPO/JPO Schema Design

**Status:** Accepted

## Context
Every downstream service (matching engine, extraction agents, CV tailoring,
application agent, company search) depends on how a candidate and a job are
represented. Needed to decide, before writing any service code, how much
structure to encode in the Candidate Profile Object (CPO) and Job Profile
Object (JPO), and how the two relate to each other.

## Options Considered

**Skill representation**
1. Flat string list (`["Python", "Kubernetes"]`) — simplest, but reproduces
   the exact keyword-matching problem the platform exists to fix: no depth,
   recency, or evidence behind a claim.
2. Skill + self-rated proficiency (`{name, proficiency, years}`) — better,
   but still trusts a bare self-report with nothing distinguishing "one
   bootcamp project" from "six years in production."
3. Skill + proficiency + evidence layer (references to work-experience
   claims, linked artifacts, education) — traceable, but meaningfully more
   upfront implementation work, since a skill can't cite evidence that
   doesn't yet exist as a structured entity elsewhere in the CPO.

**Work experience representation**
1. Free text per role — flexible, fast to fill in, nothing verifiable or
   matchable in a structured way.
2. Structured role fields (title/company/dates/seniority) with free-text
   responsibility bullets — real matchable metadata, but the substance of
   what was accomplished stays unstructured prose.
3. Structured role + quantified, individually-verifiable claims (action,
   outcome, optional metric, verified flag) — makes the extraction agent
   actively interrogate vague statements at intake ("by how much, measured
   how?"), with unquantified claims required to stay `null` rather than
   have a number invented. Real UX cost: more onboarding friction than a
   textarea.

**CPO/JPO structural relationship**
1. Fully independent schemas, matched only via ad hoc logic in the
   matching engine — simple in isolation, but no structural guarantee the
   two sides are even comparable.
2. Shared reference vocabulary (a `skill_ref` join key, shared
   `ProficiencyLevel`/`SeniorityLevel` enums) with otherwise distinct
   shapes per side, since a candidate has *evidence* and a job has
   *expectations* -- not the same concept.
3. Fully mirrored single schema, fields unused/null depending on context
   -- maximizes reuse, but tends to conflate two different concepts into
   one type with "only relevant if X" fields.

**Skill taxonomy source** (surfaced while finalizing the shape)
1. Adopt an existing taxonomy immediately (e.g. ESCO) -- most rigorous,
   real integration work up front.
2. Build a small custom taxonomy now, grow it with real data.
3. Defer the decision: treat `skill_ref` as a normalized string today: the
   field's type doesn't change regardless of which taxonomy eventually
   populates it, so this is a genuinely deferrable choice.

## Decision
- Skills: evidence-linked (Option 3) -- `CandidateSkill` carries
  `self_rated_proficiency` plus a list of `EvidenceRef` entries pointing at
  work-experience claims, linked artifacts, or education.
- Work experience: structured + quantified claims (Option 3) --
  `WorkExperienceClaim` carries `action`, `outcome`, an `Optional[Metric]`
  that must stay `None` when genuinely unquantified, and a `verified: bool`
  that defaults `False` and is only ever set `True` by the Phase 5
  fact-checker pass, never by generation.
- CPO/JPO relationship: shared vocabulary, distinct shapes (Option 2) --
  both sides reference the same `skill_ref` and `ProficiencyLevel` enum
  (defined once in `libs/schemas/common.py`), but `CandidateSkill` and
  `SkillRequirement` remain separate types with fields honest to what each
  side actually is (`evidence` vs. `importance`).
- Skill taxonomy: deferred (Option 3) -- `skill_ref` is a normalized string
  for now.
- JPO's `responsibilities` field is deliberately kept as plain text, not
  structured claims like CPO's work experience -- a job posting's stated
  duties aren't individually verifiable the way a candidate's history is,
  so applying the same claim structure there would be manufacturing false
  precision.

## Consequences
- Easier now: the matching engine can compare `CandidateSkill` against
  `SkillRequirement` structurally (same `skill_ref`, ranked
  `ProficiencyLevel` comparison) instead of embedding-similarity guessing
  on free text; the Phase 5 fact-checker has concrete claims to verify
  against instead of prose to parse.
- Harder now: candidate onboarding (Phase 3, extraction agents) must
  actively prompt for quantification of vague claims, which is more
  friction than a simple text field -- a deliberate trade of honesty over
  intake speed.
- Deferred: the skill taxonomy source (ESCO vs. custom) can be decided
  independently later without touching this schema's shape, since
  `skill_ref`'s type doesn't change based on what populates it.
- Verified in practice, not just on paper: all three decisions were proven
  against real Pydantic models, real Go/TypeScript codegen output, and real
  tests (see `documentation_phase1_Meridian.md`) -- including a test that
  specifically asserts an unquantified claim's `metric` field cannot be
  anything other than `None`, and a test proving the shared-vocabulary
  comparison produces a real structural result (`candidate_rank >
  required_rank`), not just a plausible-looking type definition.
