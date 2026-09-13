import { canonicalJson, computeSha256 } from "../../sandbox-contracts/src/index.js";
import { seededCanonicalOrder } from "./deterministic-randomization.js";
import type {
  HistoricalHibItemAudit,
  HumanBenchmarkConstruct,
  HumanBenchmarkItem,
  HumanBenchmarkPresentation,
  HumanBenchmarkSession,
  HumanBenchmarkStudyProtocol,
  HumanBenchmarkValidationViolation,
  HumanJudgeTargetResult,
  HumanSubjectIdentity,
  HumanSubjectResponse,
  HumanSubjectResponseStatus,
  ObjectiveItemJudgment
} from "./human-benchmark-types.js";
import type { BenchmarkRegistry } from "./registry.js";
import { HIB_OBJECTIVE_RULE_EVALUATOR_IDENTITY } from "./evaluator-definitions.js";
import type { EvaluatorRegistry } from "./evaluators.js";

const PRIVATE_PATH = /(?:[A-Za-z]:\\Users\\|\/Users\/|\/home\/)[^\s]+/;
const SECRET =
  /(?:BEGIN (?:RSA |OPENSSH )?PRIVATE KEY|\bghp_[A-Za-z0-9]{20,}\b|\bAKIA[0-9A-Z]{16}\b)/;
const FORBIDDEN_KEY =
  /^(?:realName|fullName|email|phone|address|ipAddress|governmentId|username|userAccount|authIdentity|raterId|medical(?:Data)?|diagnosis|politicalAffiliation|religion|ethnicity|sexuality|biometric(?:s)?|demographic(?:s)?|password|secret|token|credential|apiKey|privateKey)$/i;

function push(
  violations: HumanBenchmarkValidationViolation[],
  code: string,
  path: string,
  message: string
): void {
  violations.push({ code, path, message });
}

function scan(value: unknown, path: string, violations: HumanBenchmarkValidationViolation[]): void {
  if (typeof value === "string") {
    if (PRIVATE_PATH.test(value))
      push(
        violations,
        "PRIVATE_PATH_FORBIDDEN",
        path,
        "Stable records cannot contain private local paths."
      );
    if (SECRET.test(value))
      push(
        violations,
        "CREDENTIAL_FORBIDDEN",
        path,
        "Stable records cannot contain credentials or private keys."
      );
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => scan(entry, `${path}[${index}]`, violations));
    return;
  }
  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, entry]) => {
      if (FORBIDDEN_KEY.test(key))
        push(
          violations,
          "DIRECT_IDENTITY_FORBIDDEN",
          `${path}.${key}`,
          "Human-subject records permit pseudonymous subjectId only."
        );
      scan(entry, `${path}.${key}`, violations);
    });
  }
}

function itemKey(item: { itemId: string; itemVersion: string }): string {
  return `${item.itemId}@${item.itemVersion}`;
}

function sessionMaterial(session: HumanBenchmarkSession) {
  return {
    sessionId: session.sessionId,
    subject: session.subject,
    studyIdentity: session.studyIdentity,
    studyDefinitionDigest: session.studyDefinitionDigest,
    itemOrder: session.itemOrder,
    randomization: session.randomization
  };
}

function presentationMaterial(presentation: HumanBenchmarkPresentation) {
  return {
    presentationId: presentation.presentationId,
    sessionId: presentation.sessionId,
    subjectId: presentation.subjectId,
    itemIdentity: presentation.itemIdentity,
    prompt: presentation.prompt,
    instructions: presentation.instructions,
    responseMode: presentation.responseMode,
    language: presentation.language,
    toolPolicy: presentation.toolPolicy,
    stimulusReferences: presentation.stimulusReferences,
    transformations: presentation.transformations
  };
}

function responseMaterial(response: HumanSubjectResponse) {
  return {
    responseId: response.responseId,
    presentationDigest: response.presentationDigest,
    sessionId: response.sessionId,
    subject: response.subject,
    benchmarkIdentity: response.benchmarkIdentity,
    itemIdentity: response.itemIdentity,
    status: response.status,
    ...(response.response === undefined ? {} : { response: response.response }),
    ...(response.reason === undefined ? {} : { reason: response.reason }),
    provenanceReference: response.provenanceReference,
    scientificAuthority: response.scientificAuthority,
    groundTruthClaim: response.groundTruthClaim
  };
}

