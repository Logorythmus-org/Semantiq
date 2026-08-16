import { describe, it, expect } from "vitest";
import { RubricLegitimacyValidatorEngine } from "../../packages/semantiq/src/rubric-legitimacy.js";
import type {
  RubricAssumptionManifest,
  MultilingualValidationRecord,
  EvaluatorDisagreementRecord
} from "../../packages/semantiq/src/rubric-legitimacy.js";

describe("Phase 11.5.5 — Rubric Legitimacy and Multilingual Validity", () => {
  const engine = new RubricLegitimacyValidatorEngine();

  const validManifest: RubricAssumptionManifest = {
    rubricId: "clarity-v1",
    constructName: "Analytical Clarity",
    operationalDefinition: "Measures logical step-by-step structure of responses.",
    intendedUse: "Evaluating mathematical and logical reasoning tasks.",
    excludedInterpretations: ["Poetic or stylistic elegance"],
    linguisticAssumptions: ["Assumes standard English syntax"],
    culturalAssumptions: ["Assumes Western academic essay structure"],
    philosophicalAssumptions: ["Prioritizes deductive validity over rhetorical persuasion"],
    accessibilityAssumptions: ["Screen-reader compatible plain text"],
    targetPopulation: "LLM reasoning models",
    knownDisagreements: ["Alternative practical clarity rubric exists"],
    alternativeRubrics: ["practical-clarity-v1"],
    version: "1.0.0"
  };

  it("passes a valid rubric manifest with explicit assumptions", () => {
    const report = engine.validateRubricManifest(validManifest);
    expect(report.isValid).toBe(true);
    expect(report.violations.length).toBe(0);
  });

  it("rejects a rubric manifest lacking cultural or linguistic assumptions", () => {
    const invalidManifest = {
      ...validManifest,
      culturalAssumptions: [],
      linguisticAssumptions: []
    };
    const report = engine.validateRubricManifest(invalidManifest);
    expect(report.isValid).toBe(false);
    expect(report.violations).toContain(
      "Rubric manifest must document explicit cultural assumptions."
    );
    expect(report.violations).toContain(
      "Rubric manifest must document explicit linguistic assumptions."
    );
  });

  it("rejects treating translation alone as validated equivalence", () => {
    const record: MultilingualValidationRecord = {
      recordId: "multi-001",
      sourceLanguage: "en",
      targetLanguage: "es",
      translationMethod: "machine_translation",
      equivalenceStatus: "translated_unvalidated",
      humanReviewersCount: 0
    };
    const report = engine.validateMultilingualStatus(record);
    expect(report.isValid).toBe(false);
    expect(report.violations[0]).toContain(
      "Translation alone to 'es' does not constitute validation."
    );
  });

  it("rejects forced score aggregation when evaluators diverge", () => {
    const disagreement: EvaluatorDisagreementRecord = {
      disagreementId: "dis-001",
      rubricId: "clarity-v1",
      primaryEvaluatorId: "eval-analytical",
      dissentingEvaluatorId: "eval-accessibility",
      divergenceReason: "Analytical score high but accessibility score low",
      isAggregationPermitted: false
    };
    const report = engine.validateDisagreementAggregation(disagreement);
    expect(report.isValid).toBe(false);
    expect(report.violations[0]).toContain("Forced score aggregation is prohibited");
  });
});
