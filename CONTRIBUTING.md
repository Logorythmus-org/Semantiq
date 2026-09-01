# Contributing to SemantIQ

Thank you for contributing to SemantIQ. The project uses two contribution paths so
bounded, low-risk improvements stay approachable while changes to core behavior keep
the engineering, scientific, security, and governance review they require.

## Choose your contribution path

| Path                       | Use it for                                                                                                                                                                     | Before implementation                                                                                                      |
| :------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------- |
| **Fast contribution path** | Documentation, examples, typo or link fixes, small tests, reproduction reports, integration compatibility reports, and bounded fixes that do not change semantics.             | No Spec-Kit record, backlog ID, RFC, or prior issue is required. Keep the change focused and explain how you validated it. |
| **Core change path**       | Architecture, benchmark semantics, scoring or evidence logic, scientific claims, governance, security-sensitive behavior, release-critical contracts, or breaking API changes. | Link the relevant issue and follow the applicable specification, RFC, threat-model, compatibility, or governance process.  |

If you are unsure which path applies, open a
[reproduction or compatibility report](https://github.com/Logorythmus-org/Semantiq/issues/new?template=reproduction_report.yml)
or ask in the pull request. Maintainers may move a change to the Core path when its
impact is broader than first expected.

## Fast contribution path

1. Fork the repository, clone your fork, and create a focused branch from `main`.
2. Make the smallest change that resolves the documented problem.
3. Run the checks that cover the changed surface:
   - Documentation or link changes: `pnpm docs:build`, `pnpm docs:validate`, and `pnpm format:check`.
   - TypeScript tests or bounded fixes: the focused Vitest target plus `pnpm typecheck` and `pnpm lint` when TypeScript is affected.
   - Python tests or bounded fixes: the focused Pytest target plus `pnpm test:python` when Python is affected.
4. Open a pull request, select **Fast contribution path**, and record the exact commands and outcomes.
5. Address CI and CODEOWNER review. A fast path reduces preparation overhead; it does not bypass required checks or review.

Reproduction and integration compatibility reports may be submitted without a code
change. Include a minimal reproducer, environment details, observed behavior, and
expected behavior; do not include secrets or private data.

## Core change path

1. Audit the affected architecture, contracts, scientific invariants, security boundaries, and cross-language surfaces.
2. Link the governing issue and create or update the specification or RFC when required by the [RFC process](Docs/governance/rfc_process.md).
3. Define acceptance tests and compatibility, security, and evidence expectations before implementation.
4. Implement the smallest production-ready increment without weakening existing gates.
5. Run the full applicable validation, including `pnpm test`, `pnpm test:python`, `pnpm typecheck`, `pnpm lint`, and package-boundary, security, documentation, or version checks affected by the change.
6. Update the relevant normative documentation, migration guidance, and release notes.
7. Open a pull request, select **Core change path**, complete every applicable impact section, and obtain CODEOWNER review.

## Shared pull request workflow

1. Start from the current protected `main` branch and keep your branch up to date.
2. Use a [Conventional Commit](https://www.conventionalcommits.org/) subject.
3. Keep unrelated changes out of the pull request.
4. Use the pull request template to declare the path, scope, tests, and any impact that is not applicable.
5. Wait for required CI and review. Branch protection and [CODEOWNERS](.github/CODEOWNERS) apply to both paths.

## Standards

- Conventional commits.
- Strict TypeScript (`tsc --noEmit`) and typed Python (`mypy`, `ruff`).
- Package boundaries remain explicit (core domain packages never import application services).
- Scientific guardrails: All empirical claims must adhere to controlled language policies (no unsupported causal assertions).
- Core semantic and architectural work requires the applicable specification or RFC; bounded Fast-path work does not.
- No architecture redesign during implementation prompts unless a fundamental implementation issue is documented.

## Licensing & Rights

All contributions are subject to the multi-tier licensing terms defined in [`LICENSING.md`](LICENSING.md):

- Code contributions are licensed under the **MIT License**.
- Documentation is licensed under **CC-BY-4.0**.
- Datasets, prompts, and synthetic fixtures are dedicated to the public domain under **CC0-1.0**.
