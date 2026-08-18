"""
Tests for Python CLI interface.
"""
from io import StringIO
from pathlib import Path
import sys

src_dir = Path(__file__).resolve().parents[1] / "src"
if str(src_dir) not in sys.path:
    sys.path.insert(0, str(src_dir))

import pytest

from semantiq.cli import main


def test_cli_info(capsys):
    exit_code = main(["info"])
    assert exit_code == 0
    captured = capsys.readouterr()
    assert "SemantIQ Platform Python CLI" in captured.out
    assert "1.0.0" in captured.out


def test_cli_evaluate(capsys):
    exit_code = main(["evaluate", "--agent-name", "TestAgent"])
    assert exit_code == 0
    captured = capsys.readouterr()
    assert "[SemantIQ] Evaluation Status: passed" in captured.out
    assert "[SemantIQ] Overall Score:    1.0" in captured.out


def test_cli_evaluate_json(capsys):
    exit_code = main(["evaluate", "--json"])
    assert exit_code == 0
    captured = capsys.readouterr()
    assert '"status": "passed"' in captured.out


def test_cli_validate_language_valid(capsys):
    exit_code = main(["validate-language", "Memory partitioning is associated with reduced leakage."])
    assert exit_code == 0
    captured = capsys.readouterr()
    assert "Statement complies" in captured.out


def test_cli_validate_language_invalid(capsys):
    exit_code = main(["validate-language", "Heartbeat causes zero downtime."])
    assert exit_code == 1
    captured = capsys.readouterr()
    assert "Statement contains" in captured.out
    assert "'causes'" in captured.out


def test_cli_verify_hash(capsys):
    exit_code = main(["verify", "a" * 64])
    assert exit_code == 0
    captured = capsys.readouterr()
    assert "Cryptographic receipt digest verified" in captured.out

    exit_code_bad = main(["verify", "short_hash"])
    assert exit_code_bad == 1
