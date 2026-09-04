# SemantIQ Upstream Engagement Priority Map v0.1

**Status:** Evidence-building plan; no outreach authorized or performed

**Source revision:** `d27ef4dd57030606cb63a8921accb02df956bfe3`

**Machine-readable map:** [`upstream-engagement-priorities.json`](upstream-engagement-priorities.json)

## 1. Purpose

This map asks where SemantIQ could eventually participate in external technical ecosystems and what
it must contribute before asking maintainers for attention. It converts the
[Integration Graph](INTEGRATION_GRAPH.md) and [Public Claim Status](PUBLIC_CLAIM_STATUS.md) into a
ranked evidence-building queue.

This is not a partnership map. This is not an outreach log. This is not evidence of adoption. This
is not evidence of endorsement. No upstream issue, pull request, discussion, announcement, package,
dataset, release, or invitation was created while producing v0.1.

## 2. Evidence boundary

A dependency is not automatically an integration; an integration is not automatically an ecosystem
relationship; and an ecosystem relationship is not automatically an upstream contribution
opportunity. A candidate advances only when repository evidence supports a bounded, externally useful
artifact whose value does not depend on promoting SemantIQ.

Internal CI, owner-controlled clean-room runs, simulations, documentation, and configuration remain
internal evidence. They are not external replication, adoption, certification, official
compatibility, production use, partnership, or endorsement. npm and PyPI packages remain unpublished.

## 3. Give-first principle

The permitted order is:

> USE → DOCUMENT → VERIFY → REPORT → CONTRIBUTE → DISCUSS → INVITE

A valid future interaction starts with a minimal failing fixture, conformance vector, reproducible
bug, documentation correction, compatibility result, or deterministic test vector. Introducing the
project, requesting a link or star, asking maintainers to test it, or proposing a partnership is not
a contribution.

## 4. Readiness model

| Status | Gate |
|---|---|
| `READY_FOR_TECHNICAL_ENGAGEMENT` | Real relationship, reproducible evidence, upstream relevance, concrete give-first value, bounded burden, and safe claims |
| `NEAR_READY_ONE_EVIDENCE_GAP` | One specific reproducible evidence action separates the candidate from a technical interaction |
| `LATER_NEEDS_MORE_EVIDENCE` | Multiple evidence or consumer gaps remain |
| `INTERNAL_EVIDENCE_FIRST` | Implementation/runtime/conformance is too weak for contact |
| `DEPENDENCY_ONLY_NO_OUTREACH` | Ordinary use provides no engagement rationale |
| `NOT_CURRENTLY_APPROPRIATE` | No operational relationship or the action belongs to publication, settings, or another governance boundary |

Distribution across 30 evaluated candidates: 0 ready, 3 near-ready, 8 later, 7 internal-first,
4 dependency-only, and 8 not currently appropriate.

## 5. Scoring model

Each candidate receives integer 0–5 scores for strategic relevance (`SR`), implementation depth
(`ID`), evidence quality (`EQ`), external-user relevance (`EU`), community relevance (`CR`),
contribution opportunity (`CO`), naturalness (`NE`), give-first value (`GV`), maintainer-burden
suitability (`MB`), and claim safety (`CS`). Promotional risk (`PR`) and evidence-gap severity (`EG`)
are penalties:

`score = SR + ID + EQ + EU + CR + CO + NE + GV + MB + CS - 1.5×PR - 1.5×EG`

The score orders review; it never overrides a failed readiness gate. Qualitative overrides are
recorded in the machine-readable map. In particular, broad runtimes and protocols are not treated as
organizations, famous providers receive no market-importance bonus, and no candidate is promoted
merely to populate an engagement queue.

## 6. Ranked candidate table

The Top 10 are strategic relationships, not organizations to contact now.

