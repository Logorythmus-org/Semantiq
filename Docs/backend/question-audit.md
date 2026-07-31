# Question Audit

`question_audit_records` is the authoritative, append-only audit trail. Prompt 6 operations write audit records in the same transaction; Prompt 1-5 outbox writes are projected by a database trigger in the inserting transaction.

Audit is internal-only, capability-gated, structured, sanitized, and independent of process logs.
