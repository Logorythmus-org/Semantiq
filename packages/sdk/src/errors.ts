/**
 * @package @semantiq/sdk
 * SemantIQ SDK Error Hierarchy
 * 
 * Provides stable, typed exception models across all TypeScript SDK operations.
 */

export class SemantiqSdkError extends Error {
  public readonly code: string;
  public readonly details: Record<string, unknown> | undefined;

  constructor(message: string, code = "SDK_ERROR", details?: Record<string, unknown> | undefined) {
    super(message);
    this.name = "SemantiqSdkError";
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class SemantiqValidationError extends SemantiqSdkError {
  constructor(message: string, details?: Record<string, unknown> | undefined) {
    super(message, "VALIDATION_ERROR", details);
    this.name = "SemantiqValidationError";
  }
}

export class SemantiqEvaluationError extends SemantiqSdkError {
  constructor(message: string, details?: Record<string, unknown> | undefined) {
    super(message, "EVALUATION_ERROR", details);
    this.name = "SemantiqEvaluationError";
  }
}

export class SemantiqReceiptError extends SemantiqSdkError {
  constructor(message: string, details?: Record<string, unknown> | undefined) {
    super(message, "RECEIPT_VERIFICATION_ERROR", details);
    this.name = "SemantiqReceiptError";
  }
}

export class SemantiqInsufficientDataError extends SemantiqSdkError {
  constructor(message: string, details?: Record<string, unknown> | undefined) {
    super(message, "INSUFFICIENT_DATA_ERROR", details);
    this.name = "SemantiqInsufficientDataError";
  }
}

export class SemantiqControlledLanguageError extends SemantiqSdkError {
  public readonly violations: readonly unknown[];

  constructor(message: string, violations: readonly unknown[] = []) {
    super(message, "CONTROLLED_LANGUAGE_VIOLATION", { violations });
    this.name = "SemantiqControlledLanguageError";
    this.violations = violations;
  }
}

export class SemantiqGovernancePolicyError extends SemantiqSdkError {
  constructor(message: string, details?: Record<string, unknown> | undefined) {
    super(message, "GOVERNANCE_POLICY_ERROR", details);
    this.name = "SemantiqGovernancePolicyError";
  }
}
