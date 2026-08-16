import { LocalSprint1Runtime, type KnowledgeRecord, type QuestionRecord, type WorkspaceExport } from "../../sprint1-runtime/src/index.js";

export type SemantiqLevel = "low" | "medium" | "high" | "excellent";
export type SemantiqExecutionMode = "rule-based-local" | "local-ai-assisted" | "remote-provider-assisted" | "hybrid" | "test-fixture";
export type ApprovalState = "Suggested" | "Reviewed" | "Accepted" | "Partially Accepted" | "Rejected" | "Expired" | "Superseded";
export type Sprint2EventType =
  | "QuestionAnalysisRequested"
  | "QuestionAnalysisCompleted"
  | "QuestionIntentDetected"
  | "QuestionAmbiguityDetected"
  | "QuestionAssumptionDetected"
  | "QuestionRefinementSuggested"
  | "QuestionRefinementApproved"
  | "QuestionRefinementRejected"
  | "QuestionTagsSuggested"
  | "QuestionRelationSuggested"
  | "QuestionDuplicateCandidateFound"
  | "SemantiqEvaluationStarted"
  | "SemantiqEvaluationCompleted"
  | "ResearchProjectDrafted"
  | "ResearchProjectCreated"
  | "EvidenceAdded"
  | "EvidenceEvaluated"
  | "HypothesisCreated"
  | "ResearchTaskCreated"
  | "ResearchGraphUpdated";

export type QuestionIntent =
  | "Learning"
  | "Research"
  | "Scientific"
  | "Engineering"
  | "Programming"
  | "Business"
  | "Historical"
  | "Ethical"
  | "Creative"
  | "Educational"
  | "Personal Reflection"
  | "Project Creation"
  | "Game Creation"
  | "Community Discussion"
  | "Prediction"
  | "Open Exploration";

export type RelationSuggestionType =
  | "extends"
  | "supports"
  | "contradicts"
  | "duplicates"
  | "depends_on"
  | "generalizes"
  | "specializes"
  | "alternative_to"
  | "derived_from"
  | "part_of"
  | "related_to"
  | "future_work"
  | "evidence_needed_for";

export type EvidenceType =
  | "Observation"
  | "Scientific paper"
  | "Book"
  | "Dataset"
  | "Experiment result"
  | "Historical source"
  | "Repository"
  | "Code"
  | "Interview"
  | "Survey"
  | "Image"
  | "Audio"
  | "Video"
  | "User experience"
  | "External webpage"
  | "Mathematical proof"
  | "Simulation result"
  | "Unknown source";

export type ResearchStatus = "Draft" | "Planned" | "Active" | "Paused" | "Under Review" | "Completed" | "Archived" | "Reopened";
export type HypothesisStatus = "Draft" | "Proposed" | "Under Investigation" | "Supported" | "Partially Supported" | "Contradicted" | "Inconclusive" | "Retired";

export interface SemantiqProfile {
  readonly id: string;
  readonly version: string;
  readonly name: string;
  readonly mode: SemantiqExecutionMode;
  readonly weights: Readonly<Record<string, number>>;
}

export interface SemantiqDimension {
  readonly id: string;
  readonly label: string;
  readonly rubric: SemantiqRubric;
}

export interface SemantiqRubric {
  readonly highSignals: readonly string[];
  readonly weaknessSignals: readonly string[];
}

export interface SemantiqObservation {
  readonly id: string;
  readonly dimensionId: string;
  readonly text: string;
  readonly polarity: "strength" | "weakness" | "neutral";
}

export interface SemantiqScore {
  readonly dimensionId: string;
  readonly score: number;
  readonly level: SemantiqLevel;
  readonly explanation: string;
  readonly observations: readonly SemantiqObservation[];
  readonly weaknesses: readonly string[];
  readonly improvementSuggestions: readonly string[];
  readonly confidence: number;
  readonly evaluationVersion: string;
}

export interface SemantiqReport {
  readonly id: string;
  readonly questionId: string;
  readonly profileId: string;
  readonly evaluationVersion: SemantiqEvaluationVersion;
  readonly scores: readonly SemantiqScore[];
  readonly normalizedScore: number;
  readonly confidence: number;
  readonly recommendations: readonly SemantiqRecommendation[];
  readonly provider: ModelUsageRecord;
  readonly createdAt: string;
}

export interface SemantiqRecommendation {
  readonly id: string;
  readonly dimensionId: string;
  readonly text: string;
  readonly explanation: string;
}

export interface SemantiqEvaluationVersion {
  readonly id: string;
  readonly profileVersion: string;
  readonly promptVersion: string;
  readonly evaluatorVersion: string;
}

export interface DetectedIntent {
  readonly type: QuestionIntent;
  readonly confidence: number;
  readonly explanation: string;
  readonly triggers: readonly string[];
  readonly suggestedNextAction: string;
}

export interface AmbiguityFinding {
  readonly type:
    | "terminology"
    | "time-range"
    | "geographic-scope"
    | "target-population"
    | "context"
    | "domain"
    | "causal-claim"
    | "comparison-criteria"
    | "expected-output"
    | "definitions"
    | "measurement"
    | "audience"
    | "constraints";
  readonly severity: "low" | "medium" | "high";
  readonly text: string;
  readonly explanation: string;
  readonly suggestion: string;
}

export interface AssumptionFinding {
  readonly type:
    | "factual"
    | "causal"
    | "cultural"
    | "technical"
    | "scientific"
    | "ethical"
    | "historical"
    | "user-context"
    | "measurement";
  readonly statement: string;
  readonly explanation: string;
  readonly confidence: number;
}

export interface RefinementVariant {
  readonly id: string;
  readonly kind: "Minimal correction" | "Clear version" | "Precise version" | "Research-ready version" | "Scientific version" | "Beginner version" | "Expert version" | "Project-oriented version";
  readonly refinedText: string;
  readonly changesMade: readonly string[];
  readonly meaningPreservationNote: string;
  readonly expectedBenefit: string;
  readonly semantiqPreview: number;
  readonly confidence: number;
  readonly approvalState: ApprovalState;
}

export interface SemanticTag {
  readonly id: string;
  readonly label: string;
  readonly category:
    | "Domain"
    | "Subdomain"
    | "Intent"
    | "Method"
    | "Difficulty"
    | "Audience"
    | "Research stage"
    | "Evidence need"
    | "Risk"
    | "Language"
    | "Project suitability"
    | "Educational suitability";
  readonly confidence: number;
  readonly explanation: string;
  readonly source: string;
  readonly version: string;
  readonly approvalState: ApprovalState;
}

export interface DuplicateCandidate {
  readonly questionId: string;
  readonly similarityScore: number;
  readonly strategies: readonly string[];
  readonly sharedTags: readonly string[];
  readonly sharedConcepts: readonly string[];
  readonly differences: readonly string[];
  readonly recommendedAction: "Keep separate" | "Link as related" | "Mark as duplicate" | "Merge" | "Fork" | "Generalize" | "Specialize";
}

export interface RelationSuggestion {
  readonly id: string;
  readonly sourceId: string;
  readonly targetId: string;
  readonly relation: RelationSuggestionType;
  readonly confidence: number;
  readonly explanation: string;
  readonly evidence: readonly string[];
  readonly approvalState: ApprovalState;
}

