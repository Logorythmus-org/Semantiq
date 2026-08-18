export type BenchmarkSubjectKind =
  | "question"
  | "answer"
  | "discussion"
  | "observation"
  | "hypothesis"
  | "evidence"
  | "experiment"
  | "project"
  | "repository"
  | "dataset"
  | "research-paper"
  | "conversation"
  | "workflow"
  | "agent"
  | "narrative"
  | "book"
  | "video"
  | "game"
  | "presentation"
  | "community"
  | "knowledge-object";

export type EvaluationDimensionId =
  | "question-quality"
  | "reasoning-quality"
  | "semantic-consistency"
  | "conceptual-clarity"
  | "novelty"
  | "scientific-potential"
  | "evidence-quality"
  | "logical-structure"
  | "context-awareness"
  | "reflection"
  | "collaboration"
  | "teaching-value"
  | "innovation-potential"
  | "ethical-awareness"
  | "knowledge-density"
  | "interdisciplinary-thinking"
  | "reasoning"
  | "evidence"
  | "scientific-quality"
  | "educational-value"
  | "creativity"
  | "clarity"
  | "consistency"
  | "reusability"
  | "impact";

export type PipelineStageId =
  | "input"
  | "semantic-parsing"
  | "intent-analysis"
  | "context-analysis"
  | "knowledge-extraction"
  | "reasoning-analysis"
  | "evidence-analysis"
  | "creativity-analysis"
  | "consistency-analysis"
  | "scientific-potential"
  | "ethical-review"
  | "explainability"
  | "confidence-estimation"
  | "semantic-report"
  | "historical-comparison"
  | "recommendations";

export interface BenchmarkSubject<TContent = unknown> {
  readonly id: string;
  readonly kind: BenchmarkSubjectKind;
  readonly version: string;
  readonly title?: string;
  readonly content: TContent;
  readonly contextIds: readonly string[];
  readonly evidenceIds: readonly string[];
}

export interface EvaluationDimension {
  readonly id: EvaluationDimensionId;
  readonly version: string;
  readonly definition: string;
  readonly purpose: string;
  readonly rubric: readonly string[];
  readonly examples: readonly string[];
}

export interface ScoringProfile {
  readonly id: string;
  readonly version: string;
  readonly name: string;
  readonly weights: Readonly<Partial<Record<EvaluationDimensionId, number>>>;
  readonly domain?: "general" | "research" | "education" | "enterprise";
}

export interface DimensionScore {
  readonly dimensionId: EvaluationDimensionId;
  readonly score: number;
  readonly confidence: number;
  readonly explanation: string;
  readonly evidenceUsed: readonly string[];
  readonly strengths: readonly string[];
  readonly weaknesses: readonly string[];
  readonly improvementSuggestions: readonly string[];
}

export interface PipelineStageResult {
  readonly stageId: PipelineStageId;
  readonly version: string;
  readonly summary: string;
  readonly warnings: readonly string[];
  readonly outputs: Readonly<Record<string, unknown>>;
}

export interface BenchmarkReport {
  readonly id: string;
  readonly subjectId: string;
  readonly subjectKind: BenchmarkSubjectKind;
  readonly subjectVersion: string;
  readonly profileId: string;
  readonly profileVersion: string;
  readonly createdAt: string;
  readonly executiveSummary: string;
  readonly scores: readonly DimensionScore[];
  readonly weightedScore: number;
  readonly confidence: number;
  readonly stageResults: readonly PipelineStageResult[];
  readonly strengths: readonly string[];
  readonly weaknesses: readonly string[];
  readonly improvementRoadmap: readonly string[];
  readonly recommendations: readonly Recommendation[];
}

export interface ComparisonResult {
  readonly id: string;
  readonly subjectIds: readonly string[];
  readonly profileId: string;
  readonly createdAt: string;
  readonly summary: string;
  readonly deltas: Readonly<Record<string, number>>;
}

export interface BenchmarkHistory {
  readonly subjectId: string;
  readonly reportIds: readonly string[];
  readonly trendSummary: string;
  readonly regressionDetected: boolean;
  readonly milestones: readonly string[];
}

export interface Recommendation {
  readonly id: string;
  readonly type:
    | "better-question"
    | "missing-evidence"
    | "relevant-research"
    | "collaborator"
    | "repository"
    | "dataset"
    | "experiment"
    | "learning-path"
    | "project"
    | "game"
    | "community";
  readonly targetId?: string;
  readonly explanation: string;
  readonly sourceSignals: readonly string[];
}

export interface SemantiqEngine {
  evaluate(subject: BenchmarkSubject, profile: ScoringProfile): Promise<BenchmarkReport>;
  compare(
    subjects: readonly BenchmarkSubject[],
    profile: ScoringProfile
  ): Promise<ComparisonResult>;
  getHistory(subjectId: string): Promise<BenchmarkHistory>;
  recommend(report: BenchmarkReport): Promise<readonly Recommendation[]>;
  explain(reportId: string): Promise<string>;
  exportReport(reportId: string, format: "json" | "markdown"): Promise<string>;
}

export interface SemantiqEvent {
  readonly type:
    | "BenchmarkStarted"
    | "BenchmarkCompleted"
    | "ScoreUpdated"
    | "ComparisonCompleted"
    | "RecommendationGenerated"
    | "EvidenceGapDetected"
    | "KnowledgeExpanded"
    | "RegressionDetected"
    | "HistoricalMilestone";
  readonly version: number;
  readonly occurredAt: string;
  readonly subjectId?: string;
  readonly reportId?: string;
  readonly payload: unknown;
}
