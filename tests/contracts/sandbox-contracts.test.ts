import { describe, it, expect } from "vitest";
import {
  type EnvironmentSpec,
  computeSha256,
  canonicalJson,
  computeSpecHash,
  computeMerkleRoot,
  generateProvenance,
  environmentSpecSchema,
  executionRequestSchema,
  executionResultSchema,
  providerEcosystemDescriptorSchema,
  costAttributionRecordSchema,
  providerMarketplaceListingSchema,
  marketplaceDiscoveryQuerySchema,
  economicPricingModelSchema,
  evaluationGrantAllocationSchema,
  economicExecutionReceiptSchema,
  providerLicensingManifestSchema,
  complianceAttributionPackageSchema,
  canonicalProviderRegistryEntrySchema,
  holisticExecutionCostLedgerSchema,
  verifiableBenchmarkExecutionReceiptSchema,
  portableEvidencePackageSchema,
  transitionAnalysisReportSchema,
  semanticStressEvaluationReportSchema,
  failureInjectionReportSchema,
  recoveryResilienceScorecardSchema,
  consequenceEvaluationReportSchema,
  longHorizonEvaluationReportSchema,
  sandboxBenchmarkDSLSchema,
  runRecordSchema,
  cliRunResultSchema,
  routingDecisionRecordSchema,
  providerConformanceCertificateSchema,
  providerCertificationScorecardSchema,
  providerSecurityAuditReportSchema,
  integrityVerificationReportSchema,
  antiGamingScorecardSchema,
  independentObservationBundleSchema,
  comprehensiveEvidenceProvenanceGraphSchema,
  crossModelProviderComparisonReportSchema,
  dashboardStateSnapshotSchema,
  canonicalBenchmarkReportSchema,
  sandboxPhaseSecurityAuditReportSchema,
  sandboxEconomicAuditReportSchema,
  sandboxArchitectureAuditReportSchema,
  spisProviderInteroperabilityManifestSchema,
  sandboxPhaseCompletionReportSchema,
  sandboxReleaseGateDecisionSchema
} from "../../packages/sandbox-contracts/src/index.js";

