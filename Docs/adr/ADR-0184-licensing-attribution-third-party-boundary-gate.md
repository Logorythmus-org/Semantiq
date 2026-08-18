# ADR-0184: Licensing Attribution and Third-Party Boundary Gate (Prompt 11)

## Status
Accepted

## Context
Deploying and publishing open-source evaluation software requires rigorous licensing clarity. SemantIQ Core must be strictly permissive (MIT), free from copyleft (GPL/AGPL) contagion, legally segregated from external execution runtimes, and compliant with all third-party software attributions.

## Decision
1. **Permissive Core Licensing**:
   - SemantIQ Core and public packages are licensed under the MIT License.
   - All runtime NPM dependencies are audited and verified to use permissive licenses (MIT, Apache-2.0, BSD-3-Clause, ISC).
2. **Clean-Room Third-Party Runtime Boundary**:
   - External runtimes, Docker/Podman engines, and OpenSandbox daemons interface exclusively through clean-room IPC/socket boundaries, preventing copyleft virality.
3. **No Model Weight Redistribution**:
   - SemantIQ distributes zero proprietary model weights, ensuring zero copyright infringement risks.
4. **Automated Attribution Compilation**:
   - `ComplianceAttributionCompiler` embeds SPDX attribution notices into generated evidence packages and benchmark summaries.
5. **Behavioral Grounding Boundary**:
   - `Context → Interpretation → Decision → Action → Result → Consequence → Recovery`.
   - Evaluation is strictly grounded in observable external actions.

## Consequences
- Total legal safety and frictionless enterprise adoption.
- Clean distribution packages with zero copyleft risk.
- Verdict: `PASS`.
