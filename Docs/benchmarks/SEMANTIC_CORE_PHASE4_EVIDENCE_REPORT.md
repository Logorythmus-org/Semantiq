# Phase 4 qualification evidence report

Phase status: `BLOCKED` — operator model selection remains pending.
Qualification outcome: `INSUFFICIENT_EVIDENCE`.
Public state remains BM2. This report contains implementation and dry-run evidence only.

## Baseline and review scope

Protected-main baseline: `d43524fc49d886a01079c198695eadec1d4d1672`;
tree: `b2796414a0be4ed8355994d36b3780f378379761`. No baseline drift was observed at preflight.
PR #164 was merged, Issue #163 closed, Issue #165 open, and protected-main CI green.
The active default-branch ruleset requires approving/code-owner review and resolved threads, prevents
deletion/non-fast-forward updates, and offers no bypass. Nine unique required check contexts were inspected.
The isolated branch is `codex/semantic-core-bm3-qualification`; unrelated primary-checkout work was preserved.

Frozen implementation: `f1303d0b5dfebc55197724110573f4b697ca9e26`;
tree: `4ea51cb239b9fece6186d9529a9a1e8311034504`.
Later report/artifact commits do not reinterpret this source revision. A future live run must freeze its actual
clean implementation revision and freshly selected provider condition.

## Frozen nonempirical identities

The complete [dry preflight](../../fixtures/semantic-core-qualification-0.1.0/preflight.json) retains
all 24 ORIGINAL_BYTES case digests, the exact manifest order, all prompt digests and 53 prespecified study
definitions/digests. It explicitly records DRY_RUN and no empirical evidence.

| Identity | Value |
| --- | --- |
| Benchmark / pack | `semantic_core_pilot@0.1.0` |
| Pack SHA-256 | `b173eea32402050aba5989308fdb559b75c17956c2e2a9644ef65212a93a358a` |
| Evaluator | `semantic_core_rule_evaluator@0.1.0` |
| Evaluator configuration | `56b765ec8e387f7941c78d0ba401b37d6c3b7d1bc406cf898056d527fe79d452` |
| Case / response / protocol version | `0.1.0` / `0.1.0` / `0.1.0` |
| Prompt inventory digest | `aa800442cecd6d28cc360a3f085f329a275aa5a7ff2d7bc8e3c803e5d5b7427b` |
| Dry condition digest | `91cc8986426f5f45131bf759bd3dac70725cebe3e67e7d1f98ed18cd4615385d` |
| Qualification record digest | `5f4e699c63f6eac7f050eee5f61d6b20cbe67a891d10dfee3444357815314074` |
| Local validation report digest | `109e860b4d3ea154237ab85fad888edd862922a63852997cbac155ac0da239df` |

The five exact metric identities at version `0.1.0` are `semantic_core_eligible_cases`,
`semantic_core_passed_cases`, `semantic_core_meaning_context_pass_proportion`,
`semantic_core_epistemic_boundary_pass_proportion`, and `semantic_core_bias_resistance_pass_proportion`.
The [canonical qualification record](../../fixtures/semantic-core-qualification-0.1.0/qualification-record.json)
has scientific authority NONE, decision authority NONE, and proposesBM3 false.

## Provider discovery and cost boundary

Read-only current metadata discovery on 2026-10-06 identified these zero-price candidate routes:

| Model alias | Provider / endpoint tag | Advertised canonical slug |
| --- | --- | --- |
| `liquid/lfm-2.5-2.6b:free` | Liquid / `liquid/fp8` | `liquid/lfm-2.5-2.6b-20260811` |
| `apodex/apodex-1.1-mini:free` | Novita / `novita/bf16` | `apodex/apodex-1.1-mini-20261001` |
| `dots-studio/dots-3-note-preview:free` | AtlasCloud / `atlas-cloud/fp8` | `dots-studio/dots-3-note-preview-20260813` |

