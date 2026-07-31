# Repository Audit Plan

Phase 5 starts with audit before implementation. The goal is to reuse mature code, identify adapter opportunities, and prevent duplicate systems.

## Local Baseline
- Internal packages: 36.
- Apps: `web`, `desktop`, `mobile`.
- Services: `gateway`, `workers`.
- Workspace manager: `pnpm`.
- Current validation scripts: `build`, `lint`, `format`, `format:check`, `typecheck`, `test`, `test:e2e`.

## Audit Scope
- Tech Club current repository.
- Qikio.
- SemantIQ.
- Sunlionet.
- Menog OS.
- Semantic Wallet.
- Existing GitHub repositories owned or approved by the project.
- Internal packages, apps, services, examples, scripts, tests, docs, and tooling.

## Audit Questions
- What functionality already exists?
- Which components are mature enough to adapt instead of rewrite?
- Which packages duplicate behavior?
- Which modules are scaffolds only?
- Which dependencies create risk?
- Which interfaces need adapters?
- Which schemas, events, or APIs are incompatible?
- Which tests prove production readiness?
- Which migrations are required?

## Audit Outputs
- Repository inventory.
- Capability matrix.
- Reuse map.
- Duplication report.
- Technical debt register.
- Adapter opportunity list.
- Migration plan.
- Compatibility report.
- Missing module list.
- Production readiness score.

## Audit Rules
- Never rewrite mature code without a documented reason.
- Prefer adapter boundaries over replacement.
- Preserve package ownership and dependency direction.
- Record evidence for every reuse or migration decision.
- Do not begin feature implementation until the target area has an approved audit result.
