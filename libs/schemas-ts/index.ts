// To parse this data:
//
//   import { Convert, CandidateProfileObject, JobProfileObject } from "./index";
//
//   const candidateProfileObject = Convert.toCandidateProfileObject(json);
//   const jobProfileObject = Convert.toJobProfileObject(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

/**
 * The canonical, structured representation of a candidate. This is
 * the single source of truth generated JSON Schema / Go structs / TS
 * interfaces are derived from -- see scripts/generate_schemas.sh.
 */
export interface CandidateProfileObject {
    candidate_id: string;
    education?:   Education[];
    experience?:  WorkExperience[];
    full_name:    string;
    /**
     * Short self-description, e.g. 'Backend engineer, fintech focus'.
     */
    headline?:    null | string;
    preferences?: CandidatePreferences;
    /**
     * 0-1 score of how complete this profile is, used to nudge onboarding.
     */
    profile_completeness?: number;
    skills?:               CandidateSkill[];
    [property: string]: unknown;
}

export interface Education {
    /**
     * e.g. 'BSc Computer Science', 'Professional Certificate in Data Science'.
     */
    credential:      string;
    end_date?:       Date | null;
    field_of_study?: null | string;
    id:              string;
    institution:     string;
    [property: string]: unknown;
}

export interface WorkExperience {
    claims?: WorkExperienceClaim[];
    company: string;
    /**
     * None means current/ongoing role.
     */
    end_date?:  Date | null;
    id:         string;
    seniority:  SeniorityLevel;
    start_date: Date;
    title:      string;
    [property: string]: unknown;
}

export interface WorkExperienceClaim {
    /**
     * What the candidate did, e.g. 'Implemented a caching layer for API responses'.
     */
    action: string;
    id:     string;
    /**
     * Structured quantification if the candidate provided one. None if genuinely unquantified
     * -- never fabricated.
     */
    metric?: null | Metric;
    /**
     * What resulted, e.g. 'Reduced average page load time'.
     */
    outcome: string;
    /**
     * Set True only by the Phase 5 fact-checker pass after cross-referencing this claim. Never
     * set True at intake.
     */
    verified?: boolean;
    [property: string]: unknown;
}

/**
 * A quantified outcome, e.g. "40% reduction" or "3x throughput".
 * Kept as a structured (value, unit) pair rather than a free-text string
 * so it can be compared/sorted/verified programmatically, not just
 * read.
 */
export interface Metric {
    /**
     * Free-text unit label, e.g. 'percent_reduction', 'x_multiplier', 'dollars_saved',
     * 'users_onboarded'. Not an enum: outcomes across different roles are too varied to
     * enumerate up front, but the (value, unit) pair keeps it structured rather than a sentence.
     */
    unit:  string;
    value: number;
    [property: string]: unknown;
}

/**
 * A candidate's inferred/stated seniority (CPO) and a job's target
 * seniority band (JPO) share this same scale.
 */
export type SeniorityLevel = "entry" | "mid" | "senior" | "lead" | "principal";

export interface CandidatePreferences {
    /**
     * ISO 4217 code, e.g. 'USD', 'EUR'.
     */
    compensation_currency?: null | string;
    /**
     * Minimum acceptable compensation, in the candidate's stated currency.
     */
    compensation_floor?:  number | null;
    desired_roles?:       string[];
    industries_to_avoid?: string[];
    /**
     * Preferred city/region names or 'remote'.
     */
    locations?: string[];
    /**
     * Acceptable work arrangements.
     */
    remote_policy?: RemotePolicy[];
    visa_status?:   null | string;
    [property: string]: unknown;
}

export type RemotePolicy = "remote" | "hybrid" | "onsite";

export interface CandidateSkill {
    /**
     * Human-readable form, e.g. 'Python'.
     */
    display_name:           string;
    evidence?:              EvidenceRef[];
    self_rated_proficiency: ProficiencyLevel;
    /**
     * Normalized skill identifier, e.g. 'python'. Shared vocabulary with JPO.skill_requirements.
     */
    skill_ref: string;
    [property: string]: unknown;
}

/**
 * Points a skill claim at the specific place it came from.
 */
export interface EvidenceRef {
    /**
     * Short human-readable note on what this evidence shows.
     */
    context: string;
    /**
     * ID of a WorkExperienceClaim or Education entry within this same CPO, when type requires
     * it.
     */
    ref?: null | string;
    type: Type;
    /**
     * External URL (e.g. a GitHub repo, portfolio, publication) when type='linked_artifact'.
     */
    url?: null | string;
    [property: string]: unknown;
}

