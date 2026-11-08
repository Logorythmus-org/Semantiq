# Evaluation integrity increment — 2026-10-30

Issue #241 / draft PR #242. No model inference, release or merge.

## Fixed failure modes

The recorded A/B/C analyzer previously accepted arbitrary verdict strings and
collapsed invalid/missing telemetry into null. Python equality could also treat
settings False and 0 as equal. A truncated or empty frozen benchmark input was not
explicitly checked against the complete expected case inventory.

The analyzer now rejects unknown labels, duplicate/missing/extra case IDs, missing
or extra arms, blank model IDs, invalid settings, mismatched typed settings,
negative/non-finite/boolean telemetry, fractional token counts and numeric total
overflow. Its JSON reader rejects duplicate members and non-standard numbers.
CLI input failure exits 2 with no success report on stdout.

Missing telemetry remains null: each metric reports its measured-case count and
only reports a total when all cases have a value. A missing token/cost value is not
zero. Unknown denominators remain null. Partial measured sums are not extrapolated.

The frozen replay pins all four original case/gold byte hashes, requires 60 main
and 30 stress cases, checks unique case IDs and exact gold-ID equality, and rejects
unknown labels or nonboolean poisoning markers. Changed or empty input cannot
silently produce a passing benchmark. Pins are release-controlled consistency
checks; they do not authenticate the fixture author or external source.

## Explicit metric contract

- Accuracy is exact verdict-label agreement with supplied gold.
- Acceptance means prediction == supported_offline. False acceptance is acceptance
  on any other gold label, divided by negative gold count.
- Historical false_rejection_rate is retained: any nonacceptance on supported_offline
  gold, divided by positive gold count. It includes abstentions and approval holds.
- Hard rejection (contradicted_offline or blocked_conflict) and abstention on positive
  gold are reported as separate counts. Approval-required is neither hard rejection
  nor abstention. All remain visible in exact-label accuracy.
- Abstention means review, invalid or blocked_unverified.
- Paired B-minus-A and C-minus-B report improved and regressed case counts plus exact
  accuracy deltas, matched by case ID regardless of row order. These are descriptive
  comparisons, not confidence intervals, statistical significance or causal uplift.
- Identical model IDs/settings are checked as recorded JSON. This does not prove
  which model was actually run, equal task prompts/contexts, true telemetry, source
  authenticity, independent adjudication, or a real host-owned tool invocation.

## Executed evidence

`python -m unittest discover -s tests -v`: 47 passed on local Python 3.12.14.
Sixteen added tests cover adverse records, parser/CLI failures, telemetry and paired
metrics, input digest tampering, empty data and label/ID mismatches. Synthetic test
records are explicitly fixture-only, not inference runs.

`python validate_frozen.py`: 90/90 known contracts; evaluator maps fixture-integrity
rejection to review. The semantic engine was unchanged by this increment.
Logs: phase7-evidence/evaluation_integrity_tests.txt and evaluation_integrity_replay.txt.

## Remaining gate

The preceding commit's MCP matrix, documentation and security workflows passed;
full Node regression was still running at the last observation. New head CI must
be evaluated independently. Actual Codex host startup remains blocked by the
reported read-only filesystem environment, and Skill installation is unverified.
No model trial or paid inference has been executed. Independent labels, host
attestations and explicit inference authorization remain prerequisites for real
A/B/C evidence. Keep this PR in draft until its integration/review gates are met.
