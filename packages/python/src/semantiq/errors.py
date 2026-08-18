"""
SemantIQ Python SDK Error Hierarchy.
"""
from typing import Any, Dict, Optional


class SemantiqError(Exception):
    """Base exception for all SemantIQ operations."""
    def __init__(self, message: str, code: str = "SEMANTIQ_ERROR", details: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.message = message
        self.code = code
        self.details = details or {}


class ValidationError(SemantiqError):
    """Raised when contract or schema validation fails."""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, code="VALIDATION_ERROR", details=details)


class EvaluationError(SemantiqError):
    """Raised when benchmark or scenario execution fails."""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, code="EVALUATION_ERROR", details=details)


class ReceiptVerificationError(SemantiqError):
    """Raised when cryptographic receipt or Merkle hash verification fails."""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, code="RECEIPT_VERIFICATION_ERROR", details=details)


class InsufficientDataError(SemantiqError):
    """Raised when evaluation has insufficient data to reach a conclusive verdict."""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, code="INSUFFICIENT_DATA_ERROR", details=details)
