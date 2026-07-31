# Domain Events and Persistence

The local outbox stores versioned event payloads, correlation and causation IDs, occurrence time, processing attempts, and sanitized error state. Events are persisted in the same transaction as the originating changes. External brokers are out of scope for Prompt 4.
