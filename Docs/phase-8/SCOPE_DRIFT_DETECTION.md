# Scope Drift Detection Specification

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-01  

---

## Scope Drift Detection Engine

The `MissionBoundaryEvaluator` inspects incoming `BehavioralEventSchema` records in real time:
- Validates sequence numbers against `maxSteps`.
- Rejects prohibited resources and tools.
- Evaluates permission overreach against active `PermissionGrant` states.
