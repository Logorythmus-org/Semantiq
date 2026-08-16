# Message Bus

The Message Bus routes internal runtime messages without requiring an external broker.

## Message Types
- Commands: request state changes.
- Queries: request side-effect-free reads.
- Events: facts published after changes.
- Notifications: user or system delivery messages.
- Broadcast: fan-out runtime messages.
- Request/Response: correlated conversations.
- Priority Messages: ordered by urgency.
- Scheduled Messages: delivered later through the scheduler.
- Dead Letter Messages: failed messages retained for inspection.

## Delivery
The default delivery mode is local asynchronous in-process routing. Distributed messaging can be added through adapters.

## Safety
Every message carries correlation metadata, actor/session context, priority, and optional timeout.