export type Type = "work_experience_claim" | "linked_artifact" | "education" | "certification";

/**
 * Used both for a candidate's self-rated skill level (CPO) and a job's
 * required skill level (JPO) -- the shared vocabulary that makes
 * "candidate claims advanced, job requires intermediate" a real
 * structural comparison rather than a string-similarity guess.
 */
export type ProficiencyLevel = "beginner" | "intermediate" | "advanced" | "expert";

/**
 * The canonical, structured representation of a job posting.
 */
export interface JobProfileObject {
    company: string;
    /**
     * None if not disclosed in the posting.
     */
    compensation?:   null | CompensationRange;
    employment_type: EmploymentType;
    job_id:          string;
    location?:       null | string;
    posted_date?:    Date | null;
    remote_policy:   RemotePolicy;
    /**
     * Plain-text responsibility statements as extracted from the posting -- not structured
     * claims (see module docstring).
     */
    responsibilities?:   string[];
    seniority_band:      SeniorityLevel;
    skill_requirements?: SkillRequirement[];
    /**
     * The employer career-page/job-board URL this was extracted from -- required for the
     * compliant, non-LinkedIn-scraping acquisition path.
     */
    source_url: string;
    title:      string;
    [property: string]: unknown;
}

export interface CompensationRange {
    /**
     * ISO 4217 code, e.g. 'USD', 'EUR'.
     */
    currency: string;
    max?:     number | null;
    min?:     number | null;
    [property: string]: unknown;
}

export type EmploymentType = "full_time" | "part_time" | "contract" | "internship";

export interface SkillRequirement {
    display_name:         string;
    importance:           SkillImportance;
    required_proficiency: ProficiencyLevel;
    /**
     * Normalized skill identifier, e.g. 'python'. Shared vocabulary with CPO.skills.
     */
    skill_ref: string;
    [property: string]: unknown;
}

/**
 * JPO-only concept -- how strictly a job requires a given skill.
 * Deliberately NOT shared with CPO: a candidate's skill has no
 * equivalent 'importance', it has evidence instead. Keeping this
 * JPO-only is a direct application of the Phase 1 decision to avoid a
 * single mirrored schema with fields that are 'only relevant if X'.
 */
export type SkillImportance = "required" | "preferred";

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
    public static toCandidateProfileObject(json: string): CandidateProfileObject {
        return cast(JSON.parse(json), r("CandidateProfileObject"));
    }

    public static candidateProfileObjectToJson(value: CandidateProfileObject): string {
        return JSON.stringify(uncast(value, r("CandidateProfileObject")), null, 2);
    }

    public static toJobProfileObject(json: string): JobProfileObject {
        return cast(JSON.parse(json), r("JobProfileObject"));
    }

    public static jobProfileObjectToJson(value: JobProfileObject): string {
        return JSON.stringify(uncast(value, r("JobProfileObject")), null, 2);
    }
}

function invalidValue(typ: any, val: any, key: any, parent: any = ''): never {
    const prettyTyp = prettyTypeName(typ);
    const parentText = parent ? ` on ${parent}` : '';
    const keyText = key ? ` for key "${key}"` : '';
    throw Error(`Invalid value${keyText}${parentText}. Expected ${prettyTyp} but got ${JSON.stringify(val)}`);
}

function prettyTypeName(typ: any): string {
    if (Array.isArray(typ)) {
        if (typ.length === 2 && typ[0] === undefined) {
            return `an optional ${prettyTypeName(typ[1])}`;
        } else {
            return `one of [${typ.map(a => { return prettyTypeName(a); }).join(", ")}]`;
        }
    } else if (typeof typ === "object" && typ.literal !== undefined) {
        return typ.literal;
    } else {
        return typeof typ;
    }
}

function jsonToJSProps(typ: any): any {
    if (typ.jsonToJS === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.json] = { key: p.js, typ: p.typ });
        typ.jsonToJS = map;
    }
    return typ.jsonToJS;
}

function jsToJSONProps(typ: any): any {
    if (typ.jsToJSON === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.js] = { key: p.json, typ: p.typ });
        typ.jsToJSON = map;
    }
    return typ.jsToJSON;
}