These are discovery facts, not an execution condition. Prompt/completion prices were reported as zero,
and each inspected candidate had one listed endpoint. No model was selected. No immutable snapshot is claimed.
A Boolean credential-presence check succeeded; the value was never printed or put into evidence.
The operator selection question remains unanswered. Discovery cannot substitute for the mandatory fresh
free-only preflight immediately before generation.

Generation requests sent: **0**. Paid provider requests sent: **0**. No fallback or replacement retry occurred.
The implemented route allow-list, disabled fallback, zero price caps, returned provenance/cost checks and
fail-closed metadata handling are exercised by tests. Actual live cost evidence remains not established.

## Execution, scores, reliability and packages

Planned matrix: 3 runs × 24 cases = 72 scheduled attempts. Started live runs: 0. Accounted live attempts: 0.
No PASSED, INCORRECT, MALFORMED, ABSTAINED, MISSING or provider-error counts are reported as observed zeros;
these states are **not observed** because collection has not begun. There are no live model scores.

Evaluator replay on captured real responses: NOT ESTABLISHED. Synthetic tests demonstrate the deterministic
replay invariant and detect response/identity/artifact mutation; they are excluded from empirical qualification.

Prespecified S05 studies: 24 categorical agreement, 24 exact repeatability, five numeric run-to-run stability.
Real estimates, n/mean/sample SD/min/max/range, candidate/eligible/used observations/pairs and exclusions:
NOT ESTABLISHED. Nothing is imputed from the synthetic test adapters.

Real S09 packages and verifier outcomes: none. Real regression replay capture: none.
Synthetic test packages validate S09 lineage, artifact mutation rejection and no secret-bearing fields;
their verifier outputs are engineering test evidence only. A future live package remains partially self-contained,
with original HTTP bytes unavailable and external subject replay blocked by mutable provider state.

## Scientific and governance boundary

The pack is Tier A public reference material with public oracles. Contamination cannot be ruled out;
the evaluation is not held-out. Even a high future observed model score in this public synthetic pilot
would not establish clean generalization or general semantic intelligence.

The bounded S10 VALIDATED assessment is implemented and tested: calibration and validity gates remain blocking,
and robustness, anti-gaming, independent reproduction, external validation and governance evidence are not fabricated.
No post-live S10 assessment exists yet. Registry state remains EXECUTABLE / UNVALIDATED_PROXY / NOT_PROMOTED.
BM3 is independent of internal M-levels and requires human/code-owner review and merge of a justified public proposal.
No BM3 proposal is included. No BM4/BM5, leaderboard, Cyber, NIM comparison, tag, release or product-version change occurred.

## Validation

The [local validation record](../../fixtures/semantic-core-qualification-0.1.0/validation-report.json) lists
the full current CI command contract and intermediate failures. Final local results:

- Node: 238 files passed, 10 skipped; 1,538 tests passed, 36 skipped. Existing Postgres-dependent skips remain explicit.
- Focused Phase 3/4 + pack + S04/S05/S09/S10/S11: eight files, 284 tests passed; the separate metric/registry battery passed 48 tests.
- Python 3.11.9: 40 tests passed; editable isolated install, wheel and sdist passed. Python 3.10/3.12 are delegated to GitHub CI.
- Frozen install, staged/committed Changeset graph, format, lint, typecheck, boundaries, both conformance suites,
  docs build/validation, version/IP audits, build, SDK/security suites, doctor/preflight/connector/smoke,
  explicit reference/product/shared/doc/security/credential tests, and diff checks passed.
- The optional current CI web filter matched no project; no optional web build success is invented.
- ESLint has warnings and zero errors. Sandbox EPERM/DNS failures, the conflicting global Python installation,
  initial S09 lineage errors, a strict-schema error and one default test timeout were retained in the validation record;
  corrected/isolated reruns passed without dropping assertions.

GitHub CI is reported separately by the PR checks. This record does not self-attest those remote results.

## Exit gates

PASS below distinguishes implemented/tested controls from real-subject evidence. NOT ESTABLISHED means
the requested empirical or remote evidence has not yet been collected; it is not an invented negative model result.