describe("Sandbox Contracts & Cryptographic Utilities", () => {
  const sampleSpec: EnvironmentSpec = {
    specVersion: "1.0.0",
    runtimeType: "container",
    image: {
      name: "python:3.11-slim",
      digest: "sha256:ba822f60cf6ae44304d8f1618793ed09ac3cb6bc8b5368d653c0b8dc7c2f0ad0"
    },
    workingDirectory: "/workspace",
    resources: {
      cpuLimitCores: 2,
      memoryLimitMebibytes: 2048,
      diskLimitMebibytes: 5120,
      maxExecutionTimeoutSeconds: 300
    },
    security: {
      networkMode: "none",
      readOnlyRootFilesystem: true
    }
  };

  it("computes deterministic SHA256 checksums", () => {
    const hash = computeSha256("SemantIQ Sandbox");
    expect(hash).toHaveLength(64);
    expect(computeSha256("SemantIQ Sandbox")).toBe(hash);
  });

  it("produces canonical JSON sorting keys deterministically", () => {
    const obj1 = { b: 2, a: 1, c: { y: 2, x: 1 } };
    const obj2 = { a: 1, c: { x: 1, y: 2 }, b: 2 };
    expect(canonicalJson(obj1)).toBe(canonicalJson(obj2));
    expect(canonicalJson(obj1)).toBe('{"a":1,"b":2,"c":{"x":1,"y":2}}');
  });

  it("computes deterministic SpecHash for EnvironmentSpec", () => {
    const hash1 = computeSpecHash(sampleSpec);
    const hash2 = computeSpecHash({ ...sampleSpec });
    expect(hash1).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(hash1).toBe(hash2);
  });

  it("computes deterministic Merkle Root for file entries", () => {
    const files = [
      { path: "/workspace/b.py", sha256: "sha256_b" },
      { path: "/workspace/a.py", sha256: "sha256_a" }
    ];
    const root1 = computeMerkleRoot(files);
    const root2 = computeMerkleRoot([...files].reverse());
    expect(root1).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(root1).toBe(root2);
  });

  it("generates complete SandboxProvenance record", () => {
    const provenance = generateProvenance(
      sampleSpec,
      "local-oci",
      "1.0.0",
      "1.0.0",
      "seed-42",
      "HERMETIC_DETERMINISTIC"
    );

    expect(provenance.providerId).toBe("local-oci");
    expect(provenance.specHash).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(provenance.imageDigest).toBe(sampleSpec.image.digest);
    expect(provenance.reproducibilityTier).toBe("HERMETIC_DETERMINISTIC");
    expect(provenance.deterministicSeed).toBe("seed-42");
  });

  it("exports valid JSON Schemas", () => {
    expect(environmentSpecSchema.$id).toContain("environment-spec.json");
    expect(executionRequestSchema.$id).toContain("execution-request.json");
    expect(executionResultSchema.$id).toContain("execution-result.json");
    expect(providerEcosystemDescriptorSchema.$id).toContain("provider-model.json");
    expect(costAttributionRecordSchema.$id).toContain("cost-attribution-record.json");
    expect(providerMarketplaceListingSchema.$id).toContain("provider-marketplace-listing.json");
    expect(marketplaceDiscoveryQuerySchema.$id).toContain("marketplace-discovery-query.json");
    expect(economicPricingModelSchema.$id).toContain("economic-pricing-model.json");
    expect(evaluationGrantAllocationSchema.$id).toContain("evaluation-grant-allocation.json");
    expect(economicExecutionReceiptSchema.$id).toContain("economic-execution-receipt.json");
    expect(providerLicensingManifestSchema.$id).toContain("provider-licensing-manifest.json");
    expect(complianceAttributionPackageSchema.$id).toContain("compliance-attribution-package.json");
    expect(canonicalProviderRegistryEntrySchema.$id).toContain(
      "canonical-provider-registry-entry.json"
    );
    expect(holisticExecutionCostLedgerSchema.$id).toContain("holistic-execution-cost-ledger.json");
    expect(verifiableBenchmarkExecutionReceiptSchema.$id).toContain(
      "verifiable-benchmark-execution-receipt.json"
    );
    expect(portableEvidencePackageSchema.$id).toContain("portable-evidence-package.json");
    expect(transitionAnalysisReportSchema.$id).toContain("transition-analysis-report.json");
    expect(semanticStressEvaluationReportSchema.$id).toContain(
      "semantic-stress-evaluation-report.json"
    );
    expect(failureInjectionReportSchema.$id).toContain("failure-injection-report.json");
    expect(recoveryResilienceScorecardSchema.$id).toContain("recovery-resilience-scorecard.json");
    expect(consequenceEvaluationReportSchema.$id).toContain("consequence-evaluation-report.json");
    expect(longHorizonEvaluationReportSchema.$id).toContain("long-horizon-evaluation-report.json");
    expect(sandboxBenchmarkDSLSchema.$id).toContain("sandbox-benchmark-dsl.json");
    expect(runRecordSchema.$id).toContain("execution-api-run-record.json");
    expect(cliRunResultSchema.$id).toContain("cli-runner-result.json");
    expect(routingDecisionRecordSchema.$id).toContain("web-api-routing-decision.json");
    expect(providerConformanceCertificateSchema.$id).toContain(
      "provider-conformance-certificate.json"
    );
    expect(providerCertificationScorecardSchema.$id).toContain(
      "provider-certification-scorecard.json"
    );
    expect(providerSecurityAuditReportSchema.$id).toContain("provider-security-audit-report.json");
    expect(integrityVerificationReportSchema.$id).toContain("benchmark-integrity-report.json");
    expect(antiGamingScorecardSchema.$id).toContain("anti-gaming-scorecard.json");
    expect(independentObservationBundleSchema.$id).toContain("independent-observation-bundle.json");
    expect(comprehensiveEvidenceProvenanceGraphSchema.$id).toContain(
      "evidence-provenance-graph.json"
    );
    expect(crossModelProviderComparisonReportSchema.$id).toContain("cross-comparison-report.json");
    expect(dashboardStateSnapshotSchema.$id).toContain("observability-dashboard-snapshot.json");
    expect(canonicalBenchmarkReportSchema.$id).toContain("canonical-benchmark-report.json");
    expect(sandboxPhaseSecurityAuditReportSchema.$id).toContain(
      "sandbox-phase-security-audit-report.json"
    );
    expect(sandboxEconomicAuditReportSchema.$id).toContain("sandbox-economic-audit-report.json");
    expect(sandboxArchitectureAuditReportSchema.$id).toContain(
      "sandbox-architecture-audit-report.json"
    );
    expect(spisProviderInteroperabilityManifestSchema.$id).toContain(
      "provider-interoperability-manifest.json"
    );
    expect(sandboxPhaseCompletionReportSchema.$id).toContain(
      "sandbox-phase-completion-report.json"
    );
    expect(sandboxReleaseGateDecisionSchema.$id).toContain("sandbox-release-gate-decision.json");
  });
});
