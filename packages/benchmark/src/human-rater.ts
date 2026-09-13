import { canonicalJson, computeSha256 } from "../../sandbox-contracts/src/index.js";
import { seededCanonicalOrder } from "./deterministic-randomization.js";
import type { BenchmarkRegistry } from "./registry.js";
import type { EvaluatorRegistry } from "./evaluators.js";
import { EVALUATOR_ABSTENTION_REASONS } from "./evaluator-types.js";
import type { MetricRegistry } from "./metrics.js";
import { metricIdentityKey } from "./metrics.js";
import {
  HUMAN_BLINDING_POLICIES,
  HUMAN_PRESENTATION_MODES,
  HUMAN_RATER_STATUSES,
  HUMAN_SUBMISSION_STATUSES
} from "./human-rater-types.js";
import type {
  CanonicalHumanRaterRegistrySnapshot,
  HumanJudgeExecutionResult,
  HumanPresentation,
  HumanPresentationCandidate,
  HumanPresentationCandidateInput,
  HumanPresentationInput,
  HumanRater,
  HumanRaterValidationResult,
  HumanRaterValidationViolation,
  HumanRating,
  HumanRatingAssignment,
  HumanRatingAssignmentInput,
  HumanRatingInput,
  HumanRatingStudyDefinition,
  HumanRatingStudyIdentity,
  HumanRatingSubmission
} from "./human-rater-types.js";
import type { ReliabilityStudyTarget } from "./reliability-types.js";

const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
const ID_PATTERN = /^[a-z][a-z0-9_-]*$/;
const ABSOLUTE_PATH_PATTERN = /^(?:[A-Za-z]:[\\/]|\\\\|\/)/;
const FORBIDDEN_FIELD_PATTERN =
  /^(?:realName|fullName|email|phone|address|ipAddress|username|userAccount|auth(?:entication)?Identity|.*(?:password|secret|token|credential|apiKey|privateKey).*)$/i;
const SECRET_VALUE_PATTERN =
  /(?:BEGIN (?:RSA |OPENSSH )?PRIVATE KEY|\bghp_[A-Za-z0-9]{20,}\b|\bAKIA[0-9A-Z]{16}\b)/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const IP_PATTERN = /^(?:\d{1,3}\.){3}\d{1,3}$/;
const PHONE_PATTERN = /^\+?[0-9][0-9 ()-]{6,}$/;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

const HUMAN_EVALUATOR_IDENTITY = {
  evaluatorId: "human_judge_contract",
  evaluatorVersion: "0.1.0"
} as const;

function studyKey(identity: HumanRatingStudyIdentity): string {
  return `${identity.humanRatingStudyId}@${identity.humanRatingStudyVersion}`;
}

function rubricKey(identity: { rubricId: string; rubricVersion: string }): string {
  return `${identity.rubricId}@${identity.rubricVersion}`;
}

function bindingKey(binding: HumanRatingStudyDefinition["benchmarkBinding"]): string {
  return binding
    ? `${binding.benchmark.benchmarkId}@${binding.benchmark.benchmarkVersion}/${binding.constructId}`
    : "";
}

function push(
  violations: HumanRaterValidationViolation[],
  code: string,
  path: string,
  message: string
): void {
  violations.push({ code, path, message });
}

function scanCanonicalRecord(
  value: unknown,
  path: string,
  violations: HumanRaterValidationViolation[]
): void {
  if (typeof value === "string") {
    if (ABSOLUTE_PATH_PATTERN.test(value))
      push(
        violations,
        "PRIVATE_PATH_FORBIDDEN",
        path,
        "Canonical human-rating records cannot contain local absolute paths."
      );
    if (SECRET_VALUE_PATTERN.test(value))
      push(
        violations,
        "SECRET_MATERIAL_FORBIDDEN",
        path,
        "Canonical human-rating records cannot contain credentials or private keys."
      );
    if (EMAIL_PATTERN.test(value) || IP_PATTERN.test(value) || PHONE_PATTERN.test(value))
      push(
        violations,
        "PII_VALUE_FORBIDDEN",
        path,
        "Canonical rater lineage uses pseudonymous references rather than direct contact or network identifiers."
      );
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => scanCanonicalRecord(item, `${path}[${index}]`, violations));
    return;
  }
  if (value && typeof value === "object")
    for (const [key, nested] of Object.entries(value)) {
      if (FORBIDDEN_FIELD_PATTERN.test(key))
        push(
          violations,
          "PII_OR_SECRET_FIELD_FORBIDDEN",
          `${path}.${key}`,
          `Field '${key}' is outside the pseudonymous canonical contract.`
        );
      scanCanonicalRecord(nested, `${path}.${key}`, violations);
    }
}

