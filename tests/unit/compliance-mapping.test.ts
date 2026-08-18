import { describe, it, expect } from "vitest";
import type {
  EvidenceMapping,
  FrameworkVersion
} from "../../packages/semantiq/src/compliance-mapping.js";
import { ComplianceMappingEngine } from "../../packages/semantiq/src/compliance-mapping.js";

describe("Compliance Mapping Framework (Prompt 10.7)", () => {
  const engine = new ComplianceMappingEngine();

  const validVersion: FrameworkVersion = {
    versionString: "NIST-800-53-r5",
    releasedAt: "2020-09-23T00:00:00Z",
    isSupported: true
  };

  const validMapping: EvidenceMapping = {
    mappingId: "map_101",
    requirementId: "AC-2",
    evidenceChecksum: {
      uri: "file:///tmp/audit_log.json",
      algorithm: "sha256",
      hash: "abc123hash"
    },
    confidence: { score: 0.85, rationale: "Direct evidence match" },
    mappedAt: "2026-08-01T12:00:00Z",
    claimText: "Evidence demonstrates access control logging"
  };

  it("approves compliant evidence mapping", () => {
    const report = engine.evaluateMapping(validVersion, validMapping);
    expect(report).toBeUndefined();
  });

  it("detects outdated framework version", () => {
    const outdatedVersion: FrameworkVersion = {
      ...validVersion,
      isSupported: false
    };
    const report = engine.evaluateMapping(outdatedVersion, validMapping);
    expect(report).toBeDefined();
    expect(report?.failureClass).toBe("outdated_framework_version");
  });

  it("detects missing evidence hash", () => {
    const noEvMapping: EvidenceMapping = {
      ...validMapping,
      evidenceChecksum: { uri: "file:///tmp/audit_log.json", algorithm: "sha256", hash: "" }
    };
    const report = engine.evaluateMapping(validVersion, noEvMapping);
    expect(report).toBeDefined();
    expect(report?.failureClass).toBe("missing_evidence");
  });

  it("detects false certification language violating non-certification boundary", () => {
    const certMapping: EvidenceMapping = {
      ...validMapping,
      claimText: "System is fully compliant and certified under NIST"
    };
    const report = engine.evaluateMapping(validVersion, certMapping);
    expect(report).toBeDefined();
    expect(report?.failureClass).toBe("false_certification_language");
  });

  it("detects unsupported mapping with low confidence score", () => {
    const lowConfMapping: EvidenceMapping = {
      ...validMapping,
      confidence: { score: 0.1, rationale: "Low match confidence" }
    };
    const report = engine.evaluateMapping(validVersion, lowConfMapping);
    expect(report).toBeDefined();
    expect(report?.failureClass).toBe("unsupported_mapping");
  });
});
