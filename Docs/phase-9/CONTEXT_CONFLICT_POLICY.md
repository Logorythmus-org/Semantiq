# Context Conflict Resolution Policy

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-01  

---

## Conflict Resolution Rules

- **Explicit Merge Record**: Every merge MUST emit a `ContextMergeRecord` detailing `mergePolicy`, `selectedVersion`, `rejectedVersions`, and `resolverAgentId`.
- **Rollback Safety**: Unresolved conflicts trigger immediate state rollback to last stable `Snapshot`.
