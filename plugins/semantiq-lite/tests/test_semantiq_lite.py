"""No-dependency adapter contract tests; the SDK has its own tests."""
import importlib.util
import io
import json
import os
from pathlib import Path
import subprocess
import sys
import types
import unittest
from unittest.mock import patch

SCRIPT = Path(__file__).parents[1] / "skills" / "semantiq-lite" / "scripts" / "semantiq_lite.py"
spec = importlib.util.spec_from_file_location("semantiq_lite_adapter", SCRIPT)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class FakeViolation:
    term = "causes"
    rationale = "Unsupported causality"
    suggested_replacement = "is associated with"


class FakeClient:
    def __init__(self, is_offline_deterministic=False):
        assert is_offline_deterministic

    def validate_claim_language(self, statement):
        return types.SimpleNamespace(
            is_valid="causes" not in statement.lower(),
            violations=[FakeViolation()] if "causes" in statement.lower() else [],
        )


class SemantiqLiteTests(unittest.TestCase):
    def setUp(self):
        self.sdk = patch.dict(sys.modules, {"semantiq": types.SimpleNamespace(SemantiqClient=FakeClient)})
        self.sdk.start()

    def tearDown(self):
        self.sdk.stop()

    def test_claim_check_flags_disallowed_wording(self):
        result = module.claim_check("Treatment causes improvement.")
        self.assertEqual(result["status"], "flagged")
        self.assertEqual(result["violations"][0]["term"], "causes")

    def test_claim_check_passes_noncausal_wording_without_truth_claim(self):
        result = module.claim_check("Treatment is associated with improvement.")
        self.assertEqual(result["status"], "pass")
        self.assertIn("not truth", result["scope"].lower())

    def test_english_100_percent_safe_regression(self):
        result = module.claim_check("This AI is 100% safe.")
        self.assertEqual(result["status"], "flagged")
        self.assertIn("100% safety/certainty claim", [x["term"] for x in result["violations"]])

    def test_persian_absolute_safety_regression(self):
        result = module.claim_check("این سیستم هیچ خطایی ندارد و کاملاً ایمن است.")
        self.assertEqual(result["status"], "flagged")
        self.assertGreaterEqual(len(result["violations"]), 2)

    def test_unmatched_persian_requires_human_review(self):
        result = module.claim_check("پژوهش به نتایج جدیدی اشاره دارد.")
        self.assertEqual(result["status"], "needs_review")
        self.assertEqual(result["coverage"], "limited_lexical_rules")

    def test_unqualified_always_never_english(self):
        for sentence in ("This model will never make a mistake.", "The model is always secure."):
            with self.subTest(sentence=sentence):
                self.assertEqual(module.claim_check(sentence)["status"], "flagged")

    def test_evidence_limits_are_not_verification(self):
        result = module.evidence_limits(["ref-1", "ref-1", "ref-2"])
        self.assertEqual(result["reference_count"], 2)
        self.assertEqual(result["verification_status"], "not_verified")
        self.assertEqual(len(module.evidence_limits([])["limitations"]), 3)

    def test_short_report_never_outputs_truth_score(self):
        result = module.short_report("The result improved.", ["paper-1"])
        self.assertEqual(result["verdict"], "human_review_required")
        self.assertNotIn("score", result.keys())

    def test_cli_json_and_exit_codes(self):
        with patch("sys.stdout", new_callable=io.StringIO) as out:
            code = module.main(["claim-check", "--text", "Treatment causes improvement.", "--json"])
        self.assertEqual(code, 1)
        self.assertEqual(json.loads(out.getvalue())["status"], "flagged")
        with patch("sys.stdout", new_callable=io.StringIO) as out:
            code = module.main(["short-report", "--text", "The result improved.", "--source", "ref-1", "--json"])
        self.assertEqual(code, 0)
        self.assertEqual(json.loads(out.getvalue())["evidence_limits"]["reference_count"], 1)

    def test_empty_and_too_long_inputs_rejected(self):
        for text in ("  ", "x" * (module.MAX_TEXT + 1)):
            with patch("sys.stderr", new_callable=io.StringIO):
                self.assertEqual(module.main(["short-report", "--text", text]), 2)

    def run_stdin(self, payload, args, errors="surrogateescape"):
        with io.TextIOWrapper(io.BytesIO(payload), encoding="utf-8", errors=errors) as stdin:
            with patch("sys.stdin", stdin), patch("sys.stdout", new_callable=io.StringIO) as out:
                with patch("sys.stderr", new_callable=io.StringIO) as err:
                    code = module.main(args)
            return code, out.getvalue(), err.getvalue()

    def test_invalid_utf8_stops_before_evaluation(self):
        for action in ("claim-check", "evidence-limits", "short-report"):
            with self.subTest(action=action), patch.object(module, "claim_check") as claim:
                with patch.object(module, "evidence_limits") as evidence:
                    with patch.object(module, "short_report") as report:
                        code, out, err = self.run_stdin(b"private-marker\xff", [action, "--json"])
                self.assertEqual(code, 2)
                self.assertEqual(out, "")
                self.assertIn("valid UTF-8", err)
                self.assertNotIn("private-marker", err)
                self.assertNotIn("Traceback", err)
                claim.assert_not_called()
                evidence.assert_not_called()
                report.assert_not_called()

    def test_invalid_utf8_subprocess_errors_are_not_crashes(self):
        for action in ("claim-check", "evidence-limits", "short-report"):
            for errors in ("strict", "surrogateescape", "replace"):
                for json_args in ([], ["--json"]):
                    with self.subTest(action=action, errors=errors, json=json_args):
                        run = subprocess.run(
                            [sys.executable, str(SCRIPT), action, *json_args],
                            input=b"private-marker\xff", capture_output=True, timeout=10,
                            env={**os.environ, "PYTHONIOENCODING": f"utf-8:{errors}"},
                        )
                        self.assertEqual(run.returncode, 2, run.stderr)
                        self.assertEqual(run.stdout, b"")
                        self.assertEqual(
                            run.stderr.replace(b"\r\n", b"\n"),
                            b"Error: stdin must be valid UTF-8; encode the input as UTF-8 or use --text.\n",
                        )

    def test_ascii_stdin_preserves_json_and_action_exit_codes(self):
        for action in ("claim-check", "evidence-limits", "short-report"):
            for text in ("An association was observed.", "Treatment causes improvement."):
                with self.subTest(action=action, text=text):
                    code, out, err = self.run_stdin(text.encode(), [action, "--json"])
                    self.assertEqual(code, 1 if action == "claim-check" and "causes" in text else 0)
                    self.assertEqual(json.loads(out)["command"], action)
                    self.assertEqual(err, "")

    def test_persian_utf8_stdin_preserves_review_status(self):
        text = "پژوهش به نتایج جدیدی اشاره دارد."
        code, out, err = self.run_stdin(text.encode("utf-8"), ["claim-check", "--json"])
        self.assertEqual(code, 1)
        self.assertEqual(json.loads(out)["status"], "needs_review")
        self.assertEqual(err, "")

    def test_empty_stdin_is_an_input_error(self):
        for action in ("claim-check", "evidence-limits", "short-report"):
            with self.subTest(action=action):
                code, out, err = self.run_stdin(b"", [action, "--json"])
                self.assertEqual(code, 2)
                self.assertEqual(out, "")
                self.assertIn("must contain 1 to", err)

    def test_explicit_text_does_not_decode_stdin(self):
        code, out, err = self.run_stdin(
            b"\xff", ["claim-check", "--text", "An association was observed.", "--json"],
        )
        self.assertEqual(code, 0)
        self.assertEqual(json.loads(out)["status"], "pass")
        self.assertEqual(err, "")


if __name__ == "__main__":
    unittest.main()