function canonicalStudy(definition: HumanRatingStudyDefinition): object {
  return {
    ...definition,
    evidenceReferences: [...definition.evidenceReferences].sort(),
    provenanceReferences: [...definition.provenanceReferences].sort(),
    limitations: [...definition.limitations].sort(),
    output:
      definition.output.kind === "CATEGORICAL"
        ? { ...definition.output, allowedValues: [...definition.output.allowedValues].sort() }
        : definition.output
  };
}

export function validateHumanRaterRegistry(
  snapshot: CanonicalHumanRaterRegistrySnapshot,
  benchmarkRegistry: BenchmarkRegistry,
  metricRegistry: MetricRegistry,
  evaluatorRegistry: EvaluatorRegistry
): HumanRaterValidationResult {
  const violations: HumanRaterValidationViolation[] = [];
  if (!SEMVER_PATTERN.test(snapshot.humanRaterRegistrySchemaVersion))
    push(
      violations,
      "INVALID_REGISTRY_VERSION",
      "humanRaterRegistrySchemaVersion",
      "Registry schema version must be semver."
    );
  const raterIds = new Set<string>();
  snapshot.raters.forEach((rater, index) => {
    const path = `raters[${index}]`;
    if (raterIds.has(rater.identity.raterId))
      push(
        violations,
        "DUPLICATE_RATER_IDENTITY",
        `${path}.identity`,
        "Rater identity must be unique."
      );
    raterIds.add(rater.identity.raterId);
    if (!ID_PATTERN.test(rater.identity.raterId))
      push(
        violations,
        "INVALID_RATER_ID",
        `${path}.identity.raterId`,
        "Rater ID must be a project-scoped pseudonymous identifier."
      );
    if (!HUMAN_RATER_STATUSES.includes(rater.status))
      push(
        violations,
        "INVALID_RATER_STATUS",
        `${path}.status`,
        "Rater status must use the bounded lifecycle."
      );
    if (
      !rater.participationPolicyReference ||
      !rater.acknowledgementReference ||
      rater.provenanceReferences.length === 0 ||
      rater.limitations.length === 0
    )
      push(
        violations,
        "INCOMPLETE_RATER_RECORD",
        path,
        "Participation, acknowledgement, provenance, and limitations are required architectural references."
      );
    scanCanonicalRecord(rater, path, violations);
  });
  const studies = new Set<string>();
  snapshot.studies.forEach((study, index) => {
    const path = `studies[${index}]`;
    const key = studyKey(study.identity);
    if (studies.has(key))
      push(
        violations,
        "DUPLICATE_STUDY_IDENTITY",
        `${path}.identity`,
        "Human Rating Study identity must be unique."
      );
    studies.add(key);
    if (!ID_PATTERN.test(study.identity.humanRatingStudyId))
      push(
        violations,
        "INVALID_STUDY_ID",
        `${path}.identity.humanRatingStudyId`,
        "Study ID must be canonical and stable."
      );
    if (!SEMVER_PATTERN.test(study.identity.humanRatingStudyVersion))
      push(
        violations,
        "INVALID_STUDY_VERSION",
        `${path}.identity.humanRatingStudyVersion`,
        "Study version must be semver."
      );
    if (study.versionScope !== "HUMAN_RATING_STUDY")
      push(
        violations,
        "AMBIGUOUS_VERSION_SCOPE",
        `${path}.versionScope`,
        "Human rating studies use HUMAN_RATING_STUDY scope."
      );
    if (study.role !== "HUMAN_AS_JUDGE")
      push(
        violations,
        "HUMAN_ROLE_SUBSTITUTION",
        `${path}.role`,
        "S-06 supports HUMAN_AS_JUDGE only."
      );
    if (study.scientificAuthority !== "NONE")
      push(
        violations,
        "SCIENTIFIC_AUTHORITY_FORBIDDEN",
        `${path}.scientificAuthority`,
        "Human ratings cannot establish validity or scientific authority."
      );
    if (
      !study.name.trim() ||
      !study.description.trim() ||
      !study.evaluationTarget.trim() ||
      !study.inputKind.trim() ||
      !study.subjectKind.trim()
    )
      push(
        violations,
        "AMBIGUOUS_STUDY_TARGET",
        path,
        "Study name, target, input kind, and subject kind are required."
      );
    if (!evaluatorRegistry.getRubric(study.rubricIdentity))
      push(
        violations,
        "UNKNOWN_RUBRIC",
        `${path}.rubricIdentity`,
        "Study must bind an exact S-04 rubric identity."
      );
    if (study.benchmarkBinding) {
      const benchmark = benchmarkRegistry.get(study.benchmarkBinding.benchmark);
      if (!benchmark)
        push(
          violations,
          "UNKNOWN_BENCHMARK",
          `${path}.benchmarkBinding`,
          "Study references an unknown S-02 benchmark."
        );
      else if (!benchmark.constructIds.includes(study.benchmarkBinding.constructId))
        push(
          violations,
          "UNKNOWN_CONSTRUCT",
          `${path}.benchmarkBinding.constructId`,
          "Study references an unknown benchmark construct."
        );
    }
    if (!HUMAN_PRESENTATION_MODES.includes(study.presentationMode))
      push(
        violations,
        "INVALID_PRESENTATION_MODE",
        `${path}.presentationMode`,
        "Presentation mode is not supported."
      );
    if (!HUMAN_BLINDING_POLICIES.includes(study.blindingPolicy))
      push(
        violations,
        "INVALID_BLINDING_POLICY",
        `${path}.blindingPolicy`,
        "Blinding policy is not supported."
      );
    if (study.presentationMode === "SINGLE" && study.comparisonPolicy !== "NONE")
      push(
        violations,
        "INVALID_COMPARISON_POLICY",
        `${path}.comparisonPolicy`,
        "Single presentations cannot claim a candidate comparison."
      );
    if (study.output.kind === "NUMERIC") {
      const metric = metricRegistry.get(study.output.metricIdentity);
      if (!metric)
        push(
          violations,
          "UNKNOWN_METRIC",
          `${path}.output.metricIdentity`,
          "Numeric studies require an exact S-03 metric identity."
        );
      else if (bindingKey(metric.benchmarkBinding) !== bindingKey(study.benchmarkBinding))
        push(
          violations,
          "METRIC_BENCHMARK_SUBSTITUTION",
          `${path}.benchmarkBinding`,
          "Numeric study and S-03 metric must retain the same benchmark and construct binding."
        );
    }
    if (
      study.output.kind === "CATEGORICAL" &&
      (study.output.allowedValues.length === 0 ||
        new Set(study.output.allowedValues).size !== study.output.allowedValues.length)
    )
      push(
        violations,
        "INVALID_RATING_SCALE",
        `${path}.output.allowedValues`,
        "Categorical values must be explicit and unique."
      );
    if (
      study.output.kind === "ORDINAL" &&
      (study.output.orderedValues.length < 2 ||
        new Set(study.output.orderedValues).size !== study.output.orderedValues.length)
    )
      push(
        violations,
        "INVALID_RATING_SCALE",
        `${path}.output.orderedValues`,
        "Ordinal values require a unique declared order."
      );
    if (
      study.randomizationPolicy.method === "SEEDED_FISHER_YATES" &&
      study.randomizationPolicy.seedRequired !== true
    )
      push(
        violations,
        "INVALID_RANDOMIZATION_POLICY",
        `${path}.randomizationPolicy`,
        "Seeded randomization must require a recorded seed."
      );
    if (
      study.evidenceReferences.length === 0 ||
      study.provenanceReferences.length === 0 ||
      study.limitations.length === 0
    )
      push(
        violations,
        "INCOMPLETE_STUDY_EVIDENCE",
        path,
        "Study evidence, provenance, and limitations are required."
      );
    scanCanonicalRecord(study, path, violations);
  });
  return { valid: violations.length === 0, violations };
}

