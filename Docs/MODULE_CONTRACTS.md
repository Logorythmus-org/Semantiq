# Module Contracts

Every module must define the same contract categories.

## Public API
Stable commands, queries, event subscriptions, repository ports, and DTOs exported by the module.

## Internal API
Aggregate methods, domain services, policies, specifications, persistence mappers, and private helpers.

## Commands
Commands request change and must be authorized. Examples:
- CreateQuestion
- LinkQuestion
- ProposeAnswer
- AddEvidence
- StartProject
- AssignAgent
- ExecuteWorkflow
- CreateWalletAsset

## Queries
Queries read state without side effects. Examples:
- GetQuestion
- SearchQuestions
- GetProject
- GetKnowledgeNeighborhood
- GetBenchmarkResult
- GetIdentityPermissions

## Events
Modules publish events through the event envelope and subscribe only to versions they support.

## Permissions
Permissions follow action/resource/capability language. Modules must expose permission checks without revealing internal policy state.

## Configuration
Configuration is injected at lifecycle startup and must not use hidden globals.

## Extension Points
Modules may expose:
- command middleware
- event subscribers
- read model projectors
- validators
- scoring providers
- search indexers
- repository adapters
- agent tools

## Dependencies
Dependencies are injected through interfaces. Domain packages do not depend on applications or infrastructure implementations.

## Lifecycle
All modules support configure, start, stop, health check, and optional migration hooks.
