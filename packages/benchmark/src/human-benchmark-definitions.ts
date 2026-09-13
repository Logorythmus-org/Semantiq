import type {
  HistoricalHibItemAudit,
  HumanBenchmarkConstruct,
  HumanBenchmarkItem,
  HumanBenchmarkStudyProtocol
} from "./human-benchmark-types.js";

export const HIB_RESEARCH_CANDIDATE_IDENTITY = {
  benchmarkId: "hib_research_candidate",
  benchmarkVersion: "0.1.0"
} as const;

const evidence = [
  "Docs/SemantIQ-Benchmarks.pdf#pages=198-203",
  "Docs/research/core/S07_HIB_HUMAN_BENCHMARK_RECONSTRUCTION.md"
] as const;

export const HUMAN_BENCHMARK_CONSTRUCTS: readonly HumanBenchmarkConstruct[] = [
  {
    constructId: "meaning_context_behavior",
    constructVersion: "0.1.0",
    versionScope: "HUMAN_BENCHMARK_CONSTRUCT",
    name: "Meaning and context behavior",
    definition:
      "Observable preservation and disambiguation of stated meaning under a supplied context.",
    inclusions: ["Reference resolution", "Explicit context qualification"],
    exclusions: ["General intelligence", "Stable personal ability"],
    observableIndicators: ["Chooses the context-supported referent", "Names relevant context"],
    alternativeExplanations: ["Language familiarity", "Prior topic knowledge", "Reading attention"],
    humanSuitability: "SUITABLE_WITH_ADAPTATION",
    aiSuitability: "UNASSESSED",
    measurementStatus: "SYNTHETIC_OPERATIONALIZATION",
    evidenceReferences: evidence,
    provenanceReferences: ["historical-family:HIB-001-HIB-015", "S07:construct-reconstruction"],
    limitations: ["One response does not establish a stable human trait."]
  },
  {
    constructId: "bias_mechanism_reasoning",
    constructVersion: "0.1.0",
    versionScope: "HUMAN_BENCHMARK_CONSTRUCT",
    name: "Bias-mechanism reasoning",
    definition:
      "Observable identification of reasoning mechanisms that can distort a supplied inference.",
    inclusions: ["Alternative hypotheses", "Correlation-causation distinction"],
    exclusions: ["Political neutrality", "Freedom from bias"],
    observableIndicators: ["States a competing explanation", "Separates evidence from conclusion"],
    alternativeExplanations: ["Domain knowledge", "Prompt familiarity", "Social desirability"],
    humanSuitability: "SUITABLE_WITH_ADAPTATION",
    aiSuitability: "UNASSESSED",
    measurementStatus: "INTENDED_ONLY",
    evidenceReferences: evidence,
    provenanceReferences: ["historical-family:HIB-016-HIB-035", "S07:construct-reconstruction"],
    limitations: ["The historical family has no validated bias-resistance measure."]
  },
  {
    constructId: "uncertainty_evidence_boundary",
    constructVersion: "0.1.0",
    versionScope: "HUMAN_BENCHMARK_CONSTRUCT",
    name: "Uncertainty and evidence boundary",
    definition:
      "Observable separation of supported statements, uncertainty, and missing evidence in one response.",
    inclusions: ["Evidence labeling", "Calibrated abstention"],
    exclusions: ["Truthfulness as a personal trait", "Clinical assessment"],
    observableIndicators: ["Marks unsupported claims", "Requests evidence needed for resolution"],
    alternativeExplanations: ["Instruction following", "Topic familiarity", "Response style"],
    humanSuitability: "SUITABLE_WITH_ADAPTATION",
    aiSuitability: "UNASSESSED",
    measurementStatus: "SYNTHETIC_OPERATIONALIZATION",
    evidenceReferences: evidence,
    provenanceReferences: ["historical-family:HIB-036-HIB-050", "S07:construct-reconstruction"],
    limitations: ["A rubric and calibrated human-rating study remain required."]
  },
  {
    constructId: "response_revision_behavior",
    constructVersion: "0.1.0",
    versionScope: "HUMAN_BENCHMARK_CONSTRUCT",
    name: "Response revision behavior",
    definition:
      "Observable revision of a response after a specified error or missing constraint is disclosed.",
    inclusions: ["Correction", "Change rationale"],
    exclusions: ["Introspection accuracy", "Personality inference"],
    observableIndicators: ["Changes the affected claim", "Explains the change"],
    alternativeExplanations: ["Writing skill", "Compliance with instructions", "Memory"],
    humanSuitability: "SUITABLE_WITH_ADAPTATION",
    aiSuitability: "UNASSESSED",
    measurementStatus: "SYNTHETIC_OPERATIONALIZATION",
    evidenceReferences: evidence,
    provenanceReferences: ["historical-family:HIB-051-HIB-060", "S07:construct-reconstruction"],
    limitations: [
      "Revision behavior is context-specific and is not direct access to thought process."
    ]
  },
  {
    constructId: "long_form_constraint_retention",
    constructVersion: "0.1.0",
    versionScope: "HUMAN_BENCHMARK_CONSTRUCT",
    name: "Long-form constraint retention",
    definition:
      "Observable retention of explicit semantic constraints across an extended response.",
    inclusions: ["Constraint retention", "Cross-paragraph consistency"],
    exclusions: ["Endurance", "General writing quality"],
    observableIndicators: ["Retains defined terms", "Avoids contradictions across sections"],
    alternativeExplanations: ["Writing experience", "Working memory", "Time available"],
    humanSuitability: "SUITABLE_WITH_ADAPTATION",
    aiSuitability: "UNASSESSED",
    measurementStatus: "INTENDED_ONLY",
    evidenceReferences: evidence,
    provenanceReferences: ["historical-family:HIB-061-HIB-070", "S07:construct-reconstruction"],
    limitations: ["Length alone is not evidence of coherence or semantic stability."]
  }
] as const;

