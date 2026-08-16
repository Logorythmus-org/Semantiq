# Behavioral Execution Graph Specification (Prompt 8.6)

**Project**: SemantIQ Benchmarks / Tech Club Monorepo  
**Phase**: Phase 8.6 — Behavioral Execution Graph & Replay  
**Date**: 2026-08-01  
**Graph Verdict**: `BEHAVIORAL GRAPH AND REPLAY IMPLEMENTED`

---

## 1. Graph Node & Edge Architecture

### Node Types (9 Node Types)

`event`, `action`, `decision`, `resource`, `permission`, `evidence`, `result`, `consequence`, `recovery`

### Edge Types (12 Edge Types)

`follows`, `caused_by`, `enabled_by`, `denied_by`, `used_tool`, `affected_resource`, `produced`, `observed_as`, `violated`, `recovered_by`, `approved_by`, `delegated_to`
