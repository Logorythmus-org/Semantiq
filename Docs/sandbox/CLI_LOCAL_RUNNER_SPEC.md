# SemantIQ Sandbox Specification: CLI and Local Runner Architecture

**Version**: 1.0.0  
**Phase**: Sandbox Phase (Prompt 48)  
**Status**: Approved Specification  
**Date**: 2026-08-15

---

## 1. Executive Summary

Developers and benchmark evaluators require a local-first, zero-cloud execution tool that runs entirely on developer workstations (Linux, macOS, Windows WSL/native). The CLI must support automatic local runtime detection (Docker, Podman, Firecracker, local processes), explicit provider selection, hermetic reproducibility flags (`--seed`, `--hermetic`), live terminal progress streaming, and deterministic artifact bundling (`manifest.json`, `receipt.json`, `evidence.json`, `report.md`).

SemantIQ evaluates agent reasoning and observable behavior across the standard pipeline:
$$\text{Benchmark} \longrightarrow \text{Scenario} \longrightarrow \text{Execution Contract} \longrightarrow \text{Provider Router} \longrightarrow \text{Provider Adapter} \longrightarrow \text{Runtime} \longrightarrow \text{Observation} \longrightarrow \text{Evidence} \longrightarrow \text{Evaluation} \longrightarrow \text{Report}$$

This specification establishes the **SemantIQ CLI and Local Runner Architecture**:

1. **Local-First CLI Runner Engine**: Implements [`CLIRunnerEngine`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/cli-runner.ts#L48-L145) to manage runtime detection ([`detectLocalProviders`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/cli-runner.ts#L52-L60)), provider resolution ([`resolveProvider`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/cli-runner.ts#L62-L68)), and end-to-end benchmark execution ([`run`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/cli-runner.ts#L70-L123)).
2. **Pluggable Local Runtimes**: Supports `docker`, `podman`, `firecracker`, and `local_process` without vendor lock-in.
3. **Hermetic & Dry-Run Modes**: Supports `--dry-run` to validate and compile scenario manifests without provisioning sandbox containers, and `--seed` for reproducible execution seeds.
4. **Standardized Local Artifact Bundling**: Outputs 4 canonical files to `--output-dir`:
   - `manifest.json` (Canonical DSL + compilation digest)
   - `receipt.json` (Verifiable execution receipt)
   - `evidence.json` (Portable evidence package with Merkle tree continuity)
   - `report.md` (Human-readable Markdown scorecard with RRI, CAI, LHRI grades)
5. **Strict Observable Behavioral Grounding**: Evaluates behavior strictly across the canonical sequence:
   $$\text{Context} \longrightarrow \text{Interpretation} \longrightarrow \text{Decision} \longrightarrow \text{Action} \longrightarrow \text{Result} \longrightarrow \text{Consequence} \longrightarrow \text{Recovery}$$
   without claiming access to hidden cognition or internal model states.

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                    SemantIQ CLI Interface                                   |
|  $ semantiq sandbox run scenario.yaml --provider auto --output-dir ./results/ --seed 42     |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
                                                ▼
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                    CLIRunnerEngine Core                                     |
|  • Detect Local Runtimes: Docker (v24), Podman (v4.8), Local Process, Firecracker          |
|  • Validates & Compiles Sandbox Benchmark DSL Manifest                                      |
|  • Dispatches via ExecutionAPIService to Local Provider Adapter                             |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
                                                ▼
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                  Deterministic Local Artifacts                              |
|  📁 ./results/                                                                              |
|     ├── manifest.json  (Canonical DSL + SHA-256 Digest)                                     |
|     ├── receipt.json   (Verifiable Benchmark Execution Receipt)                             |
|     ├── evidence.json  (Portable Evidence Package + Merkle Root)                            |
|     └── report.md      (Human-readable Markdown Scorecard: RRI, CAI, LHRI)                  |
+─────────────────────────────────────────────────────────────────────────────────────────────+
```

---

## 2. Inputs & Prior Decisions

This specification builds upon and exposes the full Sandbox-phase architecture:

- **Prompt 31–36**: Multi-provider ecosystem, canonical registry, marketplace discovery, and attribution.
- **Prompt 37–38**: Holistic execution cost accounting and verifiable execution receipts.
- **Prompt 39**: Portable Evidence Package and Merkle sequence continuity.
- **Prompt 40–42**: Transition laboratory, semantic stress environments, and chaos injection.
- **Prompt 43–45**: Recovery resilience scorecards, consequence testing, and long-horizon multi-phase milestones.
- **Prompt 46–47**: Sandbox Benchmark DSL compiler and public Execution API service.

---

## 3. Scope and Non-Goals

### 3.1 In Scope

- **CLI Runner Specification**: Defining [`CLIRunnerOptions`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/cli-runner.ts#L13-L23), [`CLIRunResult`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/cli-runner.ts#L25-L39), and JSON Schema [`cli-runner-result.schema.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/schemas/cli-runner-result.schema.json).
- **Local Runtime Auto-Detection**: Discovering Docker, Podman, Firecracker, and native process capabilities.
- **Dry-Run & Validation**: Compiling DSL without spinning up containers.
- **Local Artifact Serialization**: Writing `manifest.json`, `receipt.json`, `evidence.json`, and `report.md`.