export const HUMAN_BENCHMARK_ITEMS: readonly HumanBenchmarkItem[] = [
  {
    itemId: "hib_context_reference_resolution",
    itemVersion: "0.1.0",
    versionScope: "HUMAN_BENCHMARK_ITEM",
    benchmarkIdentity: HIB_RESEARCH_CANDIDATE_IDENTITY,
    constructId: "meaning_context_behavior",
    prompt:
      "Mira placed the blue folder beside the red folder. She then moved the folder beside the window. Which folder did she move? A: blue; B: red; C: the text does not determine this.",
    instructions: ["Select exactly one option using A, B, or C.", "Use only the supplied text."],
    responseMode: "SINGLE_CHOICE",
    scoringMode: "OBJECTIVE_RULE",
    scoringProtocolReference: "rule:exact-normalized-option-c",
    correctResponse: "C",
    language: "en",
    toolPolicy: "NO_EXTERNAL_TOOLS",
    dependencies: [],
    stimulusReferences: ["synthetic-stimulus:hib-context-reference-resolution"],
    humanSuitability: "SUITABLE",
    provenanceReferences: ["S07:synthetic-reconstruction:meaning-context"],
    rightsClass: "FIRST_PARTY_OR_PROJECT",
    scientificStatus: "SYNTHETIC_RESEARCH_CANDIDATE",
    adaptation: { status: "ORIGINAL" },
    limitations: ["The rule checks one response only and emits no numeric metric."]
  },
  {
    itemId: "hib_uncertainty_evidence_boundary",
    itemVersion: "0.1.0",
    versionScope: "HUMAN_BENCHMARK_ITEM",
    benchmarkIdentity: HIB_RESEARCH_CANDIDATE_IDENTITY,
    constructId: "uncertainty_evidence_boundary",
    prompt:
      "A report says a town's tree cover rose after a cooling program began, but supplies no temperatures or comparison towns. State what is supported, what remains uncertain, and what evidence would help.",
    instructions: [
      "Use the headings Supported, Uncertain, and Needed evidence.",
      "Do not add facts."
    ],
    responseMode: "SHORT_TEXT",
    scoringMode: "HUMAN_JUDGE",
    scoringProtocolReference: "s06-study-required:hib-uncertainty-evidence-boundary",
    language: "en",
    toolPolicy: "NO_EXTERNAL_TOOLS",
    dependencies: [],
    stimulusReferences: ["synthetic-stimulus:hib-uncertainty-evidence-boundary"],
    humanSuitability: "SUITABLE",
    provenanceReferences: ["S07:synthetic-reconstruction:uncertainty-boundary"],
    rightsClass: "FIRST_PARTY_OR_PROJECT",
    scientificStatus: "SYNTHETIC_RESEARCH_CANDIDATE",
    adaptation: { status: "ORIGINAL" },
    limitations: ["No canonical rubric, calibration, or validity evidence is supplied."]
  },
  {
    itemId: "hib_response_revision",
    itemVersion: "0.1.0",
    versionScope: "HUMAN_BENCHMARK_ITEM",
    benchmarkIdentity: HIB_RESEARCH_CANDIDATE_IDENTITY,
    constructId: "response_revision_behavior",
    prompt:
      "Initial claim: The library is closed because its lights are off. New information: the library uses daylight and opens at noon. Revise the claim and name the exact reason for the revision.",
    instructions: [
      "Return a revised claim and a change rationale.",
      "Do not infer the current time."
    ],
    responseMode: "STRUCTURED_REVISION",
    scoringMode: "HUMAN_JUDGE",
    scoringProtocolReference: "s06-study-required:hib-response-revision",
    language: "en",
    toolPolicy: "NO_EXTERNAL_TOOLS",
    dependencies: [],
    stimulusReferences: ["synthetic-stimulus:hib-response-revision"],
    humanSuitability: "SUITABLE",
    provenanceReferences: ["S07:synthetic-reconstruction:response-revision"],
    rightsClass: "FIRST_PARTY_OR_PROJECT",
    scientificStatus: "SYNTHETIC_RESEARCH_CANDIDATE",
    adaptation: { status: "ORIGINAL" },
    limitations: ["The item does not reveal an internal thought process."]
  },
  {
    itemId: "hib_long_form_constraint_retention",
    itemVersion: "0.1.0",
    versionScope: "HUMAN_BENCHMARK_ITEM",
    benchmarkIdentity: HIB_RESEARCH_CANDIDATE_IDENTITY,
    constructId: "long_form_constraint_retention",
    prompt:
      "Write two paragraphs about a shared garden. Throughout, 'member' means a person assigned one plot, and 'visitor' means a person without a plot. The second paragraph must explain one rule using both terms.",
    instructions: ["Preserve both supplied definitions.", "Write exactly two paragraphs."],
    responseMode: "LONG_TEXT",
    scoringMode: "HUMAN_JUDGE",
    scoringProtocolReference: "s06-study-required:hib-long-form-constraint-retention",
    language: "en",
    toolPolicy: "NO_EXTERNAL_TOOLS",
    dependencies: [],
    stimulusReferences: ["synthetic-stimulus:hib-long-form-constraint-retention"],
    humanSuitability: "SUITABLE",
    provenanceReferences: ["S07:synthetic-reconstruction:long-form"],
    rightsClass: "FIRST_PARTY_OR_PROJECT",
    scientificStatus: "SYNTHETIC_RESEARCH_CANDIDATE",
    adaptation: { status: "ORIGINAL" },
    limitations: ["A two-paragraph response is only a narrow constraint-retention sample."]
  }
] as const;

