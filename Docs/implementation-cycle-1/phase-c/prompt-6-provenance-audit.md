# Phase C Prompt 6 Provenance Audit

## Status

**Partially Passed.** Repository-wide provenance, citation, source, evidence, graph, trust, reliability, snapshot, version, relationship, and conflict discovery completed. Runtime implementation was blocked by the missing Prompt 5 handoff.

## Reuse Classification

| Artifact                                              | Existing purpose                                                                                                                | Integrity risk or missing behavior                                                             | Decision                         |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------- |
| `packages/questions/src/safety.ts`                    | Typed Question source references, locator normalization, declaration/verification classification, logical removal, audit/events | Question-owned mutation and moderation access policy                                           | KEEP; future read adapter only   |
| `packages/persistence/src/question-safety.ts`         | PostgreSQL source persistence, uniqueness, CAS lifecycle                                                                        | Not a Semantiq source registry or immutable evidence snapshot                                  | KEEP; do not duplicate           |
| `Docs/backend/question-trust-to-semantiq-contract.md` | Explicit Semantiq consumption and no-truth boundary                                                                             | Requires future authorized adapter                                                             | KEEP                             |
| `packages/evidence`                                   | Re-exports Research `EvidenceObject`                                                                                            | No independent aggregate, versioning, persistence, or tests                                    | DEFER                            |
| `services/evidence`                                   | Static Sprint 2 route descriptor                                                                                                | No executable API or access policy                                                             | DEFER                            |
| `packages/research/src/runtime.ts`                    | Evidence/project/dataset/publication contracts                                                                                  | Arbitrary metadata, mutable history IDs, numeric quality/confidence without Prompt 6 semantics | DEFER to Research Runtime        |
| `packages/research-engine`                            | Research evidence/contribution concepts                                                                                         | Different source ownership and lifecycle                                                       | DEFER to Research Runtime        |
| `packages/sprint2-runtime`                            | Legacy evidence records, citation strings, quality scoring                                                                      | Random IDs, in-memory state, generic deterministic scores, no immutable snapshots              | DEPRECATE for Phase C provenance |
| `packages/civilization-os`                            | Broad knowledge provenance and lineage maps                                                                                     | Mutable overwrite by object ID; no fingerprints, snapshots, or access controls                 | DEFER                            |
| `packages/publications`                               | Citation-oriented package descriptor                                                                                            | No citation model or implementation                                                            | DEFER                            |
| `packages/datasets`                                   | Provenance-oriented package descriptor                                                                                          | No implementation                                                                              | DEFER                            |
| `packages/sprint5-runtime`                            | Federated references, hashes, trust status                                                                                      | Federation semantics and illustrative score fields; external boundary                          | DEFER                            |
| Phase B Question graph                                | Question-to-Question topology                                                                                                   | Not an evidence/provenance graph                                                               | KEEP separate                    |
| Prompt 2 planned evidence graph                       | Explainability graph                                                                                                            | Missing; never implemented                                                                     | BLOCKED prerequisite             |

## Model Gaps

The repository has no authoritative Phase C implementation of:

- `ProvenanceGraph`
- immutable `EvidenceSnapshot`
- `Citation` and `CitationEngine`
- citation normalization or deterministic fingerprint contract
- `ReliabilityAssessment`
- `SourceRelationship`
- `SourceConflict` or `ConflictAnalyzer`
- `EvidenceCollection` or `EvidenceAggregator`
- `ProvenanceReplay`

## Boundary Findings

1. Question provenance records declared origins; they are not evidence verification, authority, or reliability assessments.
2. Research evidence models contain useful vocabulary but own research workflows and cannot become Semantiq persistence by aliasing types.
3. Legacy numeric `confidence`, `quality`, `relevance`, and reliability values have undocumented scale/calibration semantics and must not be imported.
4. Question Graph relations must remain separate from provenance edges.
5. Explainability evidence, benchmark evidence, human judgments, and source evidence require distinct node identities and access policies before graph composition.
6. A citation URI or local reference must never be treated as fetched, verified, or authoritative merely because it normalizes successfully.

## Security Findings

- Future citation resolution must use type-specific local allowlists and reject traversal, ambiguous roots, URI spoofing, controls, and oversized metadata.
- Snapshot hashes must be computed server-side over canonical content and immutable metadata.
- Relationship creation must validate both endpoint types and caller capability.
- Provenance reads must intersect evaluation, source, Question moderation, human-judgment, and benchmark access policies.
- Replay must fail closed when any required historical snapshot is missing; it must not substitute current mutable source state.

## Scientific and Trust Integrity

Reliability may summarize observable coverage, consistency, source diversity, snapshot validity, and explicit limitations. It must not become truth, authority, website ranking, misinformation detection, or an automatic conflict winner. Existing uncalibrated quality/confidence numbers are excluded from reuse.

## Implementation Decision

No source, migration, API, event, test, Docker, or backend contract was changed. Implement Prompt 5 first, then design Prompt 6 against its actual immutable source and citation identities plus the completed Prompt 1-4 evaluation lineage.
