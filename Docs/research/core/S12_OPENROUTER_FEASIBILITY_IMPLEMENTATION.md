# S12 OpenRouter feasibility implementation

## Scope

### Boundary D-C1 execution contract decision

The historical `S12_SUBJECT.maxAttempts = 10` and
`retryPolicy.maximumAttempts = 10` were used as a model-generation ceiling in
the pre-Boundary-D qualification runner. They did not represent ten subject
attempts or ten automatic retries. Their historical configuration digest and
observations #1–#3 remain unchanged; no historical evidence is upgraded.

Prospective execution uses `EXPLICIT_EXECUTION_LIMITS@0.1.0`. It declares one
independently addressable subject attempt, either 10 or 20 model turns, a
30-minute attempt ceiling, free-only routing, and zero automatic subject
retries. The explicit `maxModelTurns` alone controls the prospective generation
loop. The legacy fields remain compatibility metadata and cannot override it.
An explicit contract with missing or mismatched fields fails closed. Its
configuration digest binds the execution contract and relevant frozen subject,
tool, and request configuration while excluding the two legacy turn-ceiling
fields. The 10- and 20-turn strata are resource conditions,
not scientific sample sizes or repetitions.

A model turn is counted at actual model-generation invocation. Preflight uses
zero turns. A tool call is an operation requested inside an attempt and uses
no additional model turn. A retry would be a separate re-execution mechanism;
this path has none. The current canonical runner creates one attempt and stops
at the selected ceiling or at an earlier valid terminal completion.

The attempt clock starts monotonically when the subject attempt is created,
after the initial metadata preflight succeeds. Initial preflight is outside the
attempt; fresh per-turn preflight is inside it. The 30-minute limit is cumulative
across generation, tool execution, and inter-turn work. Before generation and
tool execution, the runner checks the remaining budget. In-attempt metadata
requests (`listModels` and `listEndpoints`) receive an abort signal bounded by
the remaining budget; the budget is recomputed between those requests and
before generation. Generation timeout and command timeout are likewise clamped
to the remaining budget, while stricter command limits remain in force. After
a successful tool operation, its result is captured and the deadline is checked
before continuation or turn-limit classification. If the cumulative deadline
is exhausted, the attempt ends as `RESOURCE_LIMIT` with
`MAX_ATTEMPT_WALL_TIME`; an operation timeout before the attempt deadline
remains `TIMEOUT`. No subsequent subject operation or replacement attempt is
started after exhaustion.

The filesystem adapter has no cancellation or timeout hook. Its operations
check the remaining budget before each filesystem sub-operation, and the
runner checks again immediately after a successful tool result is captured.
An already-running filesystem call can therefore return after the deadline;
the deadline is enforced at operation boundaries rather than by interrupting
that call.

### Non-authoritative command diagnostic sidecar

Completed `run_command` output can produce a separate
`S12_COMMAND_DIAGNOSTIC_SIDECAR@0.1.0` artifact under policy
`S12_COMMAND_DIAGNOSTIC_POLICY@0.1.0`. The artifact is observability-only and
non-authoritative. It is associated by run ID, attempt ID, and tool-call ID.
It is returned as a sibling of the canonical qualification summary; it is not
embedded in `S12ToolExecutionResult.result`, canonical ordered events, the
execution capture, or the S09 package.

The sidecar is not model-visible, evaluator input, metric input, S05
reliability evidence, S09 successful-task evidence, or scientific evidence.
Only stdout and stderr captured as complete decoded strings from a completed
command are in scope. Timeout, resource-limit, and instrumentation failure
streams are marked `UNAVAILABLE`; partial failure output is never represented
as a complete-stream digest.

For each complete stream, `completeCapturedDecodedStreamDigest` is SHA-256 of
the UTF-8 encoding of the complete decoded JavaScript string. It is computed
before redaction and projection, and it does not identify raw process bytes.
Complete empty streams have status `EMPTY` and the deterministic digest of the
empty UTF-8 string. Stdout and stderr have independent statuses and digests.

