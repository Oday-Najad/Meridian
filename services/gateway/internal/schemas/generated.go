// Code generated from JSON Schema using quicktype. DO NOT EDIT.
// To parse and unparse this JSON data, add this code to your project and do:
//
//    candidateProfileObject, err := UnmarshalCandidateProfileObject(bytes)
//    bytes, err = candidateProfileObject.Marshal()
//
//    jobProfileObject, err := UnmarshalJobProfileObject(bytes)
//    bytes, err = jobProfileObject.Marshal()

package schemas

import "encoding/json"

func UnmarshalCandidateProfileObject(data []byte) (CandidateProfileObject, error) {
	var r CandidateProfileObject
	err := json.Unmarshal(data, &r)
	return r, err
}

func (r *CandidateProfileObject) Marshal() ([]byte, error) {
	return json.Marshal(r)
}

func UnmarshalJobProfileObject(data []byte) (JobProfileObject, error) {
	var r JobProfileObject
	err := json.Unmarshal(data, &r)
	return r, err
}

func (r *JobProfileObject) Marshal() ([]byte, error) {
	return json.Marshal(r)
}

// The canonical, structured representation of a candidate. This is
// the single source of truth generated JSON Schema / Go structs / TS
// interfaces are derived from -- see scripts/generate_schemas.sh.
type CandidateProfileObject struct {
	CandidateID                                                            string                `json:"candidate_id"`
	Education                                                              []EducationElement    `json:"education,omitempty"`
	Experience                                                             []WorkExperience      `json:"experience,omitempty"`
	FullName                                                               string                `json:"full_name"`
	// Short self-description, e.g. 'Backend engineer, fintech focus'.                           
	Headline                                                               *string               `json:"headline"`
	Preferences                                                            *CandidatePreferences `json:"preferences,omitempty"`
	// 0-1 score of how complete this profile is, used to nudge onboarding.                      
	ProfileCompleteness                                                    *float64              `json:"profile_completeness,omitempty"`
	Skills                                                                 []CandidateSkill      `json:"skills,omitempty"`
}

type EducationElement struct {
	// e.g. 'BSc Computer Science', 'Professional Certificate in Data Science'.        
	Credential                                                                 string  `json:"credential"`
	EndDate                                                                    *string `json:"end_date"`
	FieldOfStudy                                                               *string `json:"field_of_study"`
	ID                                                                         string  `json:"id"`
	Institution                                                                string  `json:"institution"`
}

type WorkExperience struct {
	Claims                             []ClaimElement `json:"claims,omitempty"`
	Company                            string         `json:"company"`
	// None means current/ongoing role.               
	EndDate                            *string        `json:"end_date"`
	ID                                 string         `json:"id"`
	Seniority                          SeniorityLevel `json:"seniority"`
	StartDate                          string         `json:"start_date"`
	Title                              string         `json:"title"`
}

type ClaimElement struct {
	// What the candidate did, e.g. 'Implemented a caching layer for API responses'.                   
	Action                                                                                     string  `json:"action"`
	ID                                                                                         string  `json:"id"`
	// Structured quantification if the candidate provided one. None if genuinely unquantified         
	// -- never fabricated.                                                                            
	Metric                                                                                     *Metric `json:"metric"`
	// What resulted, e.g. 'Reduced average page load time'.                                           
	Outcome                                                                                    string  `json:"outcome"`
	// Set True only by the Phase 5 fact-checker pass after cross-referencing this claim. Never        
	// set True at intake.                                                                             
	Verified                                                                                   *bool   `json:"verified,omitempty"`
}

// A quantified outcome, e.g. "40% reduction" or "3x throughput".
// Kept as a structured (value, unit) pair rather than a free-text string
// so it can be compared/sorted/verified programmatically, not just
// read.
type Metric struct {
	// Free-text unit label, e.g. 'percent_reduction', 'x_multiplier', 'dollars_saved',                  
	// 'users_onboarded'. Not an enum: outcomes across different roles are too varied to                 
	// enumerate up front, but the (value, unit) pair keeps it structured rather than a sentence.        
	Unit                                                                                         string  `json:"unit"`
	Value                                                                                        float64 `json:"value"`
}

type CandidatePreferences struct {
	// ISO 4217 code, e.g. 'USD', 'EUR'.                                                  
	CompensationCurrency                                                   *string        `json:"compensation_currency"`
	// Minimum acceptable compensation, in the candidate's stated currency.               
	CompensationFloor                                                      *float64       `json:"compensation_floor"`
	DesiredRoles                                                           []string       `json:"desired_roles,omitempty"`
	IndustriesToAvoid                                                      []string       `json:"industries_to_avoid,omitempty"`
	// Preferred city/region names or 'remote'.                                           
	Locations                                                              []string       `json:"locations,omitempty"`
	// Acceptable work arrangements.                                                      
	RemotePolicy                                                           []RemotePolicy `json:"remote_policy,omitempty"`
	VisaStatus                                                             *string        `json:"visa_status"`
}