function transform(val: any, typ: any, getProps: any, key: any = '', parent: any = ''): any {
    function transformPrimitive(typ: string, val: any): any {
        if (typeof typ === typeof val) return val;
        return invalidValue(typ, val, key, parent);
    }

    function transformUnion(typs: any[], val: any): any {
        // val must validate against one typ in typs
        const l = typs.length;
        for (let i = 0; i < l; i++) {
            const typ = typs[i];
            try {
                return transform(val, typ, getProps);
            } catch (_) {}
        }
        return invalidValue(typs, val, key, parent);
    }

    function transformEnum(cases: string[], val: any): any {
        if (cases.indexOf(val) !== -1) return val;
        return invalidValue(cases.map(a => { return l(a); }), val, key, parent);
    }

    function transformArray(typ: any, val: any): any {
        // val must be an array with no invalid elements
        if (!Array.isArray(val)) return invalidValue(l("array"), val, key, parent);
        return val.map(el => transform(el, typ, getProps));
    }

    function transformDate(val: any): any {
        if (val === null) {
            return null;
        }
        const d = new Date(val);
        if (isNaN(d.valueOf())) {
            return invalidValue(l("Date"), val, key, parent);
        }
        return d;
    }

    function transformObject(props: { [k: string]: any }, additional: any, val: any): any {
        if (val === null || typeof val !== "object" || Array.isArray(val)) {
            return invalidValue(l(ref || "object"), val, key, parent);
        }
        const result: any = {};
        Object.getOwnPropertyNames(props).forEach(key => {
            const prop = props[key];
            const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined;
            result[prop.key] = transform(v, prop.typ, getProps, key, ref);
        });
        Object.getOwnPropertyNames(val).forEach(key => {
            if (!Object.prototype.hasOwnProperty.call(props, key)) {
                result[key] = transform(val[key], additional, getProps, key, ref);
            }
        });
        return result;
    }

    if (typ === "any") return val;
    if (typ === null) {
        if (val === null) return val;
        return invalidValue(typ, val, key, parent);
    }
    if (typ === false) return invalidValue(typ, val, key, parent);
    let ref: any = undefined;
    while (typeof typ === "object" && typ.ref !== undefined) {
        ref = typ.ref;
        typ = typeMap[typ.ref];
    }
    if (Array.isArray(typ)) return transformEnum(typ, val);
    if (typeof typ === "object") {
        return typ.hasOwnProperty("unionMembers") ? transformUnion(typ.unionMembers, val)
            : typ.hasOwnProperty("arrayItems")    ? transformArray(typ.arrayItems, val)
            : typ.hasOwnProperty("props")         ? transformObject(getProps(typ), typ.additional, val)
            : invalidValue(typ, val, key, parent);
    }
    // Numbers can be parsed by Date but shouldn't be.
    if (typ === Date && typeof val !== "number") return transformDate(val);
    return transformPrimitive(typ, val);
}

function cast<T>(val: any, typ: any): T {
    return transform(val, typ, jsonToJSProps);
}

function uncast<T>(val: T, typ: any): any {
    return transform(val, typ, jsToJSONProps);
}

function l(typ: any) {
    return { literal: typ };
}

function a(typ: any) {
    return { arrayItems: typ };
}

function u(...typs: any[]) {
    return { unionMembers: typs };
}

function o(props: any[], additional: any) {
    return { props, additional };
}

function m(additional: any) {
    return { props: [], additional };
}

function r(name: string) {
    return { ref: name };
}

