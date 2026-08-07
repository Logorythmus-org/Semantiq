# Correction Policy

**Version**: 1.0.0  
**Date**: 2026-08-07  

---

## 9 Correction Levels

1. `clarification`: Textual clarification without score change.
2. `metadata_correction`: Fix model version, date, or tool metadata.
3. `score_recalculation`: Re-compute score under original rules due to calculation error.
4. `annotation`: Attach warning or context banner to published result.
5. `suspension`: Temporarily hide score pending investigation.
6. `partial_withdrawal`: Withdraw specific sub-scenario scores.
7. `full_withdrawal`: Complete withdrawal of published result.
8. `benchmark_deprecation`: Retire flawed benchmark suite.
9. `methodology_revision`: Update core evaluation algorithm.

## Append-Only Evidence Rule

A correction MUST NEVER overwrite original evidence, raw outputs, or publication dates.
