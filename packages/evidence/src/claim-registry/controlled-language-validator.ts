/**
 * @package @semantiq/evidence
 * Controlled Language Validator
 *
 * Invariants:
 * 1. Block unsupported causal language (e.g. 'causes', 'proves', 'guarantees', 'eliminates').
 * 2. Release controls wording, not truth.
 */

import type { ControlledLanguageViolation } from "./types.js";

interface ProhibitedRule {
  readonly regex: RegExp;
  readonly phrase: string;
  readonly reason: string;
  readonly suggestedAlternative: string;
}

const PROHIBITED_CAUSAL_RULES: readonly ProhibitedRule[] = [
  {
    regex: /\b(causes|causing|caused)\b/i,
    phrase: "causes",
    reason: "Observational and benchmark data cannot claim direct causal determination.",
    suggestedAlternative: "is associated with / correlates with"
  },
  {
    regex: /\b(proves|proven|proof)\b/i,
    phrase: "proves",
    reason: "Empirical evaluation does not constitute deductive scientific or formal proof.",
    suggestedAlternative: "provides empirical evidence supporting"
  },
  {
    regex: /\b(guarantees|guaranteed|guarantee)\b/i,
    phrase: "guarantees",
    reason: "Statistical associations provide no absolute execution guarantees.",
    suggestedAlternative: "mitigates observed risk by X%"
  },
  {
    regex: /\b(eliminates|eliminated|eliminating)\b/i,
    phrase: "eliminates",
    reason: "Absolutist elimination claims ignore residual edge-case failure modes.",
    suggestedAlternative: "significantly reduces the frequency of"
  },
  {
    regex: /\bcausal proof\b/i,
    phrase: "causal proof",
    reason: "Unsubstantiated causal claims violate epistemic standards.",
    suggestedAlternative: "robust matched association"
  },
  {
    regex: /\b(ensures absolute|complete protection|flawless|unhackable|perfect security)\b/i,
    phrase: "absolutist claim",
    reason: "Hyperbolic or absolutist marketing claims are prohibited in evidence contracts.",
    suggestedAlternative: "empirical defense under tested benchmark parameters"
  }
];

export class ControlledLanguageValidator {
  /**
   * Validates whether a claim statement adheres to controlled language guidelines.
   */
  public validate(statement: string): {
    isValid: boolean;
    violations: readonly ControlledLanguageViolation[];
  } {
    const violations: ControlledLanguageViolation[] = [];

    for (const rule of PROHIBITED_CAUSAL_RULES) {
      if (rule.regex.test(statement)) {
        violations.push({
          prohibitedPhrase: rule.phrase,
          reason: rule.reason,
          suggestedAlternative: rule.suggestedAlternative
        });
      }
    }

    return {
      isValid: violations.length === 0,
      violations: Object.freeze(violations)
    };
  }
}
