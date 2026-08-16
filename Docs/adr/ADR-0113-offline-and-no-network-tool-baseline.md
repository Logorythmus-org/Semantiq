# ADR-0113: Offline and No-Network Tool Baseline

Status: Deferred

Date: 2026-07-20

## Context

Prompt 2 requires an offline baseline, but no sandbox exists.

## Decision

Add no network-capable tool or external dependency.

## Alternatives

Browser, HTTP, remote plugin, cloud, MCP, and external AI tools were rejected.

## Consequences

Offline Tool Runtime behavior remains unimplemented and untested.

## Security Implications

No new egress path exists.

## Migration Implications

No network policy record is created.

## Future Extension Boundary

The baseline must enforce `network.none` and prove it through sandbox and Docker tests.
