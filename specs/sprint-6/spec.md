# Sprint 6 Public Alpha Hardening Spec

Spec ID: S6-SPEC

## Purpose
Prepare Tech Club for a controlled Public Alpha without redesigning the platform.

## Requirements
- Freeze alpha scope.
- Gate risky capabilities with typed flags and Safe Mode.
- Validate security, privacy, migration, backup, diagnostics, feedback and release readiness.

## Validation
- `LocalAlphaRuntime.runPublicAlphaValidation()`
- TypeScript, Vitest, JSON inventory and documentation inventory checks.

## Acceptance
No Public Alpha release proceeds with blocker validation failures.
