"""Real tests for the CPO/JPO schemas -- not just import checks."""

import pytest
from pydantic import ValidationError

from libs.schemas.candidate import (
    CandidateProfileObject,
    CandidateSkill,
    Metric,
    WorkExperienceClaim,
)
from libs.schemas.common import (
    EmploymentType,
    ProficiencyLevel,
    RemotePolicy,
    SeniorityLevel,
    SkillImportance,
)
from libs.schemas.job import JobProfileObject, SkillRequirement


def _minimal_cpo() -> CandidateProfileObject:
    return CandidateProfileObject(candidate_id="c1", full_name="Test Candidate")


def _minimal_jpo() -> JobProfileObject:
    return JobProfileObject(
        job_id="j1",
        company="Acme",
        title="Engineer",
        seniority_band=SeniorityLevel.MID,
        employment_type=EmploymentType.FULL_TIME,
        remote_policy=RemotePolicy.REMOTE,
        source_url="https://acme.com/careers/engineer",
    )


def test_cpo_minimal_construction() -> None:
    cpo = _minimal_cpo()
    assert cpo.skills == []
    assert cpo.profile_completeness == 0.0


def test_jpo_minimal_construction() -> None:
    jpo = _minimal_jpo()
    assert jpo.skill_requirements == []


def test_unquantified_claim_stays_none_not_fabricated() -> None:
    """The core honesty guarantee: a claim without a metric must be
    constructible and must NOT silently get a default numeric value."""
    claim = WorkExperienceClaim(
        id="e1", action="Helped the team", outcome="Team shipped on time"
    )
    assert claim.metric is None
    assert claim.verified is False


def test_verified_defaults_false() -> None:
    """A claim can never claim to be pre-verified -- Phase 5's
    fact-checker is the only thing allowed to flip this."""
    claim = WorkExperienceClaim(
        id="e1", action="x", outcome="y", metric=Metric(value=1, unit="x")
    )
    assert claim.verified is False


def test_shared_vocabulary_enables_structural_comparison() -> None:
    """Confirms the Phase 1 Option-B decision actually works: same
    skill_ref and comparable ProficiencyLevel enum on both CPO and JPO
    sides."""
    skill = CandidateSkill(
        skill_ref="python",
        display_name="Python",
        self_rated_proficiency=ProficiencyLevel.ADVANCED,
    )
    requirement = SkillRequirement(
        skill_ref="python",
        display_name="Python",
        required_proficiency=ProficiencyLevel.INTERMEDIATE,
        importance=SkillImportance.REQUIRED,
    )
    assert skill.skill_ref == requirement.skill_ref
    levels = list(ProficiencyLevel)
    candidate_rank = levels.index(skill.self_rated_proficiency)
    required_rank = levels.index(requirement.required_proficiency)
    assert candidate_rank > required_rank


def test_missing_required_field_raises() -> None:
    """Sanity check that Pydantic is actually enforcing required fields,
    not silently accepting incomplete candidate/job data. The type: ignore
    comments below are intentional -- mypy is correctly flagging these as
    invalid calls at the type level; that's exactly what we're testing
    happens at runtime too, via Pydantic's ValidationError."""
    with pytest.raises(ValidationError):
        CandidateProfileObject(full_name="No ID Given")  # type: ignore[call-arg]

    with pytest.raises(ValidationError):
        JobProfileObject(job_id="j1", company="Acme")  # type: ignore[call-arg]
