"""
SemantIQ Python SDK Error Hierarchy.

Provides stable, typed exception models across all SemantIQ operations.
"""
from typing import Any, Dict, Optional


class SemantiqError(Exception):
    """Base exception for all SemantIQ operations."""

    def __init__(
        self,
        message: str,
        code: str = "SEMANTIQ_ERROR",
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message)
        self.message = message
        self.code = code
        self.details = details or {}

    def __repr__(self) -> str:
        return f"{self.__class__.__name__}(code={self.code!r}, message={self.message!r})"


class ValidationError(SemantiqError):
    """Raised when contract, schema, or invariant validation fails."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, code="VALIDATION_ERROR", details=details)


class EvaluationError(SemantiqError):
    """Raised when benchmark or scenario execution fails."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, code="EVALUATION_ERROR", details=details)


class ReceiptVerificationError(SemantiqError):
    """Raised when cryptographic receipt, Merkle hash, or bundle signature verification fails."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, code="RECEIPT_VERIFICATION_ERROR", details=details)


class InsufficientDataError(SemantiqError):
    """Raised when evaluation has insufficient data to reach a conclusive verdict."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, code="INSUFFICIENT_DATA_ERROR", details=details)


class ControlledLanguageError(SemantiqError):
    """Raised when a claim statement contains prohibited unhedged causal terminology."""

    def __init__(self, message: str, violations: Optional[list] = None):
        details = {"violations": violations or []}
        super().__init__(message, code="CONTROLLED_LANGUAGE_VIOLATION", details=details)
        self.violations = violations or []


class GovernancePolicyError(SemantiqError):
    """Raised when a governance policy criteria check fails or is violated."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, code="GOVERNANCE_POLICY_ERROR", details=details)
