# Semantic Core Phase 4 controlled qualification

Status: implementation under review. No live evidence or public BM3 transition is established by this document.
SemantIQ remains `0.1.0-alpha.2`, Public Alpha (Experimental).
The [Phase 4 evidence report](SEMANTIC_CORE_PHASE4_EVIDENCE_REPORT.md) records the current insufficient-evidence result and all 45 exit gates.

The qualification target is `semantic_core_pilot@0.1.0`: the governed pack, genuine subject execution,
structured response, deterministic evaluator, five canonical metrics, S05 reliability, S09 verification,
and sanitized engineering replay. Model accuracy is descriptive and has no acceptance threshold.
The [Phase 3 plan](SEMANTIC_CORE_PILOT_QUALIFICATION_PLAN.md) remains historical; this prospective
protocol fixes exactly three scheduled runs of 24 independent requests rather than its minimum of two.

## Protocol and freeze

`semantic_core_pilot_bm3_qualification@0.1.1` fixes 72 scheduled attempts, manifest case order,
fresh context per case, no replacement retry, serializer `0.1.0`, and JSON.parse-only response handling.
There is no prose cleanup, answer inference, repair model, tool invocation, or reasoning request.
Max output is 128 tokens to accommodate the case identity and JSON envelope; temperature is zero.
The selected subject uses no requested seed; this seed policy remains fixed across all runs. Subject execution remains
`EXTERNAL_NONDETERMINISTIC`; neither zero temperature nor a requested seed guarantees determinism.

The frozen condition binds implementation source commit/tree, benchmark and pack versions,
pack digest `b173eea32402050aba5989308fdb559b75c17956c2e2a9644ef65212a93a358a`, all 24 original-byte
case digests, schemas, evaluator configuration, all five metrics, operator-selected model and exact route,
sampling settings, prompt digests, current bounded provider metadata, and 53 prespecified study definitions.
Before every generation, pack admission/bytes and provider metadata are checked again. Material substitution
halts generation; remaining scheduled attempts retain explicit terminal error records. Audit time is excluded
from condition and capture semantic identity.

## Operator CLI

`pnpm semantic-core:qualification` defaults to a network-free dry run. It validates the pack, schemas,
24-case inventory, oracle projection, evaluator configuration, and prespecified S05 studies.
Dry output is not empirical model evidence and yields `INSUFFICIENT_EVIDENCE`.

The operator selected apodex/apodex-1.1-mini:free, canonical apodex/apodex-1.1-mini-20261001, Novita / novita/bf16.
Protocol 0.1.1 adds MULTI_QUOTA_WINDOW_SAME_SUBJECT_CONDITION prospectively, preserving the blocked 0.1.0 record.
Only this selection is accepted by the live CLI. Run 1 creates the canonical directory; runs 2 and 3 resume it:

```text
pnpm semantic-core:qualification -- --mode live --authorize-live --run 1 --validation <validation-reference-json>
pnpm semantic-core:qualification -- --mode live --authorize-live --run 2 --resume fixtures/semantic-core-qualification-0.1.1/live --validation <validation-reference-json>
pnpm semantic-core:qualification -- --mode live --authorize-live --run 3 --resume fixtures/semantic-core-qualification-0.1.1/live --validation <validation-reference-json>
```

Authenticated capacity must be at least 24 before each run. Insufficient capacity creates no scheduled run and returns AWAITING_NEXT_QUOTA_WINDOW with INSUFFICIENT_EVIDENCE.
Each completed checkpoint contains exactly 24 terminals, provider preflight digest, observed quota, results/metrics, capture digest and original implementation source.
Completed files use exclusive creation; journals are appended and synced after each terminal. Previous checkpoints/journals remain byte-for-byte unchanged.
Resume verifies contiguous complete runs, all digests, pack/prompt/evaluator identities and actual re-evaluation. Interrupted or corrupt journals fail closed without replacement requests.
The fixed condition excludes audit timestamps and quota counters. A bounded 168-hour collection window and 3.5-second minimum request-start interval are prespecified.
No reset timestamp is guessed. Other account users should avoid the quota pool during active runs; unexpected quota exhaustion remains terminal infrastructure evidence.
Source must be clean. Later evidence commits can retain the original source only if all implementation/dependency/pack/test paths are unchanged from its frozen commit.
Only after run 3 are final S05/S09/replay/S10 evidence and the qualification record computed. There is no BM3 decision at 24 or 48 attempts.
Credentials remain transport-only. Exact matching metadata is provenance for a mutable external subject, not a frozen underlying scientific snapshot.

