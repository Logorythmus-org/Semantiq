import { describe, it, expect } from "vitest";
import type { GovernancePublicApiCatalog } from "../../packages/semantiq/src/governance-api-freeze.js";
import { GovernanceApiFreezeEngine } from "../../packages/semantiq/src/governance-api-freeze.js";

describe("Governance API and Contract Freeze (Prompt 10.11)", () => {
  const engine = new GovernanceApiFreezeEngine();

  const validCatalog: GovernancePublicApiCatalog = {
    catalogId: "cat_101",
    packageVersion: "v1.0.0",
    entries: [
      {
        exportName: "PolicyEvidenceEngine",
        category: "policy",
        version: "v1.0.0",
        stability: "stable"
      },
      {
        exportName: "PolicyApplicabilityEngine",
        category: "applicability",
        version: "v1.0.0",
        stability: "stable"
      },
      {
        exportName: "HumanApprovalEngine",
        category: "approval",
        version: "v1.0.0",
        stability: "stable"
      },
      {
        exportName: "GovernanceDecisionEngine",
        category: "decision",
        version: "v1.0.0",
        stability: "stable"
      },
      {
        exportName: "GovernanceIncidentAuditEngine",
        category: "audit",
        version: "v1.0.0",
        stability: "stable"
      },
      {
        exportName: "ComplianceMappingEngine",
        category: "mapping",
        version: "v1.0.0",
        stability: "stable"
      },
      {
        exportName: "TrustRiskProfileEngine",
        category: "profile",
        version: "v1.0.0",
        stability: "stable"
      }
    ],
    frozenAt: "2026-08-02T08:00:00Z"
  };

  it("approves compliant public API catalog audit", () => {
    const report = engine.auditCatalog(validCatalog);
    expect(report).toBeUndefined();
  });

  it("detects unversioned export", () => {
    const unversCatalog: GovernancePublicApiCatalog = {
      ...validCatalog,
      entries: [
        {
          exportName: "UnversionedEngine",
          category: "policy",
          version: "",
          stability: "experimental"
        }
      ]
    };
    const report = engine.auditCatalog(unversCatalog);
    expect(report).toBeDefined();
    expect(report?.failureClass).toBe("unversioned_export");
  });

  it("detects duplicate contract export", () => {
    const dupCatalog: GovernancePublicApiCatalog = {
      ...validCatalog,
      entries: [
        {
          exportName: "PolicyEvidenceEngine",
          category: "policy",
          version: "v1.0.0",
          stability: "stable"
        },
        {
          exportName: "PolicyEvidenceEngine",
          category: "policy",
          version: "v1.0.0",
          stability: "stable"
        }
      ]
    };
    const report = engine.auditCatalog(dupCatalog);
    expect(report).toBeDefined();
    expect(report?.failureClass).toBe("duplicate_contract");
  });

  it("detects enforcement semantics leaked into API export name", () => {
    const enfCatalog: GovernancePublicApiCatalog = {
      ...validCatalog,
      entries: [
        {
          exportName: "AutonomousPolicyEnforcer",
          category: "policy",
          version: "v1.0.0",
          stability: "stable"
        }
      ]
    };
    const report = engine.auditCatalog(enfCatalog);
    expect(report).toBeDefined();
    expect(report?.failureClass).toBe("enforcement_semantics_leaked_into_api");
  });

  it("detects certification semantics leaked into API export name", () => {
    const certCatalog: GovernancePublicApiCatalog = {
      ...validCatalog,
      entries: [
        {
          exportName: "ComplianceCertifierGuarantee",
          category: "mapping",
          version: "v1.0.0",
          stability: "stable"
        }
      ]
    };
    const report = engine.auditCatalog(certCatalog);
    expect(report).toBeDefined();
    expect(report?.failureClass).toBe("certification_semantics_leaked_into_api");
  });
});
