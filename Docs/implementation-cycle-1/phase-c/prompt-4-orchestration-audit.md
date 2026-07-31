# Phase C Prompt 4 Orchestration Audit

## Status

**Partially Passed.** Repository discovery completed. Orchestration implementation was blocked by the Prompt 3 NO-GO.

## Reuse Classification

| Artifact                                 | Existing purpose                                                                    | Gaps and risks                                                                                                                | Decision                                                  |
| ---------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `packages/integration`                   | Generic explicit provider registry, health, routing, context, and retry descriptors | Registry silently replaces duplicate IDs; gateway may expose provider errors; provider kinds do not model evaluator semantics | ADAPT after evaluator contracts exist                     |
| `packages/shared/src/core-primitives.ts` | Result/error/event dispatcher primitives                                            | Dispatcher is in-memory and not durable                                                                                       | KEEP for local contracts/tests                            |
| `packages/persistence` UoW patterns      | PostgreSQL transactions, outbox, idempotency, CAS                                   | No Semantiq repositories or session schema                                                                                    | KEEP and ADAPT later                                      |
| `services/workers`                       | Three-field `WorkerJob` interface                                                   | No lifecycle, persistence, retries, cancellation, or runner                                                                   | REMOVE from consideration; do not treat as implementation |
| `services/scheduler`                     | Service scaffold                                                                    | No scheduler behavior or tests                                                                                                | DEFER                                                     |
| `packages/kernel` scheduler              | Generic local scheduled task registry                                               | No durable recovery or Semantiq ownership                                                                                     | WRAP only if its semantics pass future contract tests     |
| `packages/compute-engine`                | Compute queues, workers, cancellation, retry descriptors                            | Different bounded context; resource scheduling and benchmark workers                                                          | DEFER                                                     |
| `packages/workflow-engine`               | Workflow lifecycle, retry, cancellation, approval                                   | Prompt 4 forbids modifying Workflow Runtime; semantics are broader than evaluation jobs                                       | DEFER                                                     |
| `packages/agent-os`                      | Agent orchestration modes and task lifecycle                                        | Voting/consensus and AI/tool concerns conflict with evaluator independence                                                    | DEFER                                                     |
| `packages/governance-engine`             | Governance consensus state                                                          | Consensus represents governance process, not compatible evaluation artifacts                                                  | DEFER                                                     |
| `packages/community-engine`              | Community agreement/disagreement records                                            | Includes confidence/reputation/community semantics outside Semantiq                                                           | DEFER                                                     |
| `packages/adapters`                      | Storage adapter descriptors                                                         | No evaluator behavior, capabilities, or health contract                                                                       | KEEP as unrelated infrastructure vocabulary               |
| `packages/semantiq`                      | Legacy broad in-memory benchmark engines                                            | Random IDs, unsupported scoring, no Prompt 1 profile, no persistence                                                          | DEFER; cannot be deterministic adapter                    |
| `services/semantiq`                      | Static route descriptor                                                             | No executable API or access policy                                                                                            | DEFER                                                     |

## Architectural Findings

1. No `EvaluationSession`, `EvaluationRequest`, `EvaluatorAdapter`, `EvaluatorRegistry`, `ConsensusResult`, `DisagreementRecord`, or `EvaluationJobRunner` exists.
2. No durable local job implementation supports restart recovery.
3. Existing lifecycle vocabularies can inform naming but belong to unrelated bounded contexts and must not be copied wholesale.
4. Generic provider adapters are the closest reusable shape, but evaluator registration requires duplicate rejection, static allowlisting, profile compatibility, bounded outputs, sanitized errors, and explicit offline/external-model flags.
5. Governance and community consensus models are unsafe substitutes. They mix decision, confidence, evidence, reputation, or social agreement semantics that Prompt 4 must not equate with evaluation consensus.
6. Existing worker/scheduler services are scaffolds, not evidence of job execution.

## Security Findings

- Future evaluator registration must reject unknown and duplicate adapter identities.
- Provider error text must not pass through to public APIs without sanitization.
- Session reads must reuse an authoritative capability/access boundary.
- Model adapters must remain static `NOT_IMPLEMENTED` descriptors with no credential or network path.
- Consensus must be derived only from persisted compatible child results and must never be client-forgeable.

## Reuse Boundary

After Prompt 1-3 recovery, build Semantiq-owned contracts and adapt only small mechanics: shared result envelopes, explicit registry patterns, PostgreSQL UoW/outbox/idempotency, bounded retry descriptors, and tested lifecycle naming. Do not depend on Agent, Workflow, Governance, Community, or legacy benchmark runtimes.
