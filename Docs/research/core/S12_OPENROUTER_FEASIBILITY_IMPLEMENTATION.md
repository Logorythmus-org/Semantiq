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
| Starting tree | `66bbf3d5b3efd929fc6079101ab146ea68e1fd7a1cc7831a3e2420ffeb0d6e64` |
| Task instruction | `0205eb37fedec53645aba1ac59827c39732554ea2b12a5388dccd9e49b7613c2` |
| Verifier | `f6394d5afbfe894271f0e5bbbaea7e2942c65505cbb4c2ef9f519ad2e1a06464` |
| Fixture | `0d538e5aa046d40d74074ebff40f21e8380628079dbfb6bc7f2248520ca888e6` |

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
