# Module Contracts Specification

## Purpose
Create a shared contract all Tech Club modules must follow.

## Goals
- Make modules replaceable, testable, and agent-friendly.
- Avoid circular dependencies and hidden coupling.
- Prepare extension points for future plugin loading.

## Requirements
Every module must define:
- Public API
- Internal API
- Events
- Commands
- Queries
- Configuration
- Dependencies
- Lifecycle
- Extension points

## Architecture
Modules expose a small public surface through package exports. Commands mutate state through explicit handlers. Queries read state without side effects. Events describe completed facts. Configuration is injected at startup. Extension points are versioned.

## Interfaces
```ts
export interface TechClubModule<TConfig = unknown> {
  readonly id: string;
  readonly version: string;
  configure(config: TConfig): void | Promise<void>;
  start(): void | Promise<void>;
  stop(): void | Promise<void>;
}
```

## Dependencies
Modules may depend on `@tech-club/core` and narrower domain contracts. Domain packages must not depend on apps or services.

## Risks
- Overly broad contracts can become meaningless.
- Event schemas need versioning before distributed use.

## Testing
Each module must include contract tests for commands, queries, events, and lifecycle behavior.

## Future Extension
Add schema validation, plugin manifests, and compatibility tests once runtime loading begins.

## Acceptance Criteria
- Contract shape is documented.
- Dependency rules are captured.
- A reusable core contract package exists.

## Implementation Notes
The first version intentionally stays small and interface-oriented.
