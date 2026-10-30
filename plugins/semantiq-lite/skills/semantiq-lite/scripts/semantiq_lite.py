"""Minimal offline adapter over the SemantIQ Python SDK.

Only controlled-language validation calls the SDK. Evidence labels are not
retrieved, inspected, or represented as independent verification.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from typing import Any

MAX_TEXT = 20000

# Supplemental narrow wording rules; not a multilingual truth detector.
ABSOLUTE_SAFETY_PATTERNS = (
    (r"\b100\s*%\s*(?:safe|secure|accurate|reliable)\b", "100% safety/certainty claim"),
    (r"\b(?:always\s+(?:safe|secure)|never\s+(?:make(?:s)?\s+(?:a\s+)?mistake|fail(?:s)?))\b", "unqualified always/never claim"),
    (r"(?:۱۰۰|100)\s*[٪%]\s*(?:امن|ایمن|مطمئن)", "ادعای ایمنی صددرصد"),
    (r"هیچ\s+خطایی\s+ندارد", "ادعای بدون خطا"),
    (r"کاملاً\s+ایمن\s+است", "ادعای ایمنی مطلق"),
)
PERSIAN_SCRIPT = re.compile(r"[\u0600-\u06ff]")


def supplementary_wording_flags(statement: str) -> list[dict[str, str]]:
    flags = []
    for pattern, term in ABSOLUTE_SAFETY_PATTERNS:
        if re.search(pattern, statement, flags=re.IGNORECASE):
            flags.append({
                "term": term,
                "rationale": "Unqualified absolute claim needs independently checked evidence.",
                "suggested_replacement": "Use scoped, evidenced language; do not assert certainty.",
            })
    return flags


def claim_check(statement: str) -> dict[str, Any]:
    try:
        from semantiq import SemantiqClient
    except ImportError as exc:
        raise RuntimeError(
            "SemantIQ Python SDK unavailable. From a source checkout install with "
            "python -m pip install -e ./packages/python"
        ) from exc
    result = SemantiqClient(is_offline_deterministic=True).validate_claim_language(statement)
    violations = [
        {
            "term": violation.term,
            "rationale": violation.rationale,
            "suggested_replacement": violation.suggested_replacement,
        }
        for violation in result.violations
    ] + supplementary_wording_flags(statement)
    persian_present = bool(PERSIAN_SCRIPT.search(statement))
    # Passing English regex rules does not demonstrate coverage of Persian.
    status = "flagged" if violations else ("needs_review" if persian_present else "pass")
    return {
        "command": "claim-check",
        "status": status,
        "violations": violations,
        "coverage": "limited_lexical_rules",
        "review_warning": (
            "Persian-language content is not comprehensively evaluated."
            if persian_present else
            "No matching wording rule is not evidence of truth or safety."
        ),
        "scope": "Controlled-language policy, not truth or causal verification.",
    }



def evidence_limits(sources: list[str]) -> dict[str, Any]:
    distinct = list(dict.fromkeys(sources))
    limits = [
        "References are user-supplied labels; content and authenticity were not checked.",
        "No study design, sample, measurement, or claim-evidence linkage was verified.",
    ]
    if not distinct:
        limits.insert(0, "No evidence references were supplied.")
    return {
        "command": "evidence-limits",
        "reference_count": len(distinct),
        "references": distinct,
        "limitations": limits,
        "verification_status": "not_verified",
    }


def short_report(statement: str, sources: list[str]) -> dict[str, Any]:
    return {
        "command": "short-report",
        "claim_check": claim_check(statement),
        "evidence_limits": evidence_limits(sources),
        "verdict": "human_review_required",
        "scope": "No truth, safety, or semantic maturity score is produced.",
    }


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="SemantIQ Lite: offline claim review")
    subparsers = parser.add_subparsers(dest="command", required=True)
    for name in ("claim-check", "evidence-limits", "short-report"):
        action = subparsers.add_parser(name)
        action.add_argument("--text", help="Statement; stdin is used if omitted")
        action.add_argument("--source", action="append", default=[], help="Unverified reference label")
        action.add_argument("--json", action="store_true", help="Machine-readable output")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    statement = args.text if args.text is not None else sys.stdin.read(MAX_TEXT + 1)
    if not statement.strip() or len(statement) > MAX_TEXT:
        print(f"Error: --text/stdin must contain 1 to {MAX_TEXT} characters.", file=sys.stderr)
        return 2
    try:
        if args.command == "claim-check":
            result = claim_check(statement)
        elif args.command == "evidence-limits":
            result = evidence_limits(args.source)
        else:
            result = short_report(statement, args.source)
    except RuntimeError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 2
    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    elif args.command == "claim-check":
        print(f"Claim check: {result['status']} ({len(result['violations'])} wording flags)")
        for item in result["violations"]:
            print(f"- {item['term']}: {item['suggested_replacement']}")
        print(result["scope"])
    elif args.command == "evidence-limits":
        print(f"Evidence labels: {result['reference_count']} (not verified)")
        for limit in result["limitations"]:
            print(f"- {limit}")
    else:
        check = result["claim_check"]
        limits = result["evidence_limits"]
        print("SemantIQ Lite | Short Report")
        print(f"Claim wording: {check['status']} ({len(check['violations'])} flags)")
        print(f"Evidence labels: {limits['reference_count']} (not verified)")
        for limit in limits["limitations"]:
            print(f"- {limit}")
        print("Verdict: human review required; no truth score.")
    return 1 if args.command == "claim-check" and result["status"] != "pass" else 0


if __name__ == "__main__":
    raise SystemExit(main())
