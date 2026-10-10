"""
Tests for Python CLI interface.
"""
from io import StringIO
import re
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
    assert "Release Version: 0.1.0a2" in captured.out
    assert "Maturity: Public Alpha (Experimental)" in captured.out
    assert "Schema Version: 1.0.0" in captured.out


def test_cli_version(capsys):
    with pytest.raises(SystemExit) as exc:
        main(["--version"])
    assert exc.value.code == 0
    captured = capsys.readouterr()
    assert "semantiq 0.1.0a2 (Public Alpha (Experimental)); schema 1.0.0" in captured.out


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


def _expected_ascii_logo():
    assets = Path(__file__).resolve().parents[1] / "src" / "semantiq" / "assets"
    brain = (assets / "semantiq-logo.txt").read_text(encoding="utf-8")
    title = (assets / "semantiq-wordmark.txt").read_text(encoding="utf-8")
    assert len(brain.splitlines()) == 27
    assert len(title.splitlines()) == 8
    assert title.startswith(" █████████")
    return brain.rstrip("\n") + "\n\n" + title.rstrip("\n") + "\n"


def test_cli_logo_matches_packaged_asset(capsys):
    assert main(["logo"]) == 0
    captured = capsys.readouterr()
    expected = _expected_ascii_logo()
    assert captured.out == expected
    assert "█████████" in captured.out
    assert "░░" in captured.out
    assert "\x1b[" not in captured.out


def test_cli_logo_force_color_and_plain_modes(capsys):
    expected = _expected_ascii_logo()

    assert main(["logo", "--color=always"]) == 0
    colored = capsys.readouterr().out
    assert "\x1b[38;2;255;178;174m" in colored
    assert "\x1b[38;2;147;176;194m" in colored
    assert re.sub(r"\x1b\[[0-9;]*m", "", colored) == expected

    assert main(["logo", "--color=never"]) == 0
    assert capsys.readouterr().out == expected
