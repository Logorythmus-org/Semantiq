"""Real-SDK end-to-end checks for the Codex/ChatGPT SemantIQ Lite adapter.

Run only with the repository's SDK installed. Never stub semantiq here.
These smoke checks verify the installed package import and the three CLI commands.
"""
from __future__ import annotations

import json
from pathlib import Path
import subprocess
import sys

import semantiq

ROOT = Path(__file__).resolve().parents[3]
SCRIPT = ROOT / "plugins/semantiq-lite/skills/semantiq-lite/scripts/semantiq_lite.py"


def run_cli(command: str, statement: str, *extra: str) -> tuple[subprocess.CompletedProcess[str], dict]:
    result = subprocess.run(
        [sys.executable, str(SCRIPT), command, "--text", statement, *extra, "--json"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        timeout=20,
        check=False,
    )
    assert result.stdout.strip(), f"No JSON output: rc={result.returncode} stderr={result.stderr}"
    return result, json.loads(result.stdout)


def test_real_sdk_available_and_script_exists():
    assert semantiq.__version__
    assert SCRIPT.is_file()


def test_claim_check_real_sdk_four_flags():
    run, data = run_cli(
        "claim-check",
        "Our benchmark proves the agent eliminates every risk and guarantees perfect security.",
    )
    assert run.returncode == 1, run.stderr
    assert data["status"] == "flagged"
    assert len(data["violations"]) == 4
    assert {v["term"] for v in data["violations"]} == {
        "proves", "guarantees", "eliminates", "absolutist claim",
    }


def test_claim_check_real_sdk_noncausal_language():
    run, data = run_cli("claim-check", "Our study observed an association in the test sample.")
    assert run.returncode == 0, run.stderr
    assert data["status"] == "pass"
    assert "not truth" in data["scope"].lower()


def test_evidence_limits_two_unique_unverified_labels():
    run, data = run_cli(
        "evidence-limits",
        "Our study observed an association.",
        "--source", "paper-1", "--source", "experiment-42", "--source", "paper-1",
    )
    assert run.returncode == 0, run.stderr
    assert data["reference_count"] == 2
    assert data["verification_status"] == "not_verified"
    assert data["references"] == ["paper-1", "experiment-42"]


def test_short_report_real_sdk_two_flags_one_reference():
    run, data = run_cli(
        "short-report",
        "Our evaluation proves the new agent guarantees safe execution.",
        "--source", "paper-1",
    )
    assert run.returncode == 0, run.stderr
    assert data["claim_check"]["status"] == "flagged"
    assert len(data["claim_check"]["violations"]) == 2
    assert data["evidence_limits"]["reference_count"] == 1
    assert data["verdict"] == "human_review_required"
    assert "score" not in data


def test_absolute_english_100_percent_is_flagged():
    run, data = run_cli("claim-check", "This AI is 100% safe.")
    assert run.returncode == 1, run.stderr
    assert data["status"] == "flagged"


def test_persian_absolute_claim_is_flagged():
    run, data = run_cli("claim-check", "این سیستم هیچ خطایی ندارد و کاملاً ایمن است.")
    assert run.returncode == 1, run.stderr
    assert data["status"] == "flagged"
    assert len(data["violations"]) >= 2


def test_unrecognized_persian_text_requires_review():
    run, data = run_cli("claim-check", "پژوهش به نتایج جدیدی اشاره دارد.")
    assert run.returncode == 1, run.stderr
    assert data["status"] == "needs_review"
    assert data["coverage"] == "limited_lexical_rules"


def test_reference_labels_never_count_as_verification():
    run, data = run_cli(
        "short-report", "An improvement was observed.", "--source", "unverified-example"
    )
    assert run.returncode == 0, run.stderr
    assert data["evidence_limits"]["verification_status"] == "not_verified"
    assert data["verdict"] == "human_review_required"