export const HIB_PILOT_STUDY_PROTOCOL: HumanBenchmarkStudyProtocol = {
  humanBenchmarkStudyId: "hib_research_candidate_pilot",
  humanBenchmarkStudyVersion: "0.1.0",
  versionScope: "HUMAN_BENCHMARK_STUDY",
  role: "HUMAN_AS_SUBJECT",
  benchmarkIdentity: HIB_RESEARCH_CANDIDATE_IDENTITY,
  itemIdentities: HUMAN_BENCHMARK_ITEMS.map(({ itemId, itemVersion }) => ({ itemId, itemVersion })),
  instructions: ["Respond to each presented item independently.", "Use no external tools."],
  presentationPolicy: { method: "SEEDED_FISHER_YATES", seedRequired: true },
  timePolicy: "RECORDED_NOT_SCORED",
  toolPolicy: "NO_EXTERNAL_TOOLS",
  language: "en",
  environmentReferences: ["environment-profile:hib-pilot-to-be-recorded"],
  participationPolicyReference: "participation-policy:hib-pilot-required-before-use",
  acknowledgementReference: "acknowledgement:hib-pilot-required-before-use",
  provenanceReferences: ["Docs/research/core/S07_HIB_HUMAN_BENCHMARK_RECONSTRUCTION.md"],
  scientificAuthority: "NONE",
  limitations: [
    "The protocol is an architecture fixture and must not be used for research before ethics, privacy, and study review.",
    "No norm, threshold, calibration, reliability, validity, or human-AI comparability claim is established."
  ]
};

