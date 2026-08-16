import type {
  BenchmarkReport,
  BenchmarkSubject,
  DimensionScore,
  EvaluationDimensionId,
  PipelineStageResult,
  Recommendation,
  ScoringProfile
} from "./contracts.js";

export interface SemanticAnalyzerResult {
  readonly concepts: readonly string[];
  readonly missingEvidence: boolean;
  readonly claritySignals: readonly string[];
}

export interface SemantiqRuntimeResult {
  readonly report: BenchmarkReport;
  readonly analyzer: SemanticAnalyzerResult;
}

const dimensions: readonly EvaluationDimensionId[] = [
  "reasoning",
  "evidence",
  "scientific-quality",
  "educational-value",
  "novelty",
  "creativity",
  "collaboration",
  "clarity",
  "consistency",
  "reusability",
  "impact",
  "reflection"
];

const createId = (prefix: string): string =>
  `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2)}`;

export class ExplainableSemantiqRuntime {
  private readonly reports = new Map<string, BenchmarkReport>();

  async runSemantiq(
    subject: BenchmarkSubject,
    profile: ScoringProfile
  ): Promise<SemantiqRuntimeResult> {
    const analyzer = this.analyze(subject);
    const scores = dimensions.map((dimensionId) => this.score(dimensionId, subject, analyzer));
    const weightedScore = this.weight(scores, profile);
    const stageResults: readonly PipelineStageResult[] = [
      {
        stageId: "semantic-parsing",
        version: "1.0.0",
        summary: `Extracted ${analyzer.concepts.length} concepts.`,
        warnings: analyzer.missingEvidence ? ["Evidence references are missing."] : [],
        outputs: { concepts: analyzer.concepts }
      },
      {
        stageId: "reasoning-analysis",
        version: "1.0.0",
        summary: "Reasoning signals evaluated with deterministic local heuristics.",
        warnings: [],
        outputs: { weightedScore }
      },
      {
        stageId: "recommendations",
        version: "1.0.0",
        summary: "Recommendations generated from low-scoring dimensions.",
        warnings: [],
        outputs: {}
      }
    ];
    const report: BenchmarkReport = {
      id: createId("semantiq-report"),
      subjectId: subject.id,
      subjectKind: subject.kind,
      subjectVersion: subject.version,
      profileId: profile.id,
      profileVersion: profile.version,
      createdAt: new Date().toISOString(),
      executiveSummary: `Explainable Semantiq runtime report for ${subject.kind} ${subject.id}.`,
      scores,
      weightedScore,
      confidence: scores.reduce((sum, score) => sum + score.confidence, 0) / scores.length,
      stageResults,
      strengths: scores.flatMap((score) => score.strengths).slice(0, 6),
      weaknesses: scores.flatMap((score) => score.weaknesses).slice(0, 6),
      improvementRoadmap: scores.flatMap((score) => score.improvementSuggestions).slice(0, 8),
      recommendations: this.recommendFromScores(scores)
    };
    this.reports.set(report.id, report);
    return { report, analyzer };
  }

  async explainScore(reportId: string): Promise<string> {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error(`Semantiq report not found: ${reportId}`);
    }
    return report.scores
      .map((score) => `${score.dimensionId}: ${score.score.toFixed(2)} - ${score.explanation}`)
      .join("\n");
  }

  private analyze(subject: BenchmarkSubject): SemanticAnalyzerResult {
    const text = JSON.stringify(subject.content).toLowerCase();
    const concepts = [...new Set(text.match(/[a-z][a-z-]{3,}/g) ?? [])].slice(0, 20);
    return {
      concepts,
      missingEvidence: subject.evidenceIds.length === 0,
      claritySignals: text.includes("?") ? ["question-framed"] : []
    };
  }

  private score(
    dimensionId: EvaluationDimensionId,
    subject: BenchmarkSubject,
    analyzer: SemanticAnalyzerResult
  ): DimensionScore {
    const contentLength = JSON.stringify(subject.content).length;
    const evidenceBonus = analyzer.missingEvidence ? 0 : 0.2;
    const base = Math.min(1, Math.max(0.15, contentLength / 1200 + evidenceBonus));
    const score =
      dimensionId === "evidence" && analyzer.missingEvidence ? Math.min(base, 0.45) : base;
    return {
      dimensionId,
      score,
      confidence: 0.7,
      explanation: `Score uses content depth, concept extraction, and evidence availability for ${dimensionId}.`,
      evidenceUsed: subject.evidenceIds,
      strengths: analyzer.concepts.length > 3 ? ["Multiple semantic concepts detected."] : [],
      weaknesses: analyzer.missingEvidence ? ["No evidence references were attached."] : [],
      improvementSuggestions: [
        `Improve ${dimensionId} with explicit evidence, context, and examples.`
      ]
    };
  }

  private weight(scores: readonly DimensionScore[], profile: ScoringProfile): number {
    const weights = scores.map((score) => profile.weights[score.dimensionId] ?? 1);
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    return scores.reduce((sum, score, index) => sum + score.score * weights[index]!, 0) / total;
  }

  private recommendFromScores(scores: readonly DimensionScore[]): readonly Recommendation[] {
    return scores
      .filter((score) => score.score < 0.6)
      .map((score) => ({
        id: createId("semantiq-recommendation"),
        type: score.dimensionId === "evidence" ? "missing-evidence" : "better-question",
        explanation: score.improvementSuggestions[0] ?? `Improve ${score.dimensionId}.`,
        sourceSignals: [score.dimensionId]
      }));
  }
}
