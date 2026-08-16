# ADR-0042: Question Audit Strategy

Status: Accepted

Prompt 6 commands write state, audit, and outbox in one transaction. Existing Question events are projected into audit by an `AFTER INSERT` outbox trigger in that same database transaction. Audit and moderation actions are append-only by trigger.
