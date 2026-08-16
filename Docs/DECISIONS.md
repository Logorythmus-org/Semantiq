# Decisions

## ADR-0001: Use a pnpm TypeScript Monorepo
Status: Accepted

Tech Club needs apps, packages, services, tooling, and examples to evolve together. pnpm workspaces provide fast installs, deterministic dependency management, and clear package boundaries.

## ADR-0002: Contracts Before Implementations
Status: Accepted

Future modules must expose public APIs, events, commands, queries, configuration, dependencies, lifecycle hooks, and extension points before feature code is added. This keeps modules replaceable and testable.

## ADR-0003: Adapter-First External Reuse
Status: Accepted

Qikio, Menog OS, SemantIQ, Semantic Wallet, and Sunlionet may contain reusable infrastructure. Tech Club will integrate mature capabilities through adapters before adopting or rewriting them.

## ADR-0004: Local-First by Default
Status: Accepted

Tech Club must work locally and offline before relying on cloud services. Sync and remote services are optional layers.

## ADR-0005: Authentication Deferred
Status: Accepted

Phase 1 documents security architecture but does not implement authentication. This prevents premature coupling to one identity provider.
