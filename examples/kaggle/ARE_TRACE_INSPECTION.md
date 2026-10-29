# Experimental ARE trace inspection

Standard-library Python 3.10+ example. This inspects a limited subset of the
native ARE `are_simulation_v1` exported JSON structure. It is not an hf/lite
transport adapter, full schema validator or SemantIQ SDK integration.

```sh
python -m unittest discover -s examples/kaggle -p 'test_are_trace_inspection.py' -v
python examples/kaggle/are_trace_inspection.py trace.json inspection.json --origin synthetic
```

Use `--origin external_unverified` for externally obtained input. This label is
caller-supplied provenance, not authentication. The output must not exist.
The read is limited to 8 MiB plus one byte; at most 10,000 combined scheduled
and completed events are accepted. Deeply nested malformed documents may still
raise parser errors: this is an example, not a hardened ingestion service.

Only `completed_events` produce inspection records. `events` contributes a
scheduled-event count. Array order is preserved. Simulation event timestamps
are not converted into wall duration. Duplicate JSON keys, duplicate completed
event IDs, non-finite numbers and unknown format versions are rejected.

Each event points to its raw SHA-256 and JSON Pointer. Metadata absent, explicit
null and present values stay distinct. A null exception means only
`no_exception_reported`; a string exception means `exception_reported`, including
an empty string. Neither is an official scenario verdict. Overall outcome,
judge result, tokens, cost and duration stay null when not mapped.

Action arguments, return values, exception text, stack traces, app state and
world logs are not copied. Raw input remains sensitive; identifiers and counts
in the inspection may also be sensitive. This is not a general secret-redaction
system. Hashes establish byte identity, not authenticity. The code never invokes
an app, model, judge or network service and never modifies the input.

## Contract boundary

`packages/evidence-normalizer/src/types.ts` was inspected on GitHub main on
2026-10-29. Its `RawExecutionBundle` requires sandbox spec/request/result/delta;
`ObservationEvidence` requires command, working directory, exit code, execution
duration, peak memory and file consequences. This ARE profile does not supply
those measurements and is not converted to that contract by inventing values.

Likewise `schemas/canonical-benchmark-report.schema.json` requires a verdict,
score, behavioral findings, costs and signatures. Inspection output is not a
CanonicalBenchmarkReport. No shared schema, scoring or core module changes.

## Validation and limits

Fourteen authored unit tests cover version rejection, scheduled/completed
separation, raw links, metadata presence, exception handling and no verdict
inference. Separate local probes used official ARE 1.2.0 / Pydantic 2.10.6:
the full exporter passed an empty-scenario check; two scripted tool events
(successful empty read and invalid argument) passed upstream validation and
inspection. These were locally executed authored synthetic scenarios, not
Gaia2 benchmark runs or autonomous agent evaluations. Repeated inspection of
the SAME bytes is deterministic; the upstream exporter inserts annotation dates
so independent exports may differ. No model or judge was called.

Upstream source reference:
https://facebookresearch.github.io/meta-agents-research-environments/_modules/are/simulation/data_handler/models.html

Authentic Gaia2 run validation, full SDK contract mapping, transport support,
redistribution review and provider execution remain separate work. No benchmark
score, official compatibility certification or independent replication claimed.
