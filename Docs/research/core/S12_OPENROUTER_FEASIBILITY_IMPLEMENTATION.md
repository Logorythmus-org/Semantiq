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

`s12_lh_config_migration_feasibility@0.1.0` is a first-party TypeScript repository containing a
deliberately unfinished v1-to-v2 configuration migration. The task requires schema validation,
migration, preservation and immutability, CLI behavior, integration checks, and documentation.
The fixture is synthetic and contains no PII, credentials, private code, production code, or
network dependency.

The frozen identity is:

| Field | SHA-256 |
| --- | --- |
| Canonical manifest | `b6c0d6abfcd3ead4370281097c95086210b91a84f010501dc735819c801fb970` |
| Starting tree | `c668c6d13e359b9297116098ea15a461dd81861a9c03d3a5aa4c8832d2fbb12b` |
| Task instruction | `567efd69acfe12b73eefa3b25fe8203bfcca6bfede089ae357d5d3c51cf0c109` |
| Verifier | `4fd78161d7aa20e6a73d27d16b080cc629133c5596837f751647e07083804fea` |
| Fixture | `a53583cb69399dbf2038918b8ba70925699eefc0a8a0f1eea2a21c8c703710be` |

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

The authoritative `s12_config_migration_final_state_verifier@0.2.0` executes schema, migration,
preservation, CLI, build, typecheck, verifier-suite, and documentation checks against final fixture
state. Its trusted material digest is checked before execution. An integrity mismatch yields
`UNVERIFIABLE` and `VERIFIER_FAILURE`, never a subject-task failure.
