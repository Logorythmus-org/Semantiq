# SemantIQ Sandbox Specification: Provider Failure and Fallback

**Version**: 1.0.0  
**Phase**: Sandbox Phase (Prompt 29)  
**Status**: Approved Specification  
**Date**: 2026-08-15

---

## 1. Executive Summary

External cloud sandbox platforms, container daemons, and microVM orchestrators inevitably encounter transient network timeouts, infrastructure outages, resource exhaustion, and daemon crashes.

This specification establishes **Provider Failure Classification, Fallback Routing, and Partial-Run Evidence Preservation**:

1. **SemantIQ Core** distinguishes between _Infrastructure Failures_ (transient daemon crashes or cloud network blips) and _Agent Behavioral Faults_ (syntax errors, invalid commands, or logical failures).
2. **Fallback Routing Engine** orchestrates exponential backoff retries on transient errors and seamlessly routes to secondary fallback providers (`FALLBACK_NEXT_PROVIDER`) on fatal infrastructure faults without altering benchmark requirements.
3. **Partial-Run Evidence Preservation** ensures that any interrupted benchmark run captures all in-flight stdout/stderr streams, checkpoints, and action history into a sealed `PartialRunEvidenceRecord` rather than silently discarding partial results.

```
Execution Request ──> Primary Provider ──(Infra Failure)──> Fallback Engine ──> Backup Provider ──> Evidence Sealed
                                 |                                    |
                       (Agent Syntax Error)                  (All Retries Exhausted)
                                 v                                    v
                     Halt & Score Agent Failure             Seal Partial-Run Evidence
```

---

## 2. Scope

- Granular taxonomy of failure modes (`INFRASTRUCTURE_TRANSIENT`, `INFRASTRUCTURE_FATAL`, `AGENT_BEHAVIORAL_FAULT`, `SECURITY_VIOLATION`, `TIMEOUT_EXCEEDED`).
- Deterministic fallback strategies (`RETRY_SAME_PROVIDER`, `FALLBACK_NEXT_PROVIDER`, `HALT_WITH_PARTIAL_EVIDENCE`, `QUARANTINE`).
- Partial-run evidence capture ensuring zero data loss during premature teardown.
- Circuit breaking and exponential backoff throttling with jitter.

---

## 3. Non-Goals

- Retrying agent logic errors (e.g. infinite loops, wrong tool arguments) as infrastructure faults.
- Masking provider outages by falsifying benchmark scores.
- Bypassing security quarantine protocols for suspected sandbox breakout attempts.

---

## 4. Architecture

```
+-----------------------------------------------------------------------------------+
|                                  SemantIQ Core                                    |
|  [Benchmark Execution Request with FallbackPolicy]                                |
|         |                                                                         |
|         v                                                                         |
+---------|-------------------------------------------------------------------------+
          |
          v
+-----------------------------------------------------------------------------------+
|                        Fallback Routing Engine                                    |
|  [FallbackRoutingEngine]                                                          |
|         |                                                                         |
|         +───> [Primary Provider (e.g. OpenSandbox Cloud)] ──(Success)──> [Evidence]|
|         |                     |                                                   |
|         |               (Transient Error)                                         |
|         |                     v                                                   |
|         +───> [Exponential Backoff Retry]                                         |
|         |                     |                                                   |
|         |               (Fatal Crash)                                             |
|         |                     v                                                   |
|         +───> [Fallback Provider (e.g. Docker OCI)] ────────(Success)──> [Evidence]|
|         |                     |                                                   |
|         |               (All Exhausted)                                           |
|         |                     v                                                   |
|         +───> [Partial Evidence Sealer] ───────────────────────────────> [Evidence]|
+-----------------------------------------------------------------------------------+
```

---

## 5. Data & Event Schemas

### 5.1 Fallback Policy Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "FallbackPolicy",
  "type": "object",
  "required": [
    "primaryProviderId",
    "fallbackProviderIds",
    "maxRetriesPerProvider",
    "backoffBaseMs",
    "preservePartialEvidence"
  ],
  "properties": {
    "primaryProviderId": { "type": "string" },
    "fallbackProviderIds": { "type": "array", "items": { "type": "string" } },
    "maxRetriesPerProvider": { "type": "integer" },
    "backoffBaseMs": { "type": "integer" },
    "preservePartialEvidence": { "type": "boolean" }
  }
}
```

---

## 6. Interfaces

- `FallbackRoutingEngine`: Evaluates errors and yields `FallbackDecision`.
- `PartialRunEvidenceRecord`: Standardized container for partial run logs and checkpoints.

---

## 7. Lifecycle & State Machine

```
[EXECUTING] ──(Error)──> [CLASSIFYING] ──> [RETRYING / FALLING_BACK] ──> [SEALING_PARTIAL]
    |                          |
    v                          v
[SUCCEEDED]               [QUARANTINED]
```

1. **EXECUTING**: Action runs in active sandbox.
2. **CLASSIFYING**: Error intercepted and categorized.
3. **RETRYING / FALLING_BACK**: Exponential backoff or fallback provider selected.
4. **SEALING_PARTIAL**: In-flight streams captured and marked with `isPreserved: true`.
5. **QUARANTINED**: Breakout attempts immediately isolate instance.

---

## 8. Security & Isolation Model

- **Immediate Quarantine**: Any `SECURITY_VIOLATION` (e.g. attempted port scan or root filesystem write) bypasses retries and freezes the instance for forensic analysis.
- **Audit Trails**: Provider failover events are permanently recorded in benchmark provenance manifests.

---

## 9. Reproducibility & Provenance

- **Fallback Transparency**: Provenance manifests explicitly note if a run completed on a fallback provider rather than the primary provider.
- **Checkpoint Restoration**: When falling back, the fallback provider restores the latest verified checkpoint (`CheckpointMetadata`).

---

## 10. Behavioral Chain Compatibility

| Behavioral Chain Stage | Failure and Fallback Role                                            |
| :--------------------- | :------------------------------------------------------------------- |
| **Context**            | Injected fallback policies declared in benchmark spec.               |
| **Interpretation**     | Engine detects runtime health vs agent exit code.                    |
| **Decision**           | Fallback engine selects retry, fallback, or partial sealing.         |
| **Action**             | Session migrated or retried on healthy provider.                     |
| **Result**             | Execution finishes or partial evidence is captured.                  |
| **Consequence**        | Evaluation score reflects agent behavior, not infrastructure outage. |
| **Recovery**           | Exponential backoff prevents thundering-herd cloud overload.         |

---

## 11. Provider-Neutral Design

Any provider fulfilling `ISandboxProvider` can serve as primary or fallback without modifying benchmark code.

---

## 12. Failure Modes & Mitigations

1. **Provider Outage During Long Benchmark**: Swapped to secondary provider via checkpoint state restore.
2. **Agent Infinite Loop / Resource Starvation**: Scored as `AGENT_BEHAVIORAL_FAULT` without triggering infrastructure failover.
3. **Total Network Partition**: Preserves all local partial execution traces.

---

## 13. Acceptance Criteria

- [x] Standardized `FallbackPolicy` and `PartialRunEvidenceRecord` schemas.
- [x] Accurate distinction between infrastructure faults and agent logic errors.
- [x] Automated fallback handoff and exponential backoff retry.
- [x] Unit test validation with zero boundary or typecheck errors.
