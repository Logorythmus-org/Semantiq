# SemantIQ Sandbox Specification: Sandbox Benchmark DSL and Declarative Scenario Architecture

**Version**: 1.0.0  
**Phase**: Sandbox Phase (Prompt 46)  
**Status**: Approved Specification  
**Date**: 2026-08-15

---

## 1. Executive Summary

Declaring complex sandbox benchmark scenarios requires defining environment specifications, actor roles, tool capabilities, failure perturbations, multi-phase milestones, assertions, and lifecycle teardown rules. Without a unified, declarative domain-specific language (DSL), benchmark definitions become fragmented across disparate scripts and proprietary provider formats, undermining reproducibility, portability, and independent verification.

SemantIQ evaluates agent reasoning and observable behavior across the standard pipeline:
$$\text{Benchmark} \longrightarrow \text{Scenario} \longrightarrow \text{Execution Contract} \longrightarrow \text{Provider Router} \longrightarrow \text{Provider Adapter} \longrightarrow \text{Runtime} \longrightarrow \text{Observation} \longrightarrow \text{Evidence} \longrightarrow \text{Evaluation} \longrightarrow \text{Report}$$

This specification establishes the **Sandbox Benchmark DSL Architecture**:

1. **Declarative DSL Grammar**: Defines [`SandboxBenchmarkDSL`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/benchmark-dsl.ts#L86-L98) in JSON/YAML spanning 9 comprehensive blocks: `metadata`, `environment`, `actors`, `tools`, `perturbations`, `milestones`, `assertions`, `lifecycle`, and `extensions`.
2. **Provider Neutrality & Namespaced Extensions**: Isolates provider-specific configurations within `extensions.<provider_id>`, preventing provider lock-in and keeping canonical benchmark semantics portable.
3. **Compiler & Semantic Validator**: Implements [`SandboxBenchmarkCompiler`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/benchmark-dsl.ts#L107-L188) to validate structural and semantic consistency (tool bindings, step budget constraints, assertion weights) and compile declarative documents into canonical [`EnvironmentSpec`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/types.ts#L8-L23) and [`ExecutionRequest`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/types.ts#L25-L33) execution contracts.
4. **Deterministic Canonical Digest**: Computes cryptographic SHA-256 digests over canonical JSON representations of the scenario manifest.
5. **Strict Observable Behavioral Grounding**: Evaluates behavior strictly across the canonical sequence:
   $$\text{Context} \longrightarrow \text{Interpretation} \longrightarrow \text{Decision} \longrightarrow \text{Action} \longrightarrow \text{Result} \longrightarrow \text{Consequence} \longrightarrow \text{Recovery}$$
   without claiming access to hidden cognition or internal model states.

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                               Declarative Sandbox Benchmark DSL                             |
|  [YAML / JSON Manifest: Metadata, Environment, Actors, Tools, Milestones, Assertions]       |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
                                                ▼
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                             Sandbox Benchmark Compiler & Validator                          |
|  • Semantic Validation: Tool references, budget boundaries, assertion weight sums           |
|  • Isolates Provider Extensions: extensions.docker, extensions.fly, etc.                    |
|  • Generates Canonical SHA-256 Digest for Provenance & Immutability                         |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
                                                ▼
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                           Provider-Neutral Compiled Execution Contract                      |
|  • EnvironmentSpec (Container/MicroVM/Process, CPU, Memory, Disk, Network)                  |
|  • ExecutionRequest (Setup commands, Timeouts, Metadata, Tracking Hooks)                    |
|  • Executable by ANY compliant Sandbox Execution Provider (Local, Community, Commercial)    |
+─────────────────────────────────────────────────────────────────────────────────────────────+
```

---

## 2. Inputs & Prior Decisions

This specification synthesizes and standardizes the capabilities established in prior Sandbox-phase modules:

- **Prompt 31–36**: Provider ecosystem model, canonical provider registry, trust tiers, and attribution.
- **Prompt 37–38**: Holistic execution cost accounting and verifiable execution receipts.
- **Prompt 39**: Portable Evidence Package and 7-stage behavioral chain observation.
- **Prompt 40–42**: Transition phenomena sweeps, semantic stress environments, and failure injection plans.
- **Prompt 43–45**: Recovery resilience scorecards, consequence testing, and long-horizon multi-phase milestones.

---

## 3. Scope and Non-Goals

### 3.1 In Scope

- **Declarative DSL Definition**: Complete specification of [`SandboxBenchmarkDSL`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/benchmark-dsl.ts#L86-L98) and schema [`sandbox-benchmark-dsl.schema.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/schemas/sandbox-benchmark-dsl.schema.json).
- **Semantic Compiler Engine**: Validating cross-field references, budgets, and synthesizing executable contracts.
- **Provider Extension Namespacing**: Standardizing the `extensions` block for optional provider-specific optimizations.
- **Observable Assertion Engine**: Defining deterministic and statistical evaluation criteria.

### 3.2 Non-Goals

- **No Proprietary Runtime Bundling**: SemantIQ compiles the DSL into contracts; runtime provisioning remains the provider's responsibility.
- **No Claims on Hidden Cognition**: Assertions evaluate observable shell commands, file diffs, and test reports.

---

## 4. Architecture & Responsibility Separation

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                 SEMANTIQ-OWNED RESPONSIBILITIES                             |
|  • DSL Grammar, JSON Schemas, and Compiler (SandboxBenchmarkCompiler)                       |
|  • Cross-field Semantic Validation & Error Reporting                                        |
|  • Canonical Digest Generation & Scenario Provenance Sealing                                |
|  • Compiling Standardized EnvironmentSpec and ExecutionRequest Contracts                    |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │ (Standardized Sandbox Execution Contracts)
+───────────────────────────────────────────────▼─────────────────────────────────────────────+
|                                 PROVIDER-OWNED RESPONSIBILITIES                             |
|  • Ingesting EnvironmentSpec and Spawning the Target Isolation Environment                 |
|  • Enforcing Declared Network Policies (Isolated / Egress Allowlist)                       |
|  • Executing Tool Calls and Returning Raw Behavioral Telemetry Streams                      |
+─────────────────────────────────────────────────────────────────────────────────────────────+
```

---

## 5. Interfaces, API, and DSL Specification

### 5.1 TypeScript DSL Definitions ([`packages/sandbox-contracts/src/benchmark-dsl.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/benchmark-dsl.ts))