type CandidateSkill struct {
	// Human-readable form, e.g. 'Python'.                                                                        
	DisplayName                                                                                  string           `json:"display_name"`
	Evidence                                                                                     []EvidenceRef    `json:"evidence,omitempty"`
	SelfRatedProficiency                                                                         ProficiencyLevel `json:"self_rated_proficiency"`
	// Normalized skill identifier, e.g. 'python'. Shared vocabulary with JPO.skill_requirements.                 
	SkillRef                                                                                     string           `json:"skill_ref"`
}

// Points a skill claim at the specific place it came from.
type EvidenceRef struct {
	// Short human-readable note on what this evidence shows.                                         
	Context                                                                                   string  `json:"context"`
	// ID of a WorkExperienceClaim or Education entry within this same CPO, when type requires        
	// it.                                                                                            
	Ref                                                                                       *string `json:"ref"`
	Type                                                                                      Type    `json:"type"`
	// External URL (e.g. a GitHub repo, portfolio, publication) when type='linked_artifact'.         
	URL                                                                                       *string `json:"url"`
}

// The canonical, structured representation of a job posting.
type JobProfileObject struct {
	Company                                                                                string             `json:"company"`
	// None if not disclosed in the posting.                                                                  
	Compensation                                                                           *CompensationRange `json:"compensation"`
	EmploymentType                                                                         EmploymentType     `json:"employment_type"`
	JobID                                                                                  string             `json:"job_id"`
	Location                                                                               *string            `json:"location"`
	PostedDate                                                                             *string            `json:"posted_date"`
	RemotePolicy                                                                           RemotePolicy       `json:"remote_policy"`
	// Plain-text responsibility statements as extracted from the posting -- not structured                   
	// claims (see module docstring).                                                                         
	Responsibilities                                                                       []string           `json:"responsibilities,omitempty"`
	SeniorityBand                                                                          SeniorityLevel     `json:"seniority_band"`
	SkillRequirements                                                                      []SkillRequirement `json:"skill_requirements,omitempty"`
	// The employer career-page/job-board URL this was extracted from -- required for the                     
	// compliant, non-LinkedIn-scraping acquisition path.                                                     
	SourceURL                                                                              string             `json:"source_url"`
	Title                                                                                  string             `json:"title"`
}

type CompensationRange struct {
	// ISO 4217 code, e.g. 'USD', 'EUR'.         
	Currency                            string   `json:"currency"`
	Max                                 *float64 `json:"max"`
	Min                                 *float64 `json:"min"`
}

type SkillRequirement struct {
	DisplayName                                                                      string           `json:"display_name"`
	Importance                                                                       SkillImportance  `json:"importance"`
	RequiredProficiency                                                              ProficiencyLevel `json:"required_proficiency"`
	// Normalized skill identifier, e.g. 'python'. Shared vocabulary with CPO.skills.                 
	SkillRef                                                                         string           `json:"skill_ref"`
}

// A candidate's inferred/stated seniority (CPO) and a job's target
// seniority band (JPO) share this same scale.
type SeniorityLevel string

const (
	Entry     SeniorityLevel = "entry"
	Lead      SeniorityLevel = "lead"
	Mid       SeniorityLevel = "mid"
	Principal SeniorityLevel = "principal"
	Senior    SeniorityLevel = "senior"
)

type RemotePolicy string

const (
	Hybrid RemotePolicy = "hybrid"
	Onsite RemotePolicy = "onsite"
	Remote RemotePolicy = "remote"
)

type Type string

const (
	Certification       Type = "certification"
	Education           Type = "education"
	LinkedArtifact      Type = "linked_artifact"
	WorkExperienceClaim Type = "work_experience_claim"
)

// Used both for a candidate's self-rated skill level (CPO) and a job's
// required skill level (JPO) -- the shared vocabulary that makes
// "candidate claims advanced, job requires intermediate" a real
// structural comparison rather than a string-similarity guess.
type ProficiencyLevel string

const (
	Advanced     ProficiencyLevel = "advanced"
	Beginner     ProficiencyLevel = "beginner"
	Expert       ProficiencyLevel = "expert"
	Intermediate ProficiencyLevel = "intermediate"
)

type EmploymentType string

const (
	Contract   EmploymentType = "contract"
	FullTime   EmploymentType = "full_time"
	Internship EmploymentType = "internship"
	PartTime   EmploymentType = "part_time"
)

// JPO-only concept -- how strictly a job requires a given skill.
// Deliberately NOT shared with CPO: a candidate's skill has no
// equivalent 'importance', it has evidence instead. Keeping this
// JPO-only is a direct application of the Phase 1 decision to avoid a
// single mirrored schema with fields that are 'only relevant if X'.
type SkillImportance string

const (
	Preferred SkillImportance = "preferred"
	Required  SkillImportance = "required"
)
