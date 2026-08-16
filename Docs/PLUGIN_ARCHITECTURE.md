# Plugin Architecture

Plugins extend bounded contexts without changing aggregate internals.

## Plugin API

A plugin declares identity, version, capabilities, required permissions, supported hooks, and compatible module versions.

```ts
type PluginManifest = {
  id: string;
  version: string;
  targetContext: string;
  capabilities: string[];
  permissions: string[];
  hooks: string[];
};
```

## Extension Hooks

- before command validation
- after command handling
- event subscription
- read model projection
- search indexing
- semantic evaluation provider
- repository adapter
- agent tool registration
- UI contribution

## Capability Registration

Capabilities are explicit and revocable. A plugin cannot access aggregate internals unless the owning context exposes a public extension point.

## Lifecycle

Plugins support install, configure, start, suspend, resume, stop, upgrade, and uninstall.

## Permissions

Plugin permissions use the same capability model as agents and users. Sensitive operations require audit events.

## Isolation

Plugins run behind context-owned adapters. Hot loading is a future capability and must include compatibility checks, rollback, and audit logging.

## Developer Platform Alignment

Phase 3 expands plugin architecture into a full Developer Platform. Plugins now declare UI components, API endpoints, marketplace metadata, configuration schemas, licenses, sandbox requirements, code signatures, lifecycle records, and compatibility information. Marketplace publishing requires Semantiq review, security review, compatibility review, permission review, and approval.
