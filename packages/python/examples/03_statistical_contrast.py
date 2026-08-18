"""
SemantIQ Python SDK Example 03: Matched Controls & Statistical Contrast.

Demonstrates deterministic 7-dimension matching and paired statistical contrast estimation.
"""
from pathlib import Path
import sys

src_dir = Path(__file__).resolve().parents[1] / "src"
if str(src_dir) not in sys.path:
    sys.path.insert(0, str(src_dir))

from semantiq import (
    SemantiqClient,
    mock_run_profile,
)


def main():
    print("=== SemantIQ Matched Controls & Statistical Contrast ===")
    client = SemantiqClient()

    # 1. Create treatment runs (with DP-001 mitigation) and control runs (without)
    treatment_runs = [
        mock_run_profile(run_id=f"treat_{i}", is_treatment=True, score=0.92 + (i * 0.01))
        for i in range(5)
    ]
    control_runs = [
        mock_run_profile(run_id=f"ctrl_{i}", is_treatment=False, score=0.68 + (i * 0.01))
        for i in range(5)
    ]

    # 2. Match across canonical dimensions
    matching_result = client.match_controls(treatment_runs, control_runs, target_metric="score")
    print(f"Matched Pairs:     {len(matching_result['matched_pairs'])}")
    print(f"Matching Coverage: {matching_result['matching_coverage_ratio'] * 100}%")

    # 3. Evaluate paired contrast and confidence intervals
    report = client.evaluate_contrast(target_metric="score", matched_data=matching_result)

    print(f"\nStatistical Contrast Report ({report.report_id}):")
    print(f"  Target Metric:          {report.target_metric}")
    print(f"  Mean Treatment Score:   {report.mean_treatment_score}")
    print(f"  Mean Control Score:     {report.mean_control_score}")
    print(f"  Mean Delta:             +{report.mean_delta}")
    print(f"  Bootstrap 95% CI:       [{report.bootstrap_ci.lower}, {report.bootstrap_ci.upper}]")
    print(f"  Sign Test p-value:      {report.sign_test.p_value}")
    print(f"  Evidence Grade:         {report.statistical_evidence_grade}")
    print(f"  Mandatory Epistemic Disclaimer: {report.epistemic_disclaimer}")


if __name__ == "__main__":
    main()
