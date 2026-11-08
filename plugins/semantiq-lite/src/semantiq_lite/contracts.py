"""Wire structures. Validation is mandatory at the API boundary."""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any, Literal

CONTRACT = "semantiq-lite-review/0.2.0"
Support = Literal[
    "SUPPORTED_BY_SOURCE",
    "PARTIALLY_SUPPORTED",
    "CONTRADICTED",
    "INSUFFICIENT_EVIDENCE",
    "NOT_ASSESSED",
]
Independent = Literal["NOT_ATTEMPTED", "INSUFFICIENT_DATA", "PARTIAL", "INDEPENDENTLY_VALIDATED"]


@dataclass(frozen=True)
class ResourceLimits:
    raw_bytes_per_source: int = 2 * 1024 * 1024
    total_raw_bytes: int = 8 * 1024 * 1024
    characters_per_source: int = 250_000
    total_characters: int = 1_000_000
    sources: int = 16
    claims: int = 100
    anchors: int = 300
    quote_characters: int = 2_000
    source_seconds: float = 5
    request_seconds: float = 30
    output_bytes: int = 2 * 1024 * 1024


DEFAULT_LIMITS = ResourceLimits()


@dataclass(frozen=True)
class ValidationErrorRecord:
    code: str
    location: str


@dataclass(frozen=True)
class SourceSnapshot:
    source_id: str
    media_type: Literal["text/plain", "text/markdown"]
    raw_sha256: str
    text_sha256: str
    extracted_text: str
    extractor_name: str = "semantiq-lite-utf8"
    extractor_version: str = "0.2.0"
    encoding: str = "utf-8"
    normalization: str = "lf-only-v1"
    origin: dict[str, str] = field(default_factory=dict)


@dataclass(frozen=True)
class EvidenceAnchor:
    anchor_id: str
    source_id: str
    start: int
    end: int
    quote: str


@dataclass(frozen=True)
class ResearchClaim:
    claim_id: str
    text: str


@dataclass(frozen=True)
class ClaimEvidenceLink:
    link_id: str
    claim_id: str
    anchor_id: str
    semantic_support: Support = "NOT_ASSESSED"
    independent_validation: Independent = "NOT_ATTEMPTED"


@dataclass(frozen=True)
class ReviewResult:
    sources: list[SourceSnapshot]
    claims: list[ResearchClaim] = field(default_factory=list)
    anchors: list[EvidenceAnchor] = field(default_factory=list)
    links: list[ClaimEvidenceLink] = field(default_factory=list)
    contract: str = CONTRACT
    review_required: bool = True
    limitations: list[str] = field(
        default_factory=lambda: [
            "Quotation integrity is not semantic support or independent validation."
        ]
    )

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)
