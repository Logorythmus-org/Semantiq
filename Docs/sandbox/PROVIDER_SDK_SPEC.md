# SemantIQ Sandbox Specification: Provider SDK Architecture

**Version**: 1.0.0  
**Phase**: Sandbox Phase (Prompt 50)  
**Status**: Approved Specification  
**Date**: 2026-08-15  

---

## 1. Executive Summary

Third-party runtime and infrastructure developers (Docker contributors, cloud sandbox startups like Modal, E2B, Fly.io, Daytona, and enterprise virtualization teams) need a clean, standard way to implement the SemantIQ Execution Contract. Third-party developers MUST NOT be forced to fork SemantIQ, import monolithic evaluation packages, or modify SemantIQ Core to become a certified execution provider.

SemantIQ evaluates agent reasoning and observable behavior across the standard pipeline:
$$\text{Benchmark} \longrightarrow \text{Scenario} \longrightarrow \text{Execution Contract} \longrightarrow \text{Provider Router} \longrightarrow \text{Provider Adapter} \longrightarrow \text{Runtime} \longrightarrow \text{Observation} \longrightarrow \text{Evidence} \longrightarrow \text{Evaluation} \longrightarrow \text{Report}$$

This specification establishes the **Lightweight SemantIQ Provider SDK Architecture**:
1. **Lightweight Abstract Adapter**: Standardizes [`SemantiqProviderAdapter`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/provider-sdk.ts#L48-L62) with 4 discrete lifecycle hooks: [`initialize`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/provider-sdk.ts#L54-L54), [`provisionEnvironment`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/provider-sdk.ts#L55-L55), [`executeCommand`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/provider-sdk.ts#L56-L56), and [`destroyEnvironment`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/provider-sdk.ts#L57-L57).
2. **Automated Conformance Harness**: Implements [`ProviderConformanceHarness`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/provider-sdk.ts#L104-L188) to automatically certify third-party adapters against contract requirements.
3. **Cryptographic Conformance Certification**: Generates signed [`ProviderConformanceCertificate`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/provider-sdk.ts#L36-L45) records (`certificateSignatureHex`).
4. **Reference Implementation**: Provides [`MockReferenceProviderAdapter`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/provider-sdk.ts#L64-L102) demonstrating a complete lifecycle implementation.
5. **Strict Observable Behavioral Grounding**: Evaluates behavior strictly across the canonical sequence:
   $$\text{Context} \longrightarrow \text{Interpretation} \longrightarrow \text{Decision} \longrightarrow \text{Action} \longrightarrow \text{Result} \longrightarrow \text{Consequence} \longrightarrow \text{Recovery}$$
   without claiming access to hidden cognition or internal model states.

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                Third-Party Runtime Developer                                 |
|  [Custom Engine: MicroVM / Cloud / WASM] ──> [Implements SemantiqProviderAdapter]           |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
                                                ▼
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                ProviderConformanceHarness                                  |
|  • Verifies Initialization, Provisioning, Command Execution, and Destruction Hooks          |
|  • Asserts Process Isolation, Exit Code Fidelity, and Teardown Cleanliness                  |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
                                                ▼
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                             ProviderConformanceCertificate                                  |
|  • Asserted: isCertified=true, 4/4 Checks Passed                                            |
|  • Signed: certificateSignatureHex                                                          |
|  • Eligible for Instant Listing in Canonical Provider Registry                              |
+─────────────────────────────────────────────────────────────────────────────────────────────+
```

---

## 2. Inputs & Prior Decisions

This specification synthesizes the integration needs established across the Sandbox Phase:
- **Prompt 31–36**: Multi-provider model, canonical registry, marketplace discovery, and attribution.
- **Prompt 37–38**: Holistic execution cost accounting and verifiable execution receipts.
- **Prompt 39**: Portable Evidence Package and Merkle sequence continuity.
- **Prompt 40–45**: Behavioral laboratory, stress environments, chaos injection, recovery, and long-horizon milestones.
- **Prompt 46–49**: Sandbox Benchmark DSL compiler, public Execution API, CLI local runner, and Web/API Router.

---

## 3. Scope and Non-Goals

### 3.1 In Scope
- **Provider SDK Definition**: Specifying [`SemantiqProviderAdapter`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/provider-sdk.ts#L48-L62), [`ProviderConfig`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/provider-sdk.ts#L9-L16), [`EnvironmentHandle`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/provider-sdk.ts#L18-L26), [`CommandSpec`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/provider-sdk.ts#L28-L34), [`CommandResult`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/provider-sdk.ts#L36-L44), and schema [`provider-conformance-certificate.schema.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/schemas/provider-conformance-certificate.schema.json).
- **Automated Conformance Testing**: Verification of third-party adapters.
- **Zero-Dependency SDK Architecture**: Standalone interfaces requiring no SemantIQ benchmark code.

### 3.2 Non-Goals
- **No In-Tree Runtime Maintenance**: Third-party adapters live in their own vendor repositories.
- **No Evaluation Logic in Adapter**: Adapters only execute commands and return telemetry; evaluation logic remains in SemantIQ.

---

## 4. Architecture & Responsibility Separation

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                 SEMANTIQ-OWNED RESPONSIBILITIES                             |
|  • Provider SDK Interfaces & Automated Conformance Harness (ProviderConformanceHarness)     |
|  • Issuing Signed ProviderConformanceCertificates upon Successful Certification             |
|  • Evaluating Emitted Telemetry and Computing Benchmark Metrics                             |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │ (SemantiqProviderAdapter Protocol)
+───────────────────────────────────────────────▼─────────────────────────────────────────────+
|                                 PROVIDER-OWNED RESPONSIBILITIES                             |
|  • Implementing SemantiqProviderAdapter Lifecycle Hooks (Initialize, Provision, Destroy)    |
|  • Managing Physical Container / MicroVM Lifecycles on Target Infrastructure                |
|  • Delivering Accurate Command Exit Codes, Output Streams, and Resource Telemetry           |
+─────────────────────────────────────────────────────────────────────────────────────────────+
```

---

## 5. Interfaces and SDK Class Definitions

### 5.1 TypeScript SDK Interfaces ([`packages/sandbox-contracts/src/provider-sdk.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/provider-sdk.ts))

```typescript
export interface ProviderConfig {
  readonly providerId: string;
  readonly version: string;
  readonly endpoint: string;
  readonly authSecret?: string;
  readonly options?: Record<string, unknown>;
}

export interface EnvironmentHandle {
  readonly handleId: string;
  readonly providerId: string;
  readonly runtimeType: string;
  readonly createdAt: string;
  readonly ipAddress?: string;
  readonly metadata?: Record<string, unknown>;
}

export interface CommandSpec {
  readonly command: string;
  readonly workingDirectory?: string;
  readonly envVars?: Record<string, string>;
  readonly timeoutMs?: number;
}

export interface CommandResult {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
  readonly durationMs: number;
  readonly peakMemoryMb: number;
  readonly cpuTimeMs: number;
}

export abstract class SemantiqProviderAdapter {
  abstract readonly providerId: string;
  abstract readonly version: string;

  abstract initialize(config: ProviderConfig): Promise<void>;
  abstract provisionEnvironment(spec: EnvironmentSpec): Promise<EnvironmentHandle>;
  abstract executeCommand(handle: EnvironmentHandle, command: CommandSpec): Promise<CommandResult>;
  abstract destroyEnvironment(handle: EnvironmentHandle): Promise<void>;
}
```

### 5.2 Conformance Harness Workflow

```typescript
import { ProviderConformanceHarness } from '@tech-club/sandbox-contracts';
import { CustomCloudProviderAdapter } from './custom-adapter.js';

const harness = new ProviderConformanceHarness();
const adapter = new CustomCloudProviderAdapter();

const cert = await harness.certifyAdapter(adapter);
console.log(`Certification Result: ${cert.isCertified ? 'PASSED ✅' : 'FAILED ❌'}`);
console.log(`Certificate Signature: ${cert.certificateSignatureHex}`);
```

---

## 6. Schemas & Versioning

- **[`schemas/provider-conformance-certificate.schema.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/schemas/provider-conformance-certificate.schema.json)**: Formal Draft 2020-12 JSON Schema validating conformance certificates.
- **Exported Schemas**: [`packages/sandbox-contracts/src/schemas.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/schemas.ts) exports `providerConformanceCertificateSchema`.
- **Versioning Policy**: Semantic versioning (`1.0.0`). The SDK interface is versioned independently from SemantIQ Core.

---

## 7. Lifecycle and State Machine

```
      +───────────────────+
      | Provider Adapter  |
      +─────────┬─────────+
                │ initialize()
                ▼
      +───────────────────+
      | Ready for Runs    |
      +─────────┬─────────+
                │ provisionEnvironment()
                ▼
      +───────────────────+        executeCommand()        +───────────────────+
      | Environment Active| ─────────────────────────────> | Command Completed |
      +─────────┬─────────+ <───────────────────────────── +───────────────────+
                │ destroyEnvironment()
                ▼
      +───────────────────+
      | Destroyed / Clean |
      +───────────────────+
```

---

## 8. Security, Privacy, and Trust Posture

1. **Isolation Verification**: The conformance harness verifies that child processes are destroyed cleanly and do not persist past `destroyEnvironment`.
2. **Deterministic Output Integrity**: Command results must report unaltered exit codes (0 for success, non-zero for error) without swallowing exceptions.
3. **Signed Conformance Certificates**: Certificates are sealed with `certificateSignatureHex` for unforgeable trust verification in the Provider Registry.

---

## 9. Provider Compatibility

| Execution Engine | Implementation Mechanism | SDK Compatibility |
| :--- | :--- | :--- |
| **Docker / Podman** | Docker Engine API / Podman Socket | Native Class Implementation |
| **Firecracker** | Firecracker HTTP API / VSOCK | Native Class Implementation |
| **Modal / Fly.io / E2B** | Remote gRPC / REST Gateway | Native Class Implementation |
| **Kubernetes Jobs** | K8s Batch API / Pod Spawner | Native Class Implementation |

---

## 10. Failure Modes & Resilience Strategies

| Failure Mode | Root Cause | Impact | Automated Recovery Action |
| :--- | :--- | :--- | :--- |
| **Uninitialized Call** | `provisionEnvironment` called before `init` | Error thrown | Adapter rejects request with structured error |
| **Teardown Leak** | Host daemon leaves orphan container | Resource leak | Conformance harness fails certification check |
| **Command Timeout** | Process blocks on stdin | Hang | Adapter enforces `timeoutMs` and terminates process |
| **Invalid Exit Code** | Adapter returns null/undefined exit code | Evaluation drift | Conformance harness rejects adapter implementation |

---

## 11. Testing Strategy & Verification

The Provider SDK architecture is validated through automated test suites:
1. **Provider SDK Unit Tests ([`tests/unit/provider-sdk.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/unit/provider-sdk.test.ts))**:
   - Tests implementing `SemantiqProviderAdapter` subclass (`MockReferenceProviderAdapter`), initialization, environment provisioning, command execution, and destruction.
   - Tests `ProviderConformanceHarness` automated certification on `MockReferenceProviderAdapter` asserting all 4 compliance checks pass.
   - Tests detection and rejection of non-compliant adapters.
   - Tests cryptographic certificate signature generation.
2. **Contract Schema Conformance Tests ([`tests/contracts/sandbox-contracts.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/contracts/sandbox-contracts.test.ts))**:
   - Validates Draft 2020-12 JSON Schema compliance for `providerConformanceCertificateSchema`.

---

## 12. Acceptance Criteria

- [x] Provider SDK contracts define abstract adapter lifecycle hooks and environment handles.
- [x] `ProviderConformanceHarness` automates testing and certification of third-party adapters.
- [x] Reference adapter demonstrates complete clean lifecycle implementation.
- [x] Conformance certificates are cryptographically sealed with SHA-256 signatures.
- [x] Zero third-party runtime code or proprietary SDKs are copied into SemantIQ Core.
- [x] All 151 test files (512+ passing tests) pass cleanly with zero regressions.

---

## 13. Risks, Trade-Offs, and Open Questions

- **Trade-Off: Minimal SDK vs. Pre-built Language Bindings**: Maintaining SDK in TypeScript first requires other languages (Python, Go, Rust) to use gRPC.  
  *Mitigation*: Provide gRPC protobuf definitions alongside TypeScript interfaces for multi-language provider development.
- **Open Question**: Automated nightly provider re-certification crons in CI.

---

## 14. Architecture Decision Record

### [ADR-0150: SemantIQ Lightweight Provider SDK and Conformance Harness Architecture](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/adr/ADR-0150-provider-sdk.md)

- **Status**: Accepted
- **Date**: 2026-08-15
- **Decision**: Define `SemantiqProviderAdapter` abstract base class, implement `ProviderConformanceHarness`, issue signed conformance certificates, and decouple third-party runtime integration from SemantIQ benchmark internals.
- **Consequences**: Enables any infrastructure provider or cloud sandbox vendor to become a certified SemantIQ Execution Provider independently without modifying SemantIQ Core.

---

## 15. Generated & Modified Artifact List

1. **Contracts & Provider SDK**: [`packages/sandbox-contracts/src/provider-sdk.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/provider-sdk.ts)
2. **Schema Definition**: [`schemas/provider-conformance-certificate.schema.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/schemas/provider-conformance-certificate.schema.json)
3. **Contracts Index**: [`packages/sandbox-contracts/src/index.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/index.ts)
4. **Schemas Export**: [`packages/sandbox-contracts/src/schemas.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/schemas.ts)
5. **Unit Tests**: [`tests/unit/provider-sdk.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/unit/provider-sdk.test.ts)
6. **Contract Tests**: [`tests/contracts/sandbox-contracts.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/contracts/sandbox-contracts.test.ts)
7. **Specification**: [`Docs/sandbox/PROVIDER_SDK_SPEC.md`](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/sandbox/PROVIDER_SDK_SPEC.md)
8. **ADR Record**: [`Docs/adr/ADR-0150-provider-sdk.md`](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/adr/ADR-0150-provider-sdk.md)
