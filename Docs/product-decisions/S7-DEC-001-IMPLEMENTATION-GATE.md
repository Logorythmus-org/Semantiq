# S7-DEC-001: Hold Sprint 7 Implementation Until Audit and Consent Approval

Decision ID: S7-DEC-001  
Date: 2026-07-10  
Responsible person: product-engineering-lead

## Question

Should Sprint 7 implementation begin immediately, or wait for approval of the repository reality audit, research consent design and Sprint 7 specifications?

## Evidence

- The Sprint 7 prompt explicitly says implementation may begin only after audit, consent design and specifications have been approved.
- The repository contains in-memory alpha operations runtimes and passing unit tests, but no verified deployed alpha environment.
- Standard `pnpm` commands are blocked by dependency build-script approval for `esbuild@0.28.1`.
- App and service build scripts are mostly scaffold echoes.
- `apps/web/README.md` identifies the web app as a future shell.

## Alternatives

- Begin implementing alpha runtime features immediately.
- Treat existing synthetic runtime validation as proof of alpha readiness.
- Complete only the pre-implementation audit/spec/consent gate and wait for approval.

## Decision

Complete the repository reality audit, consent/privacy design and Sprint 7 specification updates first. Do not recruit testers or implement post-gate alpha features until the gate is explicitly approved.

## Expected Outcome

Sprint 7 starts from observed repository reality instead of architectural aspiration, reducing the risk of collecting research data through incomplete or misleading product surfaces.

## Risks

- Slower visible feature progress.
- Some existing generated artifacts may appear more complete than they are.
- Additional approval step is needed before implementation continues.

## Reversal Condition

Reverse this decision only if the product owner explicitly approves implementation after reviewing the audit and consent/spec artifacts.

## Review Date

2026-07-17
