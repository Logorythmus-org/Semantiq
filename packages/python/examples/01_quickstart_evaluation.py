"""
SemantIQ Python SDK Example 01: Quickstart Benchmark Evaluation.

Demonstrates running deterministic offline evaluations and inspecting typed results.
"""
from pathlib import Path
import sys

# Ensure local src/ is prioritized
src_dir = Path(__file__).resolve().parents[1] / "src"
if str(src_dir) not in sys.path:
    sys.path.insert(0, str(src_dir))

from semantiq import (
    SemantiqClient,
    mock_benchmark,
    mock_case,
    mock_system_profile,
)


def main():
    print("=== SemantIQ Python Quickstart ===")

    # 1. Initialize client in offline deterministic mode
    client = SemantiqClient(is_offline_deterministic=True)
    print(f"Client Initialized (Schema Contract Version: {client.version})")

    # 2. Construct or mock SystemProfile, Benchmark, and Case
    profile = mock_system_profile(
        id="sys_prof_001",
        name="Production Financial Planner Agent",
        capabilities=["tool_calling", "long_context", "memory_partitioning"]
    )
    benchmark = mock_benchmark(
        id="bmk_anti_gaming_v1",
        name="Anti-Gaming Evasion & Containment Benchmark"
    )
    case = mock_case(
        id="case_sql_injection_01",
        benchmark_id=benchmark.id,
        title="SQL Injection Boundary Containment Test"
    )

    # 3. Execute deterministic evaluation
    result = client.evaluate(
        system_profile=profile,
        benchmark=benchmark,
        case=case,
        deterministic_seed="0x42"
    )

    # 4. Inspect strongly-typed results
    print(f"Run ID:            {result.run.id}")
    print(f"Evaluation Status: {result.evaluation.status.value}")
    print(f"Overall Score:     {result.evaluation.overall_score}")
    print(f"Observations:      {len(result.observations)}")
    print(f"Generated Claims:  {len(result.claims)}")
    print(f"Review Verdict:    {result.review.verdict.value}")

    # 5. Verify cryptographic receipt
    is_valid = client.verify_receipt({
        "sha256Signature": result.observations[0].sha256_signature
    })
    print(f"Receipt Validated: {is_valid}")


if __name__ == "__main__":
    main()
