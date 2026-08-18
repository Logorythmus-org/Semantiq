import { describe, it, expect } from "vitest";
import { HumanResponsibilityValidatorEngine } from "../../packages/semantiq/src/human-responsibility.js";
import type {
  HighImpactUseDisclosure,
  ResponsibilityChainRecord
} from "../../packages/semantiq/src/human-responsibility.js";

describe("Phase 11.5.3 — Human Responsibility and High-Impact Use", () => {
  const engine = new HumanResponsibilityValidatorEngine();

  const validRecord: ResponsibilityChainRecord = {
    deployingOrganization: "Org A",
    accountableHumanRole: "Chief Risk Officer",
    modelSelector: "Lead AI Engineer",
    configurationOwner: "DevOps Lead",
    dataOwner: "Data Governance Manager",
    automationApprover: "VP of Technology",
    humanReviewer: "Senior Analyst",
    appealOwner: "Appeals Committee Chair",
    incidentOwner: "Incident Manager",
    affectedPopulation: "Loan Applicants",
    decisionScope: "Advisory risk screening",
    semantiqInfluenceLevel: "advisory",
    influenceExplanation: "Used as secondary input alongside manual review",
    alternativeNonAutomatedPath: "Direct manual paper review",
    expirationReviewDate: "2026-12-31"
  };

  it("passes a valid disclosure with human appeal path and accountable human role", () => {
    const disclosure: HighImpactUseDisclosure = {
      disclosureId: "disc-001",
      domain: "credit_insurance_welfare",
      isSoleAutomatedDecider: false,
      hasHumanAppealPath: true,
      responsibilityRecord: validRecord
    };
    const report = engine.validateDisclosure(disclosure);
    expect(report.isValid).toBe(true);
    expect(report.violations.length).toBe(0);
  });

  it("rejects a sole automated decider in a high-impact domain", () => {
    const disclosure: HighImpactUseDisclosure = {
      disclosureId: "disc-002",
      domain: "employment",
      isSoleAutomatedDecider: true,
      hasHumanAppealPath: true,
      responsibilityRecord: validRecord
    };
    const report = engine.validateDisclosure(disclosure);
    expect(report.isValid).toBe(false);
    expect(report.violations[0]).toContain("strictly prohibited");
  });

  it("rejects responsibility assigned to AI or Benchmark", () => {
    const invalidRecord = { ...validRecord, accountableHumanRole: "The AI Benchmark Engine" };
    const disclosure: HighImpactUseDisclosure = {
      disclosureId: "disc-003",
      domain: "housing",
      isSoleAutomatedDecider: false,
      hasHumanAppealPath: true,
      responsibilityRecord: invalidRecord
    };
    const report = engine.validateDisclosure(disclosure);
    expect(report.isValid).toBe(false);
    expect(report.violations).toContain(
      "Accountable role cannot be assigned to an AI model or benchmark."
    );
  });

  it("detects unauthorized endorsement statements", () => {
    expect(engine.detectUnauthorizedEndorsement("SemantIQ approved this decision")).toBe(true);
    expect(engine.detectUnauthorizedEndorsement("SemantIQ certified this model")).toBe(true);
    expect(engine.detectUnauthorizedEndorsement("This report uses SemantIQ benchmarks")).toBe(
      false
    );
  });
});
