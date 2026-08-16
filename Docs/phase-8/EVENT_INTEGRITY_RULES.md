# Event Integrity & DAG Rules

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-01

---

## DAG Validation Rules

- **Sequence Monotonicity**: `sequenceNumber` and `monotonicIndex` must strictly increase.
- **Parent Resolution**: Every parent ID in `parentEventIds` must exist in DAG.
- **Cycle Prevention**: Parent references must form a strict Directed Acyclic Graph (DAG).
- **Annotation Separation**: Evaluator annotations are managed by `EvaluatorAnnotationStore` without altering source events.
