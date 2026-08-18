# ADR-0177: Core Independence and Local-First Gate (Prompt 04)

## Status
Accepted

## Context
Scientific benchmarks and safety evaluations require reproducible, air-gapped, and vendor-neutral execution. SemantIQ must operate completely offline without mandatory cloud accounts, paid API tokens, or proprietary execution daemons.

## Decision
1. **Certified Local Offline Execution**:
   - SemantIQ Core supports full offline benchmark execution using `CliBenchmarkRunner` backed by `MockReferenceProviderAdapter` and `OciSandboxAdapter`.
2. **Deterministic Replay Support**:
   - `ReplaySandboxAdapter` enables reproducible offline re-evaluations from local recordings with zero network communication.
3. **Pluggable & Optional Providers**:
   - OpenSandbox and cloud adapters remain optional; core functionality does not depend on their presence.
4. **Behavioral Grounding Boundary**:
   - `Context → Interpretation → Decision → Action → Result → Consequence → Recovery`.
   - Evaluation is strictly grounded in observable traces and local environment state diffs.

## Consequences
- Complete data privacy and sovereignty for users running sensitive benchmark evaluations.
- Full offline reproducibility for scientific research.
- Verdict: `PASS`.
