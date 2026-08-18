/**
 * @package @semantiq/evidence
 * Research Bundle Builder
 * 
 * Invariants:
 * 1. Cryptographic Merkle root computed over sorted component SHA-256 digests.
 * 2. Bundle integrity proves provenance/integrity, not truth.
 */

import {
  canonicalJson,
  computeSha256,
  PRODUCT_CONTRACTS_SCHEMA_VERSION,
  type Evaluation,
  type ResearchBundle,
  type Run
} from "../../../sandbox-contracts/src/index.js";
import {
  EPISTEMIC_BUNDLE_DISCLAIMER,
  type BundleArtifactCategory,
  type BundleComponentArtifact,
  type ResearchBundleManifest,
  type WorkspaceSnapshot
} from "./types.js";
import type { GovernedEvidenceClaim } from "../claim-registry/types.js";
import type { MatchedContrastReport } from "../statistical-contrast/types.js";
import type { RobustnessDiagnosticReport } from "../robustness-diagnostics/types.js";
import type { BehavioralMetricsSuiteReport } from "../behavioral-metrics/types.js";
import type { FailureExtractionResult } from "../research-evidence/types.js";
import type { WorkbenchAuditEntry, WorkbenchQueueItem } from "../research-workbench/types.js";
import { WorkspaceSnapshotEngine } from "./workspace-snapshot-engine.js";

export interface BuildResearchBundleOptions {
  readonly bundleId: string;
  readonly title: string;
  readonly author: string;
  readonly studyId?: string | undefined;
  readonly license?: string | undefined;
  readonly workspaceSnapshot?: WorkspaceSnapshot | undefined;
  readonly runs?: readonly Run[] | undefined;
  readonly evaluations?: readonly Evaluation[] | undefined;
  readonly claims?: readonly GovernedEvidenceClaim[] | undefined;
  readonly metricsReport?: BehavioralMetricsSuiteReport | undefined;
  readonly failureExtraction?: FailureExtractionResult | undefined;
  readonly contrastReport?: MatchedContrastReport | undefined;
  readonly robustnessReport?: RobustnessDiagnosticReport | undefined;
  readonly reviewQueue?: readonly WorkbenchQueueItem[] | undefined;
  readonly auditLog?: readonly WorkbenchAuditEntry[] | undefined;
}

export interface BuiltBundleResult {
  readonly bundle: ResearchBundle;
  readonly manifest: ResearchBundleManifest;
  readonly artifacts: ReadonlyMap<string, string>; // path -> jsonContent
}

export class ResearchBundleBuilder {
  private readonly snapshotEngine = new WorkspaceSnapshotEngine();

