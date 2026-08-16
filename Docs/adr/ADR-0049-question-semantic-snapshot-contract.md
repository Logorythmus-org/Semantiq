# ADR-0049: Question Semantic Snapshot Contract

Status: Accepted

Date: 2026-07-14

## Context

Semantiq needs a stable read contract without receiving ownership, actors, reports, audit data, locators, or inferred scores.

## Decision

Expose read-only snapshot schema 1.0 from committed Question and Frame state. Include Question identity/text/status/version, Frame identity/version/freshness/reference version, generated timestamp, and content-addressed IDs/text for allowed semantic components. Omit open possibilities and all sensitive/internal fields from this strict contract.

## Consequences

The existing semantic write API remains compatible. Component IDs are stable for the same Question, section, and normalized text; removal is represented by absence from current reads while immutable Frame revisions retain history. Schema changes require a new explicit version.
