# Sync Engine

The Sync Engine keeps local data authoritative while allowing optional remote and future peer-to-peer synchronization.

## Capabilities

- offline editing
- conflict detection
- conflict resolution
- merge
- workspace sync
- selective sync
- background sync
- encrypted sync
- future peer-to-peer sync

## Change Model

Changes are recorded as versioned operations with actor, device, object id, base version, resulting version, timestamp, hash, and optional patch.

## Conflict Strategy

Conflicts are detected when two changes share a base version and produce incompatible results. Resolution can be automatic for commutative changes, policy-based for simple fields, or human-reviewed for semantic conflicts.

## Local Authority

Cloud sync is optional. Local data remains usable and authoritative for the user's workspace.