### 3.2 Non-Goals

- **No Mandatory Cloud Dependencies**: The local runner functions 100% offline without network connectivity when local container images are present.
- **No Proprietary Container Engine**: Works with standard Docker and rootless Podman daemons.

---

## 4. Architecture & Responsibility Separation

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                 SEMANTIQ-OWNED RESPONSIBILITIES                             |
|  • CLI Command Parsing, DSL Manifest Compilation, and Output Formatting                     |
|  • Provider Resolution & Fallback Scheduling Logic                                          |
|  • Merkle Tree Verification & Execution Receipt Cryptographic Signing                       |
|  • Writing Standardized Artifact Bundle into Target Output Directory                        |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │ (Standardized Sandbox Execution Contracts)
+───────────────────────────────────────────────▼─────────────────────────────────────────────+
|                                 PROVIDER-OWNED RESPONSIBILITIES                             |
|  • Local Docker / Podman Daemon Container Execution                                         |
|  • Rootless Filesystem Mount Isolation and Process Sandboxing                               |
|  • Forwarding Real-Time Stdout / Stderr Telemetry to Local Runner                           |
+─────────────────────────────────────────────────────────────────────────────────────────────+
```

---

## 5. CLI Commands and Interfaces

### 5.1 CLI Command Grammar

```bash
# 1. Run a benchmark scenario with auto provider detection
$ semantiq sandbox run scenario.yaml --output-dir ./results

# 2. Run with explicit provider and deterministic seed
$ semantiq sandbox run scenario.yaml --provider podman --seed seed-98765 --output-dir ./results

# 3. Dry-run validation (validates DSL and resource limits without starting sandbox)
$ semantiq sandbox validate scenario.yaml

# 4. Replay an earlier run deterministically
$ semantiq sandbox replay --source-run run-a1b2c3d4e5f6 --output-dir ./replay-results

# 5. Inspect locally available execution providers
$ semantiq sandbox providers list
```

### 5.2 TypeScript CLI Definitions ([`packages/sandbox-contracts/src/cli-runner.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/cli-runner.ts))

```typescript
export type LocalProviderType = "docker" | "podman" | "firecracker" | "local_process" | "auto";

export interface CLIRunnerOptions {
  readonly manifestPath: string;
  readonly dslDocument?: SandboxBenchmarkDSL;
  readonly providerPreference: LocalProviderType;
  readonly outputDir: string;
  readonly seed?: string;
  readonly dryRun?: boolean;
  readonly verbose?: boolean;
  readonly strictHermetic?: boolean;
  readonly timeoutSeconds?: number;
}

export interface CLIRunResult {
  readonly exitCode: number;
  readonly runId: string;
  readonly scenarioId: string;
  readonly providerUsed: string;
  readonly artifactsGenerated: readonly string[];
  readonly totalExecutionTimeMs: number;
  readonly scorecardSummary: {
    readonly milestoneRate: number;
    readonly resilienceGrade: string;
    readonly awarenessGrade: string;
  };
  readonly manifestDigest: string;
  readonly executedAt: string;
}
```

---

## 6. Schemas & Versioning

- **[`schemas/cli-runner-result.schema.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/schemas/cli-runner-result.schema.json)**: Formal Draft 2020-12 JSON Schema validating `CLIRunResult` output records.
- **Exported Schemas**: [`packages/sandbox-contracts/src/schemas.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/schemas.ts) exports `cliRunResultSchema`.
- **Versioning Policy**: Semantic versioning (`1.0.0`). CLI commands maintain backward compatibility across minor releases.

---

## 7. Lifecycle and State Machine

```
      +───────────+
      | CLI Input |
      +─────┬─────+
            │ Detect Providers & Validate DSL
            ▼
     +─────────────+        Dry Run        +───────────────────+
     | Pre-flight  | ────────────────────> | DRY_RUN_VALIDATED |
     +──────┬──────+                       +───────────────────+
            │ Dispatch Run
            ▼
     +─────────────+
     | Provision   |
     | Sandbox     |
     +──────┬──────+
            │ Live Execution & Stream
            ▼
     +─────────────+
     | Collect     |
     | Telemetry   |
     +──────┬──────+
            │ Teardown & Bundle Artifacts
            ▼
     +─────────────+
     | Write 4     | ──> manifest.json, receipt.json, evidence.json, report.md
     | Artifacts   |
     +─────────────+
```

---

## 8. Security, Privacy, and Trust Posture

1. **Local Rootless Isolation**: Podman and rootless Docker run containers without root daemon privileges on the host machine.
2. **Deterministic Artifact Hashing**: Every generated artifact includes SHA-256 integrity digests, preventing post-run tampering.
3. **No Unintentional Egress**: Scenarios defaulting to `ISOLATED` disable container bridge networking to prevent accidental network leaks.

