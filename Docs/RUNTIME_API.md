# Runtime API

The runtime API is technology-independent.

## Core Methods
- `registerModule()`
- `registerService()`
- `resolve()`
- `publish()`
- `subscribe()`
- `schedule()`
- `loadPlugin()`
- `startModule()`
- `stopModule()`
- `getHealth()`
- `getConfiguration()`
- `setConfiguration()`
- `runAgent()`
- `executeWorkflow()`

## Design Rules
The API returns typed results, does not expose persistence models, and uses explicit runtime context for actor, session, correlation, and permissions.
