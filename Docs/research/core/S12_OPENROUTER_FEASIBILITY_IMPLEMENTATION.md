# S12 OpenRouter feasibility implementation

## Scope

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