export function validateHumanBenchmarkDefinitions(
  constructs: readonly HumanBenchmarkConstruct[],
  items: readonly HumanBenchmarkItem[],
  protocol: HumanBenchmarkStudyProtocol,
  audit: readonly HistoricalHibItemAudit[],
  benchmarkRegistry: BenchmarkRegistry
): readonly HumanBenchmarkValidationViolation[] {
  const violations: HumanBenchmarkValidationViolation[] = [];
  const constructIds = constructs.map((entry) => entry.constructId);
  const itemIds = items.map(itemKey);
  if (new Set(constructIds).size !== constructIds.length)
    push(violations, "DUPLICATE_CONSTRUCT", "constructs", "Construct identities must be unique.");
  if (new Set(itemIds).size !== itemIds.length)
    push(violations, "DUPLICATE_ITEM", "items", "Item identities must be unique.");
  if (!benchmarkRegistry.get(protocol.benchmarkIdentity))
    push(
      violations,
      "UNKNOWN_BENCHMARK",
      "protocol.benchmarkIdentity",
      "Protocol benchmark must exist in S02."
    );
  if (protocol.role !== "HUMAN_AS_SUBJECT")
    push(
      violations,
      "HUMAN_ROLE_SUBSTITUTION",
      "protocol.role",
      "A Human Benchmark Study must retain Human-as-Subject role."
    );
  const protocolIds = protocol.itemIdentities.map(itemKey);
  if (canonicalJson([...protocolIds].sort()) !== canonicalJson([...itemIds].sort()))
    push(
      violations,
      "ITEM_SET_MISMATCH",
      "protocol.itemIdentities",
      "Protocol must bind the exact candidate item set."
    );
  items.forEach((item, index) => {
    if (!constructIds.includes(item.constructId))
      push(
        violations,
        "UNKNOWN_CONSTRUCT",
        `items[${index}].constructId`,
        "Item construct must exist in the S07 construct registry."
      );
    if (
      item.benchmarkIdentity.benchmarkId !== protocol.benchmarkIdentity.benchmarkId ||
      item.benchmarkIdentity.benchmarkVersion !== protocol.benchmarkIdentity.benchmarkVersion
    )
      push(
        violations,
        "BENCHMARK_SUBSTITUTION",
        `items[${index}].benchmarkIdentity`,
        "Item and protocol must bind the exact same benchmark version."
      );
    if (
      item.scoringMode === "OBJECTIVE_RULE" &&
      (!item.correctResponse || !item.scoringProtocolReference.startsWith("rule:"))
    )
      push(
        violations,
        "OBJECTIVE_RULE_INCOMPLETE",
        `items[${index}]`,
        "Objective items require an exact response and rule reference."
      );
    if (
      item.scoringMode === "HUMAN_JUDGE" &&
      !item.scoringProtocolReference.startsWith("s06-study-required:")
    )
      push(
        violations,
        "S06_BINDING_REQUIRED",
        `items[${index}].scoringProtocolReference`,
        "Human-judged items must declare the required S06 study binding."
      );
    if (!/^[a-z]{2}(?:-[A-Z]{2})?$/.test(item.language))
      push(
        violations,
        "INVALID_ITEM_LANGUAGE",
        `items[${index}].language`,
        "Item language must use a bounded language tag."
      );
    if (!["NO_EXTERNAL_TOOLS", "STUDY_DECLARED"].includes(item.toolPolicy))
      push(
        violations,
        "INVALID_TOOL_POLICY",
        `items[${index}].toolPolicy`,
        "Item tool policy must use the bounded vocabulary."
      );
    if (item.provenanceReferences.length === 0)
      push(
        violations,
        "MISSING_ITEM_PROVENANCE",
        `items[${index}].provenanceReferences`,
        "Item provenance is required."
      );
    if (
      item.adaptation.status === "TRANSLATED_OR_ADAPTED" &&
      (!item.adaptation.sourceItemId ||
        !item.adaptation.sourceLanguage ||
        !item.adaptation.provenanceReference)
    )
      push(
        violations,
        "UNTRACKED_TRANSLATION",
        `items[${index}].adaptation`,
        "Translated or adapted items require source identity, language, and provenance."
      );
    if (item.rightsClass === "UNKNOWN_RIGHTS" || item.rightsClass === "PROHIBITED")
      push(
        violations,
        "ITEM_RIGHTS_NOT_CLEARED",
        `items[${index}].rightsClass`,
        "Executable candidate items require cleared rights."
      );
  });
  if (audit.length !== 70)
    push(
      violations,
      "HISTORICAL_ITEM_COUNT",
      "audit",
      "Historical HIB audit must contain all 70 source items."
    );
  audit.forEach((entry, index) => {
    const expected = `HIB-${String(index + 1).padStart(3, "0")}`;
    if (entry.historicalItemId !== expected)
      push(violations, "HISTORICAL_SEQUENCE", `audit[${index}]`, `Expected ${expected}.`);
    if (entry.scientificStatus !== "HISTORICAL_UNVALIDATED" || entry.metricAvailability !== "NONE")
      push(
        violations,
        "HISTORICAL_CLAIM_INFLATION",
        `audit[${index}]`,
        "Historical items must remain unvalidated and unscored."
      );
  });
  scan({ constructs, items, protocol, audit }, "definitions", violations);
  return violations;
}

