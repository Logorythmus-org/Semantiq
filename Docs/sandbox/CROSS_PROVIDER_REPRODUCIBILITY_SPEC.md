# SemantIQ Sandbox Specification: Cross-Provider Reproducibility

**Version**: 1.0.0  
**Phase**: Sandbox Phase (Prompt 28)  
**Status**: Approved Specification  
**Date**: 2026-08-15

---

## 1. Executive Summary

A core foundation of SemantIQ is that benchmarks must remain verifiable by third parties on diverse infrastructure (e.g. local Docker containers on macOS arm64, Firecracker microVMs on Linux x86_64, cloud sandbox pools, or in-memory replay harnesses).

Because low-level environment drift (kernel timestamps, CPU architecture, minor glibc/musl differences) makes byte-for-byte exact hash matching unrealistic across heterogeneous systems, this specification establishes **Semantic Equivalence and Cross-Provider Divergence Calibration**:

1. **SemantIQ Core** canonicalizes execution traces, state deltas, exit codes, and output streams to isolate genuine model reasoning differences from benign host environment drift.
2. **Reproducibility Tiers** (`HERMETIC_DETERMINISTIC`, `ISOLATED_REPRODUCIBLE`, `BEST_EFFORT_TRANSIENT`) formally declare the achievable determinism guarantee for each scenario.
3. **Cross-Provider Divergence Analysis** produces structured reports (`CrossProviderDivergenceReport`) categorizing differences into `BENIGN_ENVIRONMENTAL_DRIFT`, `PERFORMANCE_VARIANCE`, or `BEHAVIORAL_DIVERGENCE`.

```
Baseline Run (Provider A) ─┐
                           ├─> [CrossProviderEquivalenceEvaluator] ─> [Divergence Report & Calibration]
Candidate Run (Provider B) ┘
```

---

## 2. Scope

- Canonicalization rules for timestamps, random ephemeral paths, and architecture-specific flags.
- Multi-tier reproducibility classifications (`HERMETIC_DETERMINISTIC`, `ISOLATED_REPRODUCIBLE`, `BEST_EFFORT_TRANSIENT`).
- Automated divergence detection distinguishing benign host variations from behavioral failures.
- Cross-provider comparison contracts (`CrossProviderComparisonRequest`, `CrossProviderDivergenceReport`).

---

## 3. Non-Goals

- Requiring bit-for-bit identical binary hashes across different CPU instruction sets (x86_64 vs aarch64).
- Forcing external cloud providers to emulate internal container kernel namespaces identically.
- Hiding genuine model failures under the guise of "environment drift".

---

## 4. Architecture

```
+-----------------------------------------------------------------------------------+
|                           Cross-Provider Evidence Inputs                          |
|  [Baseline Run: Provider A (e.g. Docker x86_64)]                                  |
|         | Evidence Manifest + StateDelta + Provenance A                           |
|         v                                                                         |
|  [Candidate Run: Provider B (e.g. MicroVM aarch64)]                               |
|         | Evidence Manifest + StateDelta + Provenance B                           |
+---------|-------------------------------------------------------------------------+
          |
          v
+-----------------------------------------------------------------------------------+
|                        Canonicalization & Normalization                           |
|  - Replaces microsecond timestamps with normalized tokens                         |
|  - Normalizes line endings (\r\n -> \n) and ephemeral temp paths                 |
|  - Filters known architecture string indicators                                   |
+---------|-------------------------------------------------------------------------+
          |
          v
+-----------------------------------------------------------------------------------+
|                     Cross-Provider Equivalence Evaluator                          |
|  [CrossProviderEquivalenceEvaluator]                                              |
|         | (Compares Exit Codes, State Mutations, and Stream Content)              |
|         v                                                                         |
|  [Categorizes Divergences: BENIGN_ENVIRONMENTAL_DRIFT vs BEHAVIORAL_DIVERGENCE]   |
+---------|-------------------------------------------------------------------------+
          |
          v
+-----------------------------------------------------------------------------------+
|                        Cross-Provider Divergence Report                           |
|  [Equivalence Level: EXACT_BYTE_IDENTICAL | SEMANTICALLY_EQUIVALENT | DIVERGENT]  |
+-----------------------------------------------------------------------------------+
```

---

## 5. Data & Event Schemas

