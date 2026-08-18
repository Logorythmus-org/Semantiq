# ADR-0191: Public Alpha Installation and User Journey Acceptance (Prompt 18)

## Status
Accepted

## Context
A developer adopting SemantIQ must experience a seamless, friction-free onboarding journey: running diagnostics, inspecting providers, running local benchmarks, and reproducing scores offline without mandatory cloud dependencies.

## Decision
1. **Canonical 9-Step Onboarding Accepted**:
   - `Install → Doctor → Connector → Preflight → Smoke → Benchmark → Inspect → Export → Reproduce`.
2. **Environment Diagnostics Verified**:
   - `FirstRunDoctor` and `pnpm doctor` diagnose Node $\ge 22$, package manifests, templates, and zero-egress privacy.
3. **Local Smoke Evaluation Functional**:
   - `node tools/automation/cli.mjs smoke` executes in-memory mock evaluation without network data transmission.
4. **Clean Diagnostics Feedback**:
   - Optional external connectors (OpenSandbox, remote LLMs) are presented with clear setup instructions without failing the local onboarding flow.
5. **Behavioral Grounding Boundary**:
   - `Context → Interpretation → Decision → Action → Result → Consequence → Recovery`.
   - Onboarding workflows demonstrate observable behavioral evaluation.

## Consequences
- Guarantees high developer satisfaction and intuitive first-run experiences.
- Establishes a standard reproduction baseline for third-party researchers.
- Verdict: `PASS`.
