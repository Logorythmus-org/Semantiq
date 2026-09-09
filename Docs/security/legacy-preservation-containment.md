# Legacy preservation payload containment

Status: local containment candidate prepared as a normal Git change under the approved containment plan; public review and publication remain pending.

Legacy preservation artifacts were identified in the active repository. They represented archival and recovery material rather than assets required for SemantIQ runtime, API, SDK, build, or packaging operation.

This change removes the approved 17-artifact set from the active repository tree after byte-integrity verification and controlled private retention. Active SemantIQ product functionality is unaffected. No Git history rewrite is performed, and historical copies may remain reachable through earlier Git history.

This containment reduces unnecessary archival and provenance exposure. Ongoing provenance and rights review is handled separately and is not represented here as a public rights determination.

## Scope boundaries

- The change removes only the approved legacy preservation payload from the current public tree.
- It does not alter runtime behavior, APIs, SDKs, schemas, builds, packages, releases, tags, or license terms.
- It does not publish private archive locations, per-artifact hashes, credential history, or private research-workspace details.
- Historical reports remain historical records and are not rewritten to imply that the artifacts were never present.
