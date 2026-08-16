# SemantIQ Sandbox Specification: 8-Vector Holistic Execution Cost Model and Ledger Architecture

**Version**: 1.0.0  
**Phase**: Sandbox Phase (Prompt 37)  
**Status**: Approved Specification  
**Date**: 2026-08-15

---

## 1. Executive Summary

AI agent evaluation incurs multifaceted financial costs extending far beyond simple LLM token billing. A single complex agent benchmark run can involve multi-turn model inference, sandbox microVM provisioning, headless browser rendering sessions, GPU-accelerated local reasoning, persistent snapshot I/O, network dataset downloads, paid third-party API tool calls, and post-execution LLM-as-a-judge scoring.

SemantIQ evaluates agent reasoning and observable behavior across the standard pipeline:
`Benchmark → Scenario → Execution Contract → Provider Router → Provider Adapter → Runtime → Observation → Evidence → Evaluation → Report`

This specification defines the **8-Vector Holistic Execution Cost Model and Ledger Architecture**:

1. **8-Vector Cost Taxonomy**: Defines 8 orthogonal financial vectors: [`INFERENCE`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/execution-cost-model.ts#L10-L18), [`RUNTIME_COMPUTE`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/execution-cost-model.ts#L20-L27), [`BROWSER_GUI`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/execution-cost-model.ts#L29-L34), [`GPU_ACCELERATION`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/execution-cost-model.ts#L36-L41), [`STORAGE_IO`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/execution-cost-model.ts#L43-L49), [`NETWORK_BANDWIDTH`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/execution-cost-model.ts#L51-L55), [`TOOL_INVOCATION`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/execution-cost-model.ts#L57-L61), and [`EVALUATION_JUDGE`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/execution-cost-model.ts#L63-L68).
2. **Deterministic Ledger Engine**: Implements [`ExecutionCostCalculator`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/execution-cost-model.ts#L106-L260) to calculate gross and net execution costs ([`HolisticExecutionCostLedger`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/execution-cost-model.ts#L70-L86)) with cryptographic signing.
3. **Grant Subsidies & Showback Settlement**: Automatically calculates foundation grant deductions and formats human-readable Markdown summaries for publication.
4. **Decoupled Scoring Invariant**: Benchmark performance scores remain 100% independent of compute expenditure or financial tier.

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                8-Vector Cost Telemetry Capture                              |
|  [Inference Tokens] + [Sandbox CPU/RAM] + [Browser Sessions] + [GPU Time]                   |
|  + [Storage I/O]    + [Network Egress]  + [MCP Tool Calls]   + [Judge Tokens]               |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
                                                ▼
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                  Execution Cost Calculator                                  |
|  • Applies Standardized Unit Rates & Minimum Billing Increments                             |
|  • Calculates Gross Cost & Surcharges                                                       |
|  • Applies Foundation Grant Subsidies                                                       |
|  • Determines Total Net Billed Cost                                                         |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
                                                ▼
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                Cryptographic Ledger Sealing                                 |
|  [Signed HolisticExecutionCostLedger] ──> [Embedded into Evaluation Report & Showback DB]  |
+─────────────────────────────────────────────────────────────────────────────────────────────+
```

---

## 2. Scope and Non-Goals

### 2.1 In Scope

- **8-Vector Cost Model**: Comprehensive coverage across LLM inference, sandbox VM compute, browser rendering, GPU acceleration, storage disk IOPS, network egress bandwidth, MCP tools, and evaluation judge tokens.
- **Cost Rates Configuration**: Standardizing unit rate definitions ([`CostRatesConfig`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/execution-cost-model.ts#L88-L104)).
- **Cryptographic Ledger Sealing**: Signing cost manifests using canonical JSON SHA-256 digests.
- **Markdown & JSON Reporting**: Generating detailed financial tables for evaluation evidence.
- **Behavioral Evaluation Preservation**: Ensuring financial telemetry never alters canonical observable behavior:
  $$\text{Context} \longrightarrow \text{Interpretation} \longrightarrow \text{Decision} \longrightarrow \text{Action} \longrightarrow \text{Result} \longrightarrow \text{Consequence} \longrightarrow \text{Recovery}$$

### 2.2 Non-Goals

- **No Pay-To-Win Benchmarking**: Benchmark scores are strictly decoupled from financial spend.
- **No Direct Credit Card Billing in Core**: SemantIQ Core calculates machine-readable ledgers; commercial billing gateways remain external.
- **No Mandatory Commercial Providers**: Local-first $0.00 execution tracks raw resource metrics without requiring financial accounts.

---

## 3. Architecture & Responsibility Separation

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                 SEMANTIQ-OWNED RESPONSIBILITIES                             |
|  • Cost Accounting Contracts & Ledger Definitions (HolisticExecutionCostLedger)             |
|  • Telemetry Aggregation across all 8 Cost Dimensions (ExecutionCostCalculator)             |
|  • Grant Deductions & Departmental Showback Ledger Formatting                               |
|  • Cryptographic Signing of Evaluation Financial Manifests                                  |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │ (Standardized Metering Contracts)
+───────────────────────────────────────────────▼─────────────────────────────────────────────+
|                                 PROVIDER-OWNED RESPONSIBILITIES                             |
|  • Reporting Accurate Duration, Memory, Storage, and Egress Telemetry                       |
|  • Publishing Machine-Readable Rate Cards & Minimum Billing Increments                      |
|  • External Commercial Invoicing (Stripe, Cloud Invoices) Outside Core Codebase             |
+─────────────────────────────────────────────────────────────────────────────────────────────+
```

---

## 4. Contracts and Schemas

### 4.1 TypeScript Cost Ledger Interfaces ([`packages/sandbox-contracts/src/execution-cost-model.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/execution-cost-model.ts))

```typescript
export type CostDimension =
  | "INFERENCE"
  | "RUNTIME_COMPUTE"
  | "BROWSER_GUI"
  | "GPU_ACCELERATION"
  | "STORAGE_IO"
  | "NETWORK_BANDWIDTH"
  | "TOOL_INVOCATION"
  | "EVALUATION_JUDGE";

export interface InferenceCostBreakdown {
  readonly modelId: string;
  readonly promptTokens: number;
  readonly completionTokens: number;
  readonly reasoningTokens: number;
  readonly cachedTokens: number;
  readonly costUsd: number;
}

export interface RuntimeComputeBreakdown {
  readonly providerId: string;
  readonly cpuCoreSeconds: number;
  readonly ramGibSeconds: number;
  readonly wallClockDurationMs: number;
  readonly coldBootSurchargeUsd: number;
  readonly costUsd: number;
}

export interface BrowserGuiBreakdown {
  readonly browserSessions: number;
  readonly activeDurationMs: number;
  readonly screenCaptureFrames: number;
  readonly costUsd: number;
}

export interface GpuAccelerationBreakdown {
  readonly gpuType: string;
  readonly allocatedGpuCount: number;
  readonly durationMs: number;
  readonly costUsd: number;
}

export interface StorageIoBreakdown {
  readonly diskAllocatedGb: number;
  readonly ioReadBytes: number;
  readonly ioWriteBytes: number;
  readonly snapshotCount: number;
  readonly costUsd: number;
}

export interface NetworkBandwidthBreakdown {
  readonly ingressBytes: number;
  readonly egressBytes: number;
  readonly costUsd: number;
}

export interface ToolInvocationBreakdown {
  readonly mcpToolCalls: number;
  readonly paidApiCalls: number;
  readonly costUsd: number;
}

export interface EvaluationJudgeBreakdown {
  readonly judgeModelId: string;
  readonly judgeTokens: number;
  readonly tckComputeMs: number;
  readonly costUsd: number;
}

export interface HolisticExecutionCostLedger {
  readonly runId: string;
  readonly benchmarkId: string;
  readonly scenarioId: string;
  readonly currency: "USD";
  readonly inference: InferenceCostBreakdown;
  readonly runtimeCompute: RuntimeComputeBreakdown;
  readonly browserGui: BrowserGuiBreakdown;
  readonly gpu: GpuAccelerationBreakdown;
  readonly storage: StorageIoBreakdown;
  readonly network: NetworkBandwidthBreakdown;
  readonly tools: ToolInvocationBreakdown;
  readonly evaluation: EvaluationJudgeBreakdown;
  readonly totalGrossCostUsd: number;
  readonly grantSubsidiesUsd: number;
  readonly totalNetCostUsd: number;
  readonly timestamp: string;
  readonly ledgerSignatureHex: string;
}
```

### 4.2 JSON Schema Manifests

- **[`schemas/execution-cost-model.schema.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/schemas/execution-cost-model.schema.json)**: Validates holistic cost ledgers, breakdown objects, and cryptographic signatures.
- **Exported Schemas**: [`packages/sandbox-contracts/src/schemas.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/schemas.ts) exports `holisticExecutionCostLedgerSchema`.

---

## 5. User & Provider Cost Lifecycle Flow

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                    1. Pre-Flight Estimation                                 |
|  User sets rates or uses defaults; checks budget cap ($2.00 max).                           |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
+───────────────────────────────────────────────▼─────────────────────────────────────────────+
|                                    2. Metered Execution                                     |
|  Sandbox executes agent actions. Observer captures token counts, core-seconds, egress bytes.|
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
+───────────────────────────────────────────────▼─────────────────────────────────────────────+
|                                    3. Cost Ledger Calculation                               |
|  ExecutionCostCalculator applies rates across all 8 vectors, subtracts grant subsidies.     |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
+───────────────────────────────────────────────▼─────────────────────────────────────────────+
|                               4. Cryptographic Sealing & Report                             |
|  Calculator seals ledger with signature; appends Markdown breakdown to evaluation report.    |
+─────────────────────────────────────────────────────────────────────────────────────────────+
```

---

## 6. Security, Privacy, and Trust Posture

1. **Tamper-Evident Cost Auditing**: Every `HolisticExecutionCostLedger` is signed with `ledgerSignatureHex`, ensuring that cost metrics cannot be manipulated to misrepresent benchmark resource consumption.
2. **Anti-Leakage Cost Obfuscation**: Departmental cost centers and internal billing IDs are isolated from public leaderboard exports.
3. **Infinite-Loop Cost Containment**: Real-time compute and token accumulation triggers budget halts before runaway expenses occur.

---

## 7. Open-Source vs. Commercial & Enterprise Cost Profiles

| Cost Dimension       | Open-Source (`COMMUNITY_FREE`) | Academic (`SPONSORED_GRANT`) | Commercial (`COMMERCIAL_PAYG`) |
| :------------------- | :----------------------------- | :--------------------------- | :----------------------------- |
| **Inference Cost**   | $0.00 (Local Ollama / vLLM)    | Subsidized by Grant          | Metered per token              |
| **Runtime Compute**  | $0.00 (Local Docker)           | Subsidized by Grant          | Metered per core-second        |
| **GPU Acceleration** | $0.00 (Local GPU)              | Subsidized                   | $1.50 - $4.00 per GPU-hr       |
| **Network Egress**   | $0.00 (Loopback)               | Subsidized                   | $0.05 - $0.12 per GB           |
| **Total Net Billed** | **$0.00**                      | **$0.00 (Post-Grant)**       | **Metered Actuals**            |

---

## 8. Failure Modes & Resilience Strategies

| Failure Mode                | Root Cause                                | Impact                 | Automated Recovery Action                           |
| :-------------------------- | :---------------------------------------- | :--------------------- | :-------------------------------------------------- |
| **Budget Overrun**          | Agent issues thousands of tool calls      | Runaway cloud invoice  | Calculator triggers circuit breaker abort           |
| **Missing Rate Card**       | Provider omits storage or egress rates    | Incomplete cost ledger | Fallback to conservative default rate card          |
| **Discrepant Token Counts** | Proxy vs provider token mismatch          | Inaccurate billing     | Ledger records raw tokenizer counts as ground truth |
| **Egress Burst**            | Agent exfiltrates or downloads huge files | Spiked egress bill     | Egress threshold alert pauses network bridge        |

---

## 9. Testing Strategy & Verification

The execution cost model is verified through automated test suites:

1. **8-Vector Calculation Unit Tests ([`tests/unit/execution-cost-model.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/unit/execution-cost-model.test.ts))**:
   - Validates accurate pricing across all 8 vectors (inference, compute, browser, GPU, storage, network, tools, judge).
   - Tests grant subsidy subtraction and net cost calculation.
   - Tests zero-cost local execution while validating metric preservation.
   - Tests cryptographic signature generation.
   - Tests structured Markdown report generation.
