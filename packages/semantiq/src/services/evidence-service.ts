/**
 * @package @tech-club/semantiq
 * Authoritative Evidence Application Service
 */

import {
  BehavioralMetricsEngine,
  EvidenceGraphEngine,
  FailureEvidenceExtractor,
  ResearchClaimStore,
  type BehavioralMetricsSuiteReport,
  type ComparativeQuery,
  type ComparativeQueryResult,
  type ExtractFailureOptions,
  type FailureExtractionResult,
  type RelationObservation,
  type ResearchClaim,
  type ResearchSource
} from "../../../evidence/src/index.js";

export class EvidenceService {
  private readonly metricsEngine = new BehavioralMetricsEngine();
  private readonly failureExtractor = new FailureEvidenceExtractor();
  private readonly claimStore = new ResearchClaimStore();
  private readonly evidenceGraph = new EvidenceGraphEngine();

  public async computeBehavioralMetrics(
    evaluationTargetId: string,
    inputs: Record<string, Record<string, unknown>>
  ): Promise<BehavioralMetricsSuiteReport> {
    return this.metricsEngine.evaluateMetricsSuite(evaluationTargetId, inputs);
  }

  public async extractFailureEvidence(
    options: ExtractFailureOptions
  ): Promise<FailureExtractionResult> {
    return this.failureExtractor.extractFailureEvidence(options);
  }

  public async recordResearchSource(source: Omit<ResearchSource, "extractedAt">): Promise<ResearchSource> {
    return this.claimStore.registerSource(source);
  }

  public async recordResearchClaim(claim: Omit<ResearchClaim, "id"> & { id?: string }): Promise<ResearchClaim> {
    return this.claimStore.registerClaim(claim);
  }

  public async recordRelationObservation(
    obs: Omit<RelationObservation, "id" | "recordedAt"> & { id?: string }
  ): Promise<RelationObservation> {
    return this.evidenceGraph.addObservation(obs);
  }

  public async queryEvidenceGraph(
    query: ComparativeQuery
  ): Promise<ComparativeQueryResult> {
    return this.evidenceGraph.executeComparativeQuery(query);
  }
}
