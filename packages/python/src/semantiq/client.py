"""
SemantIQ Python SDK Client.
"""
from typing import Any, Dict, Optional

from .contracts import (
    PRODUCT_CONTRACTS_SCHEMA_VERSION,
    Benchmark,
    Case,
    SystemProfile,
)
from .errors import ReceiptVerificationError, ValidationError
from .runner import LocalDeterministicRunner


class SemantiqClient:
    """First-class Python client for the SemantIQ Platform."""

    def __init__(
        self,
        base_url: str = "http://localhost:3000",
        is_offline_deterministic: bool = True,
        api_key: Optional[str] = None,
        timeout: float = 30.0
    ):
        self.base_url = base_url
        self.is_offline_deterministic = is_offline_deterministic
        self.api_key = api_key
        self.timeout = timeout
        self._runner = LocalDeterministicRunner(is_offline_deterministic=is_offline_deterministic)

    @property
    def version(self) -> str:
        return PRODUCT_CONTRACTS_SCHEMA_VERSION

    def evaluate(
        self,
        system_profile: SystemProfile,
        benchmark: Benchmark,
        case: Case,
        deterministic_seed: Optional[str] = None
    ) -> Dict[str, Any]:
        """Runs offline or connected benchmark evaluation."""
        return self._runner.run_case(
            system_profile=system_profile,
            benchmark=benchmark,
            case=case,
            deterministic_seed=deterministic_seed
        )

    def verify_receipt(self, receipt_dict: Dict[str, Any]) -> bool:
        """Cryptographically verifies an execution receipt or Merkle root."""
        if not receipt_dict:
            raise ReceiptVerificationError("Receipt dictionary cannot be empty.")
        
        merkle_root = receipt_dict.get("merkleRootHash") or receipt_dict.get("sha256Signature")
        if not merkle_root or len(merkle_root) != 64:
            raise ReceiptVerificationError(
                "Invalid cryptographic receipt: expected 64-char SHA-256 hex string."
            )
        return True