The validation reference contains `sourceCommit`, `reportDigest`, and `status: PASSED`. It must reference
the actual full repository regression report for the same implementation commit. This is trusted operator
evidence, not a signature or automatic verification that commands ran. Without it the qualification remains
insufficient. Review must inspect the referenced report and GitHub checks.

The OpenRouter adapter checks current model and exact endpoint prices: prompt and completion prices must
be present, and every advertised monetary pricing component (discount percentages are not fees) must be zero. Unknown prices fail closed. The request
pins one exact route, forbids fallback, requires parameter support, and caps prompt/completion/request/image/audio
prices at zero. Returned model/provider and usage cost must match. Model aliases are recorded as `MUTABLE_ALIAS`;
an advertised dated slug is provenance and never an invented immutable version.
This follows OpenRouter's [provider-routing contract](https://openrouter.ai/docs/guides/routing/provider-selection)
and [structured-output contract](https://openrouter.ai/docs/guides/features/structured-outputs).

## Canonical observations and reliability

The provider-neutral subject interface receives an explicit projection containing no oracle or evaluator result.
The OpenRouter adapter retains only a validated response, safe generation identifier, model/provider, bounded
usage, terminal class, and digest of the bounded original HTTP body. HTTP headers, raw bodies, and arbitrary
provider exception messages are never retained. Invalid JSON or invalid offered-option/case identity is malformed;
an abstention, missing response, or transport failure remains a distinct observation.

S04 records use the existing deterministic rule evaluator, exact configuration, structured-response subject kind,
case/prompt references, construct binding, and categorical response including selected option identity.
Unavailable, malformed, and provider-failed decisions remain PARTIAL without output and carry the explicit
local terminal evaluation state. This excludes absent model decisions from S05 without mislabeling the local
evaluator as failed or silently assigning an incorrect answer. Five S03 metric executions are recorded per run.

S05 prespecifies 24 categorical agreement studies, 24 exact-repeatability studies, and five numeric stability
studies. Per-case studies retain three candidate observations and three candidate pairs, exclusions and reasons,
used observations/pairs, and disagreements. Numeric studies retain n, arithmetic mean, sample SD, minimum,
maximum and range. No GOOD/BAD thresholds or coefficient of variation are added.
Captured-input evaluator replay must be exactly equal. Required studies with insufficient comparable observations
leave qualification insufficient; there is no model-score gate.

## Evidence and replay

Three run packages and one qualification package use canonical S09 manifests, environment records,
artifact digests and evidence chains. Bounded payloads accompany artifact references. The packages are
`PARTIALLY_SELF_CONTAINED`: original HTTP bytes and immutable provider state are unavailable, and the
full OS/provider environment is not captured. Verifier outcomes are retained verbatim; authority is
`INTERNAL_CONSISTENCY_ONLY`. External model replay remains blocked even when local evaluator replay succeeds.

```text
pnpm semantic-core:qualification -- --replay <qualification-json>
```

Replay first validates the capture digest, condition identity and current admitted pack. It then re-evaluates
all 72 retained observations and compares exact case classifications and metrics. Mutation of an answer,
pack, prompt, evaluator or condition is detected. This is engineering replay, not independent reproduction.

## Qualification and governance

The [0.1.1 record schema](../../schemas/semantic-core-qualification-record-0.1.1.schema.json) bounds outcomes to
`QUALIFIED_FOR_BM3_REVIEW`, `NOT_QUALIFIED`, and `INSUFFICIENT_EVIDENCE`. Critical identity/cost/replay/integrity
findings prevent qualification. Genuine live provenance, all 72 terminal records, successful required S05 estimates,
valid S04 records, S09 integrity, exact regression replay, and same-source repository regression are required.
The automated record always has scientific and decision authority `NONE` and never changes public or internal state.
Only a qualified record permits a separate reviewed PR proposal for BM3; human/code-owner review and merge govern acceptance.

A bounded canonical S10 `VALIDATED` assessment preserves absent calibration, validity, robustness, anti-gaming,
independent reproduction and governance evidence. It cannot promote the registry. Internal scientific maturity
remains `UNVALIDATED_PROXY`, Core promotion remains `NOT_PROMOTED`, and public BM3 is independent of internal M states.

All cases and oracles are Tier A public reference material. Contamination cannot be ruled out; the evaluation
is not held-out; high observed scores in this public synthetic pilot cannot establish clean generalization.
BM3 concerns internal execution/reliability/integrity only. There is no BM4/BM5, leaderboard, Cyber work,
NVIDIA NIM comparison, scientific validation, release, tag or product-version publication in this phase.
