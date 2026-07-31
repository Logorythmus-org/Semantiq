# Independent Reproduction Attempt Report

This report documents an independent execution attempt to reproduce benchmark evaluations and score reports from documented artifacts in **SemantIQ Benchmarks**.

---

## Reproduction Setup & Parameters

- **Environment**: Windows 11 (Node.js v22.10.0, pnpm 11.7.0)
- **Target Subject**: Synthetic smoke question (`canonical_e2e_001`)
- **Scoring Profile**: Smoke Profile (`profile_smoke`)
- **Execution Mode**: Deterministic Local Mock

---

## Execution Logs & Verification

1. **Initial Run**:
   - Command: `node tools/automation/cli.mjs smoke`
   - Weighted Score: `0.85`
   - Report ID generated: `benchmark_report_...`

2. **Reproduction Run**:
   - Command: `node tools/automation/cli.mjs reproduce`
   - Weighted Score: `0.85`
   - Score Delta: `0.000` (100% Identical)

---

## Verdict

**VERIFIED REPRODUCIBLE** — Score identity confirmed across independent execution runs.
