/**
 * @package @tech-club/semantiq
 * Authoritative Bundles Application Service
 */

import {
  PRODUCT_CONTRACTS_SCHEMA_VERSION,
  type ResearchBundle
} from "../../../sandbox-contracts/src/index.js";
import { computeSha256 } from "../../../sandbox-contracts/src/index.js";
import type { ExportBundleRequest, ImportBundleResult } from "./types.js";
import type { RunsService } from "./runs-service.js";
import type { EvaluationsService } from "./evaluations-service.js";
import type { ClaimsService } from "./claims-service.js";

export class BundlesService {
  constructor(
    private readonly runsService: RunsService,
    private readonly evaluationsService: EvaluationsService,
    private readonly claimsService: ClaimsService
  ) {}

  public async exportResearchBundle(request: ExportBundleRequest): Promise<ResearchBundle> {
    const includedArtifacts = [
      ...request.runs.map((r) => ({
        path: `runs/${r.id}.json`,
        sha256: computeSha256(JSON.stringify(r)),
        mediaType: "application/json"
      })),
      ...request.evaluations.map((e) => ({
        path: `evaluations/${e.id}.json`,
        sha256: computeSha256(JSON.stringify(e)),
        mediaType: "application/json"
      })),
      ...request.claims.map((c) => ({
        path: `claims/${c.id}.json`,
        sha256: computeSha256(JSON.stringify(c)),
        mediaType: "application/json"
      }))
    ];

    const rawPayload = includedArtifacts.map((a) => `${a.path}:${a.sha256}`).join("|");
    const merkleRootHash = computeSha256(rawPayload);

    const bundle: ResearchBundle = {
      id: request.bundleId,
      version: PRODUCT_CONTRACTS_SCHEMA_VERSION,
      studyId: `study_${request.bundleId}`,
      pepArchiveUri: `urn:semantiq:bundle:${request.bundleId}`,
      merkleRootHash,
      includedArtifacts,
      license: "MIT",
      createdTimestamp: new Date().toISOString()
    };

    return Object.freeze(bundle);
  }

  public async verifyBundle(bundle: ResearchBundle): Promise<boolean> {
    if (!bundle.merkleRootHash || bundle.merkleRootHash.length !== 64) {
      return false;
    }
    const rawPayload = bundle.includedArtifacts.map((a) => `${a.path}:${a.sha256}`).join("|");
    const expected = computeSha256(rawPayload);
    return bundle.merkleRootHash === expected;
  }

  public async importResearchBundle(bundle: ResearchBundle): Promise<ImportBundleResult> {
    const verified = await this.verifyBundle(bundle);
    if (!verified) {
      throw new Error(`Bundle cryptographic merkle root verification failed: ${bundle.id}`);
    }

    const runsCount = bundle.includedArtifacts.filter((a) => a.path.startsWith("runs/")).length;
    const evalsCount = bundle.includedArtifacts.filter((a) => a.path.startsWith("evaluations/")).length;
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
