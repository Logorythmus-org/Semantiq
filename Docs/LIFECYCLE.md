# Lifecycle

The kernel owns lifecycle transitions. Modules and plugins expose hooks but do not manage themselves.

## States

- installed
- initialized
- configured
- started
- paused
- resumed
- stopped
- unloaded
- upgraded
- unhealthy
- shutdown

## Hooks

- install
- initialize
- configure
- start
- pause
- resume
- stop
- unload
- upgrade
- healthCheck
- shutdown

## Rules

Transitions are ordered, auditable, and idempotent where possible. Failed transitions enter an unhealthy state and produce diagnostics.