export class HumanRaterRegistryValidationError extends Error {
  constructor(readonly violations: readonly HumanRaterValidationViolation[]) {
    super(violations.map((item) => `${item.code}: ${item.message}`).join("\n"));
    this.name = "HumanRaterRegistryValidationError";
  }
}

export class HumanRaterRecordValidationError extends Error {
  constructor(readonly violations: readonly HumanRaterValidationViolation[]) {
    super(violations.map((item) => `${item.code}: ${item.message}`).join("\n"));
    this.name = "HumanRaterRecordValidationError";
  }
}

function visibleCandidate(
  candidate: HumanPresentationCandidateInput,
  policy: HumanRatingStudyDefinition["blindingPolicy"]
): { candidate: HumanPresentationCandidate; transformations: string[] } {
  const metadata = { ...candidate.metadata };
  const transformations: string[] = [];
  const remove = (key: keyof typeof metadata, name: string): void => {
    if (key in metadata) {
      delete metadata[key];
      transformations.push(name);
    }
  };
  if (policy === "SUBJECT_IDENTITY_BLINDED" || policy === "FULL_SOURCE_BLINDED")
    remove("subjectIdentity", "REMOVE_SUBJECT_IDENTITY");
  if (policy === "MODEL_IDENTITY_BLINDED" || policy === "FULL_SOURCE_BLINDED")
    remove("modelIdentity", "REMOVE_MODEL_IDENTITY");
  if (policy === "PROVIDER_IDENTITY_BLINDED" || policy === "FULL_SOURCE_BLINDED")
    remove("providerIdentity", "REMOVE_PROVIDER_IDENTITY");
  if (policy === "FULL_SOURCE_BLINDED") remove("sourceLabel", "REMOVE_SOURCE_LABEL");
  return {
    candidate: {
      candidateId: candidate.candidateId,
      contentReference: candidate.contentReference,
      semanticContentDigest: candidate.semanticContentDigest,
      visibleMetadata: metadata
    },
    transformations
  };
}

