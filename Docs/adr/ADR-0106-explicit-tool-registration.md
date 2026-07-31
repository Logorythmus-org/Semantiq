# ADR-0106: Explicit Tool Registration

Status: Deferred

Date: 2026-07-20

## Context

No authoritative Tool Definition or adapter exists.

## Decision

Register nothing; repository presence grants no execution authority.

## Alternatives

Reflection, package discovery, dynamic imports, and legacy string taxonomies were rejected.

## Consequences

The Tool Registry remains unavailable.

## Security Implications

No arbitrary module or utility can become a tool.

## Migration Implications

No registration metadata is persisted.

## Future Extension Boundary

Require immutable versions, fingerprints, compatibility checks, and explicit adapter wiring.
