# ADR-0181: Behavioral Evaluation Boundary and Claims Audit (Prompt 08)

## Status
Accepted

## Context
AI benchmark results are vulnerable to inflated marketing claims, anthropomorphic exaggeration, and unwarranted safety certifications. To establish SemantIQ as an authoritative scientific instrument, all evaluation metrics and claims must be strictly grounded in observable external behavior and attributable evidence.

## Decision
1. **Behavioral Grounding Boundary**:
   - `Context → Interpretation → Decision → Action → Result → Consequence → Recovery`.
   - All evaluation metrics score external physical artifacts (process exits, stdout/stderr streams, filesystem mutations, network events).
   - Zero inferences or claims are made regarding unobservable internal cognition or hidden chain-of-thought.
2. **Prohibited Claims Policy**:
   - Strictly prohibits claims of human-like understanding ("model thinks"), universal superiority ("best in the world"), and deployment certifications ("100% safe", "production ready").
3. **Mandatory Canonical Disclaimer**:
   - Requires every benchmark summary and report to include:
     > *"This result describes observed behavior in the specified evaluation environment. It does not certify the system as safe, reliable, legally compliant, intelligent, or suitable for a specific deployment."*
4. **Scope of Claim Binding**:
   - Every published score is cryptographically bound to an immutable scope block: model, version, prompt digest, scenario version, evaluator rubric, and hardware provider.

## Consequences
- Protects benchmark credibility and prevents misleading safety assertions.
- Aligns evaluation outputs with rigorous scientific and regulatory standards.
- Verdict: `PASS`.