Redaction runs over the complete decoded stream before prefix projection. The
policy covers authorization and bearer forms, credential-shaped assignments,
explicitly supplied runtime credential values, and common POSIX, Windows, and
UNC absolute paths, including supported serialized forms. It does not claim
universal secret detection. The process environment is not enumerated; the
OpenRouter credential, when present, is supplied only for ephemeral matching
and is never stored in the artifact. If redaction or projection fails, that
stream is `UNAVAILABLE` with no preview and canonical command status is
unchanged.

Each preview is a prefix of at most 4,096 JavaScript UTF-16 code units after
redaction. Projection shortens a boundary that would end on an unmatched high
surrogate. The digest still covers the complete decoded stream, and a preview
cannot reconstruct that stream. Optional sidecar construction failure omits
the artifact and does not fail an otherwise completed qualification. These
diagnostics do not change execution configuration identity or historical
observations.

### Operator execution-stratum selection

`pnpm s12:qualification` defaults to the governed `S12_10_TURNS` stratum.
An operator can explicitly select it with `--execution-stratum 10t` or select
the prospective extended `S12_20_TURNS` stratum with
`--execution-stratum 20t`. The CLI resolves these labels to the existing
`S12_EXECUTION_STRATA` contracts; it does not define turn limits of its own.
Missing, empty, unsupported, or repeated selectors fail before workspace or
transport setup. Before continuing toward execution, the CLI prints the
selected contract fields and the digest computed from that contract. This
summary contains no credentials or secret environment values.

The 10T and 20T conditions are execution/resource envelopes. They are not
sample sizes, subject-attempt counts, replications, scientific N, capability
levels, or evidence of better performance. Selecting 20T changes only the
prospective execution condition; it does not reinterpret historical
observations.


S12 adds one prospective, synthetic feasibility path for `long_horizon@0.1.0`. It does not execute
the subject, promote a benchmark, or change scientific maturity. Its authority is `NONE`; evidence
verification remains `INTERNAL_CONSISTENCY_ONLY`.

The frozen subject is
`s12-lh-openrouter-cohere-north-mini-code-001` using the exact OpenRouter model
`cohere/north-mini-code:free`. The expected current upstream endpoint is
`cohere/north-mini-code-20260617:free` through Cohere. Model and provider fallback are disabled.
The recorded provider limits are a 256,000-token context and 64,000-token output; this feasibility
configuration deliberately caps output at 8,192 tokens. ZDR is unavailable, reported upstream
retention is 30 days, and the route reports no training use. Only synthetic, first-party,
non-sensitive material is permitted.

## Free-only boundary

Every future generation attempt must first retrieve current model and endpoint metadata. The
adapter requires the frozen identities, one Cohere endpoint, zero prompt and completion prices,
and the frozen parameter surface. It stops before generation with a typed failure when any check
fails. The request fixes the model, restricts provider routing to Cohere, sets
`allow_fallbacks=false`, requires declared parameters, and caps accepted prompt and completion
prices at zero.

The adapter reads `OPENROUTER_API_KEY` only at the transport boundary. Captures, evidence records,
tool results, and errors contain no credential field.

## Fixture

`s12_lh_config_migration_feasibility@0.1.1` is a first-party TypeScript repository containing a
deliberately unfinished v1-to-v2 configuration migration. The task requires schema validation,
migration, preservation and immutability, CLI behavior, integration checks, and documentation.
The fixture is synthetic and contains no PII, credentials, private code, production code, or
network dependency.

The frozen identity is:

| Field | SHA-256 |
| --- | --- |
| Canonical manifest | `70992947ba6906be50bbb4ecca006cdc7a899b36df823c3eda857081e6981eef` |
| Starting tree | `d53a14ebfb99abd9592f24b7d18418ef450a714f5469e8dfba7bf17e7db043fb` |
| Task instruction | `354230384808c95a9fe68eef795981ec9c598d3285aeec5971449b1d3632798c` |
| Verifier | `4c421830e18947701bacc01c921addb62c62077a455698193e4af074200fc298` |
| Fixture | `47dbb3c89b5a56d74710e80205a86a691be0fbb1301b2c3f9147a1af614cee63` |

