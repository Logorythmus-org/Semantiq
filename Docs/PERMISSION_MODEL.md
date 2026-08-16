# Permission Model

The Core Permission Model provides deterministic authorization for RBAC, ABAC-style attributes, workspace policies, community policies, agent permissions, workflow permissions, repository permissions, marketplace permissions, and federation policies.

## Core Concepts

- `PermissionGrant`: subject, action, resource, scope, optional role, attributes, and expiry.
- `AuthorizationContext`: actor, workspace, roles, capabilities, attributes, and timestamp.
- `AuthorizationRequest`: subject, action, resource, and context.
- `AuthorizationDecision`: allowed flag, reason, matched grants, and missing capabilities.

## Determinism

Permission evaluation is deterministic. Given the same request, grants, roles, attributes, and timestamp, the result must be identical.

## Storage Independence

Permission grants are stored through `PermissionRepository`. Production adapters may use PostgreSQL, SQLite, JSON, memory, or future policy stores, but application services depend only on the repository contract.

## Events

Permission changes emit `PermissionGranted` and `PermissionRevoked` events with version and correlation metadata.
