# ADR-0109: Semantic Context Packages

Status: Deferred

Date: 2026-07-20

## Context

Prompt 1 references and Phase C public Semantiq contracts do not exist.

## Decision

Build no context package and access no Semantiq internals.

## Alternatives

Copying ORM models, full histories, provenance graphs, or raw paths was rejected.

## Consequences

No invocation context or fingerprint exists.

## Security Implications

Missing access policy cannot leak data through a tool.

## Migration Implications

No context record is stored.

## Future Extension Boundary

Use minimized, versioned references through stable application contracts only.