export class HumanRaterSystem {
  private readonly raters = new Map<string, HumanRater>();
  private readonly studies = new Map<string, HumanRatingStudyDefinition>();

  constructor(
    readonly snapshot: CanonicalHumanRaterRegistrySnapshot,
    readonly benchmarkRegistry: BenchmarkRegistry,
    readonly metricRegistry: MetricRegistry,
    readonly evaluatorRegistry: EvaluatorRegistry
  ) {
    const validation = validateHumanRaterRegistry(
      snapshot,
      benchmarkRegistry,
      metricRegistry,
      evaluatorRegistry
    );
    if (!validation.valid) throw new HumanRaterRegistryValidationError(validation.violations);
    snapshot.raters.forEach((rater) => this.raters.set(rater.identity.raterId, rater));
    snapshot.studies.forEach((study) => this.studies.set(studyKey(study.identity), study));
  }

  getRater(raterId: string): HumanRater | undefined {
    return this.raters.get(raterId);
  }
  getStudy(identity: HumanRatingStudyIdentity): HumanRatingStudyDefinition | undefined {
    return this.studies.get(studyKey(identity));
  }
  studyDigest(definition: HumanRatingStudyDefinition): string {
    return computeSha256(canonicalJson(canonicalStudy(definition)));
  }
  serialize(): string {
    return canonicalJson({
      ...this.snapshot,
      raters: [...this.snapshot.raters]
        .map((rater) => ({
          ...rater,
          qualificationReferences: [...rater.qualificationReferences].sort(),
          trainingReferences: [...rater.trainingReferences].sort(),
          rubricFamiliarizationReferences: [...rater.rubricFamiliarizationReferences].sort(),
          provenanceReferences: [...rater.provenanceReferences].sort(),
          limitations: [...rater.limitations].sort()
        }))
        .sort((a, b) => a.identity.raterId.localeCompare(b.identity.raterId)),
      studies: [...this.snapshot.studies]
        .map(canonicalStudy)
        .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
    });
  }
  digest(): string {
    return computeSha256(this.serialize());
  }

  transitionRater(rater: HumanRater, nextStatus: HumanRater["status"]): HumanRater {
    const allowed: Readonly<Record<HumanRater["status"], readonly HumanRater["status"][]>> = {
      REGISTERED: ["QUALIFIED", "SUSPENDED", "RETIRED"],
      QUALIFIED: ["SUSPENDED", "RETIRED"],
      SUSPENDED: ["QUALIFIED", "RETIRED"],
      RETIRED: []
    };
    if (!allowed[rater.status].includes(nextStatus))
      throw new HumanRaterRecordValidationError([
        {
          code: "INVALID_RATER_TRANSITION",
          path: "status",
          message: `Rater cannot transition from ${rater.status} to ${nextStatus}.`
        }
      ]);
    return { ...rater, status: nextStatus };
  }

