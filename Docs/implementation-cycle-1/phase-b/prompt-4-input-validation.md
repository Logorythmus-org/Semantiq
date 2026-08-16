# Phase B Prompt 4 Input Validation

## Repository Baseline

The active runtime is `packages/questions`, PostgreSQL persistence is in `packages/persistence`, and the local HTTP boundary is `services/api`. Prompt 1 creation, Prompt 2 lifecycle/revisions, and Prompt 3 relation/graph behavior were read before implementation.

Migration head before this sprint was `4/question_relations`. Host and Docker baselines were 129 tests with no Critical or High security finding.

## Repository-Truth Correction

The new brief describes Prompt 3 as including relation lifecycle and `QuestionRelationRemoved`. The implemented Prompt 3 contracts, ADR-0027 through ADR-0030, migration 4, tests, and handoff explicitly define immutable creation-only relations and only `question.relation.created`. Prompt 4 did not redesign that stable contract or fabricate a removal event.

## Confirmed Prompt 4 Boundary

Prompt 4 may persist explicit human-supplied context, assumptions, constraints, unknowns, uncertainty, scope, perspectives, and open possibilities. It must not import historical Question aggregates, infer semantic content, score or rank Questions, call an LLM, generate embeddings, answer Questions, or require a vector/graph database.

## Implementation Decision

Use an optional one-to-one semantic aggregate with an independent version, complete replacement commands, immutable revisions, compact outbox events, and PostgreSQL JSONB validation. Preserve Question text versions, relation identity, graph traversal, and all existing API contracts.