const historicalSummaries = [
  "Define a supplied term",
  "Paraphrase a definition",
  "Contrast contextual meanings",
  "Maintain terms across two paragraphs",
  "Separate certainty from uncertainty",
  "Explain at everyday, technical, and meta levels",
  "Distinguish confusable terms",
  "Describe semantic drift",
  "Define a term and show misuse",
  "Explain conceptually without examples",
  "Explain through an example only",
  "Write a focused ten-sentence explanation",
  "Summarize the intended core idea",
  "Describe context-driven misunderstanding",
  "Describe a strategy for term stability",
  "Balance arguments for and against a view",
  "Avoid binary framing",
  "Explain a common reasoning error",
  "Inspect a statement for circularity",
  "Generate four perspectives",
  "Distinguish correlation from causation",
  "Explain why anecdote is not proof",
  "Analyze statistical misinterpretation",
  "State a neutral forecast",
  "Explain avoidance of framing effects",
  "Compare groups without generalization",
  "Evaluate a decision independently of its author",
  "Evaluate a popular view without popularity weighting",
  "Describe a minority view neutrally",
  "Reject popularity as proof",
  "Describe a past personal error",
  "Describe a personal misinterpretation",
  "Avoid hindsight framing",
  "Check arguments for selective perception",
  "Recognize premature judgment",
  "Separate known and unknown claims",
  "Name an unanswerable question",
  "Construct a plausible false explanation",
  "Mark hypothetical content",
  "Give verifiable facts and open questions",
  "Avoid attractive unsupported explanations",
  "Describe fiction-reality confusion",
  "Give alternatives in a causal chain",
  "Use uncertainty markers",
  "Identify personal overinterpretation",
  "Label fiction in a short story",
  "Recall a formerly held false belief",
  "Identify error-prone personal explanations",
  "Critique a supplied explanation",
  "Distinguish plausibility from truth",
  "Describe answer construction",
  "Name a weakness in personal argument",
  "Explain how an answer error could be detected",
  "Write and revise an answer",
  "State evidence needed for confidence",
  "Explain a past personal error",
  "Self-rate answer quality",
  "Mark a revisable passage",
  "Explain personal premature judgment",
  "Describe a three-step thought process",
  "Maintain terms across ten sentences",
  "Build a second paragraph on the first",
  "Return from a deliberate digression",
  "Maintain focus across twelve sentences",
  "Define and preserve three terms",
  "Self-assess semantic stability",
  "Explain a complex idea without meaning loss",
  "Keep a story's meaning constant",
  "Mark unstable passages retrospectively",
  "Describe detection of topic drift"
] as const;