export interface QuestionAnalysis {
  readonly id: string;
  readonly questionId: string;
  readonly originalQuestion: string;
  readonly language: string;
  readonly intents: readonly DetectedIntent[];
  readonly ambiguities: readonly AmbiguityFinding[];
  readonly assumptions: readonly AssumptionFinding[];
  readonly tags: readonly SemanticTag[];
  readonly duplicateCandidates: readonly DuplicateCandidate[];
  readonly relationSuggestions: readonly RelationSuggestion[];
  readonly refinements: readonly RefinementVariant[];
  readonly semantiqPreview: number;
  readonly stageTimingsMs: Readonly<Record<string, number>>;
  readonly createdAt: string;
}

export interface ApprovalDecision {
  readonly id: string;
  readonly suggestionId: string;
  readonly actorId: string;
  readonly state: ApprovalState;
  readonly selectedText?: string;
  readonly reason?: string;
  readonly occurredAt: string;
  readonly auditId: string;
}

export interface ResearchProjectRecord {
  readonly id: string;
  readonly sourceQuestionId: string;
  readonly title: string;
  readonly summary: string;
  readonly researchGoal: string;
  readonly scope: string;
  readonly researchQuestions: readonly string[];
  readonly objectives: readonly string[];
  readonly hypothesisIds: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly taskIds: readonly string[];
  readonly milestones: readonly string[];
  readonly contributorIds: readonly string[];
  readonly workspaceId: string;
  readonly status: ResearchStatus;
  readonly risks: readonly string[];
  readonly ethicsNotes: readonly string[];
  readonly timeline: readonly string[];
  readonly semantiqReportId: string;
  readonly graphRelationIds: readonly string[];
  readonly versionHistory: readonly string[];
}

export interface EvidenceRecord {
  readonly id: string;
  readonly projectId: string;
  readonly title: string;
  readonly description: string;
  readonly evidenceType: EvidenceType;
  readonly source: string;
  readonly citation: string;
  readonly urlOrLocalReference?: string;
  readonly author?: string;
  readonly publicationDate?: string;
  readonly accessDate: string;
  readonly provenance: string;
  readonly reliabilityAssessment: string;
  readonly relevance: number;
  readonly confidence: number;
  readonly supportingRelations: readonly string[];
  readonly contradictingRelations: readonly string[];
  readonly attachments: readonly string[];
  readonly license: string;
  readonly versionHistory: readonly string[];
  readonly auditHistory: readonly string[];
}

export interface EvidenceQualityAssessment {
  readonly evidenceId: string;
  readonly dimensions: Readonly<Record<string, SemantiqScore>>;
  readonly overallQuality: number;
  readonly explanation: string;
}

export interface HypothesisRecord {
  readonly id: string;
  readonly statement: string;
  readonly sourceQuestionId: string;
  readonly projectId: string;
  readonly variables: readonly string[];
  readonly assumptions: readonly string[];
  readonly expectedObservations: readonly string[];
  readonly supportingEvidence: readonly string[];
  readonly contradictingEvidence: readonly string[];
  readonly testability: number;
  readonly falsifiability: number;
  readonly confidence: number;
  readonly status: HypothesisStatus;
  readonly history: readonly string[];
  readonly alternative: boolean;
  readonly nullHypothesis: boolean;
}

export interface ResearchTaskRecord {
  readonly id: string;
  readonly projectId: string;
  readonly description: string;
  readonly dependencies: readonly string[];
  readonly priority: "low" | "medium" | "high";
  readonly assignee?: string;
  readonly dueDate?: string;
  readonly status: "todo" | "doing" | "review" | "done";
  readonly requiredEvidence: readonly string[];
  readonly output: string;
  readonly semantiqCriteria: readonly string[];
  readonly auditHistory: readonly string[];
}

export interface ResearchDashboard {
  readonly sourceQuestion: string;
  readonly semantiqOverview: { readonly normalizedScore: number; readonly confidence: number };
  readonly researchStatus: ResearchStatus;
  readonly evidenceCount: number;
  readonly evidenceQuality: number;
  readonly hypotheses: readonly HypothesisRecord[];
  readonly tasks: readonly ResearchTaskRecord[];
  readonly milestones: readonly string[];
  readonly relatedQuestions: readonly DuplicateCandidate[];
  readonly knowledgeGraph: { readonly nodes: number; readonly edges: number };
  readonly activityTimeline: readonly Sprint2Event[];
  readonly risks: readonly string[];
  readonly contributors: readonly string[];
  readonly suggestedNextSteps: readonly string[];
}

export interface ModelCapability {
  readonly kind: "text-analysis" | "embedding" | "structured-output";
  readonly offline: boolean;
}

export interface ModelConfiguration {
  readonly provider: "deterministic-local-rules" | "ollama" | "openai-compatible" | "mock";
  readonly model?: string;
  readonly externalRequestsAllowed: boolean;
  readonly promptVersion: string;
}

export interface ModelHealth {
  readonly available: boolean;
  readonly latencyMs: number;
  readonly fallbackUsed: boolean;
}

export interface ModelUsageRecord {
  readonly provider: string;
  readonly model: string;
  readonly promptVersion: string;
  readonly confidence: number;
  readonly externalRequest: boolean;
}

export interface AIProvider {
  readonly id: string;
  readonly capabilities: readonly ModelCapability[];
  health(): Promise<ModelHealth>;
  analyzeText(input: string, configuration: ModelConfiguration): Promise<{ readonly text: string; readonly usage: ModelUsageRecord }>;
}

export interface PromptRegistryEntry {
  readonly id: string;
  readonly version: string;
  readonly purpose: string;
  readonly inputSchema: string;
  readonly outputSchema: string;
  readonly safetyNotes: readonly string[];
  readonly evaluationFixtures: readonly string[];
  readonly changelog: readonly string[];
}

export interface Sprint2Event {
  readonly eventId: string;
  readonly type: Sprint2EventType;
  readonly version: number;
  readonly timestamp: string;
  readonly actorId: string;
  readonly workspaceId: string;
  readonly correlationId: string;
  readonly causationId: string;
  readonly payload: unknown;
  readonly audit: Readonly<Record<string, unknown>>;
}

export interface Sprint2Export {
  readonly sprint1Export: WorkspaceExport;
  readonly originalQuestion: string;
  readonly approvedRefinedQuestion: string;
  readonly questionAnalysis: QuestionAnalysis;
  readonly semantiqReports: readonly SemantiqReport[];
  readonly suggestedAndApprovedTags: readonly SemanticTag[];
  readonly questionRelations: readonly RelationSuggestion[];
  readonly researchProject: ResearchProjectRecord;
  readonly evidence: readonly EvidenceRecord[];
  readonly hypotheses: readonly HypothesisRecord[];
  readonly researchTasks: readonly ResearchTaskRecord[];
  readonly auditTrail: readonly Sprint2Event[];
  readonly promptAndEvaluatorVersions: readonly string[];
}

export interface Sprint2JourneyResult {
  readonly identityId: string;
  readonly workspaceId: string;
  readonly question: QuestionRecord;
  readonly analysis: QuestionAnalysis;
  readonly approval: ApprovalDecision;
  readonly semantiqReport: SemantiqReport;
  readonly researchProject: ResearchProjectRecord;
  readonly evidence: EvidenceRecord;
  readonly evidenceQuality: EvidenceQualityAssessment;
  readonly hypothesis: HypothesisRecord;
  readonly tasks: readonly ResearchTaskRecord[];
  readonly dashboard: ResearchDashboard;
  readonly exportPackage: Sprint2Export;
  readonly events: readonly Sprint2Event[];
}