| Rank | Target | Candidate type | Readiness | Score | Why it matters | Give-first artifact | Missing evidence | Earliest justified interaction |
|---:|---|---|---|---:|---|---|---|---|
| 1 | JSON Schema Draft 2020-12 | `FORMAT_CONFORMANCE` | `NEAR_READY_ONE_EVIDENCE_GAP` | 43.5 | Cross-language contracts expose a distinctive, standards-oriented surface | Portable pass/fail vectors | Externally relevant minimized finding or demonstrated upstream need | After a validator-relevant discrepancy is reproduced |
| 2 | Canonical JSON / SHA-256 | `FORMAT_CONFORMANCE` | `NEAR_READY_ONE_EVIDENCE_GAP` | 42.5 | Byte-exact evidence verification is central to reproducibility | Versioned canonical bytes, digests, and out-of-domain cases | Externally relevant consumer need and a natural upstream surface | Only after an external need makes technical engagement useful beyond SemantIQ |
| 3 | CFF / CodeMeta / DataCite | `FORMAT_CONFORMANCE` | `NEAR_READY_ONE_EVIDENCE_GAP` | 37.5 | Research metadata has official local validators and low promotional risk | Minimal validator/conversion discrepancy | Pinned official-tool results | Only if official tools reveal a reproducible issue |
| 4 | ResearchBundle | `EXTERNAL_CONSUMER_VALIDATION` | `LATER_NEEDS_MORE_EVIDENCE` | 35.5 | Evidence exchange exposes SemantIQ's core differentiator | Neutral bundle and standalone verifier | Genuine third-party consumption | After a consumer reports a concrete interoperability issue |
| 5 | HTTP / REST | `INTEROPERABILITY_VALIDATION` | `LATER_NEEDS_MORE_EVIDENCE` | 35 | Main external execution surface | Language-neutral request/response fixtures | Stable contract and external-client run | Only with an implementation-specific discrepancy |
| 6 | Docker Engine / Moby / OCI | `INTEROPERABILITY_VALIDATION` | `LATER_NEEDS_MORE_EVIDENCE` | 35 | Real Engine API code exists but daemon evidence is incomplete | Minimal lifecycle reproducer | Live create/execute/terminate/cleanup gate | After a daemon-side issue is isolated |
| 7 | Deterministic replay | `EXTERNAL_CONSUMER_VALIDATION` | `LATER_NEEDS_MORE_EVIDENCE` | 34.5 | Reproducible execution is strategically distinctive | Neutral replay traces and receipts | Independent consumer | After standalone fixtures exist |
| 8 | PostgreSQL | `INTEROPERABILITY_VALIDATION` | `LATER_NEEDS_MORE_EVIDENCE` | 33 | Deep persistence relationship with optional real-service tests | Minimal SQL/schema regression | Reliable live-service CI and PostgreSQL-specific finding | After a database-specific issue is isolated |
| 9 | Python and TypeScript SDK consumers | `EXTERNAL_CONSUMER_VALIDATION` | `LATER_NEEDS_MORE_EVIDENCE` | 33 | Cross-language parity matters to users | Disposable consumer projects and parity fixtures | Clean independent consumer; packages remain unpublished | After a language-tooling defect is isolated |
| 10 | External Benchmark Pack | `INTEROPERABILITY_VALIDATION` | `LATER_NEEDS_MORE_EVIDENCE` | 30 | Benchmark exchange is relevant but current mapping is generic | Authentic, license-safe format fixture and field-loss report | Format semantics, schema, rights and provenance checks | After one authentic format is implemented and validated |

## 7. Top strategic relationships

### JSON Schema and deterministic evidence vectors

These are the most natural evidence-first surfaces because they are language-neutral, reproducible,
small enough for bounded review, and closely tied to SemantIQ's cross-language evidence contracts.
The JSON Schema vectors now pass three pinned validators across Node.js and Python. Neither surface
is ready for external contact: JSON Schema still lacks an externally relevant discrepancy or
demonstrated upstream need, while deterministic evidence packaging still lacks an independent
cross-language verifier.

### ResearchBundle, replay, and SDK consumers

These are better served by external-consumer validation than by contacting an upstream project.
SemantIQ should give a neutral fixture plus a verifier, then wait for genuine use. Internal execution
does not satisfy this gate.

### PostgreSQL and Docker

Both are real implementation relationships. Neither justifies upstream contact merely because it is
used. PostgreSQL needs reliable live-service CI; Docker needs a live daemon lifecycle and cleanup
test. Only a minimized upstream-specific finding would justify a report.

### Providers, MCP, and export formats

MCP remains `CONTRACT_ONLY`; OpenAI, Anthropic, Google GenAI, and Ollama remain docs/configuration
surfaces; E2B remains simulated. Hugging Face and Kaggle are local exporters, not publications.
These candidates stay internal-first or inappropriate.

## 8. Evidence Debt Queue

| Rank | Target | Evidence-building action |
|---:|---|---|
| 1 | JSON Schema | Review future validator disagreements for a minimized, upstream-relevant finding; the internal multi-validator vectors now pass |
| 2 | Canonical JSON / SHA-256 | Publish repository-local language-neutral byte/digest vectors |
| 3 | PostgreSQL | Make real-service tests a reliable dedicated or required CI gate |
| 4 | Docker Engine | Run create/execute/terminate/failure-cleanup against a live daemon |
| 5 | CFF / CodeMeta / DataCite | Run pinned official validators and deterministic conversions |
| 6 | ResearchBundle | Add a neutral standalone consumer fixture and verifier |
| 7 | MCP | Exercise a pinned reference server over one real transport |
| 8 | External Benchmark Pack | Add one authentic, license-safe format fixture and field-loss report |
| 9 | OpenSandbox | Resolve canonical upstream identity, then run live-daemon conformance |
| 10 | Independent replication | Wait for and rigorously classify genuine independent evidence |