const typeMap: any = {
    "CandidateProfileObject": o([
        { json: "candidate_id", js: "candidate_id", typ: "" },
        { json: "education", js: "education", typ: u(undefined, a(r("Education"))) },
        { json: "experience", js: "experience", typ: u(undefined, a(r("WorkExperience"))) },
        { json: "full_name", js: "full_name", typ: "" },
        { json: "headline", js: "headline", typ: u(undefined, u(null, "")) },
        { json: "preferences", js: "preferences", typ: u(undefined, r("CandidatePreferences")) },
        { json: "profile_completeness", js: "profile_completeness", typ: u(undefined, 3.14) },
        { json: "skills", js: "skills", typ: u(undefined, a(r("CandidateSkill"))) },
    ], "any"),
    "Education": o([
        { json: "credential", js: "credential", typ: "" },
        { json: "end_date", js: "end_date", typ: u(undefined, u(Date, null)) },
        { json: "field_of_study", js: "field_of_study", typ: u(undefined, u(null, "")) },
        { json: "id", js: "id", typ: "" },
        { json: "institution", js: "institution", typ: "" },
    ], "any"),
    "WorkExperience": o([
        { json: "claims", js: "claims", typ: u(undefined, a(r("WorkExperienceClaim"))) },
        { json: "company", js: "company", typ: "" },
        { json: "end_date", js: "end_date", typ: u(undefined, u(Date, null)) },
        { json: "id", js: "id", typ: "" },
        { json: "seniority", js: "seniority", typ: r("SeniorityLevel") },
        { json: "start_date", js: "start_date", typ: Date },
        { json: "title", js: "title", typ: "" },
    ], "any"),
    "WorkExperienceClaim": o([
        { json: "action", js: "action", typ: "" },
        { json: "id", js: "id", typ: "" },
        { json: "metric", js: "metric", typ: u(undefined, u(null, r("Metric"))) },
        { json: "outcome", js: "outcome", typ: "" },
        { json: "verified", js: "verified", typ: u(undefined, true) },
    ], "any"),
    "Metric": o([
        { json: "unit", js: "unit", typ: "" },
        { json: "value", js: "value", typ: 3.14 },
    ], "any"),
    "CandidatePreferences": o([
        { json: "compensation_currency", js: "compensation_currency", typ: u(undefined, u(null, "")) },
        { json: "compensation_floor", js: "compensation_floor", typ: u(undefined, u(3.14, null)) },
        { json: "desired_roles", js: "desired_roles", typ: u(undefined, a("")) },
        { json: "industries_to_avoid", js: "industries_to_avoid", typ: u(undefined, a("")) },
        { json: "locations", js: "locations", typ: u(undefined, a("")) },
        { json: "remote_policy", js: "remote_policy", typ: u(undefined, a(r("RemotePolicy"))) },
        { json: "visa_status", js: "visa_status", typ: u(undefined, u(null, "")) },
    ], "any"),
    "CandidateSkill": o([
        { json: "display_name", js: "display_name", typ: "" },
        { json: "evidence", js: "evidence", typ: u(undefined, a(r("EvidenceRef"))) },
        { json: "self_rated_proficiency", js: "self_rated_proficiency", typ: r("ProficiencyLevel") },
        { json: "skill_ref", js: "skill_ref", typ: "" },
    ], "any"),
    "EvidenceRef": o([
        { json: "context", js: "context", typ: "" },
        { json: "ref", js: "ref", typ: u(undefined, u(null, "")) },
        { json: "type", js: "type", typ: r("Type") },
        { json: "url", js: "url", typ: u(undefined, u(null, "")) },
    ], "any"),
    "JobProfileObject": o([
        { json: "company", js: "company", typ: "" },
        { json: "compensation", js: "compensation", typ: u(undefined, u(null, r("CompensationRange"))) },
        { json: "employment_type", js: "employment_type", typ: r("EmploymentType") },
        { json: "job_id", js: "job_id", typ: "" },
        { json: "location", js: "location", typ: u(undefined, u(null, "")) },
        { json: "posted_date", js: "posted_date", typ: u(undefined, u(Date, null)) },
        { json: "remote_policy", js: "remote_policy", typ: r("RemotePolicy") },
        { json: "responsibilities", js: "responsibilities", typ: u(undefined, a("")) },
        { json: "seniority_band", js: "seniority_band", typ: r("SeniorityLevel") },
        { json: "skill_requirements", js: "skill_requirements", typ: u(undefined, a(r("SkillRequirement"))) },
        { json: "source_url", js: "source_url", typ: "" },
        { json: "title", js: "title", typ: "" },
    ], "any"),
    "CompensationRange": o([
        { json: "currency", js: "currency", typ: "" },
        { json: "max", js: "max", typ: u(undefined, u(3.14, null)) },
        { json: "min", js: "min", typ: u(undefined, u(3.14, null)) },
    ], "any"),
    "SkillRequirement": o([
        { json: "display_name", js: "display_name", typ: "" },
        { json: "importance", js: "importance", typ: r("SkillImportance") },
        { json: "required_proficiency", js: "required_proficiency", typ: r("ProficiencyLevel") },
        { json: "skill_ref", js: "skill_ref", typ: "" },
    ], "any"),
    "SeniorityLevel": [
        "entry",
        "lead",
        "mid",
        "principal",
        "senior",
    ],
    "RemotePolicy": [
        "hybrid",
        "onsite",
        "remote",
    ],
    "Type": [
        "certification",
        "education",
        "linked_artifact",
        "work_experience_claim",
    ],
    "ProficiencyLevel": [
        "advanced",
        "beginner",
        "expert",
        "intermediate",
    ],
    "EmploymentType": [
        "contract",
        "full_time",
        "internship",
        "part_time",
    ],
    "SkillImportance": [
        "preferred",
        "required",
    ],
};