export class HumanBenchmarkRecordValidationError extends Error {
  constructor(readonly violations: readonly HumanBenchmarkValidationViolation[]) {
    super(violations.map((entry) => `${entry.code}: ${entry.message}`).join("\n"));
    this.name = "HumanBenchmarkRecordValidationError";
  }
}

export class HumanBenchmarkSystem {
  private readonly items = new Map<string, HumanBenchmarkItem>();

  constructor(
    readonly constructs: readonly HumanBenchmarkConstruct[],
    readonly itemDefinitions: readonly HumanBenchmarkItem[],
    readonly protocol: HumanBenchmarkStudyProtocol,
    readonly historicalAudit: readonly HistoricalHibItemAudit[],
    readonly benchmarkRegistry: BenchmarkRegistry
  ) {
    const violations = validateHumanBenchmarkDefinitions(
      constructs,
      itemDefinitions,
      protocol,
      historicalAudit,
      benchmarkRegistry
    );
    if (violations.length > 0) throw new HumanBenchmarkRecordValidationError(violations);
    itemDefinitions.forEach((item) => this.items.set(itemKey(item), item));
  }

  studyDigest(): string {
    return computeSha256(canonicalJson(this.protocol));
  }

  serialize(): string {
    return canonicalJson({
      constructs: this.constructs,
      items: this.itemDefinitions,
      protocol: this.protocol,
      historicalAudit: this.historicalAudit
    });
  }

  digest(): string {
    return computeSha256(this.serialize());
  }

  createSession(input: {
    sessionId: string;
    subject: HumanSubjectIdentity;
    startedAt: string;
    randomizationSeed?: number | undefined;
  }): HumanBenchmarkSession {
    const violations: HumanBenchmarkValidationViolation[] = [];
    scan(input, "session", violations);
    if (!input.sessionId || !input.subject.subjectId)
      push(
        violations,
        "MISSING_SESSION_IDENTITY",
        "session",
        "Session and pseudonymous subject identities are required."
      );
    if (
      this.protocol.presentationPolicy.method === "SEEDED_FISHER_YATES" &&
      !Number.isInteger(input.randomizationSeed)
    )
      push(
        violations,
        "RANDOMIZATION_SEED_REQUIRED",
        "session.randomizationSeed",
        "The protocol requires a recorded integer seed."
      );
    if (
      this.protocol.presentationPolicy.method === "FIXED" &&
      input.randomizationSeed !== undefined
    )
      push(
        violations,
        "UNDECLARED_RANDOMIZATION",
        "session.randomizationSeed",
        "A fixed protocol cannot carry a randomization seed."
      );
    if (violations.length > 0) throw new HumanBenchmarkRecordValidationError(violations);
    const sourceOrder = this.protocol.itemIdentities.map(itemKey);
    const itemOrder =
      this.protocol.presentationPolicy.method === "SEEDED_FISHER_YATES"
        ? seededCanonicalOrder(sourceOrder, input.randomizationSeed!)
        : sourceOrder;
    const material = {
      sessionId: input.sessionId,
      subject: input.subject,
      studyIdentity: {
        humanBenchmarkStudyId: this.protocol.humanBenchmarkStudyId,
        humanBenchmarkStudyVersion: this.protocol.humanBenchmarkStudyVersion
      },
      studyDefinitionDigest: this.studyDigest(),
      itemOrder,
      randomization: {
        method: this.protocol.presentationPolicy.method,
        ...(input.randomizationSeed === undefined ? {} : { seed: input.randomizationSeed }),
        canonicalInputOrder: sourceOrder,
        presentedOrder: itemOrder
      }
    };
    return {
      ...material,
      sessionDigest: computeSha256(canonicalJson(material)),
      startedAt: input.startedAt
    };
  }

