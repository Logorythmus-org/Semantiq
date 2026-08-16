# Repository Reuse Analysis Specification

## Purpose

Define how Tech Club evaluates external repositories before duplicating infrastructure.

## Goals

- Inspect Qikio, Menog OS, SemantIQ, Semantic Wallet, and Sunlionet before implementation.
- Decide what to reuse, adapt, keep external, or rewrite.
- Preserve Tech Club independence from LogicNet.

## Requirements

- Reuse decisions must be documented in `docs/REUSE_ANALYSIS.md`.
- External code must enter through adapters unless a package is explicitly adopted.
- No mature infrastructure should be duplicated without a decision record.

## Architecture

External repositories are treated as upstream capabilities. Tech Club packages define internal contracts. Adapters translate upstream APIs into Tech Club contracts.

## Interfaces

- Adapter packages use `@tech-club/*` contracts.
- External clients are isolated behind interface boundaries.
- Reuse decisions are recorded as ADRs.

## Dependencies

- GitHub source repositories listed in the project blueprint.
- License and maintenance review before adoption.

## Risks

- Repositories may be unavailable, incompatible, or underdocumented.
- Direct imports can create tight coupling.

## Testing

Adapters require contract tests against mocked upstream behavior and optional integration tests against real repositories.

## Future Extension

Add automated upstream compatibility checks and version pinning.

## Acceptance Criteria

- Initial reuse matrix exists.
- Inspection workflow is documented.
- Adapter-first policy is documented.

## Implementation Notes

This phase does not vendor external code.
