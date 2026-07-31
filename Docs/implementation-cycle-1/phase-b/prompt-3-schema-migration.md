# Phase B Prompt 3 Schema Migration

## Migration

- Version: `4`
- Name: `question_relations`
- Previous head: `3/question_lifecycle_revisions`

## Table

`question_relations` stores immutable ID, source/target foreign keys, type, creator, timestamp, and version 1. Both foreign keys use `ON DELETE RESTRICT`; source and target must differ.

Generated columns compute semantic identity:

- Symmetric `contradicts`, `alternative_to`, and `connects` sort endpoints.
- `narrows` canonicalizes to reversed `broadens`.
- Other directed types retain submitted orientation.

A unique constraint covers generated canonical type/source/target. Source, target, and type adjacency indexes support bounded reads. A trigger rejects UPDATE and DELETE.

## Validation

- Upgrade from migration 3 preserved existing Question text, status, creator, timestamps, and version.
- Reapplying migrations was idempotent.
- Real PostgreSQL rejected self-links, missing endpoints, symmetric reversals, inverse broadens/narrows duplicates, row mutation, and concurrent equivalent inserts.
- Migration head was confirmed as `4/question_relations` on host and Docker.

## Rollback

The operational rollback is application rollback plus restoring the pre-migration database snapshot. Migration 4 is additive, so old code can ignore the table, but dropping it is not automated. Before any destructive rollback, preserve relation and outbox data for reconciliation.