  createPresentation(input: {
    presentationId: string;
    session: HumanBenchmarkSession;
    itemId: string;
    itemVersion: string;
    presentedAt: string;
  }): HumanBenchmarkPresentation {
    const violations: HumanBenchmarkValidationViolation[] = [];
    const item = this.items.get(itemKey(input));
    scan(input, "presentation", violations);
    if (
      input.session.sessionDigest !== computeSha256(canonicalJson(sessionMaterial(input.session)))
    )
      push(
        violations,
        "SESSION_SUBSTITUTION",
        "presentation.session",
        "Presentation must retain the exact recorded session material."
      );
    if (!item)
      push(
        violations,
        "UNKNOWN_ITEM",
        "presentation.itemIdentity",
        "Presentation references an unknown item version."
      );
    if (input.session.studyDefinitionDigest !== this.studyDigest())
      push(
        violations,
        "STUDY_SUBSTITUTION",
        "presentation.session",
        "Session must retain the exact study definition."
      );
    if (!input.session.itemOrder.includes(itemKey(input)))
      push(
        violations,
        "ITEM_NOT_ASSIGNED",
        "presentation.itemIdentity",
        "Item must occur in the recorded session order."
      );
    if (violations.length > 0 || !item) throw new HumanBenchmarkRecordValidationError(violations);
    const material = {
      presentationId: input.presentationId,
      sessionId: input.session.sessionId,
      subjectId: input.session.subject.subjectId,
      itemIdentity: { itemId: item.itemId, itemVersion: item.itemVersion },
      prompt: item.prompt,
      instructions: item.instructions,
      responseMode: item.responseMode,
      language: item.language,
      toolPolicy: item.toolPolicy,
      stimulusReferences: item.stimulusReferences,
      transformations: [] as readonly string[]
    };
    return {
      ...material,
      presentationDigest: computeSha256(canonicalJson(material)),
      presentedAt: input.presentedAt
    };
  }

  submitResponse(input: {
    responseId: string;
    session: HumanBenchmarkSession;
    presentation: HumanBenchmarkPresentation;
    status: HumanSubjectResponseStatus;
    response?: string | undefined;
    reason?: string | undefined;
    provenanceReference: string;
    submittedAt: string;
  }): HumanSubjectResponse {
    const violations: HumanBenchmarkValidationViolation[] = [];
    scan(input, "response", violations);
    if (
      input.presentation.presentationDigest !==
      computeSha256(canonicalJson(presentationMaterial(input.presentation)))
    )
      push(
        violations,
        "PRESENTATION_SUBSTITUTION",
        "response.presentation",
        "Response must bind the exact recorded presentation material."
      );
    if (
      input.presentation.sessionId !== input.session.sessionId ||
      input.presentation.subjectId !== input.session.subject.subjectId
    )
      push(
        violations,
        "SUBJECT_OR_SESSION_SUBSTITUTION",
        "response.presentation",
        "Response must retain the exact session and pseudonymous subject."
      );
    if (input.status === "SUBMITTED" && (!input.response || input.response.trim().length === 0))
      push(
        violations,
        "SUBMITTED_RESPONSE_REQUIRED",
        "response.response",
        "Submitted status requires response content."
      );
    if (input.status !== "SUBMITTED" && input.response !== undefined)
      push(
        violations,
        "NON_SUBMISSION_HAS_RESPONSE",
        "response.response",
        "Missing, skipped, abstained, invalid, and failed responses cannot carry response content."
      );
    if (
      ["SKIPPED", "ABSTAINED", "INCOMPLETE", "INVALID", "SYSTEM_FAILURE"].includes(input.status) &&
      !input.reason
    )
      push(
        violations,
        "NON_SUBMISSION_REASON_REQUIRED",
        "response.reason",
        "A non-submission status requires a reason."
      );
    if (violations.length > 0) throw new HumanBenchmarkRecordValidationError(violations);
    const material = {
      responseId: input.responseId,
      presentationDigest: input.presentation.presentationDigest,
      sessionId: input.session.sessionId,
      subject: input.session.subject,
      benchmarkIdentity: this.protocol.benchmarkIdentity,
      itemIdentity: input.presentation.itemIdentity,
      status: input.status,
      ...(input.response === undefined ? {} : { response: input.response }),
      ...(input.reason === undefined ? {} : { reason: input.reason }),
      provenanceReference: input.provenanceReference,
      scientificAuthority: "NONE" as const,
      groundTruthClaim: "NONE" as const
    };
    return {
      ...material,
      responseDigest: computeSha256(canonicalJson(material)),
      submittedAt: input.submittedAt
    };
  }

