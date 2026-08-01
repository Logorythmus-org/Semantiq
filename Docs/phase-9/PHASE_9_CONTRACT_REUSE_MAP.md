# Phase 9 Contract Reuse Map

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-01  

---

## Primitive Reuse Architecture

Phase 9 reuses Phase 8 primitives cleanly without duplicating logic:
- `BehavioralEventSchema` -> Embedded inside `CollectiveReplayBundle`.
- `PermissionGrant` -> Referenced in `AgentAuthority`.
- `MissionContract` -> Wrapped inside `CollectiveMission`.
- `IncidentEvidenceBundle` -> Aggregated inside `CollectiveEvidenceBundle`.
