export type ExposureTier = 'tier_a_public_reference' | 'tier_b_rotating' | 'tier_c_transformational' | 'tier_d_protected_challenge';

export type TransformationFamily =
  | 'paraphrase'
  | 'language_shift'
  | 'role_shift'
  | 'order_change'
  | 'irrelevant_distraction'
  | 'delayed_contradiction'
  | 'equivalent_scenario'
  | 'altered_surface_vocabulary'
  | 'benchmark_name_hidden'
  | 'rubric_terminology_removed'
  | 'adversarial_evaluator_directed_text';

export interface BenchmarkExposureManifest {
  readonly benchmarkId: string;
  readonly exposureTier: ExposureTier;
  readonly isPublicBundleExportable: boolean;
  readonly rotationScheduleDays?: number | undefined;
  readonly version: string;
}

export interface TransformationManifest {
  readonly transformationId: string;
  readonly sourceScenarioId: string;
  readonly family: TransformationFamily;
  readonly isSemanticallyValidated: boolean;
  readonly provenanceNotes: string;
}

export interface ContaminationRecord {
  readonly incidentId: string;
  readonly benchmarkId: string;
  readonly detectedAt: string;
  readonly contaminationSource: string;
  readonly affectedModels: readonly string[];
  readonly isResultSuspended: boolean;
}

export interface ReportingRecord {
  readonly runId: string;
  readonly isBestRunOnly: boolean;
  readonly totalRunsCount: number;
  readonly failedRunsCount: number;
  readonly excludedRunsCount: number;
  readonly exclusionReasons: readonly string[];
  readonly medianScore: number;
  readonly worstScore: number;
  readonly bestScore: number;
  readonly variance: number;
}

export interface BenchmarkIntegrityValidationReport {
  readonly isValid: boolean;
  readonly violations: readonly string[];
}

/**
 * Benchmark Integrity Validator Engine.
 * Enforces anti-gaming controls, exposure tiers, selective reporting prevention,
 * prompt leakage protection, and transformation manifests.
 */
export class BenchmarkIntegrityValidatorEngine {
  validateExposureManifest(manifest: BenchmarkExposureManifest): BenchmarkIntegrityValidationReport {
    const violations: string[] = [];

    if (manifest.exposureTier === 'tier_d_protected_challenge' && manifest.isPublicBundleExportable) {
      violations.push('Protected challenge benchmarks (Tier D) cannot be exported in public bundles.');
    }

    if (manifest.exposureTier === 'tier_b_rotating' && (!manifest.rotationScheduleDays || manifest.rotationScheduleDays <= 0)) {
      violations.push('Rotating evaluation benchmarks (Tier B) must specify a positive rotation schedule in days.');
    }

    return {
      isValid: violations.length === 0,
      violations
    };
  }

  validateReportingRecord(record: ReportingRecord): BenchmarkIntegrityValidationReport {
    const violations: string[] = [];

    if (record.isBestRunOnly) {
      violations.push('Selective "best-run-only" reporting is prohibited in public benchmarks.');
    }

    if (record.totalRunsCount < 1) {
      violations.push('Reporting record must have at least 1 run.');
    }

    if (record.excludedRunsCount > 0 && record.exclusionReasons.length === 0) {
      violations.push('Excluded runs require explicit documented exclusion reasons.');
    }

    return {
      isValid: violations.length === 0,
      violations
    };
  }

  sanitizeEvaluatorInput(modelOutput: string): string {
    // Escapes evaluator-directed prompt injection text inside model output
    return modelOutput
      .replace(/system:/gi, 'system[data]:')
      .replace(/user:/gi, 'user[data]:')
      .replace(/assistant:/gi, 'assistant[data]:')
      .replace(/\[INSTRUCTION\]/gi, '[DATA_OUTPUT]');
  }
}