  scoreObjectiveResponse(
    response: HumanSubjectResponse,
    evaluatorRegistry: EvaluatorRegistry
  ): ObjectiveItemJudgment | undefined {
    if (response.responseDigest !== computeSha256(canonicalJson(responseMaterial(response))))
      throw new HumanBenchmarkRecordValidationError([
        {
          code: "RESPONSE_SUBSTITUTION",
          path: "response.responseDigest",
          message: "Objective scoring requires the exact recorded response material."
        }
      ]);
    if (response.status !== "SUBMITTED") return undefined;
    const item = this.items.get(itemKey(response.itemIdentity));
    if (!item || item.scoringMode !== "OBJECTIVE_RULE" || !item.correctResponse)
      throw new HumanBenchmarkRecordValidationError([
        {
          code: "OBJECTIVE_SCORING_NOT_DECLARED",
          path: "response.itemIdentity",
          message: "Only an item with a declared objective rule can be scored here."
        }
      ]);
    const category =
      response.response!.trim().toUpperCase() === item.correctResponse.toUpperCase()
        ? "CORRECT"
        : "INCORRECT";
    const configuration = evaluatorRegistry.createConfiguration({
      evaluatorIdentity: HIB_OBJECTIVE_RULE_EVALUATOR_IDENTITY,
      parameters: { ruleReference: item.scoringProtocolReference },
      contextReferences: [`human-benchmark-item:${item.itemId}@${item.itemVersion}`],
      normalizationReferences: [item.scoringProtocolReference]
    });
    const execution = evaluatorRegistry.recordExecution(
      {
        executionId: `hib-objective-evaluation:${response.responseId}`,
        evaluatorIdentity: HIB_OBJECTIVE_RULE_EVALUATOR_IDENTITY,
        configurationDigest: configuration.configurationDigest,
        runId: response.sessionId,
        subject: { subjectId: response.subject.subjectId, subjectKind: "HUMAN_SUBJECT" },
        evaluationTarget: item.constructId,
        inputKind: "HUMAN_SUBJECT_RESPONSE",
        inputReferences: [`human-subject-response:${response.responseDigest}`],
        benchmarkBinding: { benchmark: item.benchmarkIdentity, constructId: item.constructId },
        status: "SUCCEEDED",
        output: {
          kind: "CATEGORICAL_DECISION",
          category,
          evidenceReferences: [item.scoringProtocolReference]
        },
        evidenceReferences: [item.scoringProtocolReference],
        provenanceReference: response.provenanceReference,
        executedAt: response.submittedAt
      },
      configuration
    );
    return {
      kind: "CATEGORICAL_CORRECTNESS",
      category,
      ruleReference: item.scoringProtocolReference,
      numericScore: "NOT_EMITTED",
      scientificAuthority: "NONE",
      configuration,
      execution
    };
  }

  createHumanJudgeTarget(response: HumanSubjectResponse): HumanJudgeTargetResult {
    if (response.responseDigest !== computeSha256(canonicalJson(responseMaterial(response))))
      throw new HumanBenchmarkRecordValidationError([
        {
          code: "RESPONSE_SUBSTITUTION",
          path: "response.responseDigest",
          message: "Human-Judge handoff requires the exact recorded response material."
        }
      ]);
    const item = this.items.get(itemKey(response.itemIdentity));
    if (response.status !== "SUBMITTED" || !item || item.scoringMode !== "HUMAN_JUDGE")
      throw new HumanBenchmarkRecordValidationError([
        {
          code: "HUMAN_JUDGE_NOT_DECLARED",
          path: "response.itemIdentity",
          message: "Only a submitted Human-Judge item can enter the S06 workflow."
        }
      ]);
    return {
      target: {
        subjectId: response.responseId,
        subjectKind: "HUMAN_SUBJECT_RESPONSE",
        evaluationTarget: item.scoringProtocolReference,
        inputKind: item.responseMode,
        inputReferences: [`human-subject-response:${response.responseDigest}`],
        benchmarkBinding: {
          benchmark: item.benchmarkIdentity,
          constructId: item.constructId
        }
      },
      requiredSystem: "S06_HUMAN_RATER_SYSTEM",
      requiredEvaluatorMechanism: "HUMAN_JUDGE"
    };
  }
}
