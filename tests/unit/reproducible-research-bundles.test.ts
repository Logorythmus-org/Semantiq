import { describe, it, expect } from "vitest";
import {
  WorkspaceSnapshotEngine,
  ResearchBundleBuilder,
  ResearchBundleVerifier,
  EPISTEMIC_BUNDLE_DISCLAIMER
} from "../../packages/evidence/src/research-bundles/index.js";
import { createSemantiqApplicationService } from "../../packages/semantiq/src/services/index.js";
import {
  ProductRunStatus,
  EvaluationStatus,
  type Run,
  type Evaluation
} from "../../packages/sandbox-contracts/src/product-contracts.js";

describe("Reproducible Research Bundles & Workspace Snapshot (Prompt 26)", () => {
  const snapshotEngine = new WorkspaceSnapshotEngine();
  const builder = new ResearchBundleBuilder();
  const verifier = new ResearchBundleVerifier();

  describe("1. WorkspaceSnapshot & Software Fingerprints", () => {
    it("creates deterministic software fingerprints and workspace snapshot", () => {
      const snapshot1 = snapshotEngine.createSnapshot({
        workspaceName: "Benchmark Experiment Alpha",
        activeRunsCount: 5,
        activeEvaluationsCount: 5,
        deterministicSeed: 42,
        toolchainVersion: "1.0.0"
      });

      expect(snapshot1.snapshotId).toContain("ws_snap_");
      expect(snapshot1.softwareFingerprints.runtime).toContain("Node.js");
      expect(snapshot1.softwareFingerprints.deterministicSeed).toBe(42);
      expect(snapshot1.softwareFingerprints.environmentFingerprint).toHaveLength(64);
      expect(snapshot1.snapshotSha256).toHaveLength(64);

      // Reproducibility across identical environment inputs
      const snapshot2 = snapshotEngine.createSnapshot({
        workspaceName: "Benchmark Experiment Alpha",
        activeRunsCount: 5,
        activeEvaluationsCount: 5,
        deterministicSeed: 42,
        toolchainVersion: "1.0.0"
      });
      expect(snapshot2.softwareFingerprints.environmentFingerprint).toBe(
        snapshot1.softwareFingerprints.environmentFingerprint
      );
    });
  });

  describe("2. ResearchBundleBuilder & Manifest Generation", () => {
    const mockRun: Run = {
      id: "run_bundle_001",
      version: "1.0.0",
      benchmarkId: "bmk_anti_gaming_v1",
      systemProfileId: "sys_claude_35",
      status: ProductRunStatus.COMPLETED,
      startedAt: "2026-08-18T10:00:00.000Z",
      completedAt: "2026-08-18T10:00:05.000Z",
      traceIds: ["trace_001"],
      environmentMetadata: {
        provider: "local_docker",
        platform: "win32",
        isOfflineDeterministic: true
      }
    };

    const mockEvaluation: Evaluation = {
      id: "eval_bundle_001",
      version: "1.0.0",
      runId: "run_bundle_001",
      benchmarkId: "bmk_anti_gaming_v1",
      systemProfileId: "sys_claude_35",
      status: EvaluationStatus.PASSED,
      overallScore: 0.95,
      scoreBreakdown: {
        accuracy: { score: 0.95, weight: 1.0, status: "passed" }
      },
      observationIds: ["obs_001"],
      claimIds: ["claim_001"],
      generatedAt: "2026-08-18T10:00:06.000Z"
    };

    it("builds sealed ResearchBundle and manifest with cryptographic Merkle root hash", () => {
      const built = builder.buildBundle({
        bundleId: "bundle_alpha_001",
        title: "Mitigation DP-001 Robustness Study",
        author: "Dr. Researcher",
        runs: [mockRun],
        evaluations: [mockEvaluation]
      });

      expect(built.bundle.id).toBe("bundle_alpha_001");
      expect(built.bundle.merkleRootHash).toHaveLength(64);
      expect(built.bundle.includedArtifacts.length).toBeGreaterThanOrEqual(3); // snapshot, run, eval

      expect(built.manifest.bundleId).toBe("bundle_alpha_001");
      expect(built.manifest.merkleRootHash).toBe(built.bundle.merkleRootHash);
      expect(built.manifest.epistemicDisclaimer).toBe(EPISTEMIC_BUNDLE_DISCLAIMER);
      expect(built.manifest.sourceRunIds).toContain("run_bundle_001");
      expect(built.manifest.sourceEvaluationIds).toContain("eval_bundle_001");
    });
  });

  describe("3. ResearchBundleVerifier & Tamper Detection", () => {
    const mockRun: Run = {
      id: "run_bundle_002",
      version: "1.0.0",
      benchmarkId: "bmk_anti_gaming_v1",
      systemProfileId: "sys_claude_35",
      status: ProductRunStatus.COMPLETED,
      startedAt: "2026-08-18T10:00:00.000Z",
      traceIds: [],
      environmentMetadata: { provider: "local", platform: "win32", isOfflineDeterministic: true }
    };

    it("verifies untampered bundle successfully", () => {
      const built = builder.buildBundle({
        bundleId: "bundle_verify_001",
        title: "Clean Verification Test",
        author: "Auditor",
        runs: [mockRun]
      });

      const verification = verifier.verifyBundle(built.manifest, built.artifacts);
      expect(verification.isValid).toBe(true);
      expect(verification.tamperDetected).toBe(false);
      expect(verification.merkleRootValid).toBe(true);
      expect(verification.corruptedArtifacts).toHaveLength(0);
      expect(verification.missingArtifacts).toHaveLength(0);
      expect(verification.epistemicDisclaimer).toBe(EPISTEMIC_BUNDLE_DISCLAIMER);
    });

    it("detects corrupted artifact payload", () => {
      const built = builder.buildBundle({
        bundleId: "bundle_tamper_001",
        title: "Tamper Detection Test",
        author: "Auditor",
        runs: [mockRun]
      });

      const tamperedArtifacts = new Map(built.artifacts);
      tamperedArtifacts.set("runs/run_bundle_002.json", '{"tampered": true}');

      const verification = verifier.verifyBundle(built.manifest, tamperedArtifacts);
      expect(verification.isValid).toBe(false);
      expect(verification.tamperDetected).toBe(true);
      expect(verification.corruptedArtifacts).toContain("runs/run_bundle_002.json");
    });

    it("detects missing artifact in payload map", () => {
      const built = builder.buildBundle({
        bundleId: "bundle_missing_001",
        title: "Missing Artifact Test",
        author: "Auditor",
        runs: [mockRun]
      });

      const incompleteArtifacts = new Map(built.artifacts);
      incompleteArtifacts.delete("runs/run_bundle_002.json");

      const verification = verifier.verifyBundle(built.manifest, incompleteArtifacts);
      expect(verification.isValid).toBe(false);
      expect(verification.tamperDetected).toBe(true);
      expect(verification.missingArtifacts).toContain("runs/run_bundle_002.json");
    });
  });

  describe("4. Unified Application Service Bundles Integration", () => {
    it("exports, details, and verifies bundles through BundlesService", async () => {
      const service = createSemantiqApplicationService();

      const snapshot = service.bundles.createWorkspaceSnapshot({
        workspaceName: "Service Workbench Snapshot"
      });
      expect(snapshot.snapshotId).toBeDefined();

      const built = await service.bundles.buildFullBundle({
        bundleId: "bundle_srv_001",
        title: "Service Bundle Study",
        author: "Lead Scientist",
        runs: [],
        evaluations: [],
        claims: []
      });

      expect(built.bundle.merkleRootHash).toBeDefined();

      const isVerified = await service.bundles.verifyBundle(built.bundle);
      expect(isVerified).toBe(true);

      const detailedAudit = await service.bundles.verifyBundleDetailed(built.manifest, built.artifacts);
      expect(detailedAudit.isValid).toBe(true);
      expect(detailedAudit.merkleRootValid).toBe(true);
    });
  });
});