```typescript
export interface SandboxBenchmarkDSL {
  readonly dslVersion: "1.0.0";
  readonly metadata: DSLMetadata;
  readonly environment: DSLEnvironment;
  readonly actors: readonly DSLActor[];
  readonly tools: readonly DSLToolDefinition[];
  readonly perturbations?: readonly DSLPerturbation[];
  readonly milestones?: readonly DSLMilestone[];
  readonly assertions: readonly DSLAssertion[];
  readonly lifecycle: DSLLifecycle;
  readonly extensions?: Record<string, Record<string, unknown>>;
}

export interface CompiledBenchmarkContract {
  readonly scenarioId: string;
  readonly environmentSpec: EnvironmentSpec;
  readonly executionRequest: ExecutionRequest;
  readonly canonicalDigest: string;
  readonly compiledAt: string;
}
```

### 5.2 Example Benchmark DSL Declaration (`scenario.yaml`)

```yaml
dslVersion: "1.0.0"
metadata:
  benchmarkId: "semantiq-code-refactor-v1"
  scenarioId: "scenario-async-migrator-01"
  version: "1.2.0"
  title: "Async I/O Migration and Distributed Concurrency Refactor"
  description: "Migrate synchronous Flask web application to FastAPI with async motor MongoDB driver."
  tags: ["python", "fastapi", "async", "refactor", "stress"]
  license: "Apache-2.0"
  author: "SemantIQ Architecture Guild"

environment:
  runtimeType: "container"
  baseImage: "python:3.11-slim"
  resources:
    cpuCores: 2
    memoryMb: 4096
    diskGb: 10
  networkPolicy: "EGRESS_ALLOWLIST"
  egressAllowlist:
    - "pypi.org"
    - "files.pythonhosted.org"
  envVars:
    PYTHONPATH: "/workspace"
    ENVIRONMENT: "test"
  preinstalledPackages:
    - "pytest"
    - "httpx"
    - "motor"

actors:
  - actorId: "primary-agent"
    role: "PRIMARY_AGENT"
    allowedTools: ["bash_tool", "file_editor", "test_runner"]
    permissionLevel: "SANDBOX_USER"

tools:
  - name: "bash_tool"
    type: "BASH"
    description: "Execute shell commands inside sandbox container"
    timeoutMs: 30000
  - name: "file_editor"
    type: "FILE_SYSTEM"
    description: "Read and edit source code files"
    timeoutMs: 5000
  - name: "test_runner"
    type: "BASH"
    description: "Execute pytest suite"
    timeoutMs: 60000

milestones:
  - milestoneId: "ms-01"
    phase: "DISCOVERY_AND_RECON"
    description: "Audit synchronous blocking endpoints"
    stepBudget: 10
    requiredArtifacts: ["AUDIT.md"]
  - milestoneId: "ms-02"
    phase: "INCREMENTAL_IMPLEMENTATION"
    description: "Convert routes to async def and update motor queries"
    stepBudget: 25
    requiredArtifacts: ["app/main.py"]
  - milestoneId: "ms-03"
    phase: "INTEGRATION_AND_TESTING"
    description: "Run async pytest suite and verify 100% pass"
    stepBudget: 15
    requiredArtifacts: ["tests/test_async.py"]

assertions:
  - assertionId: "assert-test-pass"
    type: "TEST_SUITE_PASSES"
    params:
      suitePath: "tests/test_async.py"
    weight: 0.7
  - assertionId: "assert-rri"
    type: "RRI_THRESHOLD"
    params:
      minRRI: 0.8
    weight: 0.3

lifecycle:
  setupCommands:
    - "pip install -r requirements.txt"
    - "python init_db.py"
  maxDurationSeconds: 1800
  totalStepBudget: 50
  retryBudget: 2
  teardownCommands:
    - "rm -rf /tmp/*"

extensions:
  docker:
    cgroupParent: "semantiq-benchmarks"
    securityOpt: ["no-new-privileges:true"]
```