  createAssignment(input: HumanRatingAssignmentInput): HumanRatingAssignment {
    const violations: HumanRaterValidationViolation[] = [];
    const study = this.getStudy(input.studyIdentity);
    const rater = this.getRater(input.raterId);
    if (!study)
      push(
        violations,
        "UNKNOWN_STUDY",
        "studyIdentity",
        "Assignment references an unknown Human Rating Study."
      );
    if (!rater)
      push(
        violations,
        "UNKNOWN_RATER",
        "raterId",
        "Assignment references an unknown pseudonymous rater."
      );
    else if (rater.status !== "QUALIFIED")
      push(
        violations,
        "RATER_NOT_QUALIFIED",
        "raterId",
        "Only a currently qualified rater may receive an assignment."
      );
    if (
      !input.assignmentId ||
      !input.target.subjectId ||
      !input.target.evaluationTarget ||
      input.target.inputReferences.length === 0
    )
      push(
        violations,
        "MISSING_TARGET",
        "target",
        "Assignment requires an exact subject, target, and input references."
      );
    if (
      study &&
      (study.subjectKind !== input.target.subjectKind ||
        study.inputKind !== input.target.inputKind ||
        study.evaluationTarget !== input.target.evaluationTarget ||
        bindingKey(study.benchmarkBinding) !== bindingKey(input.target.benchmarkBinding))
    )
      push(
        violations,
        "ASSIGNMENT_TARGET_SUBSTITUTION",
        "target",
        "Assignment target must exactly match the study protocol."
      );
    scanCanonicalRecord(input, "assignment", violations);
    for (const key of Object.keys(input))
      if (/answer|judgment|rating|score|category/i.test(key))
        push(
          violations,
          "PREPOPULATED_JUDGMENT_FORBIDDEN",
          `assignment.${key}`,
          "An assignment cannot contain a judgment before submission."
        );
    if (violations.length > 0 || !study || !rater)
      throw new HumanRaterRecordValidationError(violations);
    const material = {
      assignmentId: input.assignmentId,
      studyIdentity: input.studyIdentity,
      studyDefinitionDigest: this.studyDigest(study),
      raterId: input.raterId,
      raterStatusAtAssignment: rater.status,
      target: { ...input.target, inputReferences: [...input.target.inputReferences].sort() },
      rubricIdentity: study.rubricIdentity,
      presentationMode: study.presentationMode,
      blindingPolicy: study.blindingPolicy
    };
    return {
      ...material,
      assignmentDigest: computeSha256(canonicalJson(material)),
      state: "ASSIGNED",
      createdAt: input.createdAt
    };
  }

  openAssignment(assignment: HumanRatingAssignment, openedAt: string): HumanRatingAssignment {
    if (assignment.state !== "ASSIGNED")
      throw new HumanRaterRecordValidationError([
        {
          code: "INVALID_ASSIGNMENT_TRANSITION",
          path: "state",
          message: "Only ASSIGNED records may transition to OPENED."
        }
      ]);
    return { ...assignment, state: "OPENED", openedAt };
  }

  createPresentation(input: HumanPresentationInput): HumanPresentation {
    const violations: HumanRaterValidationViolation[] = [];
    const study = this.getStudy(input.assignment.studyIdentity);
    if (!study)
      push(
        violations,
        "UNKNOWN_STUDY",
        "assignment.studyIdentity",
        "Presentation references an unknown study."
      );
    if (input.assignment.state !== "OPENED")
      push(
        violations,
        "ASSIGNMENT_NOT_OPEN",
        "assignment.state",
        "Presentation requires an opened assignment."
      );
    if (
      study &&
      (rubricKey(input.assignment.rubricIdentity) !== rubricKey(study.rubricIdentity) ||
        input.assignment.studyDefinitionDigest !== this.studyDigest(study))
    )
      push(
        violations,
        "RUBRIC_OR_STUDY_SUBSTITUTION",
        "assignment",
        "Assignment must retain the exact study definition and rubric."
      );
    const expected =
      study?.presentationMode === "SINGLE" ? 1 : study?.presentationMode === "PAIRWISE" ? 2 : 2;
    if (
      (study?.presentationMode === "SINGLE" && input.candidates.length !== expected) ||
      (study?.presentationMode === "PAIRWISE" && input.candidates.length !== expected) ||
      (study?.presentationMode === "MULTI_CANDIDATE" && input.candidates.length < expected)
    )
      push(
        violations,
        "INVALID_CANDIDATE_COUNT",
        "candidates",
        "Candidate count must match the declared presentation mode."
      );
    const candidateIds = input.candidates.map((candidate) => candidate.candidateId);
    if (
      new Set(candidateIds).size !== candidateIds.length ||
      input.candidates.some(
        (candidate) =>
          !candidate.candidateId ||
          !candidate.contentReference ||
          !SHA256_PATTERN.test(candidate.semanticContentDigest)
      )
    )
      push(
        violations,
        "INVALID_PRESENTATION_CANDIDATES",
        "candidates",
        "Candidates require unique identities, content references, and semantic digests."
      );
    if (
      study?.randomizationPolicy.method === "SEEDED_FISHER_YATES" &&
      (!Number.isInteger(input.randomizationSeed) || input.randomizationSeed === undefined)
    )
      push(
        violations,
        "INVALID_RANDOMIZATION_RECORD",
        "randomizationSeed",
        "Seeded randomization requires a recorded integer seed."
      );
    if (study?.randomizationPolicy.method === "NONE" && input.randomizationSeed !== undefined)
      push(
        violations,
        "INVALID_RANDOMIZATION_RECORD",
        "randomizationSeed",
        "A non-randomized presentation cannot carry a seed."
      );
    scanCanonicalRecord(input, "presentation", violations);
    if (violations.length > 0 || !study) throw new HumanRaterRecordValidationError(violations);
    const orderedInputs =
      study.randomizationPolicy.method === "SEEDED_FISHER_YATES"
        ? seededCanonicalOrder(input.candidates, input.randomizationSeed!)
        : [...input.candidates];
    const visible = orderedInputs.map((candidate) =>
      visibleCandidate(candidate, study.blindingPolicy)
    );
    const candidates = visible.map((item) => item.candidate);
    const transformations = [...new Set(visible.flatMap((item) => item.transformations))].sort();
    const material = {
      presentationId: input.presentationId,
      assignmentId: input.assignment.assignmentId,
      studyIdentity: input.assignment.studyIdentity,
      raterId: input.assignment.raterId,
      mode: study.presentationMode,
      rubricIdentity: study.rubricIdentity,
      candidates,
      declaredBlindingPolicy: study.blindingPolicy,
      effectiveVisibility: {
        subjectIdentity: candidates.some(
          (candidate) => candidate.visibleMetadata.subjectIdentity !== undefined
        ),
        modelIdentity: candidates.some(
          (candidate) => candidate.visibleMetadata.modelIdentity !== undefined
        ),
        providerIdentity: candidates.some(
          (candidate) => candidate.visibleMetadata.providerIdentity !== undefined
        ),
        sourceLabel: candidates.some(
          (candidate) => candidate.visibleMetadata.sourceLabel !== undefined
        )
      },
      transformations,
      randomization: {
        method: study.randomizationPolicy.method,
        ...(input.randomizationSeed === undefined ? {} : { seed: input.randomizationSeed }),
        inputOrder: candidateIds,
        resultingOrder: candidates.map((candidate) => candidate.candidateId)
      },
      sourceAnonymityGuarantee: "NOT_CLAIMED" as const
    };
    return {
      ...material,
      presentationDigest: computeSha256(canonicalJson(material)),
      openedAt: input.openedAt
    };
  }