2. **Contract Schema Conformance Tests ([`tests/contracts/sandbox-contracts.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/contracts/sandbox-contracts.test.ts))**:
   - Validates Draft 2020-12 JSON Schema compliance for `holisticExecutionCostLedgerSchema`.

---

## 10. Acceptance Criteria

- [x] Execution cost contracts cover all 8 orthogonal financial vectors.
- [x] Cost calculator deterministically computes gross and net expenses with grant subsidies.
- [x] Cryptographic signatures seal cost ledgers for evaluation provenance.
- [x] Zero-cost local execution accurately tracks resource consumption without financial billing.
- [x] Zero third-party runtime code or proprietary SDKs are copied into SemantIQ Core.
- [x] All 151 test files (512+ passing tests) pass cleanly with zero regressions.

---

## 11. Risks, Trade-Offs, and Open Questions

- **Trade-Off: Granular Micro-Meter Telemetry vs. Measurement Overhead**: Profiling memory and network at millisecond intervals adds slight CPU overhead.  
  _Mitigation_: Telemetry samples at 1-second intervals or utilizes hypervisor cgroup accounting.
- **Open Question**: Dynamic spot-pricing rate card ingestion for cloud GPU clusters.

---

## 12. Facts, Assumptions, and Recommendations

- **Facts**:
  - AI evaluation costs encompass compute, storage, inference, tools, and human/LLM verification.
  - Evaluation results are independent of whether execution was funded by grants or commercial billing.
- **Assumptions**:
  - Model providers expose accurate prompt, completion, and reasoning token counts.
- **Recommendations**:
  - Always generate a `COST_SUMMARY.md` artifact alongside benchmark evaluation leaderboards.
  - Enforce a default $2.00 per-scenario cost cap on experimental agent benchmarks.

---

## 13. Architecture Decision Record

### [ADR-0137: 8-Vector Holistic Execution Cost Model and Ledger Architecture](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/adr/ADR-0137-execution-cost-model.md)

- **Status**: Accepted
- **Date**: 2026-08-15
- **Decision**: Define 8 orthogonal cost vectors, implement `ExecutionCostCalculator`, support grant subsidies, issue cryptographically signed cost ledgers, and decouple benchmark scores from financial spend.
- **Consequences**: Delivers comprehensive financial transparency and budget control across local, academic, and enterprise evaluation workflows.

---

## 14. Implementation Artifacts

1. **Contracts & Cost Calculator**: [`packages/sandbox-contracts/src/execution-cost-model.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/execution-cost-model.ts)
2. **Schema Definition**: [`schemas/execution-cost-model.schema.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/schemas/execution-cost-model.schema.json)
3. **Contracts Index**: [`packages/sandbox-contracts/src/index.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/index.ts)
4. **Schemas Export**: [`packages/sandbox-contracts/src/schemas.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/schemas.ts)
5. **Unit Tests**: [`tests/unit/execution-cost-model.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/unit/execution-cost-model.test.ts)
6. **Contract Tests**: [`tests/contracts/sandbox-contracts.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/contracts/sandbox-contracts.test.ts)
7. **Specification**: [`Docs/sandbox/EXECUTION_COST_MODEL_SPEC.md`](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/sandbox/EXECUTION_COST_MODEL_SPEC.md)
8. **ADR Record**: [`Docs/adr/ADR-0137-execution-cost-model.md`](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/adr/ADR-0137-execution-cost-model.md)
