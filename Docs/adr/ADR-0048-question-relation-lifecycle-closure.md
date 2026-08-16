# ADR-0048: Question Relation Lifecycle Closure

Status: Accepted

Date: 2026-07-14

## Context

Phase B handoff required logical relation removal and a follow-up edge, while the Prompt 3 implementation intentionally deferred lifecycle mutation.

## Decision

Add `follow_up`; add active/removed status and removal metadata; permit only creator-authorized expected-version transition from version 1 active to version 2 removed. Persist state, `question.relation.removed`, and optional idempotency record atomically. Exclude removed rows from active list, graph, duplicate lookup, and discovery relations.

## Consequences

Assertion fields remain immutable and physical deletion remains prohibited. Existing active rows migrate without rewriting semantic identity. A removed canonical edge may be asserted again as a new row only after a future explicit uniqueness-policy migration; this sprint does not add reinstatement.