  submitRating(input: HumanRatingInput): HumanRatingSubmission {
    const violations: HumanRaterValidationViolation[] = [];
    const study = this.getStudy(input.assignment.studyIdentity);
    const rater = this.getRater(input.assignment.raterId);
    if (!study)
      push(
        violations,
        "UNKNOWN_STUDY",
        "assignment.studyIdentity",
        "Rating references an unknown study."
      );
    if (
      !rater ||
      rater.identity.raterId !== input.presentation.raterId ||
      rater.identity.raterId !== input.assignment.raterId
    )
      push(
        violations,
        "ASSIGNMENT_RATER_SUBSTITUTION",
        "raterId",
        "Rating, assignment, and presentation must retain one pseudonymous rater."
      );
    if (input.assignment.state !== "OPENED")
      push(
        violations,
        "ASSIGNMENT_NOT_OPEN",
        "assignment.state",
        "Only an opened assignment may receive a submission."
      );
    if (
      input.presentation.assignmentId !== input.assignment.assignmentId ||
      (study && studyKey(input.presentation.studyIdentity) !== studyKey(study.identity))
    )
      push(
        violations,
        "PRESENTATION_ASSIGNMENT_SUBSTITUTION",
        "presentation",
        "Rating must bind the exact assignment presentation."
      );
    if (study && rubricKey(input.presentation.rubricIdentity) !== rubricKey(study.rubricIdentity))
      push(
        violations,
        "RUBRIC_SUBSTITUTION",
        "presentation.rubricIdentity",
        "Rating must preserve the exact rubric version presented."
      );
    if (!HUMAN_SUBMISSION_STATUSES.includes(input.status))
      push(violations, "INVALID_SUBMISSION_STATUS", "status", "Submission status is invalid.");
    if (input.status === "SUBMITTED" && !input.output)
      push(violations, "MISSING_RATING_OUTPUT", "output", "A submitted rating requires an output.");
    if (input.status !== "SUBMITTED" && input.output)
      push(
        violations,
        "INVALID_SUBMISSION_OUTPUT",
        "output",
        "Abstained, incomplete, invalid, and failed submissions cannot carry a judgment."
      );
    if (input.status === "ABSTAINED") {
      if (!input.abstention || !EVALUATOR_ABSTENTION_REASONS.includes(input.abstention.reason))
        push(violations, "INVALID_ABSTENTION", "abstention", "Abstention requires an S-04 reason.");
    } else if (input.abstention)
      push(
        violations,
        "UNEXPECTED_ABSTENTION",
        "abstention",
        "Only an abstained submission may carry abstention metadata."
      );
    if (study && input.output) {
      if (input.output.kind !== study.output.kind)
        push(
          violations,
          "RATING_SCALE_MISMATCH",
          "output.kind",
          "Rating output must match the study output contract."
        );
      if (
        study.output.kind === "CATEGORICAL" &&
        input.output.kind === "CATEGORICAL" &&
        !study.output.allowedValues.includes(input.output.category)
      )
        push(
          violations,
          "INVALID_RATING_SCALE",
          "output.category",
          "Category is not declared by the study."
        );
      if (study.output.kind === "ORDINAL" && input.output.kind === "ORDINAL") {
        const position = study.output.orderedValues.indexOf(input.output.category);
        if (position < 0 || position !== input.output.ordinalPosition)
          push(
            violations,
            "INVALID_ORDINAL_RATING",
            "output",
            "Ordinal category and position must match the declared order."
          );
      }
      if (study.output.kind === "NUMERIC" && input.output.kind === "NUMERIC") {
        if (
          metricIdentityKey(study.output.metricIdentity) !==
          metricIdentityKey(input.output.metricResult.metricIdentity)
        )
          push(
            violations,
            "METRIC_SUBSTITUTION",
            "output.metricResult.metricIdentity",
            "Numeric rating must use the exact study metric."
          );
        for (const issue of this.metricRegistry.validateResult(input.output.metricResult)
          .violations)
          push(violations, `S03_${issue.code}`, `output.metricResult.${issue.path}`, issue.message);
      }
    }
    if (!input.ratingId || input.evidenceReferences.length === 0 || !input.provenanceReference)
      push(
        violations,
        "INCOMPLETE_RATING_PROVENANCE",
        "rating",
        "Rating identity, evidence, and provenance are required."
      );
    scanCanonicalRecord(input, "rating", violations);
    if (violations.length > 0 || !study || !rater)
      throw new HumanRaterRecordValidationError(violations);
    const material = {
      ratingId: input.ratingId,
      assignmentId: input.assignment.assignmentId,
      presentationId: input.presentation.presentationId,
      presentationDigest: input.presentation.presentationDigest,
      studyIdentity: study.identity,
      raterId: rater.identity.raterId,
      raterStatusAtSubmission: rater.status,
      rubricIdentity: study.rubricIdentity,
      target: input.assignment.target,
      status: input.status,
      ...(input.output ? { output: input.output } : {}),
      ...(input.abstention ? { abstention: input.abstention } : {}),
      evidenceReferences: [...input.evidenceReferences].sort(),
      provenanceReference: input.provenanceReference,
      scientificAuthority: "NONE" as const,
      groundTruthClaim: "NONE" as const,
      benchmarkMaturityEffect: "NONE" as const,
      metricValidityEffect: "NONE" as const
    };
    const rating: HumanRating = {
      ...material,
      ratingDigest: computeSha256(canonicalJson(material)),
      submittedAt: input.submittedAt
    };
    const state =
      input.status === "ABSTAINED"
        ? "ABSTAINED"
        : input.status === "SUBMITTED"
          ? "SUBMITTED"
          : input.assignment.state;
    return { rating, assignment: { ...input.assignment, state } };
  }

