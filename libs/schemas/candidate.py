"""Candidate Profile Object (CPO) -- the structured representation of a
candidate, built from honest, non-keyword-optimized intake.

Design decisions this file implements (from the Phase 1 discussion):
1. Skills are evidence-linked, not bare strings -- a claim traces back to
   where it came from (a work experience entry, a linked artifact, etc.),
   which is what lets the matching engine and the Phase 5 fact-checker
   agent explain/verify a claim instead of trusting a bare assertion.
2. Work experience uses quantified, individually-verifiable claims, not a
   free-text description. `metric` is Optional and deliberately left None
   when a candidate can't or won't quantify something -- the extraction
   agent (Phase 3) is required to leave it unquantified rather than invent
   a number. `verified` starts False and is only set True by the Phase 5
   fact-checking pass, never by the generation step that writes CV text.
"""

from __future__ import annotations

from datetime import date
from typing import Literal

from pydantic import BaseModel, Field

from libs.schemas.common import ProficiencyLevel, RemotePolicy, SeniorityLevel


class Metric(BaseModel):
    """A quantified outcome, e.g. "40% reduction" or "3x throughput".
    Kept as a structured (value, unit) pair rather than a free-text string
    so it can be compared/sorted/verified programmatically, not just
    read."""

    value: float
    unit: str = Field(
        description=(
            "Free-text unit label, e.g. 'percent_reduction', "
            "'x_multiplier', 'dollars_saved', 'users_onboarded'. Not an "
            "enum: outcomes across different roles are too varied to "
            "enumerate up front, but the (value, unit) pair keeps it "
            "structured rather than a sentence."
        )
    )


class EvidenceRef(BaseModel):
    """Points a skill claim at the specific place it came from."""

    type: Literal[
        "work_experience_claim", "linked_artifact", "education", "certification"
    ]
    ref: str | None = Field(
        default=None,
        description=(
            "ID of a WorkExperienceClaim or Education entry within this "
            "same CPO, when type requires it."
        ),
    )
    url: str | None = Field(
        default=None,
        description=(
            "External URL (e.g. a GitHub repo, portfolio, publication) "
            "when type='linked_artifact'."
        ),
    )
    context: str = Field(
        description="Short human-readable note on what this evidence shows."
    )


class CandidateSkill(BaseModel):
    skill_ref: str = Field(
        description=(
            "Normalized skill identifier, e.g. 'python'. Shared "
            "vocabulary with JPO.skill_requirements."
        )
    )
    display_name: str = Field(description="Human-readable form, e.g. 'Python'.")
    self_rated_proficiency: ProficiencyLevel
    evidence: list[EvidenceRef] = Field(default_factory=list)


class WorkExperienceClaim(BaseModel):
    id: str
    action: str = Field(
        description=(
            "What the candidate did, e.g. 'Implemented a caching layer "
            "for API responses'."
        )
    )
    outcome: str = Field(
        description="What resulted, e.g. 'Reduced average page load time'."
    )
    metric: Metric | None = Field(
        default=None,
        description=(
            "Structured quantification if the candidate provided one. "
            "None if genuinely unquantified -- never fabricated."
        ),
    )
    verified: bool = Field(
        default=False,
        description=(
            "Set True only by the Phase 5 fact-checker pass after "
            "cross-referencing this claim. Never set True at intake."
        ),
    )


class WorkExperience(BaseModel):
    id: str
    title: str
    company: str
    start_date: date
    end_date: date | None = Field(
        default=None, description="None means current/ongoing role."
    )
    seniority: SeniorityLevel
    claims: list[WorkExperienceClaim] = Field(default_factory=list)


class Education(BaseModel):
    id: str
    institution: str
    credential: str = Field(
        description=(
            "e.g. 'BSc Computer Science', 'Professional Certificate in "
            "Data Science'."
        )
    )
    field_of_study: str | None = None
    end_date: date | None = None


class CandidatePreferences(BaseModel):
    desired_roles: list[str] = Field(default_factory=list)
    locations: list[str] = Field(
        default_factory=list,
        description="Preferred city/region names or 'remote'.",
    )
    remote_policy: list[RemotePolicy] = Field(
        default_factory=list, description="Acceptable work arrangements."
    )
    compensation_floor: float | None = Field(
        default=None,
        description=(
            "Minimum acceptable compensation, in the candidate's stated "
            "currency."
        ),
    )
    compensation_currency: str | None = Field(
        default=None, description="ISO 4217 code, e.g. 'USD', 'EUR'."
    )
    visa_status: str | None = None
    industries_to_avoid: list[str] = Field(default_factory=list)


class CandidateProfileObject(BaseModel):
    """The canonical, structured representation of a candidate. This is
    the single source of truth generated JSON Schema / Go structs / TS
    interfaces are derived from -- see scripts/generate_schemas.sh."""

    candidate_id: str
    full_name: str
    headline: str | None = Field(
        default=None,
        description="Short self-description, e.g. 'Backend engineer, fintech focus'.",
    )
    skills: list[CandidateSkill] = Field(default_factory=list)
    experience: list[WorkExperience] = Field(default_factory=list)
    education: list[Education] = Field(default_factory=list)
    preferences: CandidatePreferences = Field(default_factory=CandidatePreferences)
    profile_completeness: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="0-1 score of how complete this profile is, used to nudge onboarding.",
    )
