# Event Engine

The Event Engine standardizes domain and runtime event flow.

## Capabilities

- publish
- subscribe
- replay
- filter
- version events
- retain event history
- record audit metadata
- correlate causation chains
- process asynchronously
- prepare for future cluster replication

## Event Store

Phase 1 uses an in-memory event history for local validation. Future adapters provide durable append-only storage.

## Versioning

Consumers subscribe to event type and version. Breaking payload changes require a new version.