The starting-tree digest covers every subject-visible starting file except the derived
`fixture-identity.json`; verifier material is excluded from that tree and independently binds the
parsed verifier specification plus the verifier test source. The fixture digest binds those
materials through `computeS12FixtureIdentity`.

The `0.1.1` fixture is immutable historical execution material. Its lockfile has a known
TypeScript artifact integrity error, and its Node compile-time types are incomplete for the
subject's CLI task. Historical observations 1–3 retain this exact identity; prospective
qualification rejects `0.1.1` before any provider or model activity.

The explicit prospective fixture is `s12_lh_config_migration_feasibility@0.1.2`. It uses
TypeScript `5.7.3` with corrected artifact integrity and exact `@types/node@22.10.7` plus
`undici-types@6.20.0` closure. Its starting-tree digest is
`e68e7db0ec98100505e8efed25e507439b78effd17c12eb86ce6facb0d2304c9`, verifier digest is
`ef2a7cea458bdc30d8fab95b4427eabef63f151b6902f12a2af82ffdd4e085ca`, and fixture digest is
`05041288fc913ad00e66162b62665159fe6831f74f5c1e7b4bd14d269b7344c5`. Selection requires
fixture ID, version, and expected digest; the runner recomputes the actual fixture bytes before
execution. No implicit latest version is selected. The semantic task intent is unchanged, but the
execution condition changed. Comparability requires empirical assessment; scientific equivalence
is not assumed.

### Prospective fixture supersession

Fixture `0.1.0` is `SUPERSEDED_BEFORE_EMPIRICAL_USE` because of
`INTERNAL_SPECIFICATION_CONTRADICTION`. It received zero subject observations. Its frozen digests
were manifest `b6c0d6abfcd3ead4370281097c95086210b91a84f010501dc735819c801fb970`,
starting tree `c668c6d13e359b9297116098ea15a461dd81861a9c03d3a5aa4c8832d2fbb12b`, task
`567efd69acfe12b73eefa3b25fe8203bfcca6bfede089ae357d5d3c51cf0c109`, verifier
`4fd78161d7aa20e6a73d27d16b080cc629133c5596837f751647e07083804fea`, and fixture
`a53583cb69399dbf2038918b8ba70925699eefc0a8a0f1eea2a21c8c703710be`.

The task and M3 required environment preservation, while its expected output replaced `MODE` with
unexplained `LOG_LEVEL`/`REGION` values and changed source commands to `dist` commands. Version
`0.1.1` removes those unexplained example mutations, explicitly freezes byte-identical command and
environment preservation, strengthens M3 accordingly, and changes only `TASK.md`,
`examples/expected-v2.json`, manifest/package/readme version declarations, verifier specification
and assertions, and the derived identity record.

| Requirement | Source and authority | 0.1.0 conflict | 0.1.1 resolution |
| --- | --- | --- | --- |
| Preserve environment entries | `TASK.md`, M3; construct/milestone | Expected output replaced `MODE` and introduced unexplained values | Expected output copies every entry unchanged |
| Preserve command identity | Schema-v1 plus migration preservation; schema contract | Expected output inserted `dist/` without a migration rule | Commands are copied byte-for-byte |
| Preserve identifiers and order | `TASK.md`, M3; construct/milestone | No conflict | Retained and explicitly verified |
| Keep input immutable | `TASK.md`, M3; construct/milestone | No conflict | Retained and verified |
| Exact canonical v2 output | M2 and expected example | Could not coexist with M3 | Expected example now represents the authoritative preservation rules |

## Independent verification

The verifier consumes only a final repository snapshot and command outcomes. It has no input for
the execution trace, evaluator output, metric components, evaluator flags, or model self-report.
It returns `SATISFIED`, `NOT_SATISFIED`, or `UNVERIFIABLE` for the run criterion while retaining
all six milestone results.

## Tool and capture boundary