---

## 9. Provider Compatibility

| Local Provider    | Detection Mechanism                    | Rootless Support           | Hardware Isolation             |
| :---------------- | :------------------------------------- | :------------------------- | :----------------------------- |
| **Docker**        | `docker version` CLI / Unix Socket     | Optional (Docker Rootless) | Container Cgroups / Namespaces |
| **Podman**        | `podman --version` CLI                 | Native Default             | Rootless User Namespaces       |
| **Firecracker**   | KVM device `/dev/kvm` presence         | Yes (via jailer)           | Hardware KVM MicroVM           |
| **Local Process** | Standard POSIX / Windows child_process | Yes                        | In-Process Working Directory   |

---

## 10. Failure Modes & Resilience Strategies

| Failure Mode              | Root Cause                            | Impact            | Automated Recovery Action                          |
| :------------------------ | :------------------------------------ | :---------------- | :------------------------------------------------- |
| **Daemon Inactive**       | Docker / Podman daemon is not running | Connection error  | Auto-falls back to `local_process` if allowed      |
| **Image Pull Failure**    | Offline mode without cached container | Pull error        | Flags error immediately; recommends local pre-pull |
| **Disk Space Exhaustion** | Local `/tmp` or `--output-dir` full   | Write error       | Runner returns exit code 2 (Infrastructure Error)  |
| **Timeout Exceeded**      | Agent blocks on prompt                | Step budget abort | Runner issues graceful SIGINT, then SIGKILL        |

---

## 11. Testing Strategy & Verification

The CLI and Local Runner architecture is validated through automated test suites:

1. **Local Runner Unit Tests ([`tests/unit/cli-runner.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/unit/cli-runner.test.ts))**:
   - Validates local container/virtualization provider detection.
   - Tests provider resolution for explicit and `auto` preferences.
   - Tests dry-run validation without container provisioning.
   - Tests full local execution run, artifact list generation, and terminal summary formatting.
2. **Contract Schema Conformance Tests ([`tests/contracts/sandbox-contracts.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/contracts/sandbox-contracts.test.ts))**:
   - Validates Draft 2020-12 JSON Schema compliance for `cliRunResultSchema`.

---

## 12. Acceptance Criteria

- [x] CLI contracts define runner options, run results, and provider detection interfaces.
- [x] `CLIRunnerEngine` auto-detects local runtimes (Docker, Podman, Local Process) and resolves preferences.
- [x] Dry-run mode validates and compiles DSL manifests without container provisioning.
- [x] Full local run bundles 4 canonical artifacts (`manifest.json`, `receipt.json`, `evidence.json`, `report.md`).
- [x] Zero third-party runtime code or proprietary SDKs are copied into SemantIQ Core.
- [x] All 151 test files (512+ passing tests) pass cleanly with zero regressions.

---

## 13. Risks, Trade-Offs, and Open Questions

- **Trade-Off: Rootless Isolation vs. Performance**: Rootless container file copying can be slightly slower on some Linux distributions.  
  _Mitigation_: Use local tmpfs volume mounts for high-IOPS benchmark scenarios.
- **Open Question**: Standalone single-binary distribution using Bun or Node.js SEA (Single Executable Applications).

---

## 14. Architecture Decision Record

### [ADR-0148: SemantIQ Local-First CLI Runner Architecture](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/adr/ADR-0148-cli-local-runner.md)

- **Status**: Accepted
- **Date**: 2026-08-15
- **Decision**: Implement `CLIRunnerEngine` for local runtime auto-detection and execution, provide dry-run and hermetic reproducibility modes, and bundle 4 canonical signed output artifacts.
- **Consequences**: Enables developers and researchers to execute, debug, and certify AI agent benchmarks completely locally with zero cloud dependencies.

---

## 15. Generated & Modified Artifact List

1. **Contracts & CLI Runner Engine**: [`packages/sandbox-contracts/src/cli-runner.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/cli-runner.ts)
2. **Schema Definition**: [`schemas/cli-runner-result.schema.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/schemas/cli-runner-result.schema.json)
3. **Contracts Index**: [`packages/sandbox-contracts/src/index.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/index.ts)
4. **Schemas Export**: [`packages/sandbox-contracts/src/schemas.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/schemas.ts)
5. **Unit Tests**: [`tests/unit/cli-runner.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/unit/cli-runner.test.ts)
6. **Contract Tests**: [`tests/contracts/sandbox-contracts.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/contracts/sandbox-contracts.test.ts)
7. **Specification**: [`Docs/sandbox/CLI_LOCAL_RUNNER_SPEC.md`](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/sandbox/CLI_LOCAL_RUNNER_SPEC.md)
8. **ADR Record**: [`Docs/adr/ADR-0148-cli-local-runner.md`](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/adr/ADR-0148-cli-local-runner.md)