  toEvaluatorExecution(rating: HumanRating): HumanJudgeExecutionResult {
    const study = this.getStudy(rating.studyIdentity);
    if (!study)
      throw new HumanRaterRecordValidationError([
        {
          code: "UNKNOWN_STUDY",
          path: "studyIdentity",
          message: "Rating references an unknown study."
        }
      ]);
    if (
      rating.status === "INCOMPLETE" ||
      rating.status === "INVALID" ||
      rating.status === "SYSTEM_FAILURE"
    )
      throw new HumanRaterRecordValidationError([
        {
          code: "NON_JUDGMENT_SUBMISSION",
          path: "status",
          message:
            "Incomplete, invalid, and system-failure submissions cannot become evaluator judgments."
        }
      ]);
    const configuration = this.evaluatorRegistry.createConfiguration({
      evaluatorIdentity: HUMAN_EVALUATOR_IDENTITY,
      parameters: {
        presentationMode: study.presentationMode,
        blindingPolicy: study.blindingPolicy,
        ratingScale: study.output.kind,
        comparisonPolicy: study.comparisonPolicy
      },
      rubricIdentity: study.rubricIdentity,
      contextReferences: [`human-rating-study:${studyKey(study.identity)}`],
      normalizationReferences: []
    });
    const evidenceReferences = [
      ...new Set([
        ...rating.evidenceReferences,
        `rater:${rating.raterId}`,
        `assignment:${rating.assignmentId}`,
        `presentation:${rating.presentationId}`,
        `rating:${rating.ratingId}`,
        `rubric:${rubricKey(rating.rubricIdentity)}`
      ])
    ].sort();
    const base = {
      executionId: `human-rating:${rating.ratingId}`,
      evaluatorIdentity: HUMAN_EVALUATOR_IDENTITY,
      configurationDigest: configuration.configurationDigest,
      runId: rating.assignmentId,
      subject: { subjectId: rating.target.subjectId, subjectKind: rating.target.subjectKind },
      evaluationTarget: rating.target.evaluationTarget,
      inputKind: rating.target.inputKind,
      inputReferences: [...rating.target.inputReferences].sort(),
      ...(rating.target.benchmarkBinding
        ? { benchmarkBinding: rating.target.benchmarkBinding }
        : {}),
      evidenceReferences,
      provenanceReference: `human-rating:${rating.ratingId};rater:${rating.raterId}`,
      executedAt: rating.submittedAt
    };
    const execution =
      rating.status === "ABSTAINED"
        ? {
            ...base,
            status: "ABSTAINED" as const,
            abstention: {
              reason: rating.abstention!.reason,
              ...(rating.abstention?.detail ? { detail: rating.abstention.detail } : {}),
              evidenceReferences
            }
          }
        : rating.output?.kind === "NUMERIC"
          ? {
              ...base,
              metricIdentity: rating.output.metricResult.metricIdentity,
              status: "SUCCEEDED" as const,
              output: { kind: "METRIC_RESULT" as const, metricResult: rating.output.metricResult }
            }
          : rating.output?.kind === "STRUCTURED_JUDGMENT"
            ? {
                ...base,
                status: "SUCCEEDED" as const,
                output: {
                  kind: "STRUCTURED_JUDGMENT" as const,
                  judgment: rating.output.judgment,
                  ...(rating.output.rationale ? { rationale: rating.output.rationale } : {}),
                  evidenceReferences
                }
              }
            : {
                ...base,
                status: "SUCCEEDED" as const,
                output: {
                  kind: "CATEGORICAL_DECISION" as const,
                  category: rating.output!.category,
                  ...(rating.output!.rationale ? { rationale: rating.output!.rationale } : {}),
                  evidenceReferences
                }
              };
    return {
      configuration,
      execution: this.evaluatorRegistry.recordExecution(execution, configuration)
    };
  }