The first evidence-building action, **JSON Schema Draft 2020-12 conformance vectors**, is now
complete as internal evidence. All three validators agree, so no upstream issue or contribution is
justified. The candidate remains near-ready only for a future externally relevant discrepancy or a
clearly demonstrated upstream need; additional green owner-controlled runs do not close that gap.

## 9. Give-First Contribution Queue

| Rank | Target | Artifact SemantIQ can give | Remaining gate | Do not claim |
|---:|---|---|---|---|
| 1 | JSON Schema test/validator ecosystem | Minimal pass/fail vector and validator matrix | Reproduce a validator-relevant discrepancy | Official compatibility or certification |
| 2 | Canonical JSON consumers | Byte/digest vectors and negative cases | Independent implementation check | New standard or external validation |
| 3 | Citation File Format tooling | Minimal metadata validator/conversion fixture | Run pinned official tooling | DOI registration or endorsement |
| 4 | Moby | Engine API lifecycle reproducer with version metadata | Isolate daemon-side behavior | Docker endorsement or OCI certification |
| 5 | PostgreSQL | Minimal SQL/schema reproducer | Isolate PostgreSQL-specific behavior | Official compatibility or production use |

## 10. Do Not Contact Yet

| Target | Blocking reason |
|---|---|
| OpenAI / Anthropic / Google GenAI | `DOCS_ONLY`; no connector, network test, or give-first artifact |
| Ollama | Diagnostics/configuration only; no request/response execution |
| Podman | No Podman-specific lifecycle evidence |
| E2B | Current behavior is simulated |
| OpenSandbox | Canonical upstream identity and live-daemon conformance are unresolved |
| Redis / Neo4j / MinIO | Scaffold only; no operational consumer or adapter |
| OpenTelemetry / Prometheus / Grafana / MailHog | Configuration/topology only; no producing or consuming workflow |
| npm / PyPI | Packages are unpublished; publication is not upstream engagement |
| Zenodo | No authorized release, deposition, or DOI |
| GitHub Pages | No deployment workflow or live site; settings require separate authorization |

Node.js, `node-postgres`, GitHub Actions, pnpm, Vitest, ESLint, Prettier, Turbo, Husky,
Commitlint, and Changesets are `DEPENDENCY_ONLY_NO_OUTREACH`: only a minimized upstream defect could
change that status.

## 11. External research consulted

Read-only research was limited to official project surfaces; no interaction occurred.

| Target | Canonical source | Purpose and readiness effect |
|---|---|---|
| JSON Schema | [JSON Schema Test Suite](https://github.com/json-schema-org/JSON-Schema-Test-Suite) | Confirms a language-agnostic fixture and sanity-check surface; contribute only after reproducing a relevant discrepancy |
| Moby | [Testing guide](https://github.com/moby/moby/blob/master/TESTING.md) | Confirms API integration tests should exercise HTTP requests and daemon state; strengthens the live-daemon prerequisite |
| PostgreSQL | [Regression tests](https://www.postgresql.org/docs/current/regress.html) | Confirms an established regression-test model and environment-sensitive evaluation; provides no reason for contact before a database-specific finding |
| Citation File Format | [`cffconvert`](https://github.com/citation-file-format/cffconvert) | Provides an official local validation/conversion mechanism; enables an internal conformance action, not automatic outreach |

## 12. Human decision points

1. Review the JSON Schema conformance evidence and preserve the no-outreach boundary unless a
   minimized, externally relevant discrepancy is later reproduced.
2. Decide later whether live PostgreSQL should become required main CI or a separately required gate;
   this map does not change CI.
3. Keep namespace, package publication, release, Pages, and external-service credentials behind their
   existing human authorization boundaries.

## 13. Next-stage gate

**NO EXTERNAL ENGAGEMENT IS JUSTIFIED YET.** No candidate satisfies all seven readiness gates.

The next stage should be **PROMPT 14 — FIRST EVIDENCE-BUILDING ACTION**, limited to pinned JSON
Schema Draft 2020-12 cross-language conformance vectors and independent-validator comparison. A
future technical engagement is allowed only if that work yields a minimal, externally relevant,
reproducible discrepancy or a clearly useful neutral fixture accepted by human review.

## 14. Machine-readable reference

[`upstream-engagement-priorities.json`](upstream-engagement-priorities.json) is canonical for all 30
candidates, individual scores, qualitative overrides, evidence paths, missing evidence, allowed next
actions, forbidden claims, queues, no-contact decisions, and external-source records.
