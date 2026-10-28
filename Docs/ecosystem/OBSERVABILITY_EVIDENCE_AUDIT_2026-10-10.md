# Observability & Evidence Boundary — Bounded Static Audit

**Date:** 2026-10-10  
**Evidence source:** GitHub connector read of protected `main` at commit `979cf511e2fc57811fb3cef3766be1653a2e45f5`.  
**Scope:** selected source files, tests, public docs and root Compose topology; this is **not** an exhaustive source audit, a fresh integration-graph replacement, an executed CI suite, or live OpenTelemetry/Grafana validation.  
**Tracking:** [#188](https://github.com/Logorythmus-org/Semantiq/issues/188), under canonical product-roadmap governance [#177](https://github.com/Logorythmus-org/Semantiq/issues/177) and coordination [#180](https://github.com/Logorythmus-org/Semantiq/issues/180).

## 1. Decision boundary

SemantIQ's primary purpose is **behavioral evidence infrastructure**, not a standalone APM dashboard. Design an optional, transport-neutral operational-telemetry surface only if it preserves the independently reviewable canonical `Run → Trace/TraceEvent → EvidenceObservation/Evaluation → Claim/ResearchBundle` path.

- An instrumented tool **completed** is not evidence that the user's goal was **satisfied**.
- A terminal status is an observation about execution, not a benchmark adjudication.
- An exporter, dashboard, log or third-party agent trace is **derived observability**, never the authority that promotes an evidence claim.
- Failure to observe a problem is not proof of its absence.
- Document provenance, data provenance, missingness and privacy before new telemetry export.

An external agent-observability repository motivated a comparison of architectural requirements. **No source code, API implementation, configuration, or dashboard from that repository was copied, ported, or vendored.** The external tool experiment is deferred until SemantIQ's own work is reviewed.

## 2. Current-main evidence matrix (bounded)

These classifications are **audit working findings**, not updates to the normative [Integration Graph](INTEGRATION_GRAPH.md), which is explicitly a historical snapshot.

| Boundary | What is actually visible at the inspected SHA | Working classification | Evidence / limits |
|---|---|---|---|
| Agent runtime monitoring interface | `packages/agent-runtime/src/index.ts` defines `RuntimeMetrics` and runtime event types; `packages/monitoring/src/index.ts` only re-exports `RuntimeMetrics` as a type. | **CONTRACT_ONLY** for monitoring package export | A runtime type is not an OTLP metric producer. This does not assert no producer exists elsewhere. |
| Alpha observability | `packages/alpha-observability/src/index.ts` re-exports `LocalAlphaRuntime`, `AlphaEvent`, `HealthSnapshot`. | **IMPLEMENTED_PARTIAL** underlying internal alpha runtime; **not** externally verified telemetry | No collector/exporter conformance shown by this entry point. |
| Canonical trace mapping | `packages/evidence/src/trace-mapper-engine.ts` maps approved profiles to `Trace`/`TraceEvent` with chained SHA-256 event hashes; `tests/unit/trace-mapping-provenance.test.ts` includes deterministic fingerprint, approval and mapping assertions. | **IMPLEMENTED_PARTIAL** | Tests exist in repository but were **not executed** during this connector-only audit. Several semantic edge cases below require review. |
| Sandbox observability rendering | `tests/unit/observability-dashboard.test.ts` exercises `ObservabilityDashboardEngine` snapshot, terminal and HTML rendering paths. | **IMPLEMENTED_PARTIAL**, renderer-level | Renderer assertions are **not** evidence of live Grafana, Prometheus or Tempo ingestion. |
| Evidence normalization | `packages/evidence-normalizer/src/normalizer.ts` implements stream sanitization, regex redaction, evidence payload assembly and a digest. | **IMPLEMENTED_PARTIAL; risk review needed** | Nested digest-preimage coverage and raw sensitive-context handling need validation; see #192. |
| OpenTelemetry / OTLP export | The inspected `packages/monitoring/src/index.ts` has no exporter call. Older [Integration Graph](INTEGRATION_GRAPH.md) classifies OTel as `SCAFFOLD` at a different SHA. | **NOT VERIFIED on current main** | Requires whole-repo producer/dependency search and in-memory/live-collector integration tests; do **not** claim confirmed absence globally. |
| Prometheus / Grafana stack | Root `docker-compose.yml` declares `prometheus` (`prom/prometheus:latest`) and `grafana` (`grafana/grafana:latest`), with mapped host ports. | **SCAFFOLD** for demonstrated SemantIQ data flow | The inspected Compose does not configure a metrics scrape job, OTLP Collector/Tempo, provisioned data source or trace-linked dashboard. Containers alone prove no data path. |
| Public observability wording | `packages/monitoring/README.md` labels broad tracing/OTel integration as a production monitoring package; `Docs/OBSERVABILITY.md` outlines comprehensive desired views. | **DOCS_ONLY** for unverified advertised surfaces | Text should not be interpreted as evidence of implemented or production-ready integrations. |
| Canonical truth | `Docs/KNOWN_LIMITATIONS.md`, `Docs/SCIENTIFIC_GUARDRAILS.md`, `Docs/ARCHITECTURE.md` clearly bound maturity and epistemic claims. | **DOCUMENTED GUARDRAILS** | All new telemetry claims must stay inside Public Alpha and evidence-promotion restrictions. |

**Confidence boundary:** `IMPLEMENTED_PARTIAL` here means relevant source and existing test cases were inspected; it does not mean tests passed today or a live stack has been demonstrated. No tests, containers, network benchmarks or model calls were run by this audit.

## 3. Confirmed static observations and hypotheses needing tests

### F1 — Terminal trace state is over-inferred from mere event presence (design concern)

[TraceMapperEngine](../../packages/evidence/src/trace-mapper-engine.ts) currently assigns `TraceStatus.COMPLETED` whenever the mapped stream has at least one event; an empty stream is `INSUFFICIENT_DATA`. The mapper also initializes `tokenUsage` and `durationMs` to zeros, and it supplies `new Date()` if an input timestamp is missing.

**Implication to test:** a partial/cancelled/error stream can be represented as complete, while `0` token consumption or duration can be mistaken for an observed measurement instead of unknown/unavailable data. Missing timestamps may reduce replay determinism. Do **not** silently change versioned Trace contracts; address with reviewed missingness/terminal-state semantics under [#189](https://github.com/Logorythmus-org/Semantiq/issues/189).

### F2 — Unresolved payloads require a privacy and provenance policy (design concern)

[TraceMapperEngine](../../packages/evidence/src/trace-mapper-engine.ts) preserves unmapped raw fields under `unresolvedFields` for approved profiles with that option enabled. This supports forensic provenance, but mapped payloads and unresolved vendor fields can contain prompts, file paths, credentials or personal data. Mapping approval alone is not a data-redaction guarantee.

[EvidenceNormalizer](../../packages/evidence-normalizer/src/normalizer.ts) redacts specific known patterns from stdout/stderr, diffs and an optional thought-log string, but copies `environmentVariables` and `commandArray` into its payload without the same field-level redaction. It also represents optional `agentReasoningTrace`; the system must not treat this as a general entitlement to collect private internal reasoning. Audit the full storage/export path before declaring a leak or enabling any exporter.

### F3 — Nested digest preimage is insufficiently covered (locally reproduced JavaScript behavior)

`EvidenceNormalizer.normalize()` uses `JSON.stringify(evidencePayload, Object.keys(evidencePayload).sort())` before hashing. An array replacer filters **nested** object keys as well as top-level keys; it is not recursive key canonicalization. A minimal isolated JS reproduction with held-constant outer fields yielded identical serialized strings when nested `result.exitCode` and `context.environmentVariables` differed. This demonstrates omitted nested fields from a digest input, **not** a SHA-256 collision or proven end-to-end exploitation. As the normalizer creates fresh IDs and times, controlled fixtures are necessary to establish operational impact.

Track separately in [#192](https://github.com/Logorythmus-org/Semantiq/issues/192). Compare existing project canonicalization utilities; protect historical digests and review schema/compatibility before any fix.

### F4 — An operational dashboard can mask semantic failure

An execution may have zero transport/tool errors yet miss a user-defined goal. A tool can also fail transiently before recovery. No error rate or absence of reported errors should be promoted to an accuracy, safety, intent-understanding, or successful-task claim. Governed deterministic scenarios belong in [#191](https://github.com/Logorythmus-org/Semantiq/issues/191), and any benchmark promotion stays within the BM0–BM5 lifecycle.

### F5 — Live telemetry pipeline not demonstrated in the inspected evidence

The root Compose file defines endpoint-facing services, but the inspected configuration does not connect an OTel exporter/Collector, Tempo receiver, Prometheus scrape target and Grafana data source into one verified SemantIQ path. **Do not add stack components until producer contracts, privacy controls and test gates are accepted.** Optional exporter work [#190](https://github.com/Logorythmus-org/Semantiq/issues/190) remains gated `FUTURE` under [#178](https://github.com/Logorythmus-org/Semantiq/issues/178).

## 4. Architectural decision list (for reviewed design, not automatic implementation)

1. **Correlation contract:** `runId`, `caseId`, `traceId`, `eventId`, optional `spanId`/`parentSpanId`, source and mapping-profile identity. Trace context must not re-define canonical evidence identity.
2. **Clock and ordering:** event time vs ingestion time, missing timestamps, out-of-order/duplicate events, aborted runs, status and unavailable numeric measurements.
3. **Evidence trust:** separate `observed`, `inferred`, `adjudicated` and `claimed` surfaces, including explicit unknown states and reviewable score provenance.
4. **Data minimization:** payload allowlist, private paths, prompt/code/command content, raw stream retention, opt-in export, secret redaction, and high-cardinality caps.
5. **Isolation:** exporter defaults to disabled/no-op; exporter failure must not alter benchmark outcomes, sealed research bundles or the host runtime's control decisions.
6. **Versioning:** preserve `1.0.0` contract compatibility unless a separately reviewed specification approves migration; test TS/Python parity when a shared schema changes.

## 5. Roadmap handoff and exit gates

Keep [#177](https://github.com/Logorythmus-org/Semantiq/issues/177) as the **only** canonical product roadmap; this note is an evidence annex, not a competing roadmap.

| Order | Tracked issue | Goal | Promotion/exit gate |
|---|---|---|---|
| **NOW — audit** | [#188](https://github.com/Logorythmus-org/Semantiq/issues/188) | Verify source and claim boundaries | Complete whole-repo search, add CI/runtime evidence where necessary, maintainer review of matrix. |
| **Priority integrity review** | [#192](https://github.com/Logorythmus-org/Semantiq/issues/192) | Check nested digest scope and usage | Deterministic regression + caller impact + security/Core review; severity and implementation scope not prejudged. |
| **NEXT — design only** | [#189](https://github.com/Logorythmus-org/Semantiq/issues/189) | Native correlation and missingness contract | Accepted ADR/RFC, fixture specification, backwards-compatibility decision. |
| **NEXT — offline checks** | [#191](https://github.com/Logorythmus-org/Semantiq/issues/191) | Distinguish operational and semantic outcomes | Versioned deterministic fixtures, CI results, governed evidence interpretation. |
| **FUTURE — explicitly gated** | [#190](https://github.com/Logorythmus-org/Semantiq/issues/190) | Opt-in OTel exporter/stack | Audit, contract, privacy and maintainer promotion plus collector proof. |
| **LATER — separate experiment** | No active issue commitment | Optional local comparison with third-party Codex observability project | Only after own architecture/tests reviewed; honor third-party licensing and preserve no-copy rule. |

## 6. Audit reproducibility and remaining work

### What was done
- Inspected the named source, tests, root Compose and public docs via read-only GitHub connector at a fixed commit.
- Verified issue-creation/roadmap relationships through GitHub issue metadata.
- Performed one **isolated JavaScript serialization reproduction**, not an in-repository test run.

### What remains unverified
- Whole-tree dependency/import discovery (code-search results are not proof of nonexistence).
- End-to-end local `Run → Trace → Evidence → exporter` test in a controlled environment.
- Actual invocation/coverage of the evidence-normalizer and runtime-specific secret handling.
- OpenTelemetry semantic-convention compatibility, external collector ingestion, Grafana panels and security posture.
- CI status for any PR opened from this report; always evaluate checks against its **exact head SHA**.

### Change boundary
This report makes **no code, test, canonical schema, scientific verdict, release/tag, deployment, credential, or external-project changes**. Its classifications should be revised in subsequent reviews rather than treated as final certification. Preserve historical evidence and do not auto-merge; CODEOWNER review is required.
