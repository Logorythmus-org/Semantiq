# Phase 4 qualification evidence report — protocol 0.1.1

PHASE 4 STATUS: BLOCKED — PROVIDER_REJECTION

qualificationOutcome = `NOT_QUALIFIED`

The fixed 3 × 24 = 72 schedule is complete. All 72 HTTP generation requests were rejected by the provider/API path and retained as SUBJECT_ERROR / PROVIDER_REJECTION. There are zero valid subject responses. This is an infrastructure blocker, not an accuracy result. BM3 is not proposed; PR #166 remains Draft and Issue #165 remains open.

## Historical and prospective identities

The [blocked 0.1.0 report](../../fixtures/semantic-core-qualification-0.1.0/evidence-report.md), [0.1.0 record](../../fixtures/semantic-core-qualification-0.1.0/qualification-record.json) and [operator preflight](../../fixtures/semantic-core-qualification-0.1.0/operator-preflight.json) remain unchanged. They established zero generations and the original 50-versus-72 capacity blocker. The amendment was committed before the first request as semantic_core_pilot_bm3_qualification@0.1.1.

Protected-main baseline: d43524fc49d886a01079c198695eadec1d4d1672; tree b2796414a0be4ed8355994d36b3780f378379761. Original rule/Phase 3 checks are retained in the historical report. Unrelated primary-checkout work was preserved.

- Frozen implementation commit: `7b185a1e3aea25d94474861681f1fed09ba6df93`.
- Frozen implementation tree: `5c1275a926a10ea404807ca6642c1d95d54ca45d`.
- Condition digest: `10d68b053a784ddfb86c1480405186c2697c0d456c340c9f508e915902378931`.
- Final normalized capture digest: `08a35900ce6cfb7372255d41229a828bc14fb5d16e42717663bb95926067223d`.
- Benchmark/pack: semantic_core_pilot@0.1.0; original pack SHA-256 b173eea32402050aba5989308fdb559b75c17956c2e2a9644ef65212a93a358a.
- Evaluator: semantic_core_rule_evaluator@0.1.0; configuration digest 56b765ec8e387f7941c78d0ba401b37d6c3b7d1bc406cf898056d527fe79d452.
- Prompt inventory digest: aa800442cecd6d28cc360a3f085f329a275aa5a7ff2d7bc8e3c803e5d5b7427b; serializer 0.1.0; case/response schemas 0.1.0.

The [frozen condition](../../fixtures/semantic-core-qualification-0.1.1/live/condition.json) records all 24 case digests, prompt digests, exact order, evaluator configuration, metric versions and 53 prespecified S05 definitions. Audit clocks and quota counters do not change condition identity. The fixed collection policy is MULTI_QUOTA_WINDOW_SAME_SUBJECT_CONDITION, with indivisible 24-case runs, at least 24 authenticated free requests before each run, no retries and a 168-hour maximum collection window. Sequential request starts are separated by at least 3.5 seconds.

## Actual provider and quota observations

Model alias: apodex/apodex-1.1-mini:free. Advertised canonical slug: apodex/apodex-1.1-mini-20261001. Provider: Novita. Endpoint: novita/bf16. Fresh authenticated preflight before every run and metadata checks before every attempt retained the same eligible route, zero monetary prices, strict JSON-schema support and unchanged request configuration. Temperature 0, max output 128 tokens, seed not requested, fresh messages per case, no oracle, no CoT, no alternate/paid/model fallback.

| Run | Capacity preflight (UTC) | Checkpoint completed (UTC) | Remaining before run | Terminals | Result |
| --- | --- | --- | --- | --- | --- |
| 1 | 2026-10-06T18:26:35.092Z | 2026-10-06T18:27:56.292Z | 50 | 24 | 24 PROVIDER_REJECTION |
| 2 | 2026-10-06T18:29:09.029Z | 2026-10-06T18:30:30.225Z | 50 | 24 | 24 PROVIDER_REJECTION |
| 3 | 2026-10-06T18:30:50.492Z | 2026-10-06T18:32:11.850Z | 50 | 24 | 24 PROVIDER_REJECTION |

The authenticated counter remained used=0, limit=50, remaining=50 before every run and after collection (2026-10-06T18:33:48.184Z). Therefore the >=24 gate permitted Run 3 without waiting for a reset. No quota reset or cross-window transition was observed; the protocol supports multiple windows but this failed collection completed within one observed window. No reset time was assumed and no quota/purchase workaround was used. No unrelated free generation was intentionally issued.

Every request uses the same frozen condition. All 72 request attempts are terminally accounted, without replacement. The adapter retained the bounded PROVIDER_REJECTION classification, not the HTTP error status/body, so the specific rejection cause is unresolved. No successful response contains usage/cost, returned model/provider or raw-response bytes/digests; these fields are unavailable, not fabricated. Advertised monetary prices and request price caps were zero; no paid inference or fallback was authorized/performed.

