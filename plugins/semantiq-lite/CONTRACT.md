# Local evidence integrity contract

Status: experimental, implementation proposed for maintainer review.
Contract identifier: `semantiq-lite-review/0.2.0`. This version is independent
of the Core SDK and public product release. The legacy CLI remains unchanged.

## API and installation

Install `python -m pip install ./plugins/semantiq-lite` for the integrity API.
The new API does not import the SDK; the legacy skill still requires the SDK.
`jsonschema>=4.18,<5` validates the wire structure using the bundled schema.
No schema is fetched from the network. Dataclasses are typed construction helpers;
constructing one alone is **not** validation. Call `validate_review` or `dumps_review`.

```python
from semantiq_lite import EvidenceAnchor, ReviewResult, snapshot, dumps_review

raw = b"A reported result.\r\n"
source = snapshot("paper-1", raw)
anchor = EvidenceAnchor("quote-1", "paper-1", 2, 10, "reported")
review = ReviewResult(sources=[source], anchors=[anchor])
encoded = dumps_review(review, {"paper-1": raw})
```

`snapshot` accepts UTF-8 bytes and `text/plain` or `text/markdown`.
`load_local(root, relative, source_id)` reads a `.txt` or `.md` file under a
caller-authorized root. `validate_review(review, raw_sources, limits)` checks
the complete graph against supplied original bytes, not just claimed hashes.
`dumps_review` validates before returning bounded UTF-8-serializable JSON.
It performs no writes. Persisting output and authorizing paths belong to the host.
No new CLI, PDF/HTML parser, URL intake, or implicit filesystem resolver is provided.

## Snapshots and coordinates

Every snapshot embeds extracted text. Raw SHA-256 covers original bytes;
text SHA-256 covers actual UTF-8 bytes of canonical extracted text. Hashes use
lowercase hexadecimal. `lf-only-v1` replaces CRLF and CR with LF, without trimming,
space folding, Unicode normalization, BOM stripping, or Markdown interpretation.
Extractor identity, version, encoding, normalization, and optional origin metadata
are recorded. Origin metadata is descriptive and untrusted, never authentication.

Offsets are zero-based, end-exclusive Unicode code points into **recorded canonical
text**. Python slicing defines `0 <= start < end <= len(text)` and
`text[start:end] == quote`. They are not UTF-8 bytes, UTF-16 units, graphemes,
raw-file offsets, or rendered locations. CRLF raw offsets can differ. Combining
marks count individually; a non-BMP emoji counts once. No quote search or repair occurs.

Identifiers are unique separately within sources, claims, anchors, and links.
They contain 1–128 ASCII letters, digits, underscore, dot, colon, or hyphen, starting
with an alphanumeric. Anchors reference sources; links reference claims and anchors.
The raw-source mapping must exactly match source IDs. Claims without evidence may
be recorded but remain unassessed; every result requires human review.

## Verification and transitions

Layer A checks raw bytes, extraction identity/policy, canonical content, and hashes.
Layer B checks references and exact quote locations. Layer C, semantic support,
is a separate contract dimension and is not implemented here.

The schema defines `SUPPORTED_BY_SOURCE`, `PARTIALLY_SUPPORTED`, `CONTRADICTED`,
`INSUFFICIENT_EVIDENCE`, and `NOT_ASSESSED` independently from `NOT_ATTEMPTED`,
`INSUFFICIENT_DATA`, `PARTIAL`, and `INDEPENDENTLY_VALIDATED`.
The current execution profile accepts only `NOT_ASSESSED` / `NOT_ATTEMPTED`.
It rejects every stronger imported or newly proposed state, including states
asserted by a model. No transition authority is implemented in this increment.

A future semantic-assessment authority will require identified reviewer provenance,
claim-specific rationale, and valid source anchors. Independent validation will require
a separate, authorized validation record with methods, reproducible artifacts,
observations and accountable human review. These future records and authority checks
must be specified and tested before this profile permits any stronger state.
Hashes do not authenticate an author; exact quotations do not establish truth.

## Limits and failure order