The subject may request four client-side functions: bounded file read, bounded file write, bounded
file listing, and allowlisted local commands. Paths must remain in the fixture workspace. Git
metadata, dependencies, verifier material, and evidence material are protected. Network commands,
environment enumeration, external repositories, arbitrary shell, and resource-limit bypasses are
not available.

Execution capture records frozen identities and digests, ordered turns and tool calls, artifact
mutations, durations, exit states, usage classification, free status, retry lineage, missingness,
and typed terminal failures. Mapping the same immutable capture produces byte-equivalent canonical
`BehavioralTraceEvent[]` output.

## Evidence boundaries

The S05 mapper emits an `EXACT_REPEATABILITY` record in the canonical `RELIABILITY_S05` scope and
declares schema support for later numeric run-to-run and stochastic stability work. S09 packaging
delegates to the existing `EvidenceSystem`; it cannot grant validity, calibration, reliability,
maturity, promotion, Core eligibility, or external validity.

OpenRouter remains an optional adapter. The subject and evidence contracts above it remain
provider-independent and can later be implemented for direct providers or local runtimes without
changing scientific authority.

## Qualification readiness repair

The concrete transport uses the runtime HTTP implementation without an SDK dependency. It maps
the frozen declarations deterministically to OpenRouter function schemas and parses assistant,
tool-call, provider, request, and usage metadata without retaining authorization material. The
qualification runner defaults to `DRY_RUN`; live mode fails closed unless its caller supplies an
explicit authorization flag. One attempt can contain several model request identities while
retaining one run and attempt identity.

The authoritative `s12_config_migration_final_state_verifier@0.3.0` executes schema, migration,
preservation, CLI, build, typecheck, verifier-suite, and documentation checks against final fixture
state. Its trusted material digest is checked before execution. An integrity mismatch yields
`UNVERIFIABLE` and `VERIFIER_FAILURE`, never a subject-task failure.

The production qualification path is exposed by `pnpm s12:qualification`. It defaults to the
safe dry-run mode, requires an explicit fixture workspace, and requires both `--mode live` and
`--authorize-live` before the concrete transport can be selected. Canonical post-processing is
owned by `S12CanonicalQualificationRunner`: callers can supply a transport but cannot replace the
long-horizon evaluator, metric identity, S05 mapper, or S09 `EvidenceSystem` implementation.

## Reconciled provider and tool boundary

The canonical runner constructs the initial request from the frozen system instruction and the
exact fixture `TASK.md` bytes. It blocks configuration, fixture, and task digest drift before an
attempt or generation call. Each fresh preflight records the exact model, provider endpoint,
zero-price status, supported parameters, fallback policy, observation time, and a digest. The
prepared request and message sequence have separate digests; generation count increases only
when the transport is invoked. The provider route remains Cohere only, with paid and provider
fallback disabled.

Expected subject tool mistakes return bounded, redacted results with `status: ERROR` and
`recoverable: true`. The next model turn can use these results to correct its request. A command
that launches and exits with a numeric nonzero code still yields an ordinary command result, so
failing tests remain visible as task evidence. A command timeout, resource termination, spawn
failure, or unexpected executor fault instead ends the attempt with a typed failure. Ordered
capture retains the tool call identity and non-success status; only bounded output digests are
retained. Terminal tool failures do not enter canonical evaluation, S05 mapping, or S09 packaging.
The qualification result retains the structured failure and ordered capture so missing downstream
evidence stays explicit. This is an engineering correction and adds no scientific authority.

The bounded integrity repair requires an explicit decimal zero-price string and an exact Cohere
endpoint identity during preflight. Expected `ENOTDIR` and `EISDIR` path probes become recoverable
tool errors; unexpected filesystem faults remain terminal. Ordered capture stores normalized
validated arguments or a redacted marker for invalid arguments. Write content is represented by
its digest, so replay can verify the mutation without recovering the original content from capture.
Path validation rejects absolute POSIX and Windows syntax, including UNC paths, before host-native
resolution. It interprets separators consistently for safe fixture-relative paths and rejects
traversal beyond the fixture root before either execution or ordered capture.