---

## 6. Schemas & Versioning

- **[`schemas/sandbox-benchmark-dsl.schema.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/schemas/sandbox-benchmark-dsl.schema.json)**: Formal Draft 2020-12 JSON Schema validating all top-level blocks, enumerated types, and nested constraints.
- **Exported Schemas**: [`packages/sandbox-contracts/src/schemas.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/schemas.ts) exports `sandboxBenchmarkDSLSchema`.
- **Versioning Policy**: Semantic versioning (`1.0.0`). Backward-compatible additions allow optional blocks; major version increments handle structural schema changes.

---

## 7. Lifecycle and State Machine

```
+─────────────+       Validate       +───────────+       Compile       +────────────+
| DSL Manifest| ───────────────────> | Validated | ──────────────────> | Compiled   |
| (YAML/JSON) |                      | AST       |                     | Contract   |
+─────────────+                      +───────────+                     +────────────+
       │                                                                      │
       │ (Validation Error)                                                   │ (Execute)
       ▼                                                                      ▼
+─────────────+                                                        +────────────+
| Compilation |                                                        | Provider   |
| Error Log   |                                                        | Runtime    |
+─────────────+                                                        +────────────+
```

---

## 8. Security, Privacy, and Trust Posture

1. **Least-Privilege Actor Model**: Actors declare explicit `permissionLevel` (`SANDBOX_USER`, `SUDO_ROOT`, `RESTRICTED_READONLY`). Root privileges are restricted by default.
2. **Network Egress Enclosure**: Network policies default to `ISOLATED` or `EGRESS_ALLOWLIST`, preventing exfiltration of proprietary benchmark assets or evaluation data.
3. **Canonical Digest Provenance**: The compiler computes a SHA-256 digest of the canonical JSON string, ensuring that benchmark scenarios cannot be modified post-issuance without detection.

---

## 9. Provider Compatibility

| Execution Provider        | EnvironmentSpec Compatibility   | Extensions Support                  | Deployment Mode           |
| :------------------------ | :------------------------------ | :---------------------------------- | :------------------------ |
| **Docker (Local)**        | Native Container Image & Mounts | `extensions.docker`                 | Local Open-Source         |
| **Podman / Rootless**     | Rootless Container Isolation    | `extensions.podman`                 | Local / Community         |
| **Firecracker / MicroVM** | Hardware-Isolated MicroVM       | `extensions.firecracker`            | Self-Hosted High Security |
| **Fly.io / Modal / E2B**  | Managed Ephemeral MicroVM       | `extensions.e2b` / `extensions.fly` | Managed Commercial        |

---

## 10. Failure Modes & Resilience Strategies

