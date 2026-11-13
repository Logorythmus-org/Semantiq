# B1 synthetic worker foundation

RFC [#261](https://github.com/Logorythmus-org/Semantiq/issues/261) proposes secure
offline intake. This increment implements the B1 foundation only. It adds no
PDF/HTML parser, extraction contract, media support, CLI command or release.
`semantiq-lite-review/0.2.0`, existing exports and legacy CLI behavior are unchanged.

The maintainer's B1-only decision requires fail-closed operation, separate platform
qualification and normal CI, security assessment and non-author CODEOWNER review.
The [human decision by Matrix-Engage](https://github.com/Logorythmus-org/Semantiq/issues/261#issuecomment-6840515024)
accepts B1 with conditions, leaving document processing unauthorized. The issue body
still says DRAFT; its metadata needs reconciliation with that scoped decision.
Neither implementation nor passing tests substitute for independent approval.

## Authorized surface

The internal Python API runs one fixed stdlib-only byte/hash workload:

```python
from semantiq_lite.worker import WorkerSupervisor, capture_bytes

source = capture_bytes("example", bytearray(b"trusted synthetic fixture"))
result = WorkerSupervisor().run_synthetic(source)
assert result.raw_sha256 == source.raw_sha256
```

`capture_bytes` copies mutable bytes into immutable bytes. Batch validation rejects
duplicate IDs and excessive source counts/bytes before spawning. Hashes identify
the exact captured bytes; Unicode is not decoded, normalized or assigned offsets.
This is not an atomic file acquisition API. Existing review offsets remain governed
by the existing 0.2 contract.

`capture_untrusted_path` and `run_untrusted_document` always raise
`ISOLATION_UNAVAILABLE` without inspecting/opening input or launching a worker.
Capability objects, platform names and configured limits cannot enable them. Do not
send untrusted documents through the synthetic API. No backend or subprocess
fallback exists. The fixed worker script and interpreter installation must be trusted.

## Protocol and controls

The separate internal protocol is `semantiq-lite-worker/0.1.0`; its schema is
[`contracts/semantiq-lite-worker-v0.1.schema.json`](contracts/semantiq-lite-worker-v0.1.schema.json).
Regenerate it with `python plugins/semantiq-lite/contracts/build_worker_schema.py`.
It is not an evidence/extraction schema. Code additionally enforces framing, strict
JSON types, duplicate-key rejection, nesting, exact EOF and handshake ordering.

The supervisor uses a fixed absolute interpreter and script, argument arrays, no
shell, isolated Python (`-I -S -B`), closed inherited descriptors, an explicit minimal
environment and bounded pipes. On Windows it selects the base interpreter directly
to avoid virtual-environment launcher descendants; it never retries an unsafe launch.
Worker diagnostics never forward raw stderr, input or exception paths.

Before releasing source bytes, Windows Job assignment must succeed, or the Linux
worker must establish its parent-death signal and resource limits and acknowledge
readiness. Nonce and source manifest bind the handshake; source ID, length and SHA-256
bind the response. The manifest hashes the wire and worker source files: it detects
source disagreement, **not** malicious package replacement, interpreter compromise,
signature authenticity or runtime attestation.

Default maxima (caller limits may be reduced):

| Budget | Maximum |
| --- | --- |
| Source / request wall monitor | 5 / 30 seconds |
| Cleanup grace | 2 seconds |
| Header / stdout / stderr | 16 KiB / 2 MiB / 16 KiB |
| Captured source / batch | 2 MiB / 8 MiB |
| Sources | 16 |
| Process memory / Windows Job memory | 256 MiB / 384 MiB |
| Process CPU / Windows active processes | 2 seconds / 1 |

Up to four processes can be configured for harmless descendant tests only. Linux
does not implement an aggregate process-count, CPU or memory controller here.
Windows configures Job process count, process CPU, memory and kill-on-close; its CPU
enforcement remains unqualified. Linux configures per-process AS/CPU, zero core/file
growth and descriptor limits. Filesystem writes, reads and network access are not
confined by these controls.

The parent monitors both blocked writers and readers against monotonic deadlines.
A request budget is shared across sources, not reset per source. Cleanup has its own
bounded grace, so a timeout can return after the work deadline plus cleanup grace.
OS process creation, trusted-file reads and kernel scheduling are not preemptible
hard real-time guarantees. Cleanup failure overrides success/errors and quarantines
that supervisor instance. A new instance does not establish host cleanliness.

## Capability evidence and unresolved qualification

`inspect_worker_capabilities()` separates declared controls from observations.
`SyntheticResult.configured_controls` describes setup only. Neither is affirmative
evidence that a complete security backend was observed. Mandatory confinement,
resource, capture and process-tree qualification remains `UNAVAILABLE` and
`untrusted_documents_enabled` is always false, including on maintained Python.
Python 3.10 compatibility does not qualify an untrusted worker runtime; a future
backend must independently qualify a maintained Python 3.12+ runtime.

Machine-readable states are `ENFORCED_AND_TESTED`, `IMPLEMENTED_NOT_QUALIFIED`,
`UNAVAILABLE` and `NOT_TESTED`. Runtime inspection conservatively returns unavailable
mandatory controls and implemented-but-unqualified synthetic mechanisms, never a
positive enforcement claim inferred from an OS name or worker acknowledgement.
Positive test outcomes belong to the particular test run and platform, not to every
future invocation. A caller-created evidence record cannot enable untrusted intake.

| Platform | B1 mechanisms | Qualification boundary |
| --- | --- | --- |
| Native Windows | Job + fixed worker + bounded pipes | No filesystem/network confinement; CPU and full parent-death tree behavior unresolved |
| Native Linux | New session/process group, worker rlimits, parent-death signal | No qualified namespace/cgroup/container backend or aggregate limits |
| WSL | Linux mechanisms tested separately | WSL results do not qualify native Linux or Windows |

The following matrix describes the reproducible synthetic tests, not hostile-input
qualification. E = `ENFORCED_AND_TESTED` for that narrow test, I =
`IMPLEMENTED_NOT_QUALIFIED`, U = `UNAVAILABLE`, N = `NOT_TESTED`. Native Linux
results must be read from that PR's CI; local WSL results cannot fill its column.

| Control / narrow test | Windows local | WSL local | Native Linux before CI |
| --- | --- | --- | --- |
| Wall monitor, blocked pipes, bounded IPC | E | E | N |
| Immutable bytes, parent hash/identity validation | E | E | N |
| Memory rejection under configured per-process ceiling | E | E | N |
| CPU ceiling termination | I (workload skipped) | E | N |
| Environment canary excluded | E | E | N |
| Inheritable FD canary excluded | N (Linux-only probe) | E | N |
| Ordinary non-escaping child cleanup | E | E | N |
| Single worker after parent death | E | E | N |
| Full escaping-descendant/parent-death tree containment | U | U | U |
| Filesystem/network/local IPC confinement | U | U | U |
| Atomic hostile source acquisition | U | U | U |
| Qualified aggregate resources and maintained runtime | U | U | U |

These E outcomes are test assertions with bounded fixtures. They do not promote
the conservative runtime inspection record or enable document processing. In
particular, Windows inherited-handle qualification, complete tree cleanup and
kernel confinement remain incomplete even when narrower lifecycle tests pass.

Normal worker exit, timeout and selected non-escaping descendants are tested. Linux
process-group cleanup does not contain descendants that change groups/sessions;
the parent-death signal covers the worker, not arbitrary descendants. Windows Job
assignment occurs while a trusted worker waits for the gate; it is not suspended
creation or an AppContainer. A crash before assignment and arbitrary descendant
parent-death guarantees remain unresolved. Cleanup and rlimits are not a sandbox.

Hostile filesystem acquisition still needs a qualified broker: symlink/reparse-point
races, file mutation, atomic capture, source authorization and path disclosure are
not solved here. Deadlines on the existing in-process trusted 0.2 pipeline remain
cooperative. Parser selection, independent parser-security qualification, extraction
contracts and untrusted enablement each require separate acceptance gates. No
scientific validation, security certification or release approval follows from B1.

## Reproducible validation

Install the Lite package and SDK, then run:

```text
python -m unittest discover -s plugins/semantiq-lite/tests -v
python -m pytest -q plugins/semantiq-lite/tests packages/python/tests/test_semantiq_lite_integration.py
python -m mypy --ignore-missing-imports plugins/semantiq-lite/src
python plugins/semantiq-lite/tools/worker_wheel_smoke.py
```

Use `PYTHONUTF8=1` for the existing CLI's Persian smoke on Windows. Tests use bounded
trusted fixtures, not malicious PDF/HTML. They check immutable identity, protocol
mutations, oversize/truncated data, deadlines/blocked pipes, environment/descriptor
inheritance, guarded memory/CPU workloads, ordinary descendants, single-worker
parent death, failed cleanup quarantine and fail-closed entry points. Native Windows
skips the Linux descriptor and CPU probes; native Linux and WSL are identified
separately in CI/test output. No skipped control counts as observed enforcement.
