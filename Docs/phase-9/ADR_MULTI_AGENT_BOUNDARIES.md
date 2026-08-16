# Architectural Decision Record (ADR): Multi-Agent Observation Boundaries

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-01  
**Status**: Approved  

---

## Context
SemantIQ evaluates multi-agent behavior through external observation and evidence collection. It does not provide a multi-agent orchestration runtime.

## Decision
1. SemantIQ operates strictly as an **observation and evaluation system**.
2. All multi-agent events must have attributable primary and secondary actor IDs.
3. Responsibility is assigned via explicit `ResponsibilityAssignment` contracts rather than inferring blame from message sequence order.
