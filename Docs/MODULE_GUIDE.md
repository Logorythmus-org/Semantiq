# Module Guide

Every Tech Club module must be small, explicit, testable, and replaceable.

## Required Contract
- Public API: exported types and functions for consumers.
- Internal API: private implementation details that are not exported.
- Events: facts emitted after state changes.
- Commands: explicit requests to perform work.
- Queries: side-effect-free reads.
- Configuration: injected settings.
- Dependencies: required services and module contracts.
- Lifecycle: configure, start, stop.
- Extension points: versioned plugin or adapter hooks.

## Package Rules
- Export only from `src/index.ts`.
- Keep infrastructure dependencies behind interfaces.
- Do not import from apps.
- Do not create circular dependencies.
- Add contract tests for externally visible behavior.

## Naming
Packages use `@tech-club/<name>`. Commands use imperative names. Events use past-tense names. Queries use read-oriented names.
