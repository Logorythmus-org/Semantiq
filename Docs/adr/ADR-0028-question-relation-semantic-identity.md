# ADR-0028: Question Relation Semantic Identity

Status: Accepted

Date: 2026-07-13

## Context

Directed, symmetric, and inverse relation names can describe the same semantic edge with different endpoint order. Application-only duplicate checks are insufficient under concurrent requests.

## Decision

Treat `contradicts`, `alternative_to`, and `connects` as symmetric. Canonicalize their endpoints lexically for uniqueness while preserving the submitted orientation for provenance. Treat `A narrows B` as semantically equivalent to `B broadens A`. All other relation types are directed and retain source/target order.

Persist generated canonical type/source/target columns and a database unique constraint. Keep the same canonicalization function in the domain for memory adapters and early conflict responses.

## Consequences

Reversed symmetric duplicates and broadens/narrows inverse duplicates fail consistently, including under races. Different relation types may connect the same endpoints when they express genuinely different claims.
