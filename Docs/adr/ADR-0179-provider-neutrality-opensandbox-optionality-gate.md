# ADR-0179: Provider Neutrality and OpenSandbox Optionality Gate (Prompt 06)

## Status
Accepted

## Context
SemantIQ is an open behavioral evaluation protocol. To maintain neutrality, avoid single-vendor lock-in, and ensure long-term scientific credibility, OpenSandbox and all third-party virtualization daemons must be strictly optional plug-in adapters rather than mandatory dependencies.

## Decision
1. **Certified OpenSandbox Optionality**:
   - OpenSandbox is implemented solely as an external adapter (`@tech-club/adapter-opensandbox`) communicating over standard HTTP REST endpoints.
   - Zero OpenSandbox daemon source code, binaries, forks, or clones are vendored in SemantIQ.
2. **Provider-Agnostic Core Schemas**:
   - All 37 Draft 2020-12 schemas adhere to the provider-neutral SPIS specification.
3. **Hermetic Test & Execution**:
   - The entire core test suite and local CLI benchmark runner execute hermetically with zero dependency on OpenSandbox.
4. **Behavioral Grounding Boundary**:
   - `Context → Interpretation → Decision → Action → Result → Consequence → Recovery`.
   - Evaluation is strictly grounded in observable external actions and environment state transitions.

## Consequences
- Complete vendor neutrality and zero platform lock-in.
- Core remains lightweight, independent, and runnable in any environment.
- Verdict: `PASS`.
