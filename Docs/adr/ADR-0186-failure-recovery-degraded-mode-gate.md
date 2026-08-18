# ADR-0186: Failure Recovery and Degraded-Mode Gate (Prompt 13)

## Status
Accepted

## Context
External execution providers, local container engines, and cloud networks inevitably encounter runtime failures, timeouts, socket disconnects, and malformed inputs. SemantIQ must isolate infrastructure errors from model behavioral evaluation, implement automated fallback routing, and preserve partial-run diagnostics.

## Decision
1. **Infrastructure Failure Isolation**:
   - Infrastructure timeouts, daemon crashes, and host OOM aborts are classified as `INFRASTRUCTURE_TRANSIENT` or `INFRASTRUCTURE_FATAL` and never lower agent behavioral scores.
2. **Automated Fallback Routing**:
   - `FallbackRoutingEngine` steps through secondary and reference adapters when primary providers fail or lack required capabilities.
3. **Partial-Run Trace Preservation**:
   - `PartialRunEvidenceRecord` seals uncompleted benchmark telemetry with cryptographic timestamps for post-hoc debugging.
4. **Structured Error Hierarchy**:
   - Standardizes on `SandboxRuntimeError` with structured machine-readable error codes and retryability flags.
5. **Behavioral Grounding Boundary**:
   - `Context → Interpretation → Decision → Action → Result → Consequence → Recovery`.
   - All recovery operations evaluate observable external state diffs.

## Consequences
- Prevents benchmark score distortion from external infrastructure glitches.
- Ensures robust, fault-tolerant execution in production and CI environments.
- Verdict: `PASS`.
