/**
 * @package @semantiq/sdk
 * SemantIQ SDK Error Hierarchy
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
