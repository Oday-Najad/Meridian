"""Job Profile Object (JPO) -- the structured representation of a job
posting, produced by the extraction agent (Phase 3) from a scraped/ingested
posting.

Deliberately NOT a mirror of CandidateProfileObject: a job has expectations,
not evidence, so SkillRequirement carries `importance` (required/preferred)
where CandidateSkill carries `evidence`. Responsibilities are kept as plain
text here -- a job posting's stated responsibilities aren't individually
verifiable "claims" the way a candidate's history is, so the Option-C-style
structure used for WorkExperienceClaim isn't warranted on this side. Both
sides share `skill_ref` and the ProficiencyLevel/SeniorityLevel enums from
common.py, which is what lets the matching engine compare them structurally.
"""

from __future__ import annotations

from datetime import date

from pydantic import BaseModel, Field

from libs.schemas.common import (
    EmploymentType,
    ProficiencyLevel,
    RemotePolicy,
    SeniorityLevel,
    SkillImportance,
)


class SkillRequirement(BaseModel):
    skill_ref: str = Field(
        description=(
            "Normalized skill identifier, e.g. 'python'. Shared "
            "vocabulary with CPO.skills."
        )
    )
    display_name: str
    required_proficiency: ProficiencyLevel
    importance: SkillImportance


class CompensationRange(BaseModel):
    min: float | None = None
    max: float | None = None
    currency: str = Field(description="ISO 4217 code, e.g. 'USD', 'EUR'.")


class JobProfileObject(BaseModel):
    """The canonical, structured representation of a job posting."""

    job_id: str
    company: str
    title: str
    skill_requirements: list[SkillRequirement] = Field(default_factory=list)
    responsibilities: list[str] = Field(
        default_factory=list,
        description=(
            "Plain-text responsibility statements as extracted from the "
            "posting -- not structured claims (see module docstring)."
        ),
    )
    seniority_band: SeniorityLevel
    employment_type: EmploymentType
    remote_policy: RemotePolicy
    compensation: CompensationRange | None = Field(
        default=None, description="None if not disclosed in the posting."
    )
    location: str | None = None
    source_url: str = Field(
        description=(
            "The employer career-page/job-board URL this was extracted "
            "from -- required for the compliant, non-LinkedIn-scraping "
            "acquisition path."
        )
    )
    posted_date: date | None = None