const now = (): string => new Date().toISOString();
const createId = (prefix: string): string => `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
const words = (text: string): readonly string[] => text.toLowerCase().match(/[a-z][a-z-]{2,}/g) ?? [];
const clamp = (value: number): number => Math.min(1, Math.max(0, value));

export const sprint2PromptRegistry: readonly PromptRegistryEntry[] = [
  "question-intent",
  "question-ambiguity",
  "question-assumptions",
  "question-refinement",
  "question-tags",
  "question-relations",
  "question-research-plan",
  "evidence-quality",
  "hypothesis-generation",
  "semantiq-question"
].map((name) => ({
  id: `${name}.v1`,
  version: "1.0.0",
  purpose: `Structured ${name.replaceAll("-", " ")} prompt contract.`,
  inputSchema: `${name}.input.schema.json`,
  outputSchema: `${name}.output.schema.json`,
  safetyNotes: ["Do not fabricate evidence.", "Preserve uncertainty.", "Require user approval for generated changes."],
  evaluationFixtures: [`${name}.fixture.json`],
  changelog: ["v1: Initial Sprint 2 deterministic/local-compatible prompt contract."]
}));

export const sprint2Screens = [
  "Question Intelligence Panel",
  "Question Analysis Summary",
  "Refinement Comparison",
  "Ambiguity Inspector",
  "Assumption Inspector",
  "Tag Approval Panel",
  "Duplicate Review",
  "Relation Suggestion Panel",
  "Semantiq Report",
  "Semantiq History",
  "Research Creation Wizard",
  "Research Dashboard",
  "Evidence Editor",
  "Evidence Inspector",
  "Hypothesis Editor",
  "Research Task Board",
  "Research Graph View"
] as const;

export const sprint2ApiContracts = {
  questionIntelligence: [
    "analyzeQuestion()",
    "detectIntent()",
    "detectAmbiguity()",
    "detectAssumptions()",
    "suggestRefinements()",
    "suggestTags()",
    "findDuplicates()",
    "suggestRelations()",
    "approveSuggestion()",
    "rejectSuggestion()"
  ],
  semantiq: ["evaluateQuestion()", "getSemantiqReport()", "compareEvaluations()", "getEvaluationHistory()", "explainScore()"],
  research: [
    "createResearchDraft()",
    "approveResearchProject()",
    "getResearchProject()",
    "updateResearchProject()",
    "addEvidence()",
    "evaluateEvidence()",
    "createHypothesis()",
    "createResearchTask()",
    "getResearchDashboard()"
  ],
  generatedArtifacts: ["OpenAPI descriptor", "GraphQL schema descriptor", "Zod schema descriptor", "Pydantic model descriptor", "JSON Schema descriptor", "MCP tool contract descriptor"]
} as const;

const semantiqDimensions: readonly SemantiqDimension[] = [
  { id: "clarity", label: "Clarity", rubric: { highSignals: ["question mark", "clear verb"], weaknessSignals: ["vague wording"] } },
  { id: "specificity", label: "Specificity", rubric: { highSignals: ["constraints", "scope"], weaknessSignals: ["broad wording"] } },
  { id: "context-completeness", label: "Context Completeness", rubric: { highSignals: ["audience", "domain"], weaknessSignals: ["missing context"] } },
  { id: "ambiguity", label: "Ambiguity", rubric: { highSignals: ["defined terms"], weaknessSignals: ["future", "best", "better"] } },
  { id: "assumption-visibility", label: "Assumption Visibility", rubric: { highSignals: ["because", "given"], weaknessSignals: ["hidden premise"] } },
  { id: "research-potential", label: "Research Potential", rubric: { highSignals: ["why", "how", "evidence"], weaknessSignals: ["yes/no"] } },
  { id: "evidence-awareness", label: "Evidence Awareness", rubric: { highSignals: ["evidence", "data", "source"], weaknessSignals: ["no evidence need"] } },
  { id: "testability", label: "Testability", rubric: { highSignals: ["measure", "compare", "test"], weaknessSignals: ["unmeasurable"] } },
  { id: "novelty", label: "Novelty", rubric: { highSignals: ["new", "unknown"], weaknessSignals: ["generic"] } },
  { id: "actionability", label: "Actionability", rubric: { highSignals: ["plan", "build", "decide"], weaknessSignals: ["no next action"] } },
  { id: "ethical-awareness", label: "Ethical Awareness", rubric: { highSignals: ["risk", "privacy", "fair"], weaknessSignals: ["no ethics context"] } },
  { id: "overall-confidence", label: "Overall Confidence", rubric: { highSignals: ["balanced signals"], weaknessSignals: ["low signal"] } }
];

export const defaultQuestionSemantiqProfile: SemantiqProfile = {
  id: "semantiq-question-default",
  version: "1.0.0",
  name: "Default Question Profile",
  mode: "rule-based-local",
  weights: Object.fromEntries(semantiqDimensions.map((dimension) => [dimension.id, 1]))
};

export const educationSemantiqProfilePlaceholder: SemantiqProfile = {
  ...defaultQuestionSemantiqProfile,
  id: "semantiq-education-placeholder",
  name: "Educational Profile Placeholder"
};

export const researchSemantiqProfilePlaceholder: SemantiqProfile = {
  ...defaultQuestionSemantiqProfile,
  id: "semantiq-research-placeholder",
  name: "Research Profile Placeholder",
  weights: { ...defaultQuestionSemantiqProfile.weights, "research-potential": 2, "evidence-awareness": 2, testability: 2 }
};

export class DeterministicLocalAIProvider implements AIProvider {
  readonly id = "deterministic-local-rules";
  readonly capabilities: readonly ModelCapability[] = [
    { kind: "text-analysis", offline: true },
    { kind: "embedding", offline: true },
    { kind: "structured-output", offline: true }
  ];

  async health(): Promise<ModelHealth> {
    return { available: true, latencyMs: 0, fallbackUsed: false };
  }

  async analyzeText(input: string, configuration: ModelConfiguration): Promise<{ readonly text: string; readonly usage: ModelUsageRecord }> {
    return {
      text: input,
      usage: {
        provider: this.id,
        model: configuration.model ?? "rules-v1",
        promptVersion: configuration.promptVersion,
        confidence: 0.75,
        externalRequest: false
      }
    };
  }
}

export class LocalSprint2Runtime {
  private readonly sprint1 = new LocalSprint1Runtime();
  private readonly provider = new DeterministicLocalAIProvider();
  private readonly analyses = new Map<string, QuestionAnalysis>();
  private readonly approvals = new Map<string, ApprovalDecision>();
  private readonly reports = new Map<string, SemantiqReport>();
  private readonly reportsByQuestion = new Map<string, string[]>();
  private readonly projects = new Map<string, ResearchProjectRecord>();
  private readonly evidence = new Map<string, EvidenceRecord>();
  private readonly evidenceQuality = new Map<string, EvidenceQualityAssessment>();
  private readonly hypotheses = new Map<string, HypothesisRecord>();
  private readonly tasks = new Map<string, ResearchTaskRecord>();
  private readonly events: Sprint2Event[] = [];
  private readonly graphEdges: RelationSuggestion[] = [];

  async runCriticalJourney(input: {
    readonly identityId: string;
    readonly displayName: string;
    readonly workspaceName: string;
    readonly rawQuestion: string;
    readonly evidenceTitle: string;
    readonly evidenceSource: string;
  }): Promise<Sprint2JourneyResult> {
    const identity = await this.sprint1.createIdentity({ id: input.identityId, displayName: input.displayName });
    await this.sprint1.loginLocal(identity.id, "device:sprint2");
    const workspace = await this.sprint1.createWorkspace(identity.id, input.workspaceName, "sprint2-research");
    const question = await this.sprint1.createQuestion({
      workspaceId: workspace.id,
      ownerId: identity.id,
      text: input.rawQuestion,
      tags: ["sprint2", "raw-question"]
    });
    const analysis = await this.analyzeQuestion(workspace.id, identity.id, question);
    const approval = await this.approveSuggestion(workspace.id, identity.id, analysis.refinements[3]?.id ?? analysis.refinements[0]!.id);
    const approvedText = approval.selectedText ?? analysis.refinements.find((item) => item.id === approval.suggestionId)?.refinedText ?? question.text;
    const updatedQuestion = await this.sprint1.updateQuestion(question.id, { text: approvedText, tags: analysis.tags.map((tag) => tag.label) });
    const semantiqReport = await this.evaluateQuestion(workspace.id, identity.id, updatedQuestion, analysis);
    const researchProject = await this.approveResearchProject(workspace.id, identity.id, await this.createResearchDraft(workspace.id, identity.id, updatedQuestion, analysis, semantiqReport));
    const evidence = await this.addEvidence(workspace.id, identity.id, researchProject.id, {
      title: input.evidenceTitle,
      description: `Initial evidence for ${researchProject.title}.`,
      evidenceType: "External webpage",
      source: input.evidenceSource,
      citation: input.evidenceSource,
      provenance: identity.id,
      license: "unknown"
    });
    const evidenceQuality = await this.evaluateEvidence(workspace.id, identity.id, evidence.id);
    const hypothesis = await this.createHypothesis(workspace.id, identity.id, researchProject.id, {
      statement: `If better evidence is attached to "${updatedQuestion.text}", then the research plan becomes more testable.`,
      variables: ["evidence quality", "question testability"],
      assumptions: analysis.assumptions.map((item) => item.statement),
      expectedObservations: ["Higher evidence-awareness score", "Clearer next tasks"]
    });
    const tasks = await this.generateResearchTasks(workspace.id, identity.id, researchProject.id);
    const dashboard = this.getResearchDashboard(workspace.id, researchProject.id);
    const exportPackage = this.exportResearchPackage(workspace.id, researchProject.id);
    return {
      identityId: identity.id,
      workspaceId: workspace.id,
      question: updatedQuestion,
      analysis,
      approval,
      semantiqReport,
      researchProject,
      evidence,
      evidenceQuality,
      hypothesis,
      tasks,
      dashboard,
      exportPackage,
      events: this.events
    };
  }

  async analyzeQuestion(workspaceId: string, actorId: string, question: QuestionRecord): Promise<QuestionAnalysis> {
    const started = performance.now();
    this.emit("QuestionAnalysisRequested", actorId, workspaceId, { questionId: question.id }, question.id);
    const language = this.detectLanguage(question.text);
    const intentStarted = performance.now();
    const intents = this.detectIntent(question.text);
    const ambiguityStarted = performance.now();
    const ambiguities = this.detectAmbiguity(question.text);
    const assumptionStarted = performance.now();
    const assumptions = this.detectAssumptions(question.text);
    const tags = this.suggestTags(question.text, intents, ambiguities);
    const duplicates = this.findDuplicates(question, tags);
    const relations = this.suggestRelations(question, duplicates);
    const refinements = this.suggestRefinements(question.text, ambiguities, assumptions);
    const semantiqPreview = this.previewScore(question.text, ambiguities, assumptions);
    const analysis: QuestionAnalysis = {
      id: createId("analysis"),
      questionId: question.id,
      originalQuestion: question.text,
      language,
      intents,
      ambiguities,
      assumptions,
      tags,
      duplicateCandidates: duplicates,
      relationSuggestions: relations,
      refinements,
      semantiqPreview,
      stageTimingsMs: {
        language: intentStarted - started,
        intent: ambiguityStarted - intentStarted,
        ambiguity: assumptionStarted - ambiguityStarted,
        total: performance.now() - started
      },
      createdAt: now()
    };
    this.analyses.set(analysis.id, analysis);
    this.emit("QuestionIntentDetected", actorId, workspaceId, { questionId: question.id, intents }, question.id);
    this.emit("QuestionAmbiguityDetected", actorId, workspaceId, { questionId: question.id, count: ambiguities.length }, question.id);
    this.emit("QuestionAssumptionDetected", actorId, workspaceId, { questionId: question.id, count: assumptions.length }, question.id);
    this.emit("QuestionRefinementSuggested", actorId, workspaceId, { questionId: question.id, count: refinements.length }, question.id);
    this.emit("QuestionTagsSuggested", actorId, workspaceId, { questionId: question.id, count: tags.length }, question.id);
    if (duplicates.length > 0) this.emit("QuestionDuplicateCandidateFound", actorId, workspaceId, { questionId: question.id, count: duplicates.length }, question.id);
    if (relations.length > 0) this.emit("QuestionRelationSuggested", actorId, workspaceId, { questionId: question.id, count: relations.length }, question.id);
    this.emit("QuestionAnalysisCompleted", actorId, workspaceId, { questionId: question.id, analysisId: analysis.id }, question.id);
    return analysis;
  }

  async approveSuggestion(workspaceId: string, actorId: string, suggestionId: string, selectedText?: string): Promise<ApprovalDecision> {
    const base = {
      id: createId("approval"),
      suggestionId,
      actorId,
      state: "Accepted" as const,
      occurredAt: now(),
      auditId: createId("audit")
    };
    const decision: ApprovalDecision = selectedText ? { ...base, selectedText } : base;
    this.approvals.set(decision.id, decision);
    this.emit("QuestionRefinementApproved", actorId, workspaceId, { suggestionId, decisionId: decision.id }, suggestionId);
    return decision;
  }

  async rejectSuggestion(workspaceId: string, actorId: string, suggestionId: string, reason: string): Promise<ApprovalDecision> {
    const decision: ApprovalDecision = {
      id: createId("approval"),
      suggestionId,
      actorId,
      state: "Rejected",
      reason,
      occurredAt: now(),
      auditId: createId("audit")
    };
    this.approvals.set(decision.id, decision);
    this.emit("QuestionRefinementRejected", actorId, workspaceId, { suggestionId, reason }, suggestionId);
    return decision;
  }

  async evaluateQuestion(workspaceId: string, actorId: string, question: QuestionRecord, analysis: QuestionAnalysis, profile = defaultQuestionSemantiqProfile): Promise<SemantiqReport> {
    this.emit("SemantiqEvaluationStarted", actorId, workspaceId, { questionId: question.id, profileId: profile.id }, question.id);
    const usage = (await this.provider.analyzeText(question.text, { provider: "deterministic-local-rules", externalRequestsAllowed: false, promptVersion: "semantiq-question.v1" })).usage;
    const scores = semantiqDimensions.map((dimension) => this.scoreDimension(dimension, question.text, analysis));
    const weights = scores.map((score) => profile.weights[score.dimensionId] ?? 1);
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const normalizedScore = scores.reduce((sum, score, index) => sum + score.score * weights[index]!, 0) / totalWeight;
    const report: SemantiqReport = {
      id: createId("semantiq-report"),
      questionId: question.id,
      profileId: profile.id,
      evaluationVersion: {
        id: "semantiq-question-evaluation-v1",
        profileVersion: profile.version,
        promptVersion: "semantiq-question.v1",
        evaluatorVersion: "rules-v1"
      },
      scores,
      normalizedScore,
      confidence: scores.reduce((sum, score) => sum + score.confidence, 0) / scores.length,
      recommendations: scores
        .filter((score) => score.score < 0.7)
        .map((score) => ({ id: createId("semantiq-recommendation"), dimensionId: score.dimensionId, text: score.improvementSuggestions[0] ?? "Add more context.", explanation: score.explanation })),
      provider: usage,
      createdAt: now()
    };
    this.reports.set(report.id, report);
    const reportIds = this.reportsByQuestion.get(question.id) ?? [];
    reportIds.push(report.id);
    this.reportsByQuestion.set(question.id, reportIds);
    this.emit("SemantiqEvaluationCompleted", actorId, workspaceId, { questionId: question.id, reportId: report.id, normalizedScore }, report.id);
    return report;
  }

  getSemantiqReport(reportId: string): SemantiqReport {
    return this.requireReport(reportId);
  }

  compareEvaluations(leftReportId: string, rightReportId: string): { readonly delta: number; readonly explanation: string } {
    const left = this.requireReport(leftReportId);
    const right = this.requireReport(rightReportId);
    return { delta: right.normalizedScore - left.normalizedScore, explanation: "Compared normalized Semantiq scores across evaluations." };
  }

  getEvaluationHistory(questionId: string): readonly SemantiqReport[] {
    return (this.reportsByQuestion.get(questionId) ?? []).map((reportId) => this.requireReport(reportId));
  }

  explainScore(reportId: string): string {
    const report = this.requireReport(reportId);
    return report.scores.map((score) => `${score.dimensionId}: ${score.level} (${score.score.toFixed(2)}) - ${score.explanation}`).join("\n");
  }

  async createResearchDraft(workspaceId: string, actorId: string, question: QuestionRecord, analysis: QuestionAnalysis, report: SemantiqReport): Promise<ResearchProjectRecord> {
    const project: ResearchProjectRecord = {
      id: createId("research-project"),
      sourceQuestionId: question.id,
      title: `Research: ${question.text.slice(0, 72)}`,
      summary: `Draft research project generated from approved question ${question.id}.`,
      researchGoal: `Investigate ${question.text}`,
      scope: analysis.ambiguities.length > 0 ? "Scope requires clarification before active execution." : "Initial local research scope.",
      researchQuestions: [question.text, ...analysis.refinements.slice(0, 2).map((item) => item.refinedText)],
      objectives: ["Clarify scope", "Collect evidence", "Evaluate hypotheses", "Produce a research summary"],
      hypothesisIds: [],
      evidenceIds: [],
      taskIds: [],
      milestones: ["Question approved", "Evidence collected", "Hypothesis reviewed", "Summary produced"],
      contributorIds: [actorId],
      workspaceId,
      status: "Draft",
      risks: analysis.ambiguities.map((item) => item.explanation),
      ethicsNotes: analysis.tags.some((tag) => tag.category === "Risk") ? ["Review ethical and privacy implications before external provider use."] : [],
      timeline: [now()],
      semantiqReportId: report.id,
      graphRelationIds: [],
      versionHistory: ["draft:1.0.0"]
    };
    this.projects.set(project.id, project);
    this.emit("ResearchProjectDrafted", actorId, workspaceId, { projectId: project.id, questionId: question.id }, project.id);
    return project;
  }

  async approveResearchProject(workspaceId: string, actorId: string, draft: ResearchProjectRecord): Promise<ResearchProjectRecord> {
    const relation = this.approvedRelation(draft.sourceQuestionId, draft.id, "related_to", "Question converted into a research project after user approval.");
    const project: ResearchProjectRecord = {
      ...draft,
      status: "Planned",
      graphRelationIds: [...draft.graphRelationIds, relation.id],
      timeline: [...draft.timeline, now()],
      versionHistory: [...draft.versionHistory, "approved:1.0.0"]
    };
    this.projects.set(project.id, project);
    this.graphEdges.push(relation);
    this.emit("ResearchProjectCreated", actorId, workspaceId, { projectId: project.id }, project.id);
    this.emit("ResearchGraphUpdated", actorId, workspaceId, { relationId: relation.id }, relation.id);
    return project;
  }

  getResearchProject(projectId: string): ResearchProjectRecord {
    return this.requireProject(projectId);
  }

  updateResearchProject(projectId: string, patch: { readonly status?: ResearchStatus; readonly summary?: string }): ResearchProjectRecord {
    const project = this.requireProject(projectId);
    const updated = {
      ...project,
      status: patch.status ?? project.status,
      summary: patch.summary ?? project.summary,
      timeline: [...project.timeline, now()],
      versionHistory: [...project.versionHistory, "updated:1.0.0"]
    };
    this.projects.set(projectId, updated);
    return updated;
  }

  async addEvidence(
    workspaceId: string,
    actorId: string,
    projectId: string,
    input: {
      readonly title: string;
      readonly description: string;
      readonly evidenceType: EvidenceType;
      readonly source: string;
      readonly citation: string;
      readonly urlOrLocalReference?: string;
      readonly provenance: string;
      readonly license: string;
    }
  ): Promise<EvidenceRecord> {
    const project = this.requireProject(projectId);
    const base = {
      id: createId("evidence"),
      projectId,
      title: input.title,
      description: input.description,
      evidenceType: input.evidenceType,
      source: input.source,
      citation: input.citation,
      accessDate: now(),
      provenance: input.provenance,
      reliabilityAssessment: "Unverified local evidence. Treat as a lead until corroborated.",
      relevance: 0.7,
      confidence: 0.55,
      supportingRelations: [project.sourceQuestionId],
      contradictingRelations: [],
      attachments: [],
      license: input.license,
      versionHistory: ["created:1.0.0"],
      auditHistory: [createId("audit")]
    };
    const evidence: EvidenceRecord = input.urlOrLocalReference ? { ...base, urlOrLocalReference: input.urlOrLocalReference } : base;
    this.evidence.set(evidence.id, evidence);
    this.projects.set(projectId, { ...project, evidenceIds: [...project.evidenceIds, evidence.id], timeline: [...project.timeline, now()] });
    this.emit("EvidenceAdded", actorId, workspaceId, { projectId, evidenceId: evidence.id }, evidence.id);
    this.emit("ResearchGraphUpdated", actorId, workspaceId, { evidenceId: evidence.id, projectId }, evidence.id);
    return evidence;
  }

  async evaluateEvidence(workspaceId: string, actorId: string, evidenceId: string): Promise<EvidenceQualityAssessment> {
    const evidence = this.requireEvidence(evidenceId);
    const dimensions = Object.fromEntries(
      ["source-traceability", "relevance", "reliability", "recency", "method-transparency", "reproducibility", "conflict-of-interest", "completeness", "corroboration"].map((dimensionId) => [
        dimensionId,
        this.genericScore(dimensionId, evidence.description, evidence.confidence)
      ])
    );
    const values = Object.values(dimensions).map((score) => score.score);
    const assessment: EvidenceQualityAssessment = {
      evidenceId,
      dimensions,
      overallQuality: values.reduce((sum, value) => sum + value, 0) / values.length,
      explanation: "Quality assessment is deterministic and preserves uncertainty; it is not scientific peer review."
    };
    this.evidenceQuality.set(evidenceId, assessment);
    this.emit("EvidenceEvaluated", actorId, workspaceId, { evidenceId, overallQuality: assessment.overallQuality }, evidenceId);
    return assessment;
  }

  async createHypothesis(
    workspaceId: string,
    actorId: string,
    projectId: string,
    input: {
      readonly statement: string;
      readonly variables: readonly string[];
      readonly assumptions: readonly string[];
      readonly expectedObservations: readonly string[];
    }
  ): Promise<HypothesisRecord> {
    const project = this.requireProject(projectId);
    const hypothesis: HypothesisRecord = {
      id: createId("hypothesis"),
      statement: input.statement,
      sourceQuestionId: project.sourceQuestionId,
      projectId,
      variables: input.variables,
      assumptions: input.assumptions,
      expectedObservations: input.expectedObservations,
      supportingEvidence: project.evidenceIds,
      contradictingEvidence: [],
      testability: input.expectedObservations.length > 0 ? 0.75 : 0.45,
      falsifiability: input.variables.length > 0 ? 0.7 : 0.4,
      confidence: 0.55,
      status: "Proposed",
      history: [`created:${now()}`],
      alternative: false,
      nullHypothesis: false
    };
    this.hypotheses.set(hypothesis.id, hypothesis);
    this.projects.set(projectId, { ...project, hypothesisIds: [...project.hypothesisIds, hypothesis.id], timeline: [...project.timeline, now()] });
    this.emit("HypothesisCreated", actorId, workspaceId, { projectId, hypothesisId: hypothesis.id }, hypothesis.id);
    this.emit("ResearchGraphUpdated", actorId, workspaceId, { hypothesisId: hypothesis.id, projectId }, hypothesis.id);
    return hypothesis;
  }

  async createResearchTask(workspaceId: string, actorId: string, projectId: string, description: string, dependencies: readonly string[] = []): Promise<ResearchTaskRecord> {
    const project = this.requireProject(projectId);
    const task: ResearchTaskRecord = {
      id: createId("research-task"),
      projectId,
      description,
      dependencies,
      priority: description.toLowerCase().includes("evidence") ? "high" : "medium",
      status: "todo",
      requiredEvidence: project.evidenceIds,
      output: `${description} output`,
      semantiqCriteria: ["clarity", "evidence-awareness", "testability"],
      auditHistory: [createId("audit")]
    };
    this.tasks.set(task.id, task);
    this.projects.set(projectId, { ...project, taskIds: [...project.taskIds, task.id], timeline: [...project.timeline, now()] });
    this.emit("ResearchTaskCreated", actorId, workspaceId, { projectId, taskId: task.id }, task.id);
    return task;
  }

  async generateResearchTasks(workspaceId: string, actorId: string, projectId: string): Promise<readonly ResearchTaskRecord[]> {
    const descriptions = [
      "Literature review task",
      "Evidence collection task",
      "Source validation task",
      "Hypothesis refinement task",
      "Experiment planning task",
      "Analysis task",
      "Review task",
      "Summary task"
    ];
    const created: ResearchTaskRecord[] = [];
    for (const description of descriptions) {
      created.push(await this.createResearchTask(workspaceId, actorId, projectId, description));
    }
    return created;
  }

  getResearchDashboard(workspaceId: string, projectId: string): ResearchDashboard {
    const project = this.requireProject(projectId);
    const report = this.requireReport(project.semantiqReportId);
    const evidence = project.evidenceIds.map((id) => this.requireEvidence(id));
    const quality = evidence.map((item) => this.evidenceQuality.get(item.id)?.overallQuality ?? item.confidence);
    return {
      sourceQuestion: project.researchQuestions[0] ?? project.sourceQuestionId,
      semantiqOverview: { normalizedScore: report.normalizedScore, confidence: report.confidence },
      researchStatus: project.status,
      evidenceCount: evidence.length,
      evidenceQuality: quality.length ? quality.reduce((sum, item) => sum + item, 0) / quality.length : 0,
      hypotheses: project.hypothesisIds.map((id) => this.requireHypothesis(id)),
      tasks: project.taskIds.map((id) => this.requireTask(id)),
      milestones: project.milestones,
      relatedQuestions: [...this.analyses.values()].flatMap((analysis) => analysis.duplicateCandidates),
      knowledgeGraph: { nodes: 1 + evidence.length + project.hypothesisIds.length + project.taskIds.length, edges: this.graphEdges.length },
      activityTimeline: this.events.filter((event) => event.workspaceId === workspaceId).slice(-20),
      risks: project.risks,
      contributors: project.contributorIds,
      suggestedNextSteps: ["Review evidence quality", "Clarify remaining ambiguities", "Advance highest-priority research task"]
    };
  }

  search(workspaceId: string, query: string): readonly { readonly id: string; readonly type: string; readonly title: string; readonly score: number }[] {
    const termSet = new Set(words(query));
    const score = (text: string): number => {
      const tokens = words(text);
      if (termSet.size === 0 || tokens.length === 0) return 0;
      return [...termSet].filter((term) => tokens.includes(term)).length / termSet.size;
    };
    return [
      ...[...this.projects.values()].filter((item) => item.workspaceId === workspaceId).map((item) => ({ id: item.id, type: "research-project", title: item.title, score: score(`${item.title} ${item.summary}`) })),
      ...[...this.evidence.values()].map((item) => ({ id: item.id, type: "evidence", title: item.title, score: score(`${item.title} ${item.description} ${item.source}`) })),
      ...[...this.hypotheses.values()].map((item) => ({ id: item.id, type: "hypothesis", title: item.statement, score: score(`${item.statement} ${item.variables.join(" ")}`) })),
      ...[...this.reports.values()].map((item) => ({
        id: item.id,
        type: "semantiq-report",
        title: item.profileId,
        score: score(
          `${item.profileId} semantiq report evidence research ${item.scores
            .map((scoreItem) => `${scoreItem.dimensionId} ${scoreItem.dimensionId.replaceAll("-", " ")}`)
            .join(" ")} ${item.recommendations.map((rec) => rec.text).join(" ")}`
        )
      })),
      ...[...this.analyses.values()].flatMap((analysis) => analysis.tags.map((tag) => ({ id: tag.id, type: "semantic-tag", title: tag.label, score: score(`${tag.label} ${tag.explanation}`) })))
    ]
      .filter((result) => result.score > 0)
      .sort((left, right) => right.score - left.score);
  }

  exportResearchPackage(workspaceId: string, projectId: string): Sprint2Export {
    const project = this.requireProject(projectId);
    const report = this.requireReport(project.semantiqReportId);
    const analysis = [...this.analyses.values()].find((item) => item.questionId === project.sourceQuestionId);
    if (!analysis) throw new Error(`Analysis not found for project ${projectId}`);
    const approved = [...this.approvals.values()].find((approval) => analysis.refinements.some((variant) => variant.id === approval.suggestionId));
    const approvedRefinedQuestion = approved?.selectedText ?? analysis.refinements.find((item) => item.id === approved?.suggestionId)?.refinedText ?? analysis.originalQuestion;
    return {
      sprint1Export: this.sprint1.exportWorkspace(workspaceId, "json"),
      originalQuestion: analysis.originalQuestion,
      approvedRefinedQuestion,
      questionAnalysis: analysis,
      semantiqReports: this.getEvaluationHistory(project.sourceQuestionId),
      suggestedAndApprovedTags: analysis.tags,
      questionRelations: analysis.relationSuggestions,
      researchProject: project,
      evidence: project.evidenceIds.map((id) => this.requireEvidence(id)),
      hypotheses: project.hypothesisIds.map((id) => this.requireHypothesis(id)),
      researchTasks: project.taskIds.map((id) => this.requireTask(id)),
      auditTrail: this.events,
      promptAndEvaluatorVersions: [...sprint2PromptRegistry.map((prompt) => prompt.id), report.evaluationVersion.evaluatorVersion]
    };
  }

  providerContracts(): readonly AIProvider[] {
    return [this.provider];
  }

  promptRegistry(): readonly PromptRegistryEntry[] {
    return sprint2PromptRegistry;
  }

  eventsLog(): readonly Sprint2Event[] {
    return this.events;
  }

  private detectLanguage(question: string): string {
    return /[äöüß]/i.test(question) ? "de" : "en";
  }

  private detectIntent(question: string): readonly DetectedIntent[] {
    const lower = question.toLowerCase();
    const intents: DetectedIntent[] = [];
    const push = (type: QuestionIntent, confidence: number, triggers: readonly string[], action: string): void => {
      intents.push({ type, confidence, triggers, suggestedNextAction: action, explanation: `Detected ${type} intent from ${triggers.join(", ") || "general inquiry"} signals.` });
    };
    if (/\b(research|evidence|study|why|how)\b/.test(lower)) push("Research", 0.78, ["research/evidence/how"], "Create a research-ready refinement.");
    if (/\b(build|implement|system|code|architecture)\b/.test(lower)) push("Engineering", 0.72, ["build/system/code"], "Create a project-oriented plan.");
    if (/\b(learn|learning|understand|explain|teach|education)\b/.test(lower)) push("Learning", 0.68, ["learn/learning/understand/explain"], "Create a beginner and expert variant.");
    if (/\b(ethic|privacy|fair|risk)\b/.test(lower)) push("Ethical", 0.7, ["ethic/privacy/fair/risk"], "Add ethical review criteria.");
    if (intents.length === 0) push("Open Exploration", 0.55, ["open question"], "Clarify scope and desired output.");
    return intents;
  }

  private detectAmbiguity(question: string): readonly AmbiguityFinding[] {
    const lower = question.toLowerCase();
    const findings: AmbiguityFinding[] = [];
    if (question.length < 60) findings.push({ type: "context", severity: "medium", text: question, explanation: "The question is short and may lack context.", suggestion: "Add domain, audience, constraints, and expected output." });
    if (/\b(best|better|improve)\b/.test(lower)) findings.push({ type: "comparison-criteria", severity: "medium", text: "best/better/improve", explanation: "The evaluation criteria are undefined.", suggestion: "Specify whether quality means speed, accuracy, safety, cost, learning value, or rigor." });
    if (/\b(future|soon|recent|modern)\b/.test(lower)) findings.push({ type: "time-range", severity: "medium", text: "future/soon/recent/modern", explanation: "The time horizon is undefined.", suggestion: "Specify the time horizon, such as one year, five years, or a historical period." });
    if (/\b(people|users|students|community)\b/.test(lower)) findings.push({ type: "target-population", severity: "low", text: "people/users/students/community", explanation: "The target group may need definition.", suggestion: "Define the population or user segment." });
    return findings;
  }

  private detectAssumptions(question: string): readonly AssumptionFinding[] {
    const lower = question.toLowerCase();
    const assumptions: AssumptionFinding[] = [];
    if (/\b(improve|cause|lead|impact)\b/.test(lower)) assumptions.push({ type: "causal", statement: "This question may assume a causal relationship.", explanation: "The causal mechanism requires clarification and evidence.", confidence: 0.66 });
    if (/\b(best|better)\b/.test(lower)) assumptions.push({ type: "measurement", statement: "A possible unstated premise is that quality can be measured consistently.", explanation: "Define measurement criteria before ranking alternatives.", confidence: 0.7 });
    if (/\b(ai|model|automation)\b/.test(lower)) assumptions.push({ type: "technical", statement: "This question may assume the technology is available and appropriate.", explanation: "This requires clarification about tools, constraints, and acceptable risk.", confidence: 0.62 });
    return assumptions;
  }

  private suggestTags(question: string, intents: readonly DetectedIntent[], ambiguities: readonly AmbiguityFinding[]): readonly SemanticTag[] {
    const lower = question.toLowerCase();
    const tags: SemanticTag[] = [
      this.tag("language:en", "Language", "Detected by local character heuristics.", 0.8),
      ...intents.map((intent) => this.tag(intent.type.toLowerCase().replaceAll(" ", "-"), "Intent", intent.explanation, intent.confidence))
    ];
    if (/\b(evidence|data|source)\b/.test(lower)) tags.push(this.tag("evidence-needed", "Evidence need", "Question references evidence or data.", 0.75));
    if (/\b(research|study|hypothesis)\b/.test(lower)) tags.push(this.tag("research-ready-candidate", "Research stage", "Question has research-oriented language.", 0.7));
    if (ambiguities.length > 0) tags.push(this.tag("clarification-needed", "Risk", "Ambiguity findings require review.", 0.72));
    return tags;
  }

  private findDuplicates(question: QuestionRecord, tags: readonly SemanticTag[]): readonly DuplicateCandidate[] {
    const tagLabels = tags.map((tag) => tag.label);
    const tokens = new Set(words(question.text));
    const conceptList = [...tokens].filter((term) => term.length > 4).slice(0, 5);
    const similarityScore = clamp((tokens.size > 0 ? conceptList.length / tokens.size : 0) + (tagLabels.length > 2 ? 0.2 : 0));
    return similarityScore > 0.25
      ? [
          {
            questionId: `${question.id}:candidate`,
            similarityScore,
            strategies: ["normalized-text", "keyword-overlap", "tag-overlap", "graph-neighborhood-placeholder"],
            sharedTags: tagLabels.slice(0, 3),
            sharedConcepts: conceptList,
            differences: ["Candidate is generated for human review; no automatic merge is performed."],
            recommendedAction: similarityScore > 0.7 ? "Link as related" : "Keep separate"
          }
        ]
      : [];
  }

  private suggestRelations(question: QuestionRecord, duplicates: readonly DuplicateCandidate[]): readonly RelationSuggestion[] {
    return duplicates.map((candidate) => ({
      id: createId("relation-suggestion"),
      sourceId: question.id,
      targetId: candidate.questionId,
      relation: candidate.similarityScore > 0.7 ? "related_to" : "future_work",
      confidence: candidate.similarityScore,
      explanation: "Suggested from deterministic duplicate and related-question review.",
      evidence: candidate.sharedConcepts,
      approvalState: "Suggested"
    }));
  }

  private suggestRefinements(question: string, ambiguities: readonly AmbiguityFinding[], assumptions: readonly AssumptionFinding[]): readonly RefinementVariant[] {
    const normalized = question.trim().endsWith("?") ? question.trim() : `${question.trim()}?`;
    const contextNote = ambiguities.length ? " for a defined audience, context, and evaluation criterion" : "";
    const assumptionNote = assumptions.length ? " while making key assumptions explicit" : "";
    const variants: readonly [RefinementVariant["kind"], string, readonly string[], string][] = [
      ["Minimal correction", normalized, ["Trimmed whitespace", "Ensured question punctuation"], "Basic readability"],
      ["Clear version", `${normalized.replace(/\?$/, "")}${contextNote}?`, ["Added context prompt"], "Improves clarity"],
      ["Precise version", `Which measurable criteria should be used to answer: ${normalized}`, ["Added measurable criteria"], "Improves specificity"],
      ["Research-ready version", `What evidence would help evaluate ${normalized.replace(/\?$/, "").toLowerCase()}${assumptionNote}?`, ["Added evidence need", "Surfaced assumptions"], "Prepares research project creation"],
      ["Scientific version", `How could we test the claim behind: ${normalized}`, ["Added testability frame"], "Improves falsifiability"],
      ["Beginner version", `Can you explain ${normalized.replace(/\?$/, "").toLowerCase()} with examples?`, ["Added beginner-friendly framing"], "Improves accessibility"],
      ["Expert version", `What are the strongest competing explanations and evidence standards for: ${normalized}`, ["Added competing explanations"], "Improves rigor"],
      ["Project-oriented version", `What plan, evidence, and milestones are needed to investigate: ${normalized}`, ["Added project planning frame"], "Improves actionability"]
    ];
    return variants.map(([kind, refinedText, changesMade, expectedBenefit]) => ({
      id: createId("refinement"),
      kind,
      refinedText,
      changesMade,
      meaningPreservationNote: "Generated variant preserves the original topic and waits for user approval before application.",
      expectedBenefit,
      semantiqPreview: this.previewScore(refinedText, ambiguities, assumptions),
      confidence: 0.72,
      approvalState: "Suggested"
    }));
  }

  private scoreDimension(dimension: SemantiqDimension, question: string, analysis: QuestionAnalysis): SemantiqScore {
    const lower = question.toLowerCase();
    const tokens = words(question);
    const highMatches = dimension.rubric.highSignals.filter((signal) => lower.includes(signal.split(" ")[0] ?? signal));
    const weaknessMatches = dimension.rubric.weaknessSignals.filter((signal) => lower.includes(signal.split(" ")[0] ?? signal));
    const lengthSignal = clamp(tokens.length / 24);
    const ambiguityPenalty = dimension.id === "ambiguity" ? analysis.ambiguities.length * 0.12 : analysis.ambiguities.length * 0.03;
    const assumptionSignal = dimension.id === "assumption-visibility" ? Math.min(0.25, analysis.assumptions.length * 0.08) : 0;
    const rawScore = clamp(0.35 + lengthSignal * 0.25 + highMatches.length * 0.1 + assumptionSignal - weaknessMatches.length * 0.08 - ambiguityPenalty);
    const observations: SemantiqObservation[] = [
      { id: createId("observation"), dimensionId: dimension.id, text: `${tokens.length} meaningful terms detected.`, polarity: "neutral" },
      ...highMatches.map((signal) => ({ id: createId("observation"), dimensionId: dimension.id, text: `Positive signal: ${signal}.`, polarity: "strength" as const })),
      ...weaknessMatches.map((signal) => ({ id: createId("observation"), dimensionId: dimension.id, text: `Weakness signal: ${signal}.`, polarity: "weakness" as const }))
    ];
    const weaknesses = analysis.ambiguities.length > 0 ? analysis.ambiguities.slice(0, 2).map((item) => item.explanation) : weaknessMatches.map((signal) => `Potential weakness: ${signal}.`);
    return {
      dimensionId: dimension.id,
      score: rawScore,
      level: this.level(rawScore),
      explanation: `${dimension.label} score is deterministic and based on question length, rubric signals, ambiguity findings, and assumption visibility.`,
      observations,
      weaknesses,
      improvementSuggestions: weaknesses.length ? weaknesses.map((weakness) => `Address: ${weakness}`) : [`Maintain ${dimension.label.toLowerCase()} by preserving context and evidence criteria.`],
      confidence: 0.72,
      evaluationVersion: "rules-v1"
    };
  }

  private genericScore(dimensionId: string, text: string, confidence: number): SemantiqScore {
    const score = clamp(0.35 + words(text).length / 40 + confidence * 0.25);
    return {
      dimensionId,
      score,
      level: this.level(score),
      explanation: `${dimensionId} assessed with deterministic local evidence-quality heuristics; uncertainty is preserved.`,
      observations: [{ id: createId("observation"), dimensionId, text: "Evidence saved with provenance and citation fields.", polarity: "neutral" }],
      weaknesses: score < 0.7 ? ["Evidence needs corroboration or stronger method transparency."] : [],
      improvementSuggestions: ["Add corroborating sources, method notes, and conflict-of-interest review."],
      confidence: 0.65,
      evaluationVersion: "evidence-quality-rules-v1"
    };
  }

  private previewScore(question: string, ambiguities: readonly AmbiguityFinding[], assumptions: readonly AssumptionFinding[]): number {
    return clamp(0.45 + words(question).length / 50 - ambiguities.length * 0.05 + assumptions.length * 0.03);
  }

  private tag(label: string, category: SemanticTag["category"], explanation: string, confidence: number): SemanticTag {
    return {
      id: createId("tag"),
      label,
      category,
      confidence,
      explanation,
      source: "deterministic-local-rules",
      version: "1.0.0",
      approvalState: "Suggested"
    };
  }

  private approvedRelation(sourceId: string, targetId: string, relation: RelationSuggestionType, explanation: string): RelationSuggestion {
    return {
      id: createId("relation"),
      sourceId,
      targetId,
      relation,
      confidence: 0.8,
      explanation,
      evidence: [sourceId],
      approvalState: "Accepted"
    };
  }

  private level(score: number): SemantiqLevel {
    if (score >= 0.85) return "excellent";
    if (score >= 0.7) return "high";
    if (score >= 0.45) return "medium";
    return "low";
  }

  private emit(type: Sprint2EventType, actorId: string, workspaceId: string, payload: unknown, causationId: string): void {
    this.events.push({
      eventId: createId("event"),
      type,
      version: 1,
      timestamp: now(),
      actorId,
      workspaceId,
      correlationId: `corr:${workspaceId}`,
      causationId,
      payload,
      audit: { localFirst: true, externalRequest: false }
    });
  }

  private requireReport(reportId: string): SemantiqReport {
    const report = this.reports.get(reportId);
    if (!report) throw new Error(`Semantiq report not found: ${reportId}`);
    return report;
  }

  private requireProject(projectId: string): ResearchProjectRecord {
    const project = this.projects.get(projectId);
    if (!project) throw new Error(`Research project not found: ${projectId}`);
    return project;
  }

  private requireEvidence(evidenceId: string): EvidenceRecord {
    const evidence = this.evidence.get(evidenceId);
    if (!evidence) throw new Error(`Evidence not found: ${evidenceId}`);
    return evidence;
  }

  private requireHypothesis(hypothesisId: string): HypothesisRecord {
    const hypothesis = this.hypotheses.get(hypothesisId);
    if (!hypothesis) throw new Error(`Hypothesis not found: ${hypothesisId}`);
    return hypothesis;
  }

  private requireTask(taskId: string): ResearchTaskRecord {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Research task not found: ${taskId}`);
    return task;
  }
}