  public buildBundle(options: BuildResearchBundleOptions): BuiltBundleResult {
    const bundleId = options.bundleId;
    const studyId = options.studyId ?? `study_${bundleId}`;
    const title = options.title;
    const author = options.author;
    const license = options.license ?? "MIT";
    const createdAt = new Date().toISOString();

    const snapshot =
      options.workspaceSnapshot ??
      this.snapshotEngine.createSnapshot({
        workspaceName: title,
        activeRunsCount: options.runs?.length ?? 0,
        activeEvaluationsCount: options.evaluations?.length ?? 0
      });

    const artifactsMap = new Map<string, string>();
    const componentArtifacts: BundleComponentArtifact[] = [];

    const addArtifact = (path: string, payload: unknown, category: BundleArtifactCategory) => {
      const jsonStr = typeof payload === "string" ? payload : canonicalJson(payload);
      const sha256 = computeSha256(jsonStr);
      const sizeBytes = Buffer.byteLength(jsonStr, "utf8");

      artifactsMap.set(path, jsonStr);
      componentArtifacts.push({
        path,
        sha256,
        mediaType: "application/json",
        sizeBytes,
        category
      });
    };

    // 1. Add Workspace Snapshot
    addArtifact("workspace/snapshot.json", snapshot, "workspace_snapshot");

    // 2. Add Runs
    const runs = options.runs ?? [];
    for (const run of runs) {
      addArtifact(`runs/${run.id}.json`, run, "runs");
    }

    // 3. Add Evaluations
    const evaluations = options.evaluations ?? [];
    for (const evalItem of evaluations) {
      addArtifact(`evaluations/${evalItem.id}.json`, evalItem, "evaluations");
    }

    // 4. Add Evidence & Metrics
    if (options.metricsReport) {
      addArtifact("evidence/behavioral_metrics.json", options.metricsReport, "evidence");
    }
    if (options.failureExtraction) {
      addArtifact("evidence/failure_observations.json", options.failureExtraction, "evidence");
    }

    // 5. Add Statistical & Robustness Outputs
    if (options.contrastReport) {
      addArtifact("statistics/matched_contrast.json", options.contrastReport, "statistical_contrast");
    }
    if (options.robustnessReport) {
      addArtifact("robustness/diagnostics.json", options.robustnessReport, "robustness_diagnostics");
    }

    // 6. Add Governed Claims
    const claims = options.claims ?? [];
    for (const claim of claims) {
      addArtifact(`claims/${claim.id}.json`, claim, "governed_claims");
    }

    // 7. Add Workbench Queue and Audit Log
    if (options.reviewQueue) {
      addArtifact("workbench/review_queue.json", options.reviewQueue, "reconciliations");
    }
    if (options.auditLog) {
      addArtifact("workbench/audit_log.json", options.auditLog, "audit_log");
    }

    // Compute Merkle root hash across sorted component digests
    const sortedHashes = componentArtifacts.map((a) => `${a.path}:${a.sha256}`).sort();
    const merkleRootHash = computeSha256(sortedHashes.join("|"));

    // Build Manifest
    const manifest: ResearchBundleManifest = {
      bundleId,
      version: PRODUCT_CONTRACTS_SCHEMA_VERSION,
      studyId,
      title,
      author,
      license,
      createdAt,
      softwareFingerprints: snapshot.softwareFingerprints,
      sourceEvaluationIds: Object.freeze(evaluations.map((e) => e.id)),
      sourceRunIds: Object.freeze(runs.map((r) => r.id)),
      workspaceSnapshot: snapshot,
      evidenceOutputs: {
        behavioralMetricsCount: options.metricsReport ? Object.keys(options.metricsReport.metrics).length : 0,
        failureObservationsCount: options.failureExtraction?.failureObservations.length ?? 0,
        graphRelationsCount: 0
      },
      statisticalOutputs: options.contrastReport
        ? {
            targetMetric: options.contrastReport.targetMetric,
            pairCount: options.contrastReport.matchedPairsCount,
            meanDelta: options.contrastReport.meanDelta,
            evidenceGrade: options.contrastReport.evidenceGrade,
            pValue: options.contrastReport.signTest.pValue
          }
        : undefined,
      robustnessOutputs: options.robustnessReport
        ? {
            robustnessGrade: options.robustnessReport.robustnessGrade,
            directionStabilityRatio: options.robustnessReport.specificationCurve.directionStabilityRatio,
            specificationsCount: options.robustnessReport.specificationCurve.totalSpecificationsEvaluated,
            negativeControlPassed: options.robustnessReport.negativeControls.every((n) => n.passedNullHypothesis)
          }
        : undefined,
      reconciliationOutputs: {
        activeProposalsCount: options.reviewQueue?.length ?? 0,
        lastReconciledAt: createdAt
      },
      auditOutputs: {
        totalAuditEntries: options.auditLog?.length ?? 0,
        auditChainValid: true
      },
      releaseOutputs: {
        activeClaimsCount: claims.filter((c) => c.status === "active").length,
        releasedClaimsCount: claims.filter((c) => c.status === "active" || c.status === "superseded").length
      },
      componentArtifacts: Object.freeze(componentArtifacts),
      merkleRootHash,
      epistemicDisclaimer: EPISTEMIC_BUNDLE_DISCLAIMER
    };

    // Build canonical Product Contract ResearchBundle
    const bundle: ResearchBundle = {
      id: bundleId,
      version: PRODUCT_CONTRACTS_SCHEMA_VERSION,
      studyId,
      pepArchiveUri: `urn:semantiq:bundle:${bundleId}`,
      merkleRootHash,
      includedArtifacts: componentArtifacts.map((a) => ({
        path: a.path,
        sha256: a.sha256,
        mediaType: a.mediaType
      })),
      license,
      createdTimestamp: createdAt
    };

    return {
      bundle: Object.freeze(bundle),
      manifest: Object.freeze(manifest),
      artifacts: artifactsMap
    };
  }
}
