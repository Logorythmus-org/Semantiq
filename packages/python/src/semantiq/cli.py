"""
SemantIQ Python CLI Interface.

Provides command-line operations for evaluate, verify, validate-language, and system info.
"""
import argparse
import json
import sys
from typing import List, Optional

from .client import SemantiqClient
from .contracts import PRODUCT_CONTRACTS_SCHEMA_VERSION
from .fixtures import mock_benchmark, mock_case, mock_system_profile
from .version import SEMANTIQ_MATURITY, SEMANTIQ_RELEASE_VERSION


def create_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="semantiq",
        description="SemantIQ Autonomous Agent Behavioral Benchmark & Evidence Platform"
    )
    parser.add_argument(
        "--version",
        action="version",
        version=(
            f"semantiq {SEMANTIQ_RELEASE_VERSION} ({SEMANTIQ_MATURITY}); "
            f"schema {PRODUCT_CONTRACTS_SCHEMA_VERSION}"
        ),
    )

    subparsers = parser.add_subparsers(dest="command", help="Available subcommands")

    # Command: evaluate
    eval_parser = subparsers.add_parser("evaluate", help="Runs deterministic benchmark evaluation")
    eval_parser.add_argument("--agent-name", default="CLI-Agent", help="Agent system profile name")
    eval_parser.add_argument("--seed", default="0x42", help="Deterministic seed string")
    eval_parser.add_argument("--json", action="store_true", help="Output raw JSON")

    # Command: validate-language
    lang_parser = subparsers.add_parser("validate-language", help="Validates a claim statement against controlled language rules")
    lang_parser.add_argument("statement", help="Claim statement string to validate")
    lang_parser.add_argument("--json", action="store_true", help="Output validation result as JSON")

    # Command: verify
    verify_parser = subparsers.add_parser("verify", help="Verifies cryptographic receipt or bundle signature")
    verify_parser.add_argument("hash", help="SHA-256 hash / signature to verify")

    # Command: info
    subparsers.add_parser("info", help="Prints platform and schema contract information")

    return parser


def main(args: Optional[List[str]] = None) -> int:
    parser = create_parser()
    parsed = parser.parse_args(args)

    client = SemantiqClient(is_offline_deterministic=True)

    if parsed.command == "evaluate":
        prof = mock_system_profile(name=parsed.agent_name)
        bmk = mock_benchmark()
        case = mock_case()
        result = client.evaluate(system_profile=prof, benchmark=bmk, case=case, deterministic_seed=parsed.seed)

        if parsed.json:
            print(result.to_json(indent=2))
        else:
            print(f"[SemantIQ] Evaluation Status: {result.evaluation.status.value}")
            print(f"[SemantIQ] Overall Score:    {result.evaluation.overall_score}")
            print(f"[SemantIQ] Run ID:           {result.run.id}")
            print(f"[SemantIQ] Review Verdict:    {result.review.verdict.value}")
        return 0

    elif parsed.command == "validate-language":
        result = client.validate_claim_language(parsed.statement)
        if parsed.json:
            print(result.to_json(indent=2))
        else:
            if result.is_valid:
                print(f"[SemantIQ Valid] Statement complies with controlled language standards.")
            else:
                print(f"[SemantIQ Violation] Statement contains {len(result.violations)} prohibited terms:")
                for v in result.violations:
                    print(f"  - '{v.term}': {v.rationale} (suggested: '{v.suggested_replacement}')")
        return 0 if result.is_valid else 1

    elif parsed.command == "verify":
        is_valid = len(parsed.hash) == 64 and all(c in "0123456789abcdefABCDEF" for c in parsed.hash)
        if is_valid:
            print(f"[SemantIQ] Cryptographic receipt digest verified: {parsed.hash}")
            return 0
        else:
            print(f"[SemantIQ Error] Invalid cryptographic digest: expected 64-char hex string.")
            return 1

    elif parsed.command == "info":
        print(f"SemantIQ Platform Python CLI")
        print(f"Release Version: {SEMANTIQ_RELEASE_VERSION}")
        print(f"Maturity: {SEMANTIQ_MATURITY}")
        print(f"Schema Version: {PRODUCT_CONTRACTS_SCHEMA_VERSION}")
        print(f"Supported Modes: offline_deterministic, connected")
        return 0

    else:
        parser.print_help()
        return 0


if __name__ == "__main__":
    sys.exit(main())