The provider remains EXTERNAL_NONDETERMINISTIC and the alias MUTABLE_ALIAS. The unchanged advertised slug does not cryptographically freeze remote weights. Audit timestamps document the actual run windows, and S05 explicitly varies TIME_WINDOW. No immutable scientific replication claim is made.

## Real evidence and empirical gates

The [collection summary](../../fixtures/semantic-core-qualification-0.1.1/collection-summary.json) records all error counts, timestamps, capacity observations, exclusions and verifier outcomes. All three immutable checkpoints and append-only 24-line journals are in [the capture](../../fixtures/semantic-core-qualification-0.1.1/live/qualification.json); the [original-byte inventory](../../fixtures/semantic-core-qualification-0.1.1/evidence-inventory.json) binds their durable bytes.

[S04](../../fixtures/semantic-core-qualification-0.1.1/s04-executions.json): 72 case executions are PARTIAL with no model decision output, preserving SUBJECT_ERROR; 15 metric executions retain MISSING / INSUFFICIENT_EVIDENCE. PASSED, INCORRECT, ABSTAINED, MALFORMED and MISSING response classifications each have zero observed counts; SUBJECT_ERROR is 72. No zero accuracy score is substituted for absent observations.

[S05](../../fixtures/semantic-core-qualification-0.1.1/s05-evidence.json): 24 categorical and 24 exact-repeatability studies each have 3 candidates, 0 eligible/used observations, 3 exclusions, 3 candidate pairs and 0 eligible/used pairs. That is 72 excluded observations and 72 unusable candidate pairs per method. Five numeric studies each have 3 candidates, 0 eligible/used observations and 3 exclusions (15 excluded metric observations total). Every study is INSUFFICIENT_EVIDENCE; no numeric stability/agreement estimate exists. Reliability is not validity.

[S09](../../fixtures/semantic-core-qualification-0.1.1/s09-evidence.json): three run packages and one qualification-level package all return VERIFIED_INTERNAL_CONSISTENCY, with zero ERROR findings. Packages are PARTIALLY_SELF_CONTAINED and verifier authority is INTERNAL_CONSISTENCY_ONLY. These outcomes verify the internally consistent failure evidence, not provider availability, successful generation, model accuracy or scientific validity.

[Sanitized replay](../../fixtures/semantic-core-qualification-0.1.1/regression-replay.json): the separate network-free CLI replay verifies the capture digest and re-evaluates all 72 failure observations exactly. This is deterministic engineering replay of retained errors, not external model reproduction.

[Post-live S10](../../fixtures/semantic-core-qualification-0.1.1/s10-assessment.json): recommendation INSUFFICIENT_EVIDENCE; CALIBRATION, VALIDITY, RELIABILITY, ROBUSTNESS, ANTI_GAMING and REPRODUCIBILITY remain among blocking gates. mutatesBenchmarkRegistry=false. Scientific maturity stays UNVALIDATED_PROXY and Core admission NOT_PROMOTED.

The [0.1.1 qualification record](../../fixtures/semantic-core-qualification-0.1.1/qualification-record.json) is schema-valid, accounts for all 72 attempts, references 53 studies/four verifier outcomes and source-matched repository regression, and records INFRASTRUCTURE_FAILURE. Its actual outcome is NOT_QUALIFIED; scientificAuthority=NONE, decisionAuthority=NONE and proposesBM3=false. Completing 72 scheduled attempts is necessary but does not make failed infrastructure qualified.

## Validation and current-head CI

The [source-bound validation report](../../fixtures/semantic-core-qualification-0.1.1/validation-report.json) records 239 Node files passed / 10 skipped, 1560 Node tests passed / 36 existing skips, 291 affected tests in nine files, 40 Python tests, wheel/sdist, current CI command checks and the corrected test lint binding. All existing assertions were retained. The optional web filter matched no project. The source validation report digest is 214b7c3f56d339b24aec1bf630689193088aae63734e90a1f9e2c3b22dead676.

All 12 checks on implementation head 7b185a1 completed successfully. That status is not transferred to the upcoming evidence commit: Gate 42 remains NOT ESTABLISHED for its head until inspected after push. The final handoff report will name the actual evidence head and its completed checks. PR #166 stays Draft because this record is not qualified; no merge or Issue #165 closure occurs.

## Post-collection resume correction

After the 72-request collection ended, a narrowly scoped correction moved the durable prospective condition write before the first-run low-capacity return. A first-run quota block can now resume the same directory with zero prior attempts, keeping its frozen condition bytes unchanged. The enhanced test retains all prior assertions and confirms that behavior. This correction sent no provider requests, changed no completed capture/checkpoint/journal, and did not reinterpret the evidence collected on 7b185a1.

## Exit gates

