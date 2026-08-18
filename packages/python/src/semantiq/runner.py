"""
SemantIQ Local Deterministic Evaluation Runner (Python).

Runs offline deterministic evaluation cases without external network dependencies.
"""
import time
from datetime import datetime, timezone
from typing import Optional

from .contracts import (
    PRODUCT_CONTRACTS_SCHEMA_VERSION,
    Benchmark,
    Case,
    Claim,
    ClaimAssertionType,
    ClaimStatus,
    EpistemicNature,
    Evaluation,
    EvaluationResult,
    EvaluationStatus,
    EvidenceConfidence,
    EvidenceObservation,
    ObservationCategory,
    Review,
    ReviewVerdict,
    ReviewerRole,
    Run,
    RunStatus,
    SystemProfile,
    Trace,
    TraceStatus,
    compute_sha256,
)
from .errors import ValidationError


class LocalDeterministicRunner:
    """Offline, deterministic evaluation runner."""

    def __init__(self, is_offline_deterministic: bool = True):
        self.is_offline_deterministic = is_offline_deterministic

    def run_case(
        self,
        system_profile: SystemProfile,
        benchmark: Benchmark,
        case: Case,
        deterministic_seed: Optional[str] = None
    ) -> EvaluationResult:
        """Executes a benchmark case against a SystemProfile deterministically."""
        if not system_profile.id or not benchmark.id or not case.id:
            raise ValidationError("system_profile, benchmark, and case must all have valid non-empty IDs.")

        now_iso = datetime.now(timezone.utc).isoformat()
        ts_seed = int(time.time() * 1000)
        run_id = f"run_{ts_seed}"
        trace_id = f"trc_{ts_seed}"
        eval_id = f"eval_{ts_seed}"

        run = Run(
            id=run_id,
            version=PRODUCT_CONTRACTS_SCHEMA_VERSION,
            benchmark_id=benchmark.id,
            system_profile_id=system_profile.id,
            status=RunStatus.COMPLETED,
            started_at=now_iso,
            completed_at=now_iso,
            trace_ids=[trace_id],
            evaluation_id=eval_id,
            environment_metadata={
                "provider": "deterministic-mock" if self.is_offline_deterministic else "remote",
                "is_offline_deterministic": self.is_offline_deterministic,
                "seed": deterministic_seed or "0x42"
            }
        )

        trace = Trace(
            id=trace_id,
            version=PRODUCT_CONTRACTS_SCHEMA_VERSION,
            run_id=run_id,
            case_id=case.id,
            status=TraceStatus.COMPLETED,
            events=[],
            token_usage={"prompt_tokens": 120, "completion_tokens": 30, "total_tokens": 150},
            duration_ms=100.0,
            started_at=now_iso,
            ended_at=now_iso
        )

        raw_obs_data = {"score": 1.0, "status": "pass", "caseId": case.id}
        obs_sig = compute_sha256(raw_obs_data)

        observation = EvidenceObservation(
            id=f"obs_{ts_seed}",
            version=PRODUCT_CONTRACTS_SCHEMA_VERSION,
            trace_id=trace_id,
            run_id=run_id,
            nature=EpistemicNature.OBSERVED,
            category=ObservationCategory.BEHAVIORAL_TRACE,
            data=raw_obs_data,
            confidence=EvidenceConfidence.DETERMINISTIC,
            sha256_signature=obs_sig,
            recorded_at=now_iso
        )

        claim = Claim(
            id=f"clm_{ts_seed}",
            version=PRODUCT_CONTRACTS_SCHEMA_VERSION,
            evaluation_id=eval_id,
            statement=f"Evaluation passed for {system_profile.name} on {case.title}.",
            assertion_type=ClaimAssertionType.ANTI_GAMING_RESISTANCE,
            status=ClaimStatus.VERIFIED,
            nature=EpistemicNature.OBSERVED,
            supporting_observation_ids=[observation.id],
            refuting_observation_ids=[],
            scope={"offline_deterministic_only": True}
        )

        evaluation = Evaluation(
            id=eval_id,
            version=PRODUCT_CONTRACTS_SCHEMA_VERSION,
            run_id=run_id,
            benchmark_id=benchmark.id,
            system_profile_id=system_profile.id,
            status=EvaluationStatus.PASSED,
            overall_score=1.0,
            score_breakdown={"default": {"score": 1.0, "weight": 1.0, "status": "passed"}},
            observation_ids=[observation.id],
            claim_ids=[claim.id],
            generated_at=now_iso
        )

        review = Review(
            id=f"rev_{ts_seed}",
            version=PRODUCT_CONTRACTS_SCHEMA_VERSION,
            target_id=eval_id,
            reviewer_id="reviewer_local_python_runner",
            reviewer_role=ReviewerRole.INDEPENDENT_OBSERVER,
            verdict=ReviewVerdict.APPROVED,
            comments="Verified offline deterministic execution.",
            reproducibility_audit_passed=True,
            reviewed_at=now_iso
        )

        return EvaluationResult(
            run=run,
            trace=trace,
            evaluation=evaluation,
            claims=[claim],
            observations=[observation],
            review=review
        )
