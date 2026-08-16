# ADR-0031: Question Semantic Structure

Status: Accepted

Date: 2026-07-13

## Context

A Question needs explicit context, assumptions, constraints, unknowns, uncertainty, scope, perspectives, and open possibilities before later semantic or research runtimes can consume it safely. The Question Runtime must remain authoritative without performing inference, scoring, or truth judgment.

## Decision

Model `QuestionSemanticStructure` as an optional one-to-one aggregate under `packages/questions`. It belongs to a Question but has an independent version. Its complete content is a normalized snapshot with eight stable sections:

- `context`, `assumptions`, `constraints`, `unknowns`, `perspectives`, and `openPossibilities` are statement arrays.
- `uncertainty` contains a human-declared qualitative level and explanatory statements.
- `scope` contains explicit inclusions and exclusions.

Only the Question creator may create or replace the structure. Archived Questions retain readable structures but reject semantic writes. An explicit all-empty structure is valid and represents absence without inventing meaning.

## Consequences

Question text versions, Question relations, and graph behavior remain unchanged. Later runtimes receive a stable human- and machine-readable contract, but no field is treated as inferred truth. Semantic item identity, partial field mutation, search, scoring, embeddings, suggestions, and automatic profile generation are deferred.