For the concrete HTTP transport, `WIRE_REQUEST_PREPARED` records a local digest of the serialized
request body sent to the chat completions endpoint. It is separate from the adapter's prepared
`requestDigest` and does not include the authorization header. The digest attests to local
serialization only; it is not a provider receipt or proof of remote execution. Transport doubles
without a serialized HTTP body do not emit this event.
The wire digest uses the existing `semantiq-canonical-json-v1` representation of the final local
body: object key order is normalized recursively while array order is preserved. The transport
still sends its original JSON serialization of that same body; canonicalization changes evidence
construction, not the provider-facing request.

## Track A synthetic pipeline qualification

Track A is the deterministic, first-party synthetic fixture `s12_pipeline_qualification_edit@0.1.0`.
Its fixed task changes `getMessage()` from `alpha` to `beta`. This qualifies only the local
execution pipeline; it does not validate model capability, construct validity, empirical
reliability, scientific benchmark validity, external replication, or benchmark maturity.

The starting fixture identity is derived from the actual bytes of the README, task, manifest,
package metadata, and initial source under `S12_TRACK_A_FILE_BYTES_SHA256_V1`. The frozen tests,
verification contract, and other protected fixture files have a separately frozen digest in the
same domain. Caller-supplied digests are ignored. Final verification checks protected bytes and
the actual final source, then runs the frozen Node test. The mutable source is therefore permitted
to change from the frozen initial `alpha` bytes to `beta` while protected verifier material remains
bound to its expected identity.

The Track-A workflow invokes the existing governed `createS12ExecutionCaptureFromEvents` producer.
Its repeatability projection is a derivative that removes timestamps and measured runtime while
retaining model-turn content digests, tool calls and results, mutation sequence, terminal status,
fixture/configuration/environment identities, and verification outcome. It is not a second
canonical capture. Track A packages its governed capture, fixture, and final-state verifier lineage
through the canonical S-09 `EvidenceSystem` and `EvidenceVerifier`. Canonical internal-consistency
success is a necessary evidence-integrity condition for a qualified Track-A result; S-09 success
cannot override `NOT_QUALIFIED` or `MISSING`. S-09 authority remains `INTERNAL_CONSISTENCY_ONLY`,
and scientific authority remains `NONE`; this verification is not scientific validation. Diagnostic
sidecars remain non-authoritative observability and do not enter the capture, S05 projection, S09
lineage, or successful-task evidence.

The local transport is scripted and has no network or credential dependency. Its metadata is a
compatibility seam for the existing S12 runner, not a real provider observation. No model-generation
request, subject observation, scientific evidence, or Observation #4 is produced by Track A.

## Boundary E governance charter

Human governance has explicitly accepted this charter. Its repository integration is pending;
`BOUNDARY_E = NOT_STARTED` and Observation #4 is absent. This acceptance does not authorize a live
run or an OpenRouter call.

Boundary E is the **program governance boundary** between completed synthetic and engineering
qualification and the first prospective collection of real-subject feasibility evidence under a
frozen execution envelope. It is not a runtime architecture layer or synonymous with
`LIVE_QUALIFICATION`. That mode is the existing technical mechanism that may be used only after
separate authorization.

The state sequence is:

1. Engineering qualification complete; Boundary E is `NOT_STARTED`.
2. Human charter acceptance and durable repository integration define Boundary E (`DEFINED`).
3. Separate explicit live authorization and all mandatory execution preconditions leave it
   `DEFINED_NOT_ENTERED`. Successful initial preflight alone also leaves it `DEFINED_NOT_ENTERED`.
4. The first `ATTEMPT_CREATED` for an explicitly authorized prospective real-subject feasibility
   execution after successful initial preflight enters Boundary E (`ENTERED`), creates one
   observation, and begins feasibility evidence collection.

