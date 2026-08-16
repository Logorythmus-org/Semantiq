# Question Archive and Restore

Archive and restore are explicit POST operations, never DELETE. Archive preserves text and changes status from `published` to `archived`; restore changes it back. Each transition increments version and creates its own revision and event.

Only the creator may transition a Question. Archived Questions reject updates until restored. Idempotent replay returns the original logical result without creating another transition, revision, or event.

Permanent deletion and legal retention/redaction behavior are deferred.
