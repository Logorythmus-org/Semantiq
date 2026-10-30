"""No-dependency adapter contract tests; the SDK has its own tests."""
import importlib.util
import io
import json
from pathlib import Path
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


if __name__ == "__main__":
    unittest.main()
