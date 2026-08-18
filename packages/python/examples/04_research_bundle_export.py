"""
SemantIQ Python SDK Example 04: Research Bundle Packaging & Verification.

Demonstrates exporting runs, evaluations, and claims into a cryptographically sealed ResearchBundle.
"""
from pathlib import Path
import sys

src_dir = Path(__file__).resolve().parents[1] / "src"
if str(src_dir) not in sys.path:
    sys.path.insert(0, str(src_dir))

from semantiq import (
    SemantiqClient,
    mock_benchmark,
    mock_case,
    mock_governed_claim,
    mock_system_profile,
)


def main():
    print("=== SemantIQ Research Bundle Export & Verification ===")
    client = SemantiqClient()

    # 1. Run evaluation to produce canonical artifacts
    profile = mock_system_profile()
    benchmark = mock_benchmark()
    case = mock_case()
    result = client.evaluate(profile, benchmark, case)

    # 2. Prepare governed claims
    claim = mock_governed_claim()

    # 3. Export ResearchBundle
    bundle = client.export_research_bundle(
        bundle_id="bundle_py_demo_2026",
        title="Python SDK Demonstration Research Bundle",
        runs=[result.run],
        evaluations=[result.evaluation],
        claims=[claim]
    )

    print(f"Exported ResearchBundle:")
    print(f"  Bundle ID:        {bundle.id}")
    print(f"  Schema Version:   {bundle.version}")
    print(f"  Included Items:   {len(bundle.included_artifacts)}")
    print(f"  Merkle Root Hash: {bundle.merkle_root_hash}")

    # 4. Verify bundle integrity
    is_valid = client.verify_bundle(bundle)
    print(f"Cryptographic Verification: {is_valid}")

    # 5. Import bundle
    import_result = client.import_bundle(bundle)
    print(f"Imported Artifacts: {import_result.imported_claims_count} claims, {import_result.imported_runs_count} runs")


if __name__ == "__main__":
    main()
