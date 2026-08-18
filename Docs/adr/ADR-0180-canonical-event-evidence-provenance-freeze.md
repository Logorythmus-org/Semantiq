# ADR-0180: Canonical Event Evidence and Provenance Freeze (Prompt 07)

## Status
Accepted

## Context
Benchmark evaluation integrity requires tamper-evident evidence packages with verifiable provenance. To avoid epistemic confusion between independently verified observation and provider-reported telemetry, a rigorous 5-tier classification and Merkle trace immutability standard must be permanently frozen.

## Decision
1. **Epistemic Evidence Classification**:
   - Every evidence entry must be labeled with its epistemic source: `OBSERVED`, `PROVIDER_REPORTED`, `IMPORTED`, `INFERRED`, or `JUDGED`.
2. **Merkle Trace Immutability**:
   - `BehavioralTraceEvent` sequences are cryptographically hashed using canonical JSON serialization (RFC 8785) and chained into a Merkle root digest.
   - Any modification or omission of events invalidates the root digest and receipt signature.
3. **Comprehensive Provenance Lineage**:
   - `EvidenceProvenanceEngine` constructs full lineage graphs connecting scenario specifications, model identities, runtime parameters, transformation operations, and evaluator rubrics.
4. **Behavioral Grounding Boundary**:
   - `Context → Interpretation → Decision → Action → Result → Consequence → Recovery`.
   - Evidence records only external physical actions and observable state transitions; zero claims are made regarding unobservable internal cognition.

## Consequences
- Evidence packages are mathematically tamper-evident and independently verifiable.
- Benchmark evaluations can be published, audited, and replayed with complete provenance.
- Verdict: `PASS`.