  createHumanRaterSet(ratings: readonly HumanRating[]): {
    readonly target: ReliabilityStudyTarget;
    readonly raterReferences: readonly string[];
  } {
    if (ratings.length === 0)
      throw new HumanRaterRecordValidationError([
        {
          code: "EMPTY_RATER_SET",
          path: "ratings",
          message: "A human-rater set requires at least one rating."
        }
      ]);
    const conditionKeys = ratings.map((rating) =>
      canonicalJson({
        studyIdentity: rating.studyIdentity,
        rubricIdentity: rating.rubricIdentity,
        target: {
          ...rating.target,
          inputReferences: [...rating.target.inputReferences].sort()
        }
      })
    );
    if (new Set(conditionKeys).size !== 1)
      throw new HumanRaterRecordValidationError([
        {
          code: "MIXED_HUMAN_RATER_SET_CONDITION",
          path: "ratings",
          message: "A human-rater set must retain one study, rubric, target, and input condition."
        }
      ]);
    if (ratings.some((rating) => !["SUBMITTED", "ABSTAINED"].includes(rating.status)))
      throw new HumanRaterRecordValidationError([
        {
          code: "INELIGIBLE_HUMAN_RATER_SET_RECORD",
          path: "ratings",
          message: "Only submitted judgments and explicit abstentions may enter a human-rater set."
        }
      ]);
    const raterReferences = [...new Set(ratings.map((rating) => `rater:${rating.raterId}`))].sort();
    return {
      target: {
        kind: "HUMAN_RATER_SET",
        evaluator: HUMAN_EVALUATOR_IDENTITY,
        raterSetId: computeSha256(
          canonicalJson({ studyIdentity: ratings[0]!.studyIdentity, raterReferences })
        )
      },
      raterReferences
    };
  }
}

export { HUMAN_EVALUATOR_IDENTITY };