| # | Gate | Result | Scope / reason |
| --- | --- | --- | --- |
| 1 | Protected-main baseline | PASS | Historical SHA/tree/ruleset evidence retained |
| 2 | Phase 3 identity frozen | PASS | semantic_core_pilot@0.1.0 unchanged |
| 3 | Pack digest frozen | PASS | Expected admitted original-byte digest |
| 4 | All 24 case digests frozen | PASS | Exact manifest inventory in condition |
| 5 | Protocol versioned | PASS | New 0.1.1; historical 0.1.0 retained; exactly 3 × 24 |
| 6 | Provider-neutral interface | PASS | Bounded detached input/config/observations |
| 7 | Dry-run default | PASS | Actual network-free 0.1.1 CLI run |
| 8 | Explicit live authorization | PASS | --mode live and --authorize-live enforced |
| 9 | Zero-cost preflight | PASS | Authenticated route; zero advertised fees; response cost unavailable on rejections |
| 10 | No paid/model/provider fallback | PASS | One selected route; disabled fallback; zero price caps |
| 11 | Credential boundary | PASS | Only HTTP transport; no secret values retained |
| 12 | Genuine model path executed | NOT ESTABLISHED | Generation HTTP path attempted; every request rejected; no genuine model response observed |
| 13 | Exact subject condition | PASS | Selection/preflight and frozen request condition established; response-side identity unavailable |
| 14 | Exact prompt digest | PASS | Unchanged serializer, case order and all prompt digests |
| 15 | Three scheduled live runs | PASS | Three complete 24-terminal runs |
| 16 | 72 scheduled live attempts | PASS | 72 request attempts; zero replacement retries |
| 17 | All live attempts accounted | PASS | 72 unique IDs; 72 terminal errors; durable checkpoints |
| 18 | No oracle leakage | PASS | Only explicit input projection serialized |
| 19 | No hidden reasoning request | PASS | No CoT/tool/rationale request |
| 20 | No silent replacement retry | PASS | NONE; all rejections retained |
| 21 | Real S04 execution records | PASS | 72 PARTIAL case executions plus 15 metric executions; errors explicit |
| 22 | Exact real evaluator replay | PASS | 72/72 failure observations replay exactly; no successful response replay claimed |
| 23 | S05 studies prespecified | PASS | 24 categorical + 24 exact + 5 numeric definitions |
| 24 | Categorical/repeatability evidence sufficient | BLOCKED | All 48 studies INSUFFICIENT_EVIDENCE; zero eligible observations/pairs |
| 25 | Numeric stability sufficient | BLOCKED | All five studies INSUFFICIENT_EVIDENCE; all run metrics MISSING |
| 26 | Exclusion/missingness accounting | PASS | Every candidate/exclusion/pair retained; no fabricated zero scores |
| 27 | Real S09 packages | PASS | Three run packages and one qualification package |
| 28 | S09 integrity outcomes | PASS | Four VERIFIED_INTERNAL_CONSISTENCY outcomes; zero ERROR findings |
| 29 | Sanitized regression capture | PASS | Capture digest verified; network-free replay exact for all 72 |
| 30 | Exposure limitation | PASS | Public synthetic cases/oracles; contaminable; not held-out |
| 31 | No model-score gate | PASS | Infrastructure failure blocks; no accuracy threshold |
| 32 | Post-live S10 non-promotion proof | PASS | INSUFFICIENT_EVIDENCE recommendation; calibration/validity gates block |
| 33 | No scientific auto-promotion | PASS | UNVALIDATED_PROXY retained |
| 34 | Core promotion unchanged | PASS | NOT_PROMOTED; registry not mutated |
| 35 | No BM4 claim | PASS | No external reproduction |
| 36 | No BM5 claim | PASS | No leaderboard |
| 37 | Qualification record | PASS | Schema-valid 0.1.1 NOT_QUALIFIED record |
| 38 | Outcome justified | PASS | INFRASTRUCTURE_FAILURE and insufficient S05 evidence |
| 39 | Conditional BM3 proposal | PASS | No BM3 proposal; public BM2 retained; Draft |
| 40 | Focused tests | PASS | 291 affected tests in nine files; 39 Phase 4 tests |
| 41 | Full local regression | PASS | 1,560 Node passed / 36 existing skipped; 40 Python; wheel/sdist |
| 42 | PR CI | NOT ESTABLISHED | Evidence-head checks must complete after this snapshot is pushed; final handoff report records that SHA |
| 43 | Public Alpha boundary | PASS | 0.1.0-alpha.2 unchanged |
| 44 | No Cyber work | PASS | Scope preserved |
| 45 | No release/tag/version publication | PASS | No applied version or release |

Public lifecycle remains BM2. No BM4/BM5, leaderboard, Cyber, scientific validation, release/tag, applied version change or automatic promotion. Public Tier A synthetic cases/oracles are contaminable and not held-out; no clean-generalization claim is possible. The failure evidence remains immutable and cannot be replaced by retries or silently interpreted as a qualified model condition.
