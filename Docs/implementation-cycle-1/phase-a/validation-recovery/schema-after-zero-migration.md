# Schema After Zero Migration

Migration 1/foundation applied from empty validation databases. Tables: `schema_migrations`, `system_metadata`, `idempotency_records`, `outbox_events`. Indexes: four primary-key indexes plus `outbox_events_pending_idx`. Re-run reported one existing migration and made no second change.