| Resource | Default |
| --- | ---: |
| Raw bytes per source / total | 2 MiB / 8 MiB |
| Extracted code points per source / total | 250,000 / 1,000,000 |
| Sources / claims / anchors | 16 / 100 / 300 |
| Links | 300 (shares configured anchor cap) |
| Quote code points | 2,000 |
| Serialized JSON UTF-8 bytes | 2 MiB |
| Source / request time budgets | 5 / 30 seconds (reserved, unenforced) |

`ResourceLimits` configures positive finite values. No silent truncation occurs.
The bounded file reader reads at most the smaller applicable raw cap plus one byte.
Serialization counts UTF-8 bytes incrementally and returns nothing on failure.
The output ceiling can reject a review otherwise within extracted-text limits.

Hard parser and request deadlines are explicitly **deferred** to process-isolated
parsing. Time fields reserve policy defaults only; they are not elapsed-time or
hard-timeout enforcement. `PARSE_TIMEOUT` is reserved and is not emitted here.
Blocking filesystem reads also have no wall-clock bound. Use trusted local disks;
the host must isolate untrusted mounts or concurrent writers.

The API raises `ContractError` with `ValidationErrorRecord(code, location)`.
Diagnostics contain fixed locations, never supplied IDs, paths, quotes or text.

| Code | Meaning |
| --- | --- |
| `INVALID_CONTRACT` | Schema, type, version, policy, media or configuration error |
| `LIMIT_EXCEEDED` | Configured size/count/output budget exceeded |
| `INVALID_ENCODING` | Malformed source UTF-8 or non-UTF-8-serializable review text |
| `HASH_MISMATCH` | Raw/text hash or canonical extraction mismatch |
| `DUPLICATE_ID` | Duplicate within one identifier scope |
| `DANGLING_REFERENCE` | Missing/extra raw source or unresolved graph reference |
| `ANCHOR_MISMATCH` | Invalid range or exact quotation mismatch |
| `INVALID_STATE_TRANSITION` | Assessment outside this execution profile |
| `UNSAFE_PATH` | Escaping, missing, linked, special or unreadable local path |
| `PARSE_TIMEOUT` | Reserved for future isolated parsers |

Review error precedence follows execution: limit configuration, wire schema,
serialization/encoding/output budget, collection counts, duplicate IDs (sources,
claims, anchors, links), raw-map completeness, then each source in input order
(resource budgets, UTF-8 decoding, integrity), anchors in order (integer types,
quote limit, source reference, range/quote), and links in order (references, states).
Schema failures use one fixed error independent of validator traversal details.
Intake checks raw limit before UTF-8, character limit before source metadata.
Local path checks precede reads and snapshot validation. No aggregation or repair.

## Security and remaining risks

All source text, including apparent instructions, remains inert data. The API does
not evaluate code, invoke tools, log source content, retrieve URLs or write files.
Reports intentionally include source text; callers must control artifact disclosure.

Local paths reject absolute paths, drives, traversal components, alternate streams,
symlinks, Windows reparse points, unsupported extensions and non-regular files.
The caller explicitly authorizes the root, including its resolved location.
Path inspection is not atomic with opening on every supported OS: an attacker able
to replace directories concurrently can race it. This API is for caller-controlled
local trees; hostile concurrent filesystem access requires OS sandboxing or an
atomic handle-based loader before any remote-tool exposure.

Wire schema validates shape; graph, hashes, exact Python integer offsets, budgets,
and profile transitions require the Python validator. Inputs are in-memory objects;
there is no unbounded JSON-file parser entry point. Callers must bound/deserialise
their own transport and must not mutate inputs concurrently during validation.
Synthetic regressions are not independent security or scientific evaluation.

## Compatibility and next increments

`claim-check`, `evidence-limits`, `short-report`, their SDK calls, field names,
warnings and exit codes remain unchanged. A successful `short-report` process
still requires human review. The Windows subprocess test accepts native CRLF
diagnostic newlines; test runs use `PYTHONUTF8=1` to preserve existing Unicode output.
Plugin identity remains 0.1.1 until a separate host-packaging change; the new
experimental Python distribution and evidence contract are versioned 0.2.0.

Remaining gaps: hard deadlines and atomic hostile-filesystem intake; PDF/HTML
extraction; claim proposals and semantic assessment; authenticated reviewer records;
host invocation; Cyber-specific review; MCP/ChatGPT packaging; independent evaluation.