| # | Gate | Result | Scope / reason |
| --- | --- | --- | --- |
| 1 | Protected-main baseline | PASS | SHA, tree, issue/merge and ruleset inspected |
| 2 | Phase 3 identity frozen | PASS | Exact 0.1.0 identities |
| 3 | Pack digest frozen | PASS | Admitted expected digest |
| 4 | All 24 case digests frozen | PASS | ORIGINAL_BYTES inventory in preflight |
| 5 | Protocol versioned | PASS | 0.1.0, 3 × 24, no retry |
| 6 | Provider-neutral interface | PASS | Bounded input/config/context/observation |
| 7 | Dry-run default | PASS | Actual network-free CLI run |
| 8 | Explicit live authorization | PASS | Both flags enforced and tested |
| 9 | Zero-cost preflight | PASS | Current-price checks implemented/tested |
| 10 | No paid fallback | PASS | Single-route allow-list and zero caps |
| 11 | Credential boundary | PASS | Transport-only access; no value retained |
| 12 | Genuine model path executed | NOT ESTABLISHED | No operator model selected |
| 13 | Exact subject condition | NOT ESTABLISHED | Dry condition has null subject |
| 14 | Exact prompt digest | PASS | Per-case and inventory digests frozen |
| 15 | Three scheduled live runs | NOT ESTABLISHED | Three planned, zero started |
| 16 | 72 scheduled live attempts | NOT ESTABLISHED | 72 planned, zero sent |
| 17 | All live attempts accounted | NOT ESTABLISHED | Collection not begun |
| 18 | No oracle leakage | PASS | Explicit projection tested; no live transmission |
| 19 | No hidden reasoning request | PASS | Observable JSON only; no tools/rationale |
| 20 | No silent replacement retry | PASS | Retry NONE; failures retained in tests |
| 21 | Real S04 execution records | NOT ESTABLISHED | Adapter/records tested synthetically |
| 22 | Exact real evaluator replay | NOT ESTABLISHED | No captured model responses |
| 23 | S05 studies prespecified | PASS | 53 validated definitions/digests |
| 24 | Real categorical evidence | NOT ESTABLISHED | No live estimates |
| 25 | Real numeric stability | NOT ESTABLISHED | No live estimates |
| 26 | Real exclusion/missingness accounting | NOT ESTABLISHED | No live observation matrix |
| 27 | Real S09 packages | NOT ESTABLISHED | None generated |
| 28 | Real S09 integrity outcomes | NOT ESTABLISHED | No verifier outcome invented |
| 29 | Real sanitized regression capture | NOT ESTABLISHED | None available |
| 30 | Exposure limitation | PASS | Public, contaminable, not held-out |
| 31 | No model-score gate | PASS | Engineering integrity only |
| 32 | Post-live S10 non-promotion proof | NOT ESTABLISHED | Implemented/tested, no live assessment |
| 33 | No scientific auto-promotion | PASS | UNVALIDATED_PROXY unchanged |
| 34 | Core promotion unchanged | PASS | NOT_PROMOTED |
| 35 | No BM4 claim | PASS | External reproduction absent |
| 36 | No BM5 claim | PASS | No leaderboard authorization |
| 37 | Qualification record | PASS | Versioned, schema-valid insufficient record |
| 38 | Outcome justified | PASS | Missing empirical evidence stated explicitly |
| 39 | Conditional BM3 proposal | PASS | No proposal; public BM2 retained |
| 40 | Focused tests | PASS | 284 affected + 48 metric/registry tests |
| 41 | Full local regression | PASS | 1,538 Node and 40 Python tests |
| 42 | PR CI | NOT ESTABLISHED | Consult current GitHub checks |
| 43 | Public Alpha boundary | PASS | 0.1.0-alpha.2 unchanged |
| 44 | No Cyber work | PASS | Scope preserved |
| 45 | No release/tag/version publication | PASS | Changeset declaration only; no version applied |

Phase 4 remains BLOCKED until operator selection enables genuine collection and its evidence is reviewed.
This infrastructure PR does not close Issue #165 and is not a completed empirical qualification.