| Failure Mode                   | Root Cause                          | Impact            | Automated Recovery Action                                     |
| :----------------------------- | :---------------------------------- | :---------------- | :------------------------------------------------------------ |
| **Undeclared Tool Call**       | Actor invokes tool not in manifest  | Tool RPC Error    | Compiler blocks compilation at validation phase               |
| **Step Budget Overflow**       | Sum of milestones > totalStepBudget | Premature Timeout | Compiler flags validation error; rejects manifest             |
| **Assertion Weight Drift**     | Weights sum to > 1.0                | Score distortion  | Compiler enforces $\sum \text{weight}_i \le 1.0$              |
| **Extension Misconfiguration** | Provider ignores invalid extension  | Local crash       | Providers ignore unparseable namespaced extension keys safely |

---

## 11. Testing Strategy & Verification

The Sandbox Benchmark DSL architecture is validated through automated test suites:

1. **DSL Compiler & Validation Unit Tests ([`tests/unit/benchmark-dsl.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/unit/benchmark-dsl.test.ts))**:
   - Validates well-formed declarative scenario DSL documents.
   - Compiles DSL into executable `EnvironmentSpec` and `ExecutionRequest` contracts.
   - Verifies SHA-256 canonical digest computation.
   - Validates error detection for undeclared tools and budget overflow.
2. **Contract Schema Conformance Tests ([`tests/contracts/sandbox-contracts.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/contracts/sandbox-contracts.test.ts))**:
   - Validates Draft 2020-12 JSON Schema compliance for `sandboxBenchmarkDSLSchema`.

---

## 12. Acceptance Criteria

- [x] Declarative DSL grammar covers metadata, environment, actors, tools, perturbations, milestones, assertions, lifecycle, and provider extensions.
- [x] Namespaced provider extensions (`extensions.<provider_id>`) prevent provider lock-in.
- [x] `SandboxBenchmarkCompiler` validates semantic consistency and compiles executable contracts.
- [x] SHA-256 canonical digest generation guarantees scenario immutability and provenance.
- [x] Zero third-party runtime code or proprietary SDKs are copied into SemantIQ Core.
- [x] All 151 test files (512+ passing tests) pass cleanly with zero regressions.

---

## 13. Risks, Trade-Offs, and Open Questions

- **Trade-Off: Strict Tool Declarations vs. Dynamic Discovery**: Requiring all tools to be declared in DSL prevents dynamic ad-hoc tool creation.  
  _Mitigation_: Support dynamic tool spawning under an explicitly declared `meta_tool_spawner` capability.
- **Open Question**: Cross-compiling Sandbox Benchmark DSL into standard OCI compose and Kubernetes manifests.

---

## 14. Architecture Decision Record

### [ADR-0146: Sandbox Benchmark DSL and Declarative Scenario Specification](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/adr/ADR-0146-sandbox-benchmark-dsl.md)

- **Status**: Accepted
- **Date**: 2026-08-15
- **Decision**: Standardize `SandboxBenchmarkDSL` schema, implement `SandboxBenchmarkCompiler`, isolate provider extensions under namespaced keys, and synthesize provider-neutral `EnvironmentSpec` and `ExecutionRequest` contracts.
- **Consequences**: Enables authoring human-readable, machine-verifiable, and completely portable benchmark scenarios across any compliant execution provider.

---

## 15. Generated & Modified Artifact List

1. **Contracts & Compiler Engine**: [`packages/sandbox-contracts/src/benchmark-dsl.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/benchmark-dsl.ts)
2. **Schema Definition**: [`schemas/sandbox-benchmark-dsl.schema.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/schemas/sandbox-benchmark-dsl.schema.json)
3. **Contracts Index**: [`packages/sandbox-contracts/src/index.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/index.ts)
4. **Schemas Export**: [`packages/sandbox-contracts/src/schemas.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/schemas.ts)
5. **Unit Tests**: [`tests/unit/benchmark-dsl.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/unit/benchmark-dsl.test.ts)
6. **Contract Tests**: [`tests/contracts/sandbox-contracts.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/contracts/sandbox-contracts.test.ts)
7. **Specification**: [`Docs/sandbox/SANDBOX_BENCHMARK_DSL_SPEC.md`](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/sandbox/SANDBOX_BENCHMARK_DSL_SPEC.md)
8. **ADR Record**: [`Docs/adr/ADR-0146-sandbox-benchmark-dsl.md`](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/adr/ADR-0146-sandbox-benchmark-dsl.md)
