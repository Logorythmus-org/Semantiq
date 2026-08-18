"""
Controlled Language Validation Engine (Python).

Enforces epistemic language standards on empirical claim statements.
Invariant: Block unsupported causal language; enforce hedged associative terminology.
"""
import re
from typing import List, Tuple

from .contracts import (
    ControlledLanguageValidationResult,
    ControlledLanguageViolation,
)
from .errors import ControlledLanguageError

PROHIBITED_TERMS: List[Tuple[str, str, str, str, str]] = [
    (
        r"\b(causes|causing|caused|cause)\b",
        "causes",
        "unsupported_causality",
        "is associated with / correlates with under benchmark conditions",
        "Observational and benchmark data cannot claim direct causal determination.",
    ),
    (
        r"\b(proves|proven|proof|prove|proving)\b",
        "proves",
        "epistemic_absolutism",
        "provides empirical evidence supporting",
        "Empirical evaluation does not constitute deductive scientific or formal proof.",
    ),
    (
        r"\b(guarantees|guaranteed|guarantee|guaranteeing)\b",
        "guarantees",
        "unsupported_certainty",
        "mitigates observed risk by X%",
        "Statistical associations provide no absolute execution guarantees.",
    ),
    (
        r"\b(eliminates|eliminated|eliminating|eliminate|elimination)\b",
        "eliminates",
        "unsupported_absolutism",
        "significantly reduces the frequency of",
        "Absolutist elimination claims ignore residual edge-case failure modes.",
    ),
    (
        r"\bcausal\s+proof\b",
        "causal proof",
        "unsupported_causality",
        "robust matched association",
        "Unsubstantiated causal claims violate epistemic standards.",
    ),
    (
        r"\b(ensures\s+absolute|complete\s+protection|flawless|unhackable|perfect\s+security|completely\s+safe|zero\s+risk)\b",
        "absolutist claim",
        "epistemic_absolutism",
        "empirical defense under tested benchmark parameters",
        "Hyperbolic or absolutist marketing claims are prohibited in evidence contracts.",
    ),
]


class ControlledLanguageValidator:
    """Deterministic validator for claim statements against controlled language standards."""

    def validate(self, statement: str) -> ControlledLanguageValidationResult:
        """Validates a claim statement, identifying any prohibited causal or absolutist phrases."""
        violations: List[ControlledLanguageViolation] = []

        for pattern, term, category, replacement, rationale in PROHIBITED_TERMS:
            if re.search(pattern, statement, re.IGNORECASE):
                violations.append(
                    ControlledLanguageViolation(
                        term=term,
                        category=category,
                        suggested_replacement=replacement,
                        rationale=rationale,
                    )
                )

        is_valid = len(violations) == 0
        return ControlledLanguageValidationResult(
            is_valid=is_valid,
            violations=violations,
            statement=statement,
        )

    def assert_valid(self, statement: str) -> None:
        """Asserts that a statement conforms to controlled language, raising ControlledLanguageError if not."""
        result = self.validate(statement)
        if not result.is_valid:
            violation_terms = ", ".join(f"'{v.term}'" for v in result.violations)
            raise ControlledLanguageError(
                f"Claim statement violates controlled language governance: contains prohibited terms {violation_terms}.",
                violations=[v.to_dict() for v in result.violations],
            )
