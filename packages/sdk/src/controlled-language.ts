/**
 * @package @semantiq/sdk
 * Controlled Language Validation Engine (TypeScript SDK)
 *
 * Enforces epistemic language standards on empirical claim statements.
 * Invariant: Block unsupported causal language; enforce hedged associative terminology.
 */

import type {
  ControlledLanguageValidationResult,
  ControlledLanguageViolation
} from "./contracts.js";
import { SemantiqControlledLanguageError } from "./errors.js";

interface ProhibitedRule {
  readonly regex: RegExp;
  readonly phrase: string;
  readonly category: string;
  readonly reason: string;
  readonly suggestedAlternative: string;
}

const PROHIBITED_CAUSAL_RULES: readonly ProhibitedRule[] = [
  {
    regex: /\b(causes|causing|caused|cause)\b/i,
    phrase: "causes",
    category: "unsupported_causality",
    reason: "Observational and benchmark data cannot claim direct causal determination.",
    suggestedAlternative: "is associated with / correlates with"
  },
  {
    regex: /\b(proves|proven|proof|prove|proving)\b/i,
    phrase: "proves",
    category: "epistemic_absolutism",
    reason: "Empirical evaluation does not constitute deductive scientific or formal proof.",
    suggestedAlternative: "provides empirical evidence supporting"
  },
  {
    regex: /\b(guarantees|guaranteed|guarantee|guaranteeing)\b/i,
    phrase: "guarantees",
    category: "unsupported_certainty",
    reason: "Statistical associations provide no absolute execution guarantees.",
    suggestedAlternative: "mitigates observed risk by X%"
  },
  {
    regex: /\b(eliminates|eliminated|eliminating|eliminate|elimination)\b/i,
    phrase: "eliminates",
    category: "unsupported_absolutism",
    reason: "Absolutist elimination claims ignore residual edge-case failure modes.",
    suggestedAlternative: "significantly reduces the frequency of"
  },
  {
    regex: /\bcausal\s+proof\b/i,
    phrase: "causal proof",
    category: "unsupported_causality",
    reason: "Unsubstantiated causal claims violate epistemic standards.",
    suggestedAlternative: "robust matched association"
  },
  {
    regex:
      /\b(ensures\s+absolute|complete\s+protection|flawless|unhackable|perfect\s+security|completely\s+safe|zero\s+risk)\b/i,
    phrase: "absolutist claim",
    category: "epistemic_absolutism",
    reason: "Hyperbolic or absolutist marketing claims are prohibited in evidence contracts.",
    suggestedAlternative: "empirical defense under tested benchmark parameters"
  }
];

export class ControlledLanguageValidator {
  /**
   * Validates whether a claim statement adheres to controlled language guidelines.
   */
  public validate(statement: string): ControlledLanguageValidationResult {
    const violations: ControlledLanguageViolation[] = [];

    for (const rule of PROHIBITED_CAUSAL_RULES) {
      if (rule.regex.test(statement)) {
        violations.push({
          term: rule.phrase,
          category: rule.category,
          suggestedReplacement: rule.suggestedAlternative,
          rationale: rule.reason
        });
      }
    }

    return {
      isValid: violations.length === 0,
      violations,
      statement
    };
  }

  /**
   * Asserts that a claim statement adheres to controlled language, throwing SemantiqControlledLanguageError if violated.
   */
  public assertValid(statement: string): void {
    const result = this.validate(statement);
    if (!result.isValid) {
      const phrases = result.violations.map((v) => `'${v.term}'`).join(", ");
      throw new SemantiqControlledLanguageError(
        `Claim statement violates controlled language governance: contains prohibited terms ${phrases}.`,
        result.violations
      );
    }
  }
}