### 5.1 Cross-Provider Divergence Report Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "CrossProviderDivergenceReport",
  "type": "object",
  "required": [
    "comparisonId",
    "scenarioId",
    "equivalenceLevel",
    "isEquivalent",
    "divergences",
    "comparisonTimestamp"
  ],
  "properties": {
    "comparisonId": { "type": "string" },
    "scenarioId": { "type": "string" },
    "equivalenceLevel": {
      "type": "string",
      "enum": ["EXACT_BYTE_IDENTICAL", "SEMANTICALLY_EQUIVALENT", "DIVERGENT"]
    },
    "isEquivalent": { "type": "boolean" },
    "divergences": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["property", "baselineValue", "candidateValue", "category", "description"],
        "properties": {
          "property": { "type": "string" },
          "baselineValue": { "type": "string" },
          "candidateValue": { "type": "string" },
          "category": {
            "type": "string",
            "enum": [
              "BENIGN_ENVIRONMENTAL_DRIFT",
              "PERFORMANCE_VARIANCE",
              "BEHAVIORAL_DIVERGENCE",
              "CRITICAL_FAULT"
            ]
          },
          "description": { "type": "string" }
        }
      }
    },
    "comparisonTimestamp": { "type": "string" }
  }
}
```

---

## 6. Interfaces

- `CrossProviderEquivalenceEvaluator`: Executes canonicalization, equivalence verification, and divergence classification.
- `CrossProviderDivergenceReport`: Structured report documenting equivalence status and detailed divergence items.

---

## 7. Lifecycle & State Machine

```
[RUNS_COMPLETED] ──> [CANONICALIZING] ──> [COMPARING] ──> [CLASSIFYING] ──> [REPORT_SEALED]
         |                    |
         v                    v
  [MISSING_EVIDENCE]    [UNPARSEABLE_DATA]
```

1. **RUNS_COMPLETED**: Baseline and candidate runs finish on respective providers.
2. **CANONICALIZING**: Output streams and state deltas are stripped of volatile timestamps and ephemeral path prefixes.
3. **COMPARING**: Structural diffs generated across exit codes, files, and stdout.
4. **CLASSIFYING**: Differences assigned to `BENIGN_ENVIRONMENTAL_DRIFT` or `BEHAVIORAL_DIVERGENCE`.
5. **REPORT_SEALED**: Comparison report generated and recorded in evaluation archives.

---

## 8. Security & Trust Model

- **Public Replication Verification**: Enables independent third parties to verify official benchmark claims on their own infrastructure without requiring proprietary hardware.
- **Tamper Evidence**: Provenance fingerprints (base image digest, spec hash, deterministic seed) ensure candidate runs used identical initial states.

---

## 9. Reproducibility Tiers

| Tier                     | Determinism Guarantee                      | Permitted Discrepancies                                   |
| :----------------------- | :----------------------------------------- | :-------------------------------------------------------- |
| `HERMETIC_DETERMINISTIC` | Exact byte-for-byte hash equality.         | Zero drift permitted.                                     |
| `ISOLATED_REPRODUCIBLE`  | Semantic state delta and exit code parity. | Minor timestamp and architecture drift allowed.           |
| `BEST_EFFORT_TRANSIENT`  | Trajectory and score confidence bounds.    | Live network latency and minor payload variation allowed. |

---

## 10. Behavioral Chain Compatibility

| Behavioral Chain Stage | Cross-Provider Role                                                                 |
| :--------------------- | :---------------------------------------------------------------------------------- |
| **Context**            | Identical benchmark spec dispatched to Provider A and Provider B.                   |
| **Interpretation**     | Agent interprets scenario in both environments.                                     |
| **Decision**           | Agent actions compared across both providers.                                       |
| **Action**             | Commands executed in respective sandbox runtimes.                                   |
| **Result**             | Outputs recorded with full provider provenance.                                     |
| **Consequence**        | `CrossProviderEquivalenceEvaluator` canonicalizes and compares state deltas.        |
| **Recovery**           | Divergences trigger diagnostic breakdown showing environmental vs reasoning causes. |

---

## 11. Provider-Neutral Design

No provider-specific assumptions are made. Any provider fulfilling the `ISandboxProvider` contract can be tested and verified as a baseline or candidate.

---

## 12. Failure Modes & Mitigations

1. **Architecture Mismatch Causing False Failures**: Canonicalizer flags architecture differences as `BENIGN_ENVIRONMENTAL_DRIFT` rather than model errors.
2. **Exit Code Discrepancies**: Marked as immediate `BEHAVIORAL_DIVERGENCE` for human review.
3. **Missing State Delta**: Handled gracefully with fallback comparison on standard streams.

---

## 13. Acceptance Criteria

- [x] Standardized `CrossProviderComparisonRequest` and `CrossProviderDivergenceReport` contracts.
- [x] Canonicalization engine for stripping non-deterministic timestamps and ephemeral paths.
- [x] Automated classification of environmental drift vs behavioral divergence.
- [x] Comprehensive unit tests passing with zero typecheck or boundary errors.
