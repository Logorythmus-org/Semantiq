import { describe, expect, it } from "vitest";
import {
  DatasetCaseRegistry,
  EPISTEMIC_REPRODUCIBILITY_DISCLAIMER,
  EvaluationLedgerEngine
} from "../../packages/evidence/src/index.js";
import { EvidenceConfidence } from "../../packages/sandbox-contracts/src/product-contracts.js";

describe("Immutable Evaluation Ledger & Dataset/Case Registry", () => {
  const registry = new DatasetCaseRegistry();
  const ledger = new EvaluationLedgerEngine();

  const sampleRecords = [
    { id: "case_01", prompt: "Explain quantum superposition", expected: "explanation" },
    { id: "case_02", prompt: "Evaluate tool call boundaries", expected: "tool_isolation" }
  ];

  it("registers dataset sources and creates immutable snapshots with fingerprints", () => {
    const source = registry.registerSource({
      id: "ds_custom_hacs",
      name: "Custom HACS Dataset",
      sourceType: "git",
      uri: "https://github.com/example/custom-hacs.git",
      license: "Apache-2.0",
      description: "Custom test scenarios"
    });

    expect(source.id).toBe("ds_custom_hacs");

    const snapshot = registry.createSnapshot({
      datasetSourceId: "ds_custom_hacs",
      versionTag: "v1.0.0",
      records: sampleRecords
    });

    expect(snapshot.id).toBe("dss_ds_custom_hacs_v1_0_0");
    expect(snapshot.contentFingerprint).toHaveLength(64);
    expect(snapshot.schemaFingerprint).toHaveLength(64);
    expect(snapshot.recordCount).toBe(2);
    expect(snapshot.isImmutable).toBe(true);

    // Attempting to recreate the same snapshot must throw
    expect(() =>
      registry.createSnapshot({
        datasetSourceId: "ds_custom_hacs",
        versionTag: "v1.0.0",
        records: sampleRecords
      })
    ).toThrow(/already exists and is immutable/);
  });

  it("registers a CaseStudy linking benchmarks, dataset snapshots, and test cases", () => {
    const caseStudy = registry.registerCaseStudy({
      id: "cs_quantum_hacs_01",
      benchmarkId: "bm_hacs_v1",
      datasetSnapshotId: "dss_ds_custom_hacs_v1_0_0",
      title: "HACS Quantum Superposition & Boundary Exploration",
      caseIds: ["case_01", "case_02"],
      hypothesis: "Agents equipped with memory isolation will maintain 100% constraint compliance.",
      evaluationParameters: { temperature: 0.0, maxSteps: 10 },
      authorIdentity: "researcher@semantiq.org"
    });

    expect(caseStudy.id).toBe("cs_quantum_hacs_01");
    expect(registry.getCaseStudy("cs_quantum_hacs_01")).toBeDefined();
    expect(registry.listCaseStudies("bm_hacs_v1").length).toBe(1);
  });

  it("appends evaluation records to the immutable ledger with cryptographic state chaining", () => {
    const entry1 = ledger.appendEvaluation({
      evaluationId: "eval_001",
      runId: "run_001",
      benchmarkId: "bm_hacs_v1",
      caseStudyId: "cs_quantum_hacs_01",
      datasetSnapshotId: "dss_ds_custom_hacs_v1_0_0",
      contentFingerprint: "a".repeat(64),
      configFingerprint: "b".repeat(64),
      overallScore: 0.95,
      confidence: EvidenceConfidence.DETERMINISTIC,
      environmentFingerprint: "c".repeat(64),
      deterministicSeed: 42,
      toolchainVersion: "node-22.10.7"
    });

    const entry2 = ledger.appendEvaluation({
      evaluationId: "eval_002",
      runId: "run_002",
      benchmarkId: "bm_hacs_v1",
      caseStudyId: "cs_quantum_hacs_01",
      datasetSnapshotId: "dss_ds_custom_hacs_v1_0_0",
      contentFingerprint: "a".repeat(64),
      configFingerprint: "b".repeat(64),
      overallScore: 0.95,
      confidence: EvidenceConfidence.DETERMINISTIC,
      environmentFingerprint: "c".repeat(64),
      deterministicSeed: 42,
      toolchainVersion: "node-22.10.7"
    });

    expect(entry1.ledgerIndex).toBe(0);
    expect(entry1.previousEntryHash).toBe("0".repeat(64));
    expect(entry1.currentEntryHash).toHaveLength(64);

    expect(entry2.ledgerIndex).toBe(1);
    expect(entry2.previousEntryHash).toBe(entry1.currentEntryHash);

    // Verify Epistemic Disclaimer
    expect(entry1.reproducibility.epistemicDisclaimer).toBe(
      EPISTEMIC_REPRODUCIBILITY_DISCLAIMER
    );
    expect(entry1.reproducibility.epistemicDisclaimer).toBe(
      "Stable fingerprints prove artifact/config reproducibility, not scientific replication."
    );

    // Verify ledger integrity
    const verification = ledger.verifyLedgerIntegrity();
    expect(verification.valid).toBe(true);
    expect(verification.totalEntries).toBe(2);
  });

  it("verifies config & content fingerprint reproducibility across multiple evaluation runs", () => {
    const history = ledger.getHistory();
    const entry1 = history[0]!;
    const entry2 = history[1]!;

    const reproCheck = ledger.verifyReproducibility(entry1, entry2);
    expect(reproCheck.reproducible).toBe(true);
    expect(reproCheck.contentMatch).toBe(true);
    expect(reproCheck.configMatch).toBe(true);
    expect(reproCheck.scoreDelta).toBe(0.0);
    expect(reproCheck.disclaimer).toBe(
      "Stable fingerprints prove artifact/config reproducibility, not scientific replication."
    );
  });

  it("supports querying history by runId, caseStudyId, and datasetSnapshotId", () => {
    const runEntries = ledger.getEntriesForRun("run_001");
    expect(runEntries.length).toBe(1);
    expect(runEntries[0]?.evaluationId).toBe("eval_001");

    const studyEntries = ledger.getEntriesForCaseStudy("cs_quantum_hacs_01");
    expect(studyEntries.length).toBe(2);

    const snapshotEntries = ledger.getEntriesForDatasetSnapshot("dss_ds_custom_hacs_v1_0_0");
    expect(snapshotEntries.length).toBe(2);
  });
});
