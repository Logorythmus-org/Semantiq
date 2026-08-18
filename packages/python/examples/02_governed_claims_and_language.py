"""
SemantIQ Python SDK Example 02: Governed Claims & Controlled Language.

Demonstrates validating claim statements against epistemic policies and drafting governed claims.
"""
from pathlib import Path
import sys

src_dir = Path(__file__).resolve().parents[1] / "src"
if str(src_dir) not in sys.path:
    sys.path.insert(0, str(src_dir))

from semantiq import (
    ControlledLanguageError,
    SemantiqClient,
)


def main():
    print("=== SemantIQ Governed Claims & Controlled Language ===")
    client = SemantiqClient()

    # 1. Test an invalid claim statement containing unhedged causal words
    unsupported_statement = "Dynamic heartbeat causes zero downtime and completely eliminates system hanging."
    validation = client.validate_claim_language(unsupported_statement)

    print(f"Statement: \"{unsupported_statement}\"")
    print(f"Is Valid:  {validation.is_valid}")
    print(f"Violations Detected: {len(validation.violations)}")
    for v in validation.violations:
        print(f"  - Prohibited Term: '{v.term}'")
        print(f"    Suggested Fix:   '{v.suggested_replacement}'")
        print(f"    Rationale:       {v.rationale}")

    # 2. Test a compliant associative claim statement
    compliant_statement = (
        "Dynamic heartbeat monitoring is associated with an empirical 80% decrease "
        "in task timeout frequency under standard benchmark conditions."
    )
    compliant_val = client.validate_claim_language(compliant_statement)
    print(f"\nCompliant Statement: \"{compliant_statement}\"")
    print(f"Is Valid: {compliant_val.is_valid}")

    # 3. Draft a governed claim
    governed_claim = client.draft_claim(
        statement=compliant_statement,
        topic="heartbeat_resilience",
        target_pattern_or_relation_id="DP-001_FP-001",
        run_ids=["run_101", "run_102"],
        observation_ids=["obs_501", "obs_502"],
        governance_verdict="promote"
    )

    print(f"\nCreated Governed Claim:")
    print(f"  Claim ID:        {governed_claim.id}")
    print(f"  Family ID:       {governed_claim.claim_family_id}")
    print(f"  Status:          {governed_claim.status.value}")
    print(f"  Mandatory Seal:  {governed_claim.epistemic_disclaimer}")


if __name__ == "__main__":
    main()
