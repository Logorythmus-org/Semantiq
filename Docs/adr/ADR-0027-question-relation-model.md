# ADR-0027: Question Relation Model

Status: Superseded in part by Phase B Prompt 7 closure

Date: 2026-07-13

## Context

Questions need explicit, navigable connections without importing the incompatible historical Question aggregates or introducing a general-purpose knowledge graph.

## Decision

Model `QuestionRelation` as a separate immutable aggregate owned by `packages/questions`. It has identity, source Question ID, target Question ID, one approved relation type, creator, timestamp, and version. It does not live inside a Question row and does not increment either endpoint's aggregate version.

The final Phase B taxonomy adds `follow_up` to `emerges_from`, `refines`, `challenges`, `contradicts`, `depends_on`, `broadens`, `narrows`, `alternative_to`, and `connects`. Creation rejects self-links, missing endpoints, archived endpoints, and actors other than the source Question creator. Prompt 7 adds one-way logical removal with optimistic versioning while preserving immutable assertion fields.

## Consequences

Question mutation and revision contracts remain stable. Relations evolve independently and feed other runtimes through explicit adapters. Correction, evidence, confidence, physical deletion, and machine-generated suggestions remain deferred rather than hidden in untyped metadata.
