export interface RubricAssumptionManifest {
  readonly rubricId: string;
  readonly constructName: string;
  readonly operationalDefinition: string;
  readonly intendedUse: string;
  readonly excludedInterpretations: readonly string[];
  readonly linguisticAssumptions: readonly string[];
  readonly culturalAssumptions: readonly string[];
  readonly philosophicalAssumptions: readonly string[];
  readonly accessibilityAssumptions: readonly string[];
  readonly targetPopulation: string;
  readonly knownDisagreements: readonly string[];
  readonly alternativeRubrics: readonly string[];
  readonly version: string;
}

export type EquivalenceStatus =
  | "validated_equivalent"
  | "translated_unvalidated"
  | "unknown"
  | "conceptually_divergent";

export interface MultilingualValidationRecord {
  readonly recordId: string;
  readonly sourceLanguage: string;
  readonly targetLanguage: string;
  readonly translationMethod: string;
  readonly equivalenceStatus: EquivalenceStatus;
  readonly interRaterAgreementScore?: number | undefined;
  readonly humanReviewersCount: number;
}

export interface EvaluatorDisagreementRecord {
  readonly disagreementId: string;
  readonly rubricId: string;
  readonly primaryEvaluatorId: string;
  readonly dissentingEvaluatorId: string;
  readonly divergenceReason: string;
  readonly isAggregationPermitted: boolean;
}

export interface RubricValidationReport {
  readonly isValid: boolean;
  readonly violations: readonly string[];
}

/**
 * Rubric Legitimacy Validator Engine.
 * Enforces rubric assumptions, multilingual validity rules, rubric plurality,
 * and handles evaluator disagreement records.
 */
export class RubricLegitimacyValidatorEngine {
  validateRubricManifest(manifest: RubricAssumptionManifest): RubricValidationReport {
    const violations: string[] = [];

    if (!manifest.constructName || manifest.constructName.trim() === "") {
      violations.push("Rubric manifest must declare a construct name.");
    }

    if (!manifest.operationalDefinition || manifest.operationalDefinition.trim() === "") {
      violations.push("Rubric manifest must state an explicit operational definition.");
    }

    if (!manifest.culturalAssumptions || manifest.culturalAssumptions.length === 0) {
      violations.push("Rubric manifest must document explicit cultural assumptions.");
    }

    if (!manifest.linguisticAssumptions || manifest.linguisticAssumptions.length === 0) {
      violations.push("Rubric manifest must document explicit linguistic assumptions.");
    }

    return {
      isValid: violations.length === 0,
      violations
    };
  }

  validateMultilingualStatus(record: MultilingualValidationRecord): RubricValidationReport {
    const violations: string[] = [];

    if (
      record.equivalenceStatus === "translated_unvalidated" ||
      record.equivalenceStatus === "unknown"
    ) {
      violations.push(
        `Translation alone to '${record.targetLanguage}' does not constitute validation. Equivalence remains unvalidated.`
      );
    }

    if (record.equivalenceStatus === "validated_equivalent" && record.humanReviewersCount < 1) {
      violations.push("Validated equivalence requires at least 1 human reviewer.");
    }

    return {
      isValid: violations.length === 0,
      violations
    };
  }

  validateDisagreementAggregation(record: EvaluatorDisagreementRecord): RubricValidationReport {
    const violations: string[] = [];

    if (!record.isAggregationPermitted) {
      violations.push(
        "Forced score aggregation is prohibited when evaluators fundamentally diverge under plural rubrics."
      );
    }

    return {
      isValid: violations.length === 0,
      violations
    };
  }
}
