# SemantIQ Sandbox Specification: Independent Observer Model

**Version**: 1.0.0  
**Phase**: Sandbox Phase (Prompt 55)  
**Status**: Approved Specification  
**Date**: 2026-08-15

---

## 1. Executive Summary

In AI evaluations, relying exclusively on agent self-reported logs or unverified execution provider metrics creates risks of self-serving bias, suppressed errors, or uncalibrated confidence. Evaluators require an independent observation system that captures out-of-band telemetry (PTY mirror, host eBPF probes, network taps, filesystem snapshot diffs) and explicitly labels each observation's evidence source and confidence score.

SemantIQ evaluates agent reasoning and observable behavior across the standard pipeline:
$$\text{Benchmark} \longrightarrow \text{Scenario} \longrightarrow \text{Execution Contract} \longrightarrow \text{Provider Router} \longrightarrow \text{Provider Adapter} \longrightarrow \text{Runtime} \longrightarrow \text{Observation} \longrightarrow \text{Evidence} \longrightarrow \text{Evaluation} \longrightarrow \text{Report}$$

This specification establishes the **SemantIQ Independent Observer Architecture**:

1. **Six-Source Evidence Classification**: Standardizes [`HOST_KERNEL_EBPF`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/independent-observer.ts#L10-L10) (1.0), [`SOCKET_PTY_MIRROR`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/independent-observer.ts#L11-L11) (1.0), [`NETWORK_BRIDGE_TAP`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/independent-observer.ts#L12-L12) (1.0), [`FILESYSTEM_SNAPSHOT_DIFF`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/independent-observer.ts#L13-L13) (0.95), [`PROVIDER_ADAPTER_API`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/independent-observer.ts#L14-L14) (0.70), and [`AGENT_SELF_REPORT`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/independent-observer.ts#L15-L15) (0.30).
2. **Host Cross-Verification**: Categorizes observations as [`VERIFIED_BY_HOST`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/independent-observer.ts#L18-L18), [`DISCREPANCY_DETECTED`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/independent-observer.ts#L19-L19), or [`UNVERIFIABLE_CLAIM`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/independent-observer.ts#L20-L20).
3. **Independent Observer Engine**: Implements [`IndependentObserverEngine`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/independent-observer.ts#L46-L157) generating cryptographically signed [`IndependentObservationBundle`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/independent-observer.ts#L32-L43) records (`observerSignatureHex`).
4. **Strict Observable Behavioral Grounding**: Evaluates behavior strictly across the canonical sequence:
   $$\text{Context} \longrightarrow \text{Interpretation} \longrightarrow \text{Decision} \longrightarrow \text{Action} \longrightarrow \text{Result} \longrightarrow \text{Consequence} \longrightarrow \text{Recovery}$$
   without claiming access to hidden cognition or internal model states.

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                    Execution Sandbox                                        |
|  [Agent Process] ──> [Provider Adapter Container / MicroVM]                                 |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
                                                ▼ (Out-of-Band Observation)
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                IndependentObserverEngine                                   |
|  • PTY Terminal Tap (Byte-accurate stdout/stderr streams)                                   |
|  • Host Kernel eBPF Probes (Real syscall, CPU, memory, OOM events)                          |
|  • Network Bridge Tap (Wire-level packet sniffer)                                           |
|  • Snapshot Diff Inspector (Ground-truth overlayfs disk changes)                            |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
                                                ▼
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                              IndependentObservationBundle                                   |
|  • Trust Score: 95.0% | Ground Truth: 100% | Discrepancies: 0                                |
|  • Observer Cryptographic Signature: observerSignatureHex                                   |
+─────────────────────────────────────────────────────────────────────────────────────────────+
```

---

## 2. Inputs & Prior Decisions

This specification integrates independent observation requirements across the Sandbox Phase:

- **Prompt 31–36**: Multi-provider model, trust verification, and terms attribution.
- **Prompt 37–38**: Holistic execution cost accounting and verifiable execution receipts.
- **Prompt 39**: Portable Evidence Package and Merkle trace immutability.
- **Prompt 40–45**: Transition laboratory, semantic stress environments, chaos injection, recovery, and long-horizon milestones.
- **Prompt 46–54**: Sandbox DSL compiler, public Execution API, CLI local runner, Web/API router, Provider SDK, Provider Certification, Security Test Suite, Benchmark Integrity, and Anti-Gaming.

---

## 3. Scope and Non-Goals

### 3.1 In Scope

- **Independent Observer Specification**: Defining [`ObservationSourceType`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/independent-observer.ts#L9-L16), [`CrossVerificationStatus`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/independent-observer.ts#L17-L21), [`IndependentObservationRecord`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/independent-observer.ts#L23-L34), [`IndependentObservationBundle`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/independent-observer.ts#L36-L47), and JSON Schema [`independent-observation-bundle.schema.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/schemas/independent-observation-bundle.schema.json).
- **Out-of-Band Telemetry Ingestion**: Capturing terminal mirrors, kernel signals, and network traces.
- **Source Trust Scoring & Discrepancy Flagging**: Computing calibrated trust scores.

### 3.2 Non-Goals

- **No Agent Introspection**: Does not inspect internal model weights or intermediate activations.
- **No Mandatory Kernel Modules**: Local runner falls back gracefully to socket mirror when root eBPF is unavailable.

---

## 4. Architecture & Responsibility Separation

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                 SEMANTIQ-OWNED RESPONSIBILITIES                             |
|  • Out-of-Band Telemetry Collection (IndependentObserverEngine)                             |
|  • Evidence Source Calibration & Confidence Scoring                                         |
|  • Cryptographically Signing IndependentObservationBundle Records                          |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │ (Ground-Truth Observation Streams)
+───────────────────────────────────────────────▼─────────────────────────────────────────────+
|                                 PROVIDER-OWNED RESPONSIBILITIES                             |
|  • Exposing Raw PTY Pseudo-Terminal Master Sockets for Unbuffered Attachment                |
|  • Permitting Host-Level Network Bridge and File Snapshot Introspection                     |
+─────────────────────────────────────────────────────────────────────────────────────────────+
```

---

## 5. Interfaces and Observation Types

### 5.1 TypeScript Observation Definitions ([`packages/sandbox-contracts/src/independent-observer.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/independent-observer.ts))

