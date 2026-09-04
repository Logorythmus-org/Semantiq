# JSON Schema Draft 2020-12 Conformance Evidence

**Evidence status:** `INTERNALLY_VALIDATED`

**Evidence origin:** owner-controlled repository and CI environments

**External validation:** not established

This report documents a bounded portability check for three checked-in SemantIQ JSON Schemas. It
does not claim certification, complete coverage of all schemas, validator correctness, upstream
acceptance, or independent replication.

## Scope and selection

| Schema | Why it is included |
|---|---|
| [`claim-scope.schema.json`](../../schemas/claim-scope.schema.json) | Public claim-boundary metadata used by evidence workflows |
| [`replication-record.schema.json`](../../schemas/replication-record.schema.json) | Portable reproduction-outcome and discrepancy record |
| [`public-alpha-evidence-manifest.schema.json`](../../schemas/public-alpha-evidence-manifest.schema.json) | Public Alpha maturity and evidence boundary manifest |

All three files explicitly declare `https://json-schema.org/draft/2020-12/schema`. The separate
Draft-07 product-contract schema is intentionally excluded: Ajv documents that Draft 2020-12 is not
backwards-compatible and should not share an instance with earlier drafts.

The vector pack contains twelve cases: six expected-valid and six expected-invalid. The negative
cases exercise missing required properties, JSON type mismatches, and constant-value mismatches.
Every validator reads the same JSON instances from
[`vectors.json`](../../tools/conformance/json-schema/vectors.json); no validator-specific fixture is
substituted.

## Validators and runtimes

| Implementation | Pinned version | Runtime | Draft support |
|---|---:|---|---|
| [Ajv](https://ajv.js.org/json-schema.html) | `8.20.0` | Node.js 22 | Dedicated `Ajv2020` implementation |
| [Hyperjump JSON Schema](https://github.com/hyperjump-io/json-schema) | `1.17.8` | Node.js 22 | Draft-specific stable entry point |
| [python-jsonschema](https://python-jsonschema.readthedocs.io/) | `4.26.0` | Python 3.10–3.12 in repository CI; 3.12 in the recorded local run | `Draft202012Validator` |

The checked-in [`results.json`](../../tools/conformance/json-schema/results.json) records the exact
runtime patch versions observed when it was generated. Runtime patch metadata can differ on another
supported machine; case ordering, validity outcomes, normalized diagnostic categories, validator
versions, and the JSON structure are deterministic.

## Format policy

`format` is treated as annotation-only. The selected schemas contain no `format` keyword, and the
harness does not infer formats from property names. Two valid fixtures intentionally use
`not-format-asserted` for timestamp-shaped fields to make this policy reviewable. Ajv is configured
with `validateFormats: false`; Hyperjump format assertion is not enabled; python-jsonschema is used
without a `FormatChecker`.

## Run it

From a clean source checkout with the repository prerequisites installed:

```bash
pnpm install --frozen-lockfile
python -m pip install -r tools/conformance/json-schema/requirements.txt
pnpm conformance:json-schema
```

On Windows, if `python` is not on `PATH`, set `SEMANTIQ_CONFORMANCE_PYTHON` to the Python executable.
The command overwrites only the checked-in normalized result matrix and exits nonzero when a schema
dialect, validator result, or normalized category differs from the manifest.

## Result matrix

The recorded run produced:

- 3 selected schemas;
- 12 shared cases;
- 3 independent validator implementations across Node.js and Python;
- 36 matching validator/case results;
- no disagreements, schema defects, or portability blockers.

Diagnostic text differs across implementations, so the harness records only stable categories:
`missing-required`, `type-mismatch`, `const-mismatch`, and `other-invalid`. These categories are
derived from each validator's reported keyword, not copied from expected fixture metadata.

## Reproducibility and provenance

The schemas, vector manifest, runner, pinned dependencies, and normalized matrix are all tracked in
the repository. GitHub CI runs the same command in the Cross-Language Schema & Contract Parity job.
This is internal conformance evidence because both the local run and project CI remain
owner-controlled. It is not an external reproduction or an independent validator audit.

## Readiness consequence

This closes Prompt 13's internal “pinned multi-validator execution” gap. It does **not** make external
engagement ready: the run found no validator disagreement, no minimized upstream defect, and no
demonstrated need for a new upstream test vector. JSON Schema therefore remains
`NEAR_READY_ONE_EVIDENCE_GAP`; the remaining gap is an externally relevant, reproducible finding or
clear upstream need—not merely another owner-controlled green run.

No outreach was performed. No upstream issue or pull request is justified by these results.