Charter acceptance, durable recording, live authorization, and metadata preflight do not themselves
enter Boundary E. An observation is an independently addressable real-subject attempt created after
successful initial preflight. Its existence does not require `GENERATION_INVOKED`, successful
generation, task completion, verification, or `QUALIFIED` status. A preflight failure before
`ATTEMPT_CREATED` creates no observation; a later failure, timeout, unverifiable result, or missing
evidence preserves the created observation.

Three historical real-subject observations remain preserved. Observation #4 stays absent until the
first valid, explicitly authorized prospective `ATTEMPT_CREATED`; that attempt becomes Observation
#4 even if it later fails. Acceptance, recording, and authorization neither create nor reserve it.
`REAL_SUBJECT_OBSERVATIONS` and `REAL_GENERATION_REQUESTS` are independent counters: an observation
begins at `ATTEMPT_CREATED`, while a generation request is counted only when the model transport is
actually invoked at `GENERATION_INVOKED`. One observation may contain zero, one, or multiple bounded
generation requests. Model turns are not observations, and observation count is not scientific N.

The accepted `GOVERNED_INITIAL_FEASIBILITY_ENVELOPE` is:

| Field | Frozen value |
| --- | --- |
| Purpose / mode | `PROSPECTIVE_REAL_SUBJECT_FEASIBILITY` / `LIVE_QUALIFICATION` |
| Subject | `s12-lh-openrouter-cohere-north-mini-code-001` |
| Model / expected upstream | `cohere/north-mini-code:free` / `cohere/north-mini-code-20260617:free` |
| Expected provider | `Cohere` |
| Fixture / digest | `s12_lh_config_migration_feasibility@0.1.2` / `05041288fc913ad00e66162b62665159fe6831f74f5c1e7b4bd14d269b7344c5` |
| Execution stratum | `S12_10_TURNS` |
| Subject attempts / automatic retries | `1` / `0` |
| Routing / fallback | `FREE_ONLY`; no model, provider, or paid fallback |
| Maximum attempt wall time | 30 minutes |
| Data | `SYNTHETIC_FIRST_PARTY_NON_SENSITIVE_ONLY` |

This is an initial governed feasibility envelope, not a scientifically optimal, validated,
calibrated, or general benchmarking recommendation. Before `ATTEMPT_CREATED`, the accepted charter
must be durably integrated, and a specific live execution must receive separate explicit human
authorization. Record the exact implementation revision; verify exact fixture, task, configuration,
and verifier identity and integrity; require a valid explicit stratum and credential availability
without disclosure; run fresh model and provider endpoint metadata preflight; verify zero price,
frozen model/upstream/provider identities, required parameters, and the fallback prohibition. Any
mandatory failure blocks attempt creation.

Routing fails closed with `FREE_TIER_UNAVAILABLE`, `SUBJECT_IDENTITY_DRIFT`,
`PROVIDER_ROUTE_DRIFT`, or `REQUIRED_PARAMETER_UNAVAILABLE` as applicable. There is no automatic
replacement model, provider substitution, or paid fallback. An unavailable frozen route stops
execution before generation. A failure before `ATTEMPT_CREATED` leaves Boundary E not entered and
Observation #4 absent.

`BOUNDARY_E_SCIENTIFIC_ROLE = FEASIBILITY_ONLY`; `SCIENTIFIC_AUTHORITY = NONE`;
`S09_AUTHORITY = INTERNAL_CONSISTENCY_ONLY`; and
`S05_LIVE_AUTHORITY = SINGLE_CAPTURE_REPLAY_CONSISTENCY_ONLY`. A Boundary E observation can inform
feasibility of the frozen real-subject pipeline. It does not establish construct validity,
calibration, independent-run reliability, external validity or replication, general model
capability, model superiority, benchmark maturity, scientific validation, or Core promotion
eligibility. Mapping and replaying one immutable capture is not independent run-to-run reliability
evidence.

After `ATTEMPT_CREATED`, failure cannot undo Boundary E entry. Preserve the attempt identity,
generation count, ordered capture, failure point, tool evidence, verifier state, missingness,
terminal status, available S09 evidence, and non-authoritative diagnostics. A later attempt receives
a new observation identity; it never overwrites a failed observation.