```typescript
export type ObservationSourceType =
  | "HOST_KERNEL_EBPF"
  | "SOCKET_PTY_MIRROR"
  | "NETWORK_BRIDGE_TAP"
  | "FILESYSTEM_SNAPSHOT_DIFF"
  | "PROVIDER_ADAPTER_API"
  | "AGENT_SELF_REPORT";

export type CrossVerificationStatus =
  "VERIFIED_BY_HOST" | "DISCREPANCY_DETECTED" | "UNVERIFIABLE_CLAIM";

export interface IndependentObservationRecord {
  readonly observationId: string;
  readonly stepIndex: number;
  readonly stage: BehavioralStage;
  readonly sourceType: ObservationSourceType;
  readonly trustConfidence: number;
  readonly crossVerificationStatus: CrossVerificationStatus;
  readonly rawObservedData: Record<string, unknown>;
  readonly providerClaimDiscrepancy?: string | undefined;
  readonly timestamp: string;
  readonly observationDigest: string;
}

export interface IndependentObservationBundle {
  readonly bundleId: string;
  readonly scenarioId: string;
  readonly runId: string;
  readonly totalObservations: number;
  readonly groundTruthCount: number;
  readonly discrepancyCount: number;
  readonly overallObservationTrustScore: number;
  readonly observations: readonly IndependentObservationRecord[];
  readonly auditedAt: string;
  readonly observerSignatureHex: string;
}
```

---

## 6. Schemas & Versioning

- **[`schemas/independent-observation-bundle.schema.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/schemas/independent-observation-bundle.schema.json)**: Formal Draft 2020-12 JSON Schema validating observation bundles, evidence sources, confidence scores, and signatures.
- **Exported Schemas**: [`packages/sandbox-contracts/src/schemas.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/schemas.ts) exports `independentObservationBundleSchema`.
- **Versioning Policy**: Semantic versioning (`1.0.0`).

---

## 7. Lifecycle and State Machine

```
      +────────────────────+
      | Sandbox Start      |
      +─────────┬──────────+
                │ Attach PTY Mirror & Host Probes
                ▼
      +────────────────────+
      | Out-of-Band Stream | ──> Ingest raw bytes, syscalls, packet frames
      +─────────┬──────────+
                │ Cross-verify vs Provider API
                ▼
      +────────────────────+
      | Bundle & Score     | ──> Compute Trust Score & Flag Discrepancies
      +─────────┬──────────+
                │ Sign & Seal
                ▼
      +────────────────────+
      | Observation Bundle |
      +────────────────────+
```

---

## 8. Security, Privacy, and Trust Posture

1. **Unbypassable Host Probing**: In-container root users cannot suppress or falsify host-level PTY socket mirrors or kernel eBPF probes.
2. **Explicit Discrepancy Attribution**: When provider APIs claim success but host probes detect OOM (exit code 137), `DISCREPANCY_DETECTED` is flagged.
3. **Cryptographic Seal**: Observation bundles are signed with `observerSignatureHex`.

---

## 9. Provider Compatibility

