# ADR-0119: Workflow Recovery

Status: Deferred

Date: 2026-07-20

## Context

There is no durable queue, checkpoint, lease, transition history, or completed-step identity.

## Decision

Do not claim pause, resume, or restart recovery from event-only legacy methods.

## Consequences

Recovery validation is not executable and Prompt 3 remains `NO GO`.
