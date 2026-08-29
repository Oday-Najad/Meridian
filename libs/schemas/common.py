"""Shared vocabulary between CPO (candidate) and JPO (job) schemas.

Per ADR (Phase 1 design discussion): CPO and JPO are structurally DISTINCT
shapes -- a candidate has evidence, a job has expectations, and those aren't
the same concept -- but they share a common reference vocabulary so the
matching engine can do real structural comparison instead of embedding-only
guesswork on free text.

`skill_ref` is a normalized string for now (e.g. "python", "team-leadership").
The taxonomy SOURCE (a formal system like ESCO, vs. a hand-grown internal
list) is a deferred decision -- swapping the source later does not change
this field's type or any schema that references it, only what populates it.
"""

from __future__ import annotations

from enum import StrEnum


class ProficiencyLevel(StrEnum):
    """Used both for a candidate's self-rated skill level (CPO) and a job's
    required skill level (JPO) -- the shared vocabulary that makes
    "candidate claims advanced, job requires intermediate" a real
    structural comparison rather than a string-similarity guess."""

    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"


class SeniorityLevel(StrEnum):
    """A candidate's inferred/stated seniority (CPO) and a job's target
    seniority band (JPO) share this same scale."""

    ENTRY = "entry"
    MID = "mid"
    SENIOR = "senior"
    LEAD = "lead"
    PRINCIPAL = "principal"


class SkillImportance(StrEnum):
    """JPO-only concept -- how strictly a job requires a given skill.
    Deliberately NOT shared with CPO: a candidate's skill has no
    equivalent 'importance', it has evidence instead. Keeping this
    JPO-only is a direct application of the Phase 1 decision to avoid a
    single mirrored schema with fields that are 'only relevant if X'."""

    REQUIRED = "required"
    PREFERRED = "preferred"


class EmploymentType(StrEnum):
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"
    INTERNSHIP = "internship"


class RemotePolicy(StrEnum):
    REMOTE = "remote"
    HYBRID = "hybrid"
    ONSITE = "onsite"