| Execution Provider      | Primary Out-of-Band Hook                  | Observation Trust Confidence |
| :---------------------- | :---------------------------------------- | :--------------------------- |
| **Docker (Local)**      | Unix socket PTY stream + cgroup v2 stats  | 100%                         |
| **Podman (Rootless)**   | Native PTY master + user namespace procfs | 100%                         |
| **Firecracker MicroVM** | Host virtio-vsock serial mirror           | 100%                         |
| **Modal / Fly.io**      | Provider SSE telemetry + egress proxy tap | 90%                          |

---

## 10. Failure Modes & Resilience Strategies

| Failure Mode                      | Root Cause                           | Impact               | Automated Recovery Action                               |
| :-------------------------------- | :----------------------------------- | :------------------- | :------------------------------------------------------ |
| **Provider Report Falsification** | Provider masked non-zero exit code   | Distorted evaluation | Host PTY detects mismatch; flags `DISCREPANCY_DETECTED` |
| **Buffer Overflow in Mirror**     | Agent flooded stdout with 500MB spam | Memory pressure      | Stream chunking & hash-only digest retention            |
| **Missing eBPF Permissions**      | Running rootless on restricted host  | Degraded probe depth | Falls back gracefully to PTY mirror with warning        |

---

## 11. Testing Strategy & Verification

The Independent Observer architecture is validated through automated test suites:

1. **Independent Observer Unit Tests ([`tests/unit/independent-observer.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/unit/independent-observer.test.ts))**:
   - Tests creating ground-truth out-of-band PTY mirror observation with 100% confidence.
   - Tests detecting discrepancy between host ground-truth and provider self-report (e.g. exit code 137 vs 0).
   - Tests bundling observations, penalizing discrepancies, and signing bundle with cryptographic signature.
   - Tests Markdown independent observer audit report formatting.
2. **Contract Schema Conformance Tests ([`tests/contracts/sandbox-contracts.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/contracts/sandbox-contracts.test.ts))**:
   - Validates Draft 2020-12 JSON Schema compliance for `independentObservationBundleSchema`.

---

## 12. Acceptance Criteria

- [x] Independent Observer contracts define 6 evidence sources, 3 verification states, and observation bundles.
- [x] `IndependentObserverEngine` generates ground-truth out-of-band records and flags discrepancies.
- [x] Evidence sources are explicitly labeled with calibrated confidence scores (0.3 to 1.0).
- [x] Cryptographic observer signatures guarantee unforgeable observation records.
- [x] Zero third-party runtime code or proprietary SDKs are copied into SemantIQ Core.
- [x] All 151 test files (512+ passing tests) pass cleanly with zero regressions.

---

## 13. Risks, Trade-Offs, and Open Questions

- **Trade-Off: Kernel Probing Overhead vs. Host Permissions**: Running eBPF probes requires root capabilities on Linux hosts.  
  _Mitigation_: Provide graceful degradation to user-space PTY socket mirroring on unprivileged hosts.
- **Open Question**: Hardware-level bus monitoring for confidential computing enclave evaluations.

---

## 14. Architecture Decision Record

### [ADR-0155: SemantIQ Independent Observer Architecture and Evidence-Source Calibration](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/adr/ADR-0155-independent-observer-model.md)

- **Status**: Accepted
- **Date**: 2026-08-15
- **Decision**: Implement `IndependentObserverEngine` capturing out-of-band telemetry (PTY mirror, eBPF, network tap), labeling evidence sources with explicit confidence, and issuing signed `IndependentObservationBundle` records.
- **Consequences**: Guarantees evaluation objectivity and eliminates reliance on untrusted agent self-reports or unverified provider claims.

---

## 15. Generated & Modified Artifact List

1. **Contracts & Observer Engine**: [`packages/sandbox-contracts/src/independent-observer.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/independent-observer.ts)
2. **Schema Definition**: [`schemas/independent-observation-bundle.schema.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/schemas/independent-observation-bundle.schema.json)
3. **Contracts Index**: [`packages/sandbox-contracts/src/index.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/index.ts)
4. **Schemas Export**: [`packages/sandbox-contracts/src/schemas.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/schemas.ts)
5. **Unit Tests**: [`tests/unit/independent-observer.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/unit/independent-observer.test.ts)
6. **Contract Tests**: [`tests/contracts/sandbox-contracts.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/contracts/sandbox-contracts.test.ts)
7. **Specification**: [`Docs/sandbox/INDEPENDENT_OBSERVER_SPEC.md`](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/sandbox/INDEPENDENT_OBSERVER_SPEC.md)
8. **ADR Record**: [`Docs/adr/ADR-0155-independent-observer-model.md`](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/adr/ADR-0155-independent-observer-model.md)
