# Architectural Decision Record (ADR): Policy Evidence Observation Boundary

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-01  
**Status**: Approved

---

## Context

SemantIQ evaluates policy evidence to record and benchmark governance indicators. It is not an active policy enforcement authority.

## Decision

1. SemantIQ operates strictly as an **evidence observation and evaluation system**.
2. Missing evidence remains missing evidence and MUST NOT be converted into compliance or safety approvals.
3. Evaluator interpretations are recorded separately from raw immutable policy text.
