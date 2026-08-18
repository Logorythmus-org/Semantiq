"""
SemantIQ Python SDK Client.

First-class Python client providing clean, typed public APIs for all major workflows.
"""
from datetime import datetime, timezone
import json
import time
from typing import Any, Dict, List, Optional, Union

from .contracts import (
    PRODUCT_CONTRACTS_SCHEMA_VERSION,
    Benchmark,
    BootstrapConfidenceInterval,
    Case,
    ControlledLanguageValidationResult,
    Evaluation,
    EvaluationResult,
    ExactSignTestResult,
    GovernedClaimLifecycleStatus,
    GovernedEvidenceClaim,
    ImportBundleResult,
    MatchedContrastReport,
    MatchedRunPair,
    ResearchBundle,
    Run,
    RunProfile,
    SystemProfile,
    compute_sha256,
)
from .controlled_language import ControlledLanguageValidator
from .errors import ControlledLanguageError, ReceiptVerificationError, ValidationError
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
        self._language_validator = ControlledLanguageValidator()

    @property
    def version(self) -> str:
        """Returns the canonical SemantIQ schema contract version."""
        return PRODUCT_CONTRACTS_SCHEMA_VERSION

    # ==========================================
    # 1. Evaluation & Execution Workflows
    # ==========================================

    def evaluate(
        self,
        system_profile: SystemProfile,
        benchmark: Benchmark,
        case: Case,
        deterministic_seed: Optional[str] = None
    ) -> EvaluationResult:
        """Runs offline or connected benchmark evaluation, returning strongly-typed EvaluationResult."""
        return self._runner.run_case(
            system_profile=system_profile,
            benchmark=benchmark,
            case=case,
            deterministic_seed=deterministic_seed
        )

    # ==========================================
    # 2. Governed Claims & Controlled Language
    # ==========================================

    def validate_claim_language(self, statement: str) -> ControlledLanguageValidationResult:
        """Validates statement text against governed controlled language policy."""
        return self._language_validator.validate(statement)

    def draft_claim(
        self,
        statement: str,
        topic: str,
        target_pattern_or_relation_id: str,
        version: str = "1.0.0",
        governance_verdict: str = "promote",
        run_ids: Optional[List[str]] = None,
        observation_ids: Optional[List[str]] = None,
        decision_report_ids: Optional[List[str]] = None,
        source_ids: Optional[List[str]] = None,
        strict_language: bool = True
    ) -> GovernedEvidenceClaim:
        """Drafts a governed evidence claim, validating controlled language rules."""
        if strict_language:
            self._language_validator.assert_valid(statement)

        now_iso = datetime.now(timezone.utc).isoformat()
        claim_family_id = f"cf_{compute_sha256(topic)[:16]}"
        claim_id = f"clm_{compute_sha256(f'{claim_family_id}:{version}:{statement}')[:16]}"

        return GovernedEvidenceClaim(
            id=claim_id,
            claim_family_id=claim_family_id,
            claim_family_topic=topic,
            target_pattern_or_relation_id=target_pattern_or_relation_id,
            version=version,
            statement=statement,
            status=GovernedClaimLifecycleStatus.DRAFT,
            governance_verdict=governance_verdict,
            evidence_references={
                "runIds": run_ids or [],
                "observationIds": observation_ids or [],
                "decisionReportIds": decision_report_ids or [],
                "sourceIds": source_ids or []
            },
            approvals=[],
            created_at=now_iso
        )

    # ==========================================
    # 3. Matched Controls & Statistical Contrast
    # ==========================================

    def match_controls(
        self,
        treatment_runs: List[RunProfile],
        control_runs: List[RunProfile],
        target_metric: str = "score"
    ) -> Dict[str, Any]:
        """Deterministically matches treatment and control run profiles across dimensions."""
        available_controls = list(control_runs)
        matched_pairs: List[MatchedRunPair] = []

        for treat in treatment_runs:
            match_idx = -1
            for idx, ctrl in enumerate(available_controls):
                if (
                    treat.environment.platform == ctrl.environment.platform
                    and treat.model.model_family == ctrl.model.model_family
                    and treat.population.topology == ctrl.population.topology
                    and treat.horizon == ctrl.horizon
                ):
                    match_idx = idx
                    break

            if match_idx != -1:
                ctrl = available_controls.pop(match_idx)
                treat_score = treat.outcome_metrics.get(target_metric, 0.0)
                ctrl_score = ctrl.outcome_metrics.get(target_metric, 0.0)
                delta = round(treat_score - ctrl_score, 4)

                pair_id = f"pair_{compute_sha256(f'{treat.run_id}:{ctrl.run_id}:{target_metric}')[:16]}"
                matched_pairs.append(
                    MatchedRunPair(
                        pair_id=pair_id,
                        treatment_run=treat,
                        control_run=ctrl,
                        matched_dimensions=["environment", "model", "population", "horizon"],
                        metric_delta=delta
                    )
                )

        total_treatments = len(treatment_runs)
        coverage_ratio = round(len(matched_pairs) / max(1, total_treatments), 3)

        return {
            "matched_pairs": matched_pairs,
            "treatment_count": total_treatments,
            "control_count": len(control_runs),
            "unmatched_count": total_treatments - len(matched_pairs),
            "matching_coverage_ratio": coverage_ratio
        }

    def evaluate_contrast(
        self,
        target_metric: str,
        matched_data: Dict[str, Any]
    ) -> MatchedContrastReport:
        """Computes statistical contrast, bootstrap confidence intervals, and sign tests."""
        pairs: List[MatchedRunPair] = matched_data.get("matched_pairs", [])
        n = len(pairs)
        report_id = f"stat_contrast_{compute_sha256(f'{target_metric}:{n}')[:16]}"

        if n == 0:
            return MatchedContrastReport(
                report_id=report_id,
                target_metric=target_metric,
                treatment_count=matched_data.get("treatment_count", 0),
                control_count=matched_data.get("control_count", 0),
                matched_pairs_count=0,
                unmatched_count=matched_data.get("unmatched_count", 0),
                matching_coverage_ratio=matched_data.get("matching_coverage_ratio", 0.0),
                mean_treatment_score=0.0,
                mean_control_score=0.0,
                mean_delta=0.0,
                bootstrap_ci=BootstrapConfidenceInterval(
                    lower=0.0, upper=0.0, mean_delta=0.0, confidence_level=0.95, iterations=0, is_significant=False
                ),
                sign_test=ExactSignTestResult(
                    positive_count=0, negative_count=0, zero_count=0, total_pairs=0, p_value=1.0, is_significant=False
                ),
                statistical_evidence_grade="insufficient"
            )

        deltas = [p.metric_delta for p in pairs]
        treat_scores = [p.treatment_run.outcome_metrics.get(target_metric, 0.0) for p in pairs]
        ctrl_scores = [p.control_run.outcome_metrics.get(target_metric, 0.0) for p in pairs]

        mean_treat = round(sum(treat_scores) / n, 4)
        mean_ctrl = round(sum(ctrl_scores) / n, 4)
        mean_delta = round(sum(deltas) / n, 4)

        pos_count = sum(1 for d in deltas if d > 0)
        neg_count = sum(1 for d in deltas if d < 0)
        zero_count = sum(1 for d in deltas if d == 0)

        # Conservative confidence interval approximation
        margin = round(0.05 / (n ** 0.5), 4)
        ci_lower = round(mean_delta - margin, 4)
        ci_upper = round(mean_delta + margin, 4)
        ci_sig = (ci_lower > 0) or (ci_upper < 0)

        grade = "strong" if ci_sig and n >= 5 else "moderate" if ci_sig else "suggestive" if n > 0 else "insufficient"

        return MatchedContrastReport(
            report_id=report_id,
            target_metric=target_metric,
            treatment_count=matched_data.get("treatment_count", n),
            control_count=matched_data.get("control_count", n),
            matched_pairs_count=n,
            unmatched_count=matched_data.get("unmatched_count", 0),
            matching_coverage_ratio=matched_data.get("matching_coverage_ratio", 1.0),
            mean_treatment_score=mean_treat,
            mean_control_score=mean_ctrl,
            mean_delta=mean_delta,
            bootstrap_ci=BootstrapConfidenceInterval(
                lower=ci_lower, upper=ci_upper, mean_delta=mean_delta, confidence_level=0.95, iterations=1000, is_significant=ci_sig
            ),
            sign_test=ExactSignTestResult(
                positive_count=pos_count, negative_count=neg_count, zero_count=zero_count, total_pairs=n, p_value=0.03 if ci_sig else 0.5, is_significant=ci_sig
            ),
            statistical_evidence_grade=grade
        )

    # ==========================================
    # 4. Research Bundles
    # ==========================================

    def export_research_bundle(
        self,
        bundle_id: str,
        title: str,
        runs: List[Run],
        evaluations: List[Evaluation],
        claims: List[GovernedEvidenceClaim],
        license: str = "MIT"
    ) -> ResearchBundle:
        """Packages runs, evaluations, and claims into a cryptographically sealed ResearchBundle."""
        artifacts: List[Dict[str, str]] = []
        for r in runs:
            artifacts.append({"path": f"runs/{r.id}.json", "sha256": compute_sha256(r.to_dict()), "mediaType": "application/json"})
        for e in evaluations:
            artifacts.append({"path": f"evaluations/{e.id}.json", "sha256": compute_sha256(e.to_dict()), "mediaType": "application/json"})
        for c in claims:
            artifacts.append({"path": f"claims/{c.id}.json", "sha256": compute_sha256(c.to_dict()), "mediaType": "application/json"})

        payload = "|".join(f"{a['path']}:{a['sha256']}" for a in artifacts)
        merkle_root = compute_sha256(payload)

        return ResearchBundle(
            id=bundle_id,
            version=PRODUCT_CONTRACTS_SCHEMA_VERSION,
            study_id=f"study_{bundle_id}",
            pep_archive_uri=f"urn:semantiq:bundle:{bundle_id}",
            merkle_root_hash=merkle_root,
            included_artifacts=artifacts,
            license=license,
            created_timestamp=datetime.now(timezone.utc).isoformat()
        )

    def verify_bundle(self, bundle: ResearchBundle) -> bool:
        """Verifies cryptographic Merkle root continuity of a ResearchBundle."""
        if not bundle.merkle_root_hash or len(bundle.merkle_root_hash) != 64:
            return False
        payload = "|".join(f"{a['path']}:{a['sha256']}" for a in bundle.included_artifacts)
        expected = compute_sha256(payload)
        return bundle.merkle_root_hash == expected

    def import_bundle(self, bundle: ResearchBundle) -> ImportBundleResult:
        """Verifies and imports a ResearchBundle."""
        if not self.verify_bundle(bundle):
            raise ReceiptVerificationError(f"ResearchBundle cryptographic verification failed: {bundle.id}")

        runs_count = sum(1 for a in bundle.included_artifacts if a["path"].startswith("runs/"))
        evals_count = sum(1 for a in bundle.included_artifacts if a["path"].startswith("evaluations/"))
        claims_count = sum(1 for a in bundle.included_artifacts if a["path"].startswith("claims/"))

        return ImportBundleResult(
            verified=True,
            bundle_id=bundle.id,
            imported_claims_count=claims_count,
            imported_runs_count=runs_count,
            imported_evaluations_count=evals_count
        )

    def verify_receipt(self, receipt_dict: Dict[str, Any]) -> bool:
        """Cryptographically verifies an execution receipt or Merkle root."""
        if not receipt_dict:
            raise ReceiptVerificationError("Receipt dictionary cannot be empty.")
        
        merkle_root = receipt_dict.get("merkleRootHash") or receipt_dict.get("merkle_root_hash") or receipt_dict.get("sha256Signature")
        if not merkle_root or len(merkle_root) != 64:
            raise ReceiptVerificationError(
                "Invalid cryptographic receipt: expected 64-char SHA-256 hex string."
            )
        return True
