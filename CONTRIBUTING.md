# Contributing to SemantIQ

SemantIQ follows rigorous engineering and scientific standards. Every production change must link to a specification, backlog ID, acceptance tests, validation evidence, and documentation updates.

## Workflow

1. Complete repository audit for the target area.
2. Create or update the Spec-Kit record.
3. Define acceptance tests before implementation.
4. Implement the smallest production-ready increment.
5. Run validation locally (`pnpm test`, `pnpm test:python`, `pnpm typecheck`).
6. Update documentation and changelog notes.

## Standards

- Conventional commits.
- Strict TypeScript (`tsc --noEmit`) and typed Python (`mypy`, `ruff`).
- Package boundaries remain explicit (core domain packages never import application services).
- Scientific guardrails: All empirical claims must adhere to controlled language policies (no unsupported causal assertions).
- No feature work without specification.
- No architecture redesign during implementation prompts unless a fundamental implementation issue is documented.

## Licensing & Rights

All contributions are subject to the multi-tier licensing terms defined in [`LICENSING.md`](LICENSING.md):

- Code contributions are licensed under the **MIT License**.
- Documentation is licensed under **CC-BY-4.0**.
- Datasets, prompts, and synthetic fixtures are dedicated to the public domain under **CC0-1.0**.
