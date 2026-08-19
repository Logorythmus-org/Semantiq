/**
 * @package @tech-club/semantiq
 * Authoritative Unified SemantIQ Application Service Facade
 *
 * Provides unified operations across all 9 domain areas:
 * 1. runs
 * 2. evaluations
 * 3. patterns
 * 4. evidence
 * 5. comparisons
 * 6. claims
 * 7. reviews
 * 8. studies
 * 9. bundles
 *
 * Invariants:
 * - CLI, Python SDK, TypeScript SDK, HTTP API, and future UIs consume these operations.
 * - No transport-specific models in domain services.
 */

import { RunsService } from "./runs-service.js";
import { EvaluationsService } from "./evaluations-service.js";
import { PatternsService } from "./patterns-service.js";
import { EvidenceService } from "./evidence-service.js";
import { ComparisonsService } from "./comparisons-service.js";
import { ClaimsService } from "./claims-service.js";
import { ReviewsService } from "./reviews-service.js";
import { StudiesService } from "./studies-service.js";
import { BundlesService } from "./bundles-service.js";

export class SemantiqApplicationService {
  public readonly runs: RunsService;
  public readonly evaluations: EvaluationsService;
  public readonly patterns: PatternsService;
  public readonly evidence: EvidenceService;
  public readonly comparisons: ComparisonsService;
  public readonly claims: ClaimsService;
  public readonly reviews: ReviewsService;
  public readonly studies: StudiesService;
  public readonly bundles: BundlesService;

  constructor() {
    this.runs = new RunsService();
    this.evaluations = new EvaluationsService();
    this.patterns = new PatternsService();
    this.evidence = new EvidenceService();
    this.comparisons = new ComparisonsService();
    this.claims = new ClaimsService();
    this.reviews = new ReviewsService(this.claims);
    this.studies = new StudiesService();
    this.bundles = new BundlesService(this.runs, this.evaluations, this.claims);
  }
}

/**
 * Factory function to create a fresh SemantiqApplicationService instance.
 */
export function createSemantiqApplicationService(): SemantiqApplicationService {
  return new SemantiqApplicationService();
}
