# ADR-0025: Question Archive and Restore

Status: Accepted

Date: 2026-07-12

## Context

Questions require reversible lifecycle control without permanent deletion or hidden generic actions.

## Decision

Preserve Prompt 1 `published` as the active state and add `archived`. Use explicit archive and restore commands/endpoints. Archived Questions cannot be edited and must be restored first. Both transitions create revisions/events and require creator plus expected version.

## Consequences

Prompt 1 data remains compatible. Permanent deletion, moderation, visibility, and legal erasure are separate future decisions.
