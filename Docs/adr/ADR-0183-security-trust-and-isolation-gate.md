# ADR-0183: Security Trust and Isolation Gate (Prompt 10)

## Status
Accepted

## Context
Executing untrusted agent code during automated benchmarks introduces severe security risks: sandbox breakout, secret credential exfiltration, assertion tampering, and denial of service. Strict isolation boundaries, secret scrubbing, and execution-evaluation separation must be audited and enforced.

## Decision
1. **Ten Threat Vectors Mitigated**:
   - Audited and verified defenses against input injection, path traversal, privilege escalation, network escape, credential leakage, rubric gaming, actor spoofing, resource exhaustion, orphaned processes, and evidence tampering.
2. **Execution vs. Evaluation Isolation**:
   - Evaluated models execute in unprivileged sandboxes (`ISandboxInstance`) with zero access to the supervisor evaluation engine.
3. **Secret Token Redaction**:
   - Scrubbers strip PATs, API keys, Bearer headers, and private keys from logs and evidence packages.
4. **Anti-Gaming Protection**:
   - Anti-gaming analyzers detect assertion overwrites and golden answer harvesting, assigning zero scores to compromised runs.
5. **Behavioral Grounding Boundary**:
   - `Context → Interpretation → Decision → Action → Result → Consequence → Recovery`.
   - Evaluation evaluates observable external actions only.

## Consequences
- Protects host environments and developer machines while evaluating untrusted agent code.
- Ensures benchmark scoring integrity against adversarial gaming.
- Verdict: `PASS`.
