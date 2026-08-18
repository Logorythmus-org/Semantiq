export type ScientificClaimClass =
  | "observation"
  | "measurement"
  | "evaluator_judgment"
  | "aggregate_finding"
  | "inference"
  | "recommendation"
  | "unsupported_claim"
  | "prohibited_claim";

export interface ScopeOfClaimBlock {
  readonly modelId: string;
  readonly modelVersion: string;
  readonly provider: string;
  readonly executionTimestamp: string;
  readonly benchmarkVersion: string;
  readonly scenarioVersion: string;
  readonly evaluatorVersion: string;
  readonly configuration: Record<string, unknown>;
  readonly enabledTools: readonly string[];
  readonly language: string;
  readonly repetitionCount: number;
  readonly variance: number;
  readonly knownExclusions: readonly string[];
  readonly scope: string;
  readonly prohibitedInterpretations: readonly string[];
  readonly uncertaintyStatement: string;
}

export interface ResultClaimRecord {
  readonly claimId: string;
  readonly claimClass: ScientificClaimClass;
  readonly claimText: string;
  readonly scopeBlock: ScopeOfClaimBlock;
  readonly supportingEvidence: readonly string[];
  readonly hasMandatoryDisclaimer: boolean;
}

export interface ClaimValidationReport {
  readonly isValid: boolean;
  readonly violations: readonly string[];
}

const PROHIBITED_KEYWORDS = [
  "safety certification",
  "certified safe",
  "production ready",
  "deployment ready",
  "model thinks",
  "model understands",
  "system understands",
  "understands",
  "thinks",
  "legally compliant",
  "first in the world",
  "universal ranking"
];

export const CANONICAL_DISCLAIMER =
  "This result describes observed behavior in the specified evaluation environment. It does not certify the system as safe, reliable, legally compliant, intelligent, or suitable for a specific deployment.";

/**
 * Scientific Claims Validator Engine.
 * Enforces claim boundaries, mandatory scope blocks, and prohibits unbacked or misleading claims.
 */
export class ScientificClaimsValidatorEngine {
  validateClaimRecord(record: ResultClaimRecord): ClaimValidationReport {
    const violations: string[] = [];

    if (record.claimClass === "prohibited_claim" || record.claimClass === "unsupported_claim") {
      violations.push(`Claim class '${record.claimClass}' is not permitted in published results.`);
    }

    if (!record.scopeBlock.modelId || !record.scopeBlock.modelVersion) {
      violations.push("Result claim must include model ID and explicit model version.");
    }

    if (!record.hasMandatoryDisclaimer) {
      violations.push("Result claim is missing the mandatory canonical disclaimer.");
    }

    if (record.claimClass === "inference" && record.supportingEvidence.length === 0) {
      violations.push("Inference claims require explicit supporting evidence.");
    }

    const lowerText = record.claimText.toLowerCase();
    for (const kw of PROHIBITED_KEYWORDS) {
      if (lowerText.includes(kw)) {
        violations.push(`Claim text contains prohibited claim keyword: '${kw}'.`);
      }
    }

    return {
      isValid: violations.length === 0,
      violations
    };
  }

  scanTextForProhibitedClaims(text: string): readonly string[] {
    const found: string[] = [];
    const lower = text.toLowerCase();
    for (const kw of PROHIBITED_KEYWORDS) {
      if (lower.includes(kw)) {
        found.push(kw);
      }
    }
    return found;
  }
}
