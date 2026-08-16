# Architectural Decision Record: ADR-001 — Behavioral Lifecycle Contract

**Status**: Accepted  
**Date**: 2026-08-01  
**Context**: SemantIQ requires a provider-neutral, local-first domain model for evaluating single-agent behavior.  
**Decision**: Adopt a 9-stage observable lifecycle (`Environment → Permissions → Context → Interpretation → Decision → Action → Result → Consequence → Recovery`).  
**Consequences**: Evaluators observe empirical input/output records without inspecting or storing private model chain-of-thought. Zero dependencies on parent platform modules.
