/**
 * @package @tech-club/semantiq
 * Authoritative Reproducible Research Bundles Application Service
 *
 * Invariants:
 * 1. Cryptographic Merkle root computed over sorted component SHA-256 digests.
 * 2. Bundle integrity proves provenance/integrity, not truth.
 */

import type { ResearchBundle } from "../../../sandbox-contracts/src/index.js";
import {
  ResearchBundleBuilder,
  ResearchBundleVerifier,
  WorkspaceSnapshotEngine,
  type BuiltBundleResult,
  type BundleVerificationResult,
  type CreateWorkspaceSnapshotOptions,
  type ResearchBundleManifest,
  type WorkspaceSnapshot
} from "../../../evidence/src/index.js";
import type { ExportBundleRequest, ImportBundleResult } from "./types.js";
import type { RunsService } from "./runs-service.js";
import type { EvaluationsService } from "./evaluations-service.js";
import type { ClaimsService } from "./claims-service.js";

export class BundlesService {
  private readonly builder = new ResearchBundleBuilder();
  private readonly verifier = new ResearchBundleVerifier();
  private readonly snapshotEngine = new WorkspaceSnapshotEngine();

  constructor(
    private readonly runsService: RunsService,
    private readonly evaluationsService: EvaluationsService,
    private readonly claimsService: ClaimsService
  ) {}

  public createWorkspaceSnapshot(options: CreateWorkspaceSnapshotOptions): WorkspaceSnapshot {
    return this.snapshotEngine.createSnapshot(options);
  }

  public async exportResearchBundle(request: ExportBundleRequest): Promise<ResearchBundle> {
    const built = this.builder.buildBundle({
      bundleId: request.bundleId,
      title: request.title,
      author: request.author,
      runs: request.runs,
      evaluations: request.evaluations,
      claims: request.claims
    });
    return built.bundle;
  }

  public async buildFullBundle(request: ExportBundleRequest): Promise<BuiltBundleResult> {
    return this.builder.buildBundle({
      bundleId: request.bundleId,
      title: request.title,
      author: request.author,
      runs: request.runs,
      evaluations: request.evaluations,
      claims: request.claims
    });
  }

  public async verifyBundle(
    bundle: ResearchBundle,
    actualArtifacts?: ReadonlyMap<string, string> | Record<string, string> | undefined
  ): Promise<boolean> {
    const result = this.verifier.verifyBundle(bundle, actualArtifacts);
    return result.isValid;
  }

  public async verifyBundleDetailed(
    manifestOrBundle: ResearchBundleManifest | ResearchBundle,
    actualArtifacts?: ReadonlyMap<string, string> | Record<string, string> | undefined
  ): Promise<BundleVerificationResult> {
    return this.verifier.verifyBundle(manifestOrBundle, actualArtifacts);
  }

  public async importResearchBundle(bundle: ResearchBundle): Promise<ImportBundleResult> {
    const verified = await this.verifyBundle(bundle);
    if (!verified) {
      throw new Error(`Bundle cryptographic Merkle root verification failed: ${bundle.id}`);
    }

    const runsCount = bundle.includedArtifacts.filter((a) => a.path.startsWith("runs/")).length;
    const evalsCount = bundle.includedArtifacts.filter((a) =>
      a.path.startsWith("evaluations/")
    ).length;
    const claimsCount = bundle.includedArtifacts.filter((a) => a.path.startsWith("claims/")).length;

    return {
      verified: true,
      bundleId: bundle.id,
      importedClaimsCount: claimsCount,
      importedRunsCount: runsCount,
      importedEvaluationsCount: evalsCount
    };
  }
}
