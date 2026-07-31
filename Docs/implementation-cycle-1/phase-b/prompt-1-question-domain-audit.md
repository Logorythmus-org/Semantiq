# Phase B Prompt 1 Question Domain Audit

## Phase Gate

Phase A is `CONDITIONAL GO` after the 2026-07-11 validation recovery. Docker/PostgreSQL persistence, migration, API readiness, restart, and outbox foundation evidence passed. Conditions retained: persistent idempotency adapter is limited, Docker health is TCP-level, and the minimal image does not contain the full test toolchain. None prevents this narrow Question slice when real PostgreSQL tests remain enabled.

## Existing Implementations

| Path                                                    | Purpose                                                                              | Status                            | Reuse decision                                                                                                                      |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `packages/core/src/domain/models.ts`                    | Large `QuestionAggregate` tied to knowledge/workspace/owner/profile/graph-era fields | Existing historical/core contract | Preserve for existing consumers; not authoritative for the minimal slice because creation requires unrelated aggregates             |
| `packages/core/src/domain/identifiers.ts`               | String QuestionId alias and UUID/semantic ID factories                               | Reusable                          | Reuse ID generation pattern; add no new ID framework                                                                                |
| `packages/core/src/domain/events.ts`                    | Core event/command/query contracts and `QuestionCreated` legacy event type           | Reusable legacy contract          | Preserve; new runtime event uses shared Phase A event shape and stable `question.created` name                                      |
| `packages/core/src/contracts/repositories.ts`           | Question repository requiring `QuestionAggregate` save/get                           | Existing                          | Preserve for core domain; create focused runtime repository contract                                                                |
| `packages/question-engine/src/index.ts`                 | Minimal `{id,text,status}` in-memory-oriented interface                              | Legacy/partially reusable         | Reuse concept only; replace package export with authoritative runtime types                                                         |
| `packages/questions/src/index.ts`                       | Re-export of core question aggregate/application service                             | Duplicate boundary                | Make this the authoritative minimal Question Runtime package; retain core exports through explicit compatibility names where needed |
| `services/question/src/index.ts`                        | Route descriptor listing future PATCH/archive/etc. routes                            | Documentation/scaffold            | Keep descriptor; no future routes implemented                                                                                       |
| `packages/question-network` and `question-intelligence` | Discovery/scoring/intelligence contracts                                             | Out of scope                      | Do not import into first slice                                                                                                      |
| `packages/sprint1-runtime` and `mvp-runtime`            | Historical question flows and health descriptors                                     | Reference/history                 | Do not use as production Question Runtime source                                                                                    |

## Domain Discovery Decisions

- Smallest valid Question: validated human-readable text plus language, published status, timestamps, version, ID, and optional local actor reference.
- Body/title split: deferred; the first API accepts one `text` field.
- Initial status: `published`, because the first slice creates a retrievable local question immediately.
- Creator: optional `creatorId` from trusted request context/header; no body creator spoofing and no auth redesign.
- Duplicate text: identical text is allowed as separate questions; idempotency keys prevent repeated command submission only.
- Language: required, normalized to a small BCP-47-like tag (`en`, `fa`, `de`, etc.).
- Metadata, tags, scoring, uncertainty, graph links, and research context are deferred.
- `QuestionCreated` contains a compact summary, not full text, and carries correlation/causation metadata.

## Migration Risk

The new table is additive after Phase A migration 1. Existing core QuestionAggregate data is not migrated or altered. The compatibility path remains available to historical packages; new runtime code imports `packages/questions`.
