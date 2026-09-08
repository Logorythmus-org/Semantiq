# Legacy preservation payload containment

Status: local containment candidate prepared as a normal Git change under the approved containment plan; public review and publication remain pending.

Legacy preservation artifacts were identified in the active repository. They represented archival and recovery material rather than assets required for SemantIQ runtime, API, SDK, build, or packaging operation.

After byte-integrity verification and controlled private retention, the approved 17-artifact set was removed from the active public tree. Active SemantIQ product functionality was unaffected. No Git history rewrite was performed, and historical copies may remain reachable through earlier Git history.

This containment reduces unnecessary archival and provenance exposure. Ongoing provenance and rights review is handled separately and is not represented here as a public rights determination.

## Scope boundaries

- The change removes only the approved legacy preservation payload from the current public tree.
- It does not alter runtime behavior, APIs, SDKs, schemas, builds, packages, releases, tags, or license terms.
- It does not publish private archive locations, per-artifact hashes, credential history, or private research-workspace details.
- Historical reports remain historical records and are not rewritten to imply that the artifacts were never present.
