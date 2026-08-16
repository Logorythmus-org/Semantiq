# ADR-0148: SemantIQ Local-First CLI Runner Architecture

**Status**: Accepted  
**Date**: 2026-08-15

---

## Context

Developers and benchmark evaluators require a local-first, zero-cloud execution tool that runs entirely on developer workstations (Linux, macOS, Windows WSL/native). The CLI must support automatic local runtime detection (Docker, Podman, Firecracker, local processes), explicit provider selection, hermetic reproducibility flags (`--seed`, `--hermetic`), live terminal progress streaming, and deterministic artifact bundling (`manifest.json`, `receipt.json`, `evidence.json`, `report.md`).

To provide a seamless developer experience without mandating external cloud services, SemantIQ requires a canonical CLI and Local Runner architecture.

---

## Decision

1. **Local-First CLI Runner Engine**: Implement `CLIRunnerEngine` to manage provider auto-detection (`detectLocalProviders`), provider resolution (`resolveProvider`), and end-to-end benchmark execution (`run`).
2. **Pluggable Local Runtimes**: Support `docker`, `podman`, `firecracker`, and `local_process` without vendor lock-in.
3. **Hermetic & Dry-Run Modes**: Support `--dry-run` to validate and compile scenario manifests without provisioning sandbox containers, and `--seed` for reproducible execution seeds.
4. **Standardized Local Artifact Bundling**: Output 4 canonical files to `--output-dir`:
   - `manifest.json` (Canonical DSL + compilation digest)
   - `receipt.json` (Verifiable execution receipt)
   - `evidence.json` (Portable evidence package with Merkle tree continuity)
   - `report.md` (Human-readable Markdown scorecard with RRI, CAI, LHRI grades)
5. **Observable Terminal UI**: Render terminal summaries showing exit codes, manifest digests, execution times, and multi-tier resilience grades.
6. **Observable Behavioral Grounding**: Invariant: All local telemetry streams reflect observable `BehavioralTraceEvent` actions and outputs without speculative claims on internal cognition.

---

## Consequences

- Researchers can evaluate agents entirely offline with zero cloud credentials or vendor lock-in.
- Works out of the box with existing developer Docker or Podman installations.
- Guarantees 100% reproducible execution receipts and evidence packages on local hardware.