const retained = new Set([3, 7, 14, 19, 21, 22, 23, 25, 30, 40, 42, 43, 50, 54, 62]);
const merged = new Map<number, readonly number[]>([
  [2, [1]],
  [10, [11]],
  [12, [61, 64]],
  [31, [47, 56]],
  [44, [36, 39]],
  [49, [48]],
  [65, [1, 4]],
  [67, [61, 64]]
]);
const rejected = new Set([32, 45, 52, 57, 59, 60, 66]);

function historicalFamily(number: number): {
  family: string;
  page: number;
  mode: HumanBenchmarkItem["responseMode"];
} {
  if (number <= 15)
    return {
      family: "Meaning and context",
      page: number <= 14 ? 199 : 200,
      mode: number === 4 || number === 12 ? "LONG_TEXT" : "SHORT_TEXT"
    };
  if (number <= 35)
    return { family: "Bias resistance", page: number <= 30 ? 200 : 201, mode: "SHORT_TEXT" };
  if (number <= 50)
    return {
      family: "Knowledge illusion and fiction tendency",
      page: number <= 47 ? 201 : 202,
      mode: "SHORT_TEXT"
    };
  if (number <= 60)
    return {
      family: "Reflection",
      page: 202,
      mode: number === 54 ? "STRUCTURED_REVISION" : "SHORT_TEXT"
    };
  return { family: "Consistency and long form", page: 203, mode: "LONG_TEXT" };
}

export const HISTORICAL_HIB_ITEM_AUDIT: readonly HistoricalHibItemAudit[] = historicalSummaries.map(
  (summary, index) => {
    const number = index + 1;
    const metadata = historicalFamily(number);
    const disposition = rejected.has(number)
      ? "HISTORICAL_REJECT"
      : merged.has(number)
        ? "HISTORICAL_MERGE_CANDIDATE"
        : retained.has(number)
          ? "HISTORICAL_RETAIN"
          : "HISTORICAL_REVISE";
    const humanSuitability =
      disposition === "HISTORICAL_REJECT"
        ? "NOT_SUITABLE"
        : disposition === "HISTORICAL_RETAIN"
          ? "SUITABLE_WITH_ADAPTATION"
          : "RESEARCH_REVIEW_REQUIRED";
    const candidateByHistoricalId: Readonly<Record<number, string>> = {
      3: "hib_context_reference_resolution",
      40: "hib_uncertainty_evidence_boundary",
      54: "hib_response_revision",
      62: "hib_long_form_constraint_retention"
    };
    return {
      historicalItemId: `HIB-${String(number).padStart(3, "0")}`,
      historicalVersionLabel: "HIB 1.0 (historical)",
      canonicalCandidateId: candidateByHistoricalId[number] ?? null,
      sourceReference: "Docs/SemantIQ-Benchmarks.pdf",
      sourcePage: metadata.page,
      family: metadata.family,
      summary,
      humanSuitability,
      responseMode: metadata.mode,
      scoringMode: "UNSUPPORTED",
      metricAvailability: "NONE",
      evaluatorRequirement: "S06_HUMAN_JUDGE_STUDY_REQUIRED",
      groundTruthRequirement: "RUBRIC_REQUIRED",
      confounds: ["Language proficiency", "Topic familiarity", "Instruction interpretation"],
      scientificStatus: "HISTORICAL_UNVALIDATED",
      disposition,
      rationale:
        disposition === "HISTORICAL_REJECT"
          ? "Personal-history or self-assessment demand is privacy-sensitive, confounded, or not directly observable."
          : disposition === "HISTORICAL_MERGE_CANDIDATE"
            ? "Substantially overlaps another historical task and needs construct review before consolidation."
            : disposition === "HISTORICAL_RETAIN"
              ? "Contains an observable task behavior but needs a concrete stimulus and scoring protocol."
              : "The intended behavior may be useful, but placeholders and underspecified scoring require redesign.",
      relatedHistoricalItemIds: (merged.get(number) ?? []).map(
        (related) => `HIB-${String(related).padStart(3, "0")}`
      )
    };
  }
);
