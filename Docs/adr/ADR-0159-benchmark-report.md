# ADR-0159: SemantIQ Canonical Sandbox Benchmark Report Architecture

**Status**: Accepted  
**Date**: 2026-08-15  

---

## Context

The final phase of the SemantIQ evaluation pipeline (`Benchmark → Scenario → Execution Contract → Provider Router → Provider Adapter → Runtime → Observation → Evidence → Evaluation → Report`) requires a standardized, canonical human- and machine-readable benchmark report format. The report must synthesize methodology, behavioral metrics ($LHRI$, $CAI$, $RRI$), integrity grades, anti-gaming classifications, financial cost accounting, and cryptographic provenance without proprietary lock-in.

---

## Decision

1. **Holistic Seven-Pillar Synthesis**:
   - Verdict & Score: `PASSED` / `FAILED` / `PARTIAL` / `ERROR`, composite score.
   - Methodology: Benchmark ID, DSL version, provider ID, image digest, network policy, step budget.
   - Observable Behavioral Findings: $LHRI$, $CAI$, $RRI$, detected phase transitions.
   - Integrity & Trust: Integrity seal (`SEALED_VALID`), anti-gaming badge (`AUTHENTIC_REASONED`), observer trust score.
   - Cost Accounting: Total USD cost ($C_{inference}, C_{runtime}, C_{tools}$) and verifiable receipt hash.
   - Lineage Provenance: Merkle root and evidence digest.
   - Declared Limitations: Hardware throttling, network jitter, or unverified claims.
2. **Dual-Format Output**:
   - `renderReportMarkdown`: GitHub Flavored Markdown for human review, pull request audits, and executive summaries.
   - `renderReportJson`: Machine-readable JSON conforming to `canonical-benchmark-report.schema.json`.
3. **Cryptographic Signing**:
   - The entire report payload is canonically hashed with SHA-256 and signed with `reportSignatureHex`.
4. **Observable Behavioral Grounding**: Invariant: The report presents observable actions, error recovery episodes, and concrete consequence chains without asserting claims about internal hidden cognition.

---

## Consequences

- Standardizes benchmark report exchange between research organizations, leaderboards, and enterprise evaluation pipelines.
- Zero reliance on proprietary cloud services or closed-source evaluators.
- Fully cryptographically verifiable by third-party auditors.
