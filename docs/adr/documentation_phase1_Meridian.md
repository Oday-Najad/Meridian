# Phase 1 Documentation — Meridian
### CPO/JPO Schema: design reasoning, implementation, and what broke along the way

Companion to `documentation_phase0_Meridian.md`. Same two purposes: a
complete record of Phase 1's decisions and process, and a reusable playbook
for designing a shared data contract on any future project.

---

## 1. What Phase 1 Was For

Before any service (matching engine, extraction agents, CV tailoring,
application agent, company search) could be built, the system needed a
settled answer to: **how is a candidate represented, how is a job
represented, and how do the two relate?** This is the contract every later
phase depends on -- get the categories of information right now, since
reversing a shape decision after services are built against it is expensive
in a way that renaming a field later is not.

---

## 2. The Three Design Decisions

Full reasoning for each lives in `docs/adr/0003-cpo-jpo-schema-design.md`.
Summary:

1. **Skills are evidence-linked**, not bare strings or a bare
   proficiency rating. A `CandidateSkill` carries a self-rated proficiency
   plus a list of `EvidenceRef` entries pointing at *where the claim comes
   from* -- a specific work-experience claim, a linked artifact (e.g. a
   GitHub repo), or an education entry. This is what lets the matching
   engine later explain a fit-score ("advanced Python, evidenced by 3 years
   building backend services") instead of stating a bare "Python: yes",
   and what gives the Phase 5 fact-checker something concrete to verify
   against.

2. **Work experience uses structured, quantified, individually-verifiable
   claims**, not a free-text description. A `WorkExperienceClaim` has an
   `action`, an `outcome`, an *optional* `Metric` (structured
   value+unit pair), and a `verified` flag that defaults `False`. The
   critical rule, enforced in code and tested: **`metric` must stay `None`
   when a candidate can't or won't quantify something -- it is never
   invented.** This is the single mechanism that makes "honest, no
   keyword-stuffing" a structural property of the data rather than a
   marketing claim.

3. **CPO and JPO share a reference vocabulary but stay structurally
   distinct.** Both sides use the same `skill_ref` (a normalized string
   identifier) and the same `ProficiencyLevel` enum, defined once in
   `libs/schemas/common.py` -- this is what lets the matching engine
   compare "candidate's self-rated proficiency" against "job's required
   proficiency" as a real ranked comparison instead of a fuzzy text match.
   But `CandidateSkill` and `SkillRequirement` remain separate types: a
   candidate has `evidence`, a job has `importance` (required/preferred) --
   forcing both into one mirrored type would produce a schema full of
   "only relevant if X" fields, which is usually a sign two different
   concepts are being forced into one shape.

A fourth, smaller decision fell out of finalizing the shape: **the skill
taxonomy source (where `skill_ref` values actually come from -- a formal
system like ESCO, or a grown-from-scratch internal list) was deliberately
deferred.** `skill_ref` is a normalized string today; swapping the source
later doesn't change the field's type or any schema referencing it.

---

## 3. Final Schema (as implemented)

```
libs/schemas/
├── common.py       # ProficiencyLevel, SeniorityLevel, SkillImportance,
│                    # EmploymentType, RemotePolicy -- shared vocabulary
├── candidate.py     # CandidateProfileObject (CPO) and its nested types:
│                    # CandidateSkill, EvidenceRef, WorkExperience,
│                    # WorkExperienceClaim, Metric, Education,
│                    # CandidatePreferences
├── job.py            # JobProfileObject (JPO) and its nested types:
│                    # SkillRequirement, CompensationRange
└── test_smoke.py     # Real tests, not just import checks (see Section 4)
```

Generated (committed, not hand-written -- see Section 5):
```
libs/schemas-json/CandidateProfileObject.json
libs/schemas-json/JobProfileObject.json
libs/schemas-ts/index.ts
services/gateway/internal/schemas/generated.go
```

---

## 4. How This Was Verified, Not Just Written

Every design decision was proven against real, executable code before being
considered "done" -- this section is worth internalizing as a habit for any
future schema-design phase, not specific to Meridian:

- **Real instances constructed**: a full `CandidateProfileObject` and
  `JobProfileObject` were built with realistic data (a candidate with one
  quantified claim and one deliberately unquantified claim; a job with a
  matching skill requirement) and validated with Pydantic.
- **The core honesty guarantee was tested, not assumed**: a specific test
  (`test_unquantified_claim_stays_none_not_fabricated`) asserts that a
  `WorkExperienceClaim` built without a metric genuinely has
  `metric is None` -- proving the "never invent a number" rule is
  structurally enforced, not just documented in a docstring.
- **The shared-vocabulary comparison was tested, not assumed**: a specific
  test (`test_shared_vocabulary_enables_structural_comparison`) builds a
  candidate skill and a job requirement with the same `skill_ref`, then
  asserts the `ProficiencyLevel` enum ranks them comparably
  (`candidate_rank > required_rank`) -- proving Option-B's whole premise
  (real structural matching, not string-similarity guessing) actually
  works in code.
- **Type safety was verified with `mypy --strict`**, not just `mypy`
  default mode -- strict mode is what catches a schema change that breaks
  a consumer before it becomes a runtime bug in an agent pipeline.
- **The full cross-language codegen pipeline was run end-to-end**: real
  JSON Schema exported from the real Pydantic models, then real Go structs
  and real TypeScript interfaces generated via `quicktype` from that JSON
  Schema -- confirming the Phase 0 codegen pipeline (built against an
  empty placeholder) actually works against real, non-trivial schema
  content with nested types and enums.
- **All of the above was independently reproduced on two separate
  machines** (a Linux sandbox and the developer's Windows machine) --
  catching two real environment-specific bugs neither machine alone would
  have caught (see Section 6).

---

## 5. Why the Schema Is Generated, Not Hand-Written in Three Languages

Per ADR-0002 (polyglot stack), the CPO/JPO schema is authored once in
Pydantic and mechanically generated into Go structs and TypeScript
interfaces via JSON Schema + `quicktype`. Phase 1 was the first time this
pipeline ran against *real* schema content (Phase 0 only proved it didn't
crash against an empty schema set). The value of this approach was
concretely demonstrated during Phase 1: when the `ProficiencyLevel` enum's
base class was changed (`str, Enum` -> `StrEnum`, see Section 6), the
regenerated TypeScript and Go output needed zero manual changes to stay
correct -- the codegen step alone kept all three languages in sync.

---

## 6. Real Problems Hit During Phase 1
*(Continuing the numbering convention from the Phase 0 doc's troubleshooting log.)*

### Problem 11: `ruff` passed in one environment, failed with 25 errors in another
**Symptom:** An initial sandbox verification of the schema files showed
`ruff check` passing cleanly. Running the identical command against the
identical files on the real development machine produced 25 errors
(line-too-long, and enum-inheritance style suggestions).

**Root cause:** The sandbox check was run without the repository's actual
`pyproject.toml` in scope, so `ruff` silently fell back to its own default
rule set -- which does not include `E501` (line-too-long). The real repo's
`pyproject.toml` explicitly selects `["E", "F", "I", "UP", "B"]`, and `E`
does include line-length checking. The two environments were, invisibly,
running different effective configurations of the same tool.

**Fix:** Reproduced the real `pyproject.toml` in the sandbox before
re-verifying, confirmed the same 25 errors, then fixed the actual code
(wrapped long description strings via implicit multi-line string
concatenation; switched `class X(str, Enum)` to `class X(StrEnum)` per
ruff's own `UP042` suggestion, which Python 3.11+ supports natively).

**Lesson:** A linter/type-checker run without the project's real config
file present is not a meaningful check -- it's checking against a
different, arbitrary rule set that happens to share a tool name. Always
verify tooling against the actual project configuration, not a bare
invocation, especially when validating in a scratch/sandbox environment
before handing results to someone testing against the real repo.

### Problem 12: `schema-drift-check` failed in CI with `ModuleNotFoundError: No module named 'libs'`
**Symptom:** The job failed specifically at the "Regenerate schemas" step,
even though the exact same schema files and the exact same
`generate_schemas.sh` script had been manually verified as working on the
developer's local machine minutes earlier.

**Root cause:** `generate_schemas.sh` invoked
`python scripts/export_json_schema.py`. When Python runs a script by file
path, it adds only that *script's own directory* (`scripts/`) to its
module search path -- not the repository root. `export_json_schema.py`'s
`from libs.schemas.candidate import ...` therefore could not resolve
`libs` at all, in any environment that hadn't separately been told to
search the repo root. Local manual testing had not caught this because the
developer's shell session had `$env:PYTHONPATH = "."` already set from
earlier verification steps in the same session -- silently masking the
gap. CI runs in a clean environment every time, with no such carryover, so
it surfaced the bug immediately.

**Fix:** Modified `generate_schemas.sh` itself to set
`PYTHONPATH="$REPO_ROOT"` explicitly on the specific line that invokes the
Python script, rather than relying on any caller's shell environment
already having it set.

**Lesson (the general one, worth remembering beyond this specific bug):**
Any script intended to run in CI must be self-contained about its own
path/environment requirements. If a script only works because of state set
*outside* the script (an exported variable, a shell alias, an IDE's run
configuration), it will pass in whatever environment happened to have that
state already present and fail the moment it runs somewhere clean --
which is exactly what CI is. When verifying a script locally, prefer
testing it in a **fresh terminal session** with nothing pre-set, precisely
to catch this class of bug before CI does.

---

## 7. Updated Reusable Checklist — Schema/Contract Design Additions

On top of the Phase 0 checklists, add these when designing a shared data
contract (a schema, an API contract, any structure multiple services will
depend on):

- [ ] For each field/structure decision, write out at least two real
      alternatives and why each was rejected -- not just the one chosen.
      This is what turns a schema into a documented decision instead of an
      arbitrary shape that will be second-guessed later.
- [ ] Identify which fields carry a *correctness guarantee* (e.g. "this
      must never be fabricated," "this must default to unverified") and
      write an explicit test asserting that guarantee holds -- a schema
      that merely defines a type doesn't enforce a promise about how it's
      used; a test does.
- [ ] If the contract will be shared across multiple languages, prove the
      codegen pipeline against real content (not a placeholder) before
      calling the phase done -- an empty-schema-set test only proves the
      pipeline doesn't crash, not that it correctly translates real
      nested types and enums.
- [ ] Verify all tooling (linters, type-checkers) against the project's
      actual configuration file, in more than one environment if possible
      -- a bare tool invocation without the real config can silently pass
      checks the real CI run will fail.
- [ ] Test any CI-bound script in a fresh shell session with no
      pre-existing environment state, specifically to catch
      "only works because of something set outside the script" bugs
      before CI does.

---

## 8. Status
Phase 1 complete: CPO/JPO schema designed (ADR-0003), implemented, tested
(6 tests covering construction, the no-fabrication guarantee, and the
shared-vocabulary structural comparison), verified independently on two
machines, and the full JSON-Schema-to-Go/TypeScript codegen pipeline proven
against real content for the first time. Merged to `develop`, synced to
`main`. Next: Phase 2, the matching engine that actually consumes this
schema to produce an explainable fit-score.
